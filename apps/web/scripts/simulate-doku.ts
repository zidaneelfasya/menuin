import 'dotenv/config';
import crypto from 'crypto';

// Ganti INVOICE_NUMBER dengan nomor pesanan kamu (misal: "MG7B4K9X2M")
const INVOICE_NUMBER = process.argv[2];

if (!INVOICE_NUMBER) {
  console.error("❌ Harap masukkan nomor pesanan! Contoh: npx tsx scripts/simulate-doku.ts MG7B4K9X2M");
  process.exit(1);
}

const clientId = process.env.DOKU_CLIENT_ID;
const secretKey = process.env.DOKU_SECRET_KEY;
const path = process.env.DOKU_NOTIFICATION_PATH || '/api/webhook/doku';

if (!clientId || !secretKey) {
  console.error("❌ DOKU_CLIENT_ID atau DOKU_SECRET_KEY tidak ditemukan di file .env.local!");
  process.exit(1);
}

const body = JSON.stringify({
  order: {
    invoice_number: INVOICE_NUMBER,
    amount: 10000 // Jumlah bebas, tidak divalidasi secara ketat oleh webhook dasar
  },
  transaction: {
    status: 'SUCCESS',
    date: new Date().toISOString()
  },
  channel: {
    id: 'QRIS'
  }
});

const requestId = `sim-${Date.now()}`;
const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
const digest = crypto.createHash('sha256').update(body, 'utf8').digest('base64');

const component = [
  `Client-Id:${clientId}`,
  `Request-Id:${requestId}`,
  `Request-Timestamp:${timestamp}`,
  `Request-Target:${path}`,
  `Digest:${digest}`
].join('\n');

const signature = 'HMACSHA256=' + crypto.createHmac('sha256', secretKey).update(component, 'utf8').digest('base64');

console.log(`Mengirim simulasi webhook untuk pesanan: ${INVOICE_NUMBER}...`);

fetch(`http://localhost:3000${path}`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Client-Id': clientId,
    'Request-Id': requestId,
    'Request-Timestamp': timestamp,
    'Signature': signature
  },
  body: body
}).then(async res => {
  console.log(`Status Webhook: ${res.status}`);
  console.log(await res.text());
  if (res.ok) {
    console.log("✅ Simulasi berhasil! Silakan cek layar storefront kamu, status pesanan seharusnya berubah.");
  } else {
    console.log("❌ Simulasi gagal!");
  }
}).catch(err => {
  console.error("❌ Gagal terhubung ke localhost:3000. Pastikan npm run dev sedang berjalan.", err);
});
