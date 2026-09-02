import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { transactions, payments, tenants } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    
    // We need the transaction ID from the payload (order_id)
    const transactionId = payload.order_id;
    if (!transactionId) {
      return NextResponse.json({ error: "Missing order_id" }, { status: 400 });
    }

    // Midtrans dashboard test button sends mock order_id starting with 'payment_notif_test_'
    if (transactionId.startsWith('payment_notif_test_')) {
      return NextResponse.json({ success: true, message: "Test notification received successfully" });
    }

    // 1. Fetch transaction to know the tenant
    const txResult = await db.select().from(transactions).where(eq(transactions.id, transactionId)).limit(1);
    if (txResult.length === 0) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }
    const transaction = txResult[0];

    // 2. Fetch tenant to get Midtrans Server Key
    const tenantResult = await db.select().from(tenants).where(eq(tenants.id, transaction.tenantId)).limit(1);
    if (tenantResult.length === 0) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }
    const tenant = tenantResult[0];

    // 3. Verify Signature Key
    if (tenant.midtransServerKey) {
      const { signature_key, status_code, gross_amount } = payload;
      const dataToHash = transactionId + status_code + gross_amount + tenant.midtransServerKey;
      const calculatedSignature = crypto.createHash('sha512').update(dataToHash).digest('hex');

      if (signature_key !== calculatedSignature) {
        console.error("Midtrans signature mismatch!", { expected: calculatedSignature, received: signature_key });
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    // 4. Update transaction status based on Midtrans transaction_status
    const transactionStatus = payload.transaction_status;
    const fraudStatus = payload.fraud_status;

    let newStatus = transaction.status;
    let newPaymentStatus = transaction.paymentStatus || 'PENDING';

    if (transactionStatus === 'capture') {
      if (fraudStatus === 'challenge') {
        newPaymentStatus = 'PENDING'; // Need manual checking
      } else if (fraudStatus === 'accept') {
        newPaymentStatus = 'PAID';
        newStatus = tenant.orderProcessType === 'AUTO' ? 'COMPLETED' : 'NEW';
      }
    } else if (transactionStatus === 'settlement') {
      newPaymentStatus = 'PAID';
      newStatus = tenant.orderProcessType === 'AUTO' ? 'COMPLETED' : 'NEW';
    } else if (transactionStatus === 'cancel' || transactionStatus === 'deny' || transactionStatus === 'expire') {
      newPaymentStatus = 'CANCELED';
      newStatus = 'FAILED';
    } else if (transactionStatus === 'pending') {
      newPaymentStatus = 'PENDING';
      // keep existing kitchen status (should be PENDING)
    }

    // Update Transaction
    if (newStatus !== transaction.status || newPaymentStatus !== transaction.paymentStatus) {
      await db.update(transactions)
        .set({ status: newStatus, paymentStatus: newPaymentStatus })
        .where(eq(transactions.id, transactionId));
    }

    // Log the payment details in the payments table for idempotency and records
    // Check if payment already exists
    const existingPayment = await db.select().from(payments).where(eq(payments.providerTransactionId, payload.transaction_id)).limit(1);
    
    if (existingPayment.length === 0) {
      await db.insert(payments).values({
        transactionId: transaction.id,
        providerTransactionId: payload.transaction_id,
        provider: 'MIDTRANS',
        amount: payload.gross_amount,
        status: newStatus
      });
    } else {
      await db.update(payments)
        .set({ status: newStatus })
        .where(eq(payments.providerTransactionId, payload.transaction_id));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
