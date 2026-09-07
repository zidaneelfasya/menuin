import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { payments } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createOrUpdateSubscription } from '@/lib/actions/subscription';

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    
    // We need the transaction ID from the payload (order_id)
    const transactionId = payload.order_id;
    if (!transactionId) {
      return NextResponse.json({ error: "Missing order_id" }, { status: 400 });
    }

    if (!transactionId.startsWith('MENUIN-SUB-') && !transactionId.startsWith('payment_notif_test_')) {
      return NextResponse.json({ error: "Not a subscription transaction" }, { status: 400 });
    }

    if (transactionId.startsWith('payment_notif_test_')) {
      return NextResponse.json({ success: true, message: "Test notification received successfully" });
    }

    // 1. Fetch Global Server Key
    const serverKey = process.env.MIDTRANS_SERVER_KEY || "";
    if (!serverKey) {
      console.error("MIDTRANS_SERVER_KEY not configured!");
      return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
    }

    // 2. Verify Signature Key
    const { signature_key, status_code, gross_amount, custom_field1: tenantId, custom_field2: planName } = payload;
    const dataToHash = transactionId + status_code + gross_amount + serverKey;
    const calculatedSignature = crypto.createHash('sha512').update(dataToHash).digest('hex');

    if (signature_key !== calculatedSignature) {
      console.error("Midtrans signature mismatch!", { expected: calculatedSignature, received: signature_key });
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    if (!tenantId) {
      return NextResponse.json({ error: "Missing tenantId in custom_field1" }, { status: 400 });
    }

    // 3. Update subscription status based on Midtrans transaction_status
    const transactionStatus = payload.transaction_status;
    const fraudStatus = payload.fraud_status;

    let isSuccess = false;

    if (transactionStatus === 'capture') {
      if (fraudStatus === 'accept') {
        isSuccess = true;
      }
    } else if (transactionStatus === 'settlement') {
      isSuccess = true;
    }

    if (isSuccess) {
      // Create or update subscription
      const planToApply = planName || 'PRO'; // Fallback to PRO
      // Ignore auth guard by mocking context in service or running direct DB updates
      // Wait, createOrUpdateSubscription requires context (requireTenantAccess). 
      // This is a webhook (server-to-server), so we cannot use requireTenantAccess!
      // We must implement the direct DB transaction here.
      
      const { subscriptions } = await import('@/lib/db/schema');
      const { eq, and } = await import('drizzle-orm');
      const { v4: uuidv4 } = await import('uuid');

      const now = new Date();
      const currentPeriodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      await db.transaction(async (tx) => {
        // Mark existing ACTIVE subscriptions as EXPIRED
        await tx.update(subscriptions)
          .set({ status: 'EXPIRED' })
          .where(
            and(
              eq(subscriptions.tenantId, tenantId),
              eq(subscriptions.status, 'ACTIVE')
            )
          );

        // Insert new ACTIVE subscription
        const newSubId = uuidv4();
        await tx.insert(subscriptions).values({
          id: newSubId,
          tenantId,
          plan: planToApply,
          status: 'ACTIVE',
          currentPeriodStart: now,
          currentPeriodEnd,
        });
      });
    }

    // Log the payment details in the payments table for idempotency and records
    const existingPayment = await db.select().from(payments).where(eq(payments.providerTransactionId, payload.transaction_id)).limit(1);
    
    if (existingPayment.length === 0) {
      await db.insert(payments).values({
        tenantId: tenantId,
        transactionId: transactionId,
        providerTransactionId: payload.transaction_id,
        provider: 'MIDTRANS',
        amount: payload.gross_amount,
        status: transactionStatus
      });
    } else {
      await db.update(payments)
        .set({ status: transactionStatus })
        .where(eq(payments.providerTransactionId, payload.transaction_id));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Subscription Webhook error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
