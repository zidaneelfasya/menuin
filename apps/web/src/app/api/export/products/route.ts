import { NextResponse } from 'next/server';
import * as xlsx from 'xlsx';
import { db } from '@/lib/db';
import { products, categories } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/actions/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const productList = await db
      .select({
        id: products.id,
        name: products.name,
        categoryName: categories.name,
        price: products.price,
        costPrice: products.costPrice,
        stock: products.stock,
        minStock: products.minStock,
        trackStock: products.trackStock,
        isFeatured: products.isFeatured,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.tenantId, user.tenantId))
      .orderBy(desc(products.isFeatured), products.name);

    const headers = [
      'Nama Item',
      'Kategori',
      'Harga Jual',
      'Harga Modal',
      'Stok',
      'Stok Minimal',
      'Lacak Stok (YA/TIDAK)',
      'Best Seller (YA/TIDAK)',
    ];

    const rows = productList.map((item) => [
      item.name,
      item.categoryName || '',
      Number(item.price) || 0,
      Number(item.costPrice) || 0,
      item.stock ?? 0,
      item.minStock ?? 5,
      item.trackStock !== false ? 'YA' : 'TIDAK',
      item.isFeatured ? 'YA' : 'TIDAK',
    ]);

    const worksheetData = [headers, ...rows];
    const worksheet = xlsx.utils.aoa_to_sheet(worksheetData);

    worksheet['!cols'] = [
      { wch: 30 }, // Nama Item
      { wch: 22 }, // Kategori
      { wch: 15 }, // Harga Jual
      { wch: 18 }, // Harga Modal
      { wch: 15 }, // Stok
      { wch: 20 }, // Stok Minimal
      { wch: 22 }, // Lacak Stok
      { wch: 22 }, // Best Seller
    ];

    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Menu Item');

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    const today = new Date().toISOString().slice(0, 10);
    const filename = `menu_item_${user.outletKey || 'export'}_${today}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error: any) {
    console.error('Error exporting products:', error);
    return NextResponse.json({ error: 'Gagal mengekspor data menu item' }, { status: 500 });
  }
}
