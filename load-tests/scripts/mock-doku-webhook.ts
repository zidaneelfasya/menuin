/**
 * MENUIN — Mock Payment Gateway (DOKU & SNAP QRIS Simulation)
 * 
 * Safely simulates payment success webhooks without connecting to real bank APIs.
 * Generates authentic DOKU HMAC-SHA256 signatures for staging load tests.
 * 
 * Usage:
 *   npx tsx scripts/mock-doku-webhook.ts --invoice=INV-STG-1234 --amount=45000
 */

import crypto from 'crypto';
import testConfig from '../config/test-config.json';

const DOKU_CLIENT_ID = process.env.DOKU_CLIENT_ID || 'MOCK-CLIENT-ID-STAGING';
const DOKU_SECRET_KEY = process.env.DOKU_SECRET_KEY || 'MOCK-SECRET-KEY-STAGING';
const TARGET_BASE_URL = process.env.TARGET_BASE_URL || testConfig.targetBaseUrl;

export function buildDigest(body: string): string {
  return crypto.createHash('sha256').update(body, 'utf8').digest('base64');
}

export function generateDokuSignature(params: {
  clientId: string;
  requestId: string;
  requestTimestamp: string;
  requestTarget: string;
  body: string;
  secretKey: string;
}): string {
  const digest = buildDigest(params.body);
  const component = [
    `Client-Id:${params.clientId}`,
    `Request-Id:${params.requestId}`,
    `Request-Timestamp:${params.requestTimestamp}`,
    `Request-Target:${params.requestTarget}`,
    `Digest:${digest}`,
  ].join('\n');

  const hmac = crypto
    .createHmac('sha256', params.secretKey)
    .update(component, 'utf8')
    .digest('base64');

  return `HMACSHA256=${hmac}`;
}

export async function sendMockDokuPaidWebhook(params: {
  invoiceNumber: string;
  amount: number;
  paymentChannel?: string;
  targetUrl?: string;
}) {
  const targetBase = params.targetUrl || TARGET_BASE_URL;
  const endpoint = '/api/webhook/doku';
  const requestTarget = endpoint;
  const requestId = `mock-req-${crypto.randomUUID()}`;
  const requestTimestamp = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');

  const payload = {
    service: {
      id: 'ONLINE_PAYMENT'
    },
    acquirer: {
      id: 'DOKU'
    },
    channel: {
      id: params.paymentChannel || 'QRIS'
    },
    order: {
      invoice_number: params.invoiceNumber,
      amount: params.amount
    },
    transaction: {
      status: 'SUCCESS',
      date: new Date().toISOString(),
      original_request_id: requestId
    }
  };

  const rawBody = JSON.stringify(payload);
  const signature = generateDokuSignature({
    clientId: DOKU_CLIENT_ID,
    requestId,
    requestTimestamp,
    requestTarget,
    body: rawBody,
    secretKey: DOKU_SECRET_KEY,
  });

  const fullUrl = `${targetBase}${endpoint}`;
  console.log(`📡 Dispatching Mock DOKU Webhook to: ${fullUrl}`);
  console.log(`   Invoice: ${params.invoiceNumber} | Amount: Rp ${params.amount}`);

  const response = await fetch(fullUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Client-Id': DOKU_CLIENT_ID,
      'Request-Id': requestId,
      'Request-Timestamp': requestTimestamp,
      'Signature': signature,
    },
    body: rawBody,
  });

  const responseText = await response.text();
  console.log(`   Response Status: ${response.status} ${response.statusText}`);
  console.log(`   Response Body: ${responseText}\n`);

  return { status: response.status, body: responseText };
}

// Direct CLI Execution support:
if (require.main === module) {
  const args = process.argv.slice(2);
  const invoiceArg = args.find(a => a.startsWith('--invoice='))?.split('=')[1] || `INV-STG-${Date.now()}`;
  const amountArg = parseInt(args.find(a => a.startsWith('--amount='))?.split('=')[1] || '50000', 10);

  sendMockDokuPaidWebhook({
    invoiceNumber: invoiceArg,
    amount: amountArg
  }).catch(err => {
    console.error('❌ Error sending mock webhook:', err);
    process.exit(1);
  });
}
