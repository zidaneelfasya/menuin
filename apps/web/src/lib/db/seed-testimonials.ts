import { db } from './index';
import { testimonials } from './schema';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
  console.log('Seeding testimonials...');
  
  const dummyTestimonials = [
    {
      name: 'Budi Santoso',
      role: 'Owner Warung Kopi Senja',
      avatarUrl: 'https://i.pravatar.cc/150?u=budi',
      rating: '5.0',
      content: 'Sejak pakai Menuin, antrean panjang di kasir hilang. Pelanggan bisa langsung pesan dari meja. Sistem POS-nya juga sangat lancar!',
      sentiment: 'Sangat Puas'
    },
    {
      name: 'Siti Aminah',
      role: 'Manager Resto Padang Raya',
      avatarUrl: 'https://i.pravatar.cc/150?u=siti',
      rating: '4.8',
      content: 'Fitur manajemen stoknya juara. Saya bisa tahu kapan harus restock bahan baku sebelum habis. Sangat membantu operasional harian.',
      sentiment: 'Sangat Puas'
    },
    {
      name: 'Andi Wijaya',
      role: 'Founder Burger Bros',
      avatarUrl: 'https://i.pravatar.cc/150?u=andi',
      rating: '5.0',
      content: 'Checkout mandiri pakai QRIS langsung masuk tanpa delay. Laporan penjualannya juga detail banget. Menuin emang the best!',
      sentiment: 'Sangat Direkomendasikan'
    },
    {
      name: 'Dewi Lestari',
      role: 'Pemilik Cafe Kekinian',
      avatarUrl: 'https://i.pravatar.cc/150?u=dewi',
      rating: '4.9',
      content: 'Tampilannya elegan dan gampang banget dipake sama tim kitchen. Proses order dari meja langsung ke dapur tanpa ada yang miss.',
      sentiment: 'Sangat Puas'
    },
    {
      name: 'Reza Rahadian',
      role: 'CEO Kedai Kopi Lokal',
      avatarUrl: 'https://i.pravatar.cc/150?u=reza',
      rating: '5.0',
      content: 'Supportnya responsif dan sistemnya jarang banget down walau lagi peak hours. Investasi terbaik untuk bisnis F&B saya.',
      sentiment: 'Sangat Direkomendasikan'
    },
    {
      name: 'Ayu Ting Ting',
      role: 'Owner Ayam Geprek',
      avatarUrl: 'https://i.pravatar.cc/150?u=ayu',
      rating: '4.7',
      content: 'Gampang banget set up cabang baru pake Menuin. Semua laporan terintegrasi jadi satu. Sangat recommended buat yang mau scale up.',
      sentiment: 'Sangat Puas'
    }
  ];

  for (const t of dummyTestimonials) {
    await db.insert(testimonials).values(t);
  }

  console.log('Seeded 6 testimonials successfully!');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
