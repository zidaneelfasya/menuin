import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products, categories, productModifierGroups, modifierGroups, tenants, transactions, transactionItems, shifts } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'menuin-pos-secret-key-change-in-prod';

async function verifyMobileAuth(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.replace('Bearer ', '');
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    return {
      id: decoded.sub, // Membership ID
      username: decoded.username,
      tenantId: decoded.tenantId,
      role: decoded.role
    };
  } catch (error) {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await verifyMobileAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = user.tenantId;

    // 1. Fetch Categories
    const categoriesData = await db.select().from(categories).where(eq(categories.tenantId, tenantId)).orderBy(categories.displayOrder);
    
    // 2. Fetch Modifier Groups
    const modifierGroupsData = await db.select().from(modifierGroups).where(eq(modifierGroups.tenantId, tenantId));
    
    // 3. Fetch Products
    const productsData = await db
      .select({
        id: products.id,
        sku: products.sku,
        name: products.name,
        price: products.price,
        stock: products.stock,
        categoryId: products.categoryId,
        imageUrl: products.imageUrl,
        barcode: products.barcode,
        isAvailableOnline: products.isAvailableOnline,
        isFeatured: products.isFeatured,
      })
      .from(products)
      .where(eq(products.tenantId, tenantId))
      .orderBy(desc(products.isFeatured), products.name);
      
    // Fetch product modifiers
    const allProductModifiers = await db.select().from(productModifierGroups);
    const productsWithModifiers = productsData.map(p => ({
      ...p,
      modifierGroupIds: allProductModifiers.filter(pm => pm.productId === p.id).map(pm => pm.modifierGroupId)
    }));

    // 4. Fetch Tenant Settings
    const tenantSettings = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);

    return NextResponse.json({
      success: true,
      data: {
        categories: categoriesData,
        products: productsWithModifiers,
        modifierGroups: modifierGroupsData,
        settings: tenantSettings[0] || null
      }
    });
  } catch (error) {
    console.error('Mobile POS API GET Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

function generateOrderNumber() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '#';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function POST(req: NextRequest) {
  try {
    const user = await verifyMobileAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const tenantId = user.tenantId;
    const userId = user.id;

    const result = await db.transaction(async (tx) => {
      const orderNumber = generateOrderNumber();

      // Find active shift
      const activeShifts = await tx
        .select()
        .from(shifts)
        .where(
          and(
            eq(shifts.tenantId, tenantId),
            eq(shifts.status, 'ACTIVE')
          )
        )
        .limit(1);
        
      const shiftId = activeShifts.length > 0 ? activeShifts[0].id : null;

      // 1. Create Transaction record
      const [newTx] = await tx.insert(transactions).values({
        tenantId,
        cashierMembershipId: userId, // userId is now membershipId
        posSessionId: null, // Depending on if we enforce pos sessions in the POS route
        shiftId,
        totalAmount: payload.totalAmount.toString(),
        discount: (payload.discount || 0).toString(),
        tax: (payload.tax || 0).toString(),
        serviceCharge: (payload.serviceCharge || 0).toString(),
        platformFee: (payload.platformFee || 0).toString(),
        grandTotal: payload.grandTotal.toString(),
        promoCode: payload.promoCode || null,
        paymentMethod: (payload.paymentMethod || 'CASH').toUpperCase(),
        paymentStatus: 'PAID', // POS transactions are always paid immediately
        status: 'PROCESSING', // POS orders directly go to kitchen as PROCESSING
        source: 'POS',
        orderType: payload.orderType || 'DINE_IN',
        customerName: payload.customerName || null,
        customerPhone: payload.customerPhone || null,
        tableNumber: payload.tableNumber || null,
        orderNumber,
      }).returning({ id: transactions.id });
      
      // 2. Insert Items
      for (const item of payload.items) {
        await tx.insert(transactionItems).values({
          tenantId,
          transactionId: newTx.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price.toString(),
          subtotal: item.subtotal.toString(),
          modifiers: item.modifiers || [],
          notes: item.notes || null,
        });
      }
      
      return newTx.id;
    });

    return NextResponse.json({ success: true, transactionId: result });
  } catch (error) {
    console.error('Mobile POS API POST Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
