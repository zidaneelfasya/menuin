import * as XLSX from 'xlsx';
import { ProductDto } from '@menuin/types';

export interface MenuTemplateRow {
  'Nama Menu *': string;
  'Kategori': string;
  'Harga Jual *': number | string;
  'Harga Modal': number | string;
  'Stok': number | string;
  'Stok Minimum': number | string;
  'Lacak Stok (YA/TIDAK)': string;
  'SKU': string;
  'Barcode': string;
  'Menu Unggulan (YA/TIDAK)': string;
  'Deskripsi': string;
}

/**
 * Contoh data realistis untuk template Excel/CSV
 */
const SAMPLE_TEMPLATE_DATA: MenuTemplateRow[] = [
  {
    'Nama Menu *': 'Es Kopi Susu Gula Aren',
    'Kategori': 'Minuman Kopi',
    'Harga Jual *': 22000,
    'Harga Modal': 11000,
    'Stok': 100,
    'Stok Minimum': 15,
    'Lacak Stok (YA/TIDAK)': 'YA',
    'SKU': 'KOP-001',
    'Barcode': '899100100001',
    'Menu Unggulan (YA/TIDAK)': 'YA',
    'Deskripsi': 'Espresso double shot dipadukan dengan susu segar dan sirup gula aren murni.',
  },
  {
    'Nama Menu *': 'Nasi Goreng Spesial Menuin',
    'Kategori': 'Makanan Utama',
    'Harga Jual *': 35000,
    'Harga Modal': 18000,
    'Stok': 50,
    'Stok Minimum': 10,
    'Lacak Stok (YA/TIDAK)': 'YA',
    'SKU': 'NAS-002',
    'Barcode': '899100100002',
    'Menu Unggulan (YA/TIDAK)': 'YA',
    'Deskripsi': 'Nasi goreng harum bumbu rempah pilihan, dilengkapi telur mata sapi, ayam suwir, dan kerupuk.',
  },
  {
    'Nama Menu *': 'Croissant Butter Crispy',
    'Kategori': 'Pastry & Roti',
    'Harga Jual *': 28000,
    'Harga Modal': 14000,
    'Stok': 30,
    'Stok Minimum': 5,
    'Lacak Stok (YA/TIDAK)': 'YA',
    'SKU': 'PAS-003',
    'Barcode': '899100100003',
    'Menu Unggulan (YA/TIDAK)': 'TIDAK',
    'Deskripsi': 'Croissant renyah berlapis dengan aroma butter Prancis yang wangi dan gurih.',
  },
  {
    'Nama Menu *': 'Matcha Latte Ice',
    'Kategori': 'Non-Kopi',
    'Harga Jual *': 26000,
    'Harga Modal': 13000,
    'Stok': 80,
    'Stok Minimum': 10,
    'Lacak Stok (YA/TIDAK)': 'YA',
    'SKU': 'MAT-004',
    'Barcode': '',
    'Menu Unggulan (YA/TIDAK)': 'TIDAK',
    'Deskripsi': 'Bubuk matcha murni berkualitas tinggi dengan susu creamy dingin.',
  },
];

const GUIDE_DATA = [
  {
    'Nama Kolom': 'Nama Menu *',
    'Wajib': 'WAJIB',
    'Tipe Data': 'Teks',
    'Keterangan & Contoh': 'Nama item menu yang akan tampil di kasir dan menu digital. Contoh: "Es Kopi Susu"',
  },
  {
    'Nama Kolom': 'Kategori',
    'Wajib': 'Opsional',
    'Tipe Data': 'Teks',
    'Keterangan & Contoh': 'Kategori produk. Jika kategori belum ada di sistem, akan otomatis dibuatkan. Contoh: "Minuman Kopi"',
  },
  {
    'Nama Kolom': 'Harga Jual *',
    'Wajib': 'WAJIB',
    'Tipe Data': 'Angka',
    'Keterangan & Contoh': 'Harga jual ke pelanggan (hanya angka positif). Contoh: 25000',
  },
  {
    'Nama Kolom': 'Harga Modal',
    'Wajib': 'Opsional',
    'Tipe Data': 'Angka',
    'Keterangan & Contoh': 'Harga pokok penjualan / HPP untuk menghitung margin keuntungan. Contoh: 12000 (Default: 0)',
  },
  {
    'Nama Kolom': 'Stok',
    'Wajib': 'Opsional',
    'Tipe Data': 'Angka',
    'Keterangan & Contoh': 'Jumlah stok awal produk. Contoh: 50 (Default: 0)',
  },
  {
    'Nama Kolom': 'Stok Minimum',
    'Wajib': 'Opsional',
    'Tipe Data': 'Angka',
    'Keterangan & Contoh': 'Batas peringatan jika stok menipis. Contoh: 5 (Default: 5)',
  },
  {
    'Nama Kolom': 'Lacak Stok (YA/TIDAK)',
    'Wajib': 'Opsional',
    'Tipe Data': 'YA / TIDAK',
    'Keterangan & Contoh': 'Isi YA untuk mengaktifkan pelacakan stok, atau TIDAK untuk stok tak terbatas (unlimited). Default: YA',
  },
  {
    'Nama Kolom': 'SKU',
    'Wajib': 'Opsional',
    'Tipe Data': 'Teks / Kode',
    'Keterangan & Contoh': 'Kode unik produk. Jika dikosongkan, sistem akan otomatis menghasilkan SKU unik.',
  },
  {
    'Nama Kolom': 'Barcode',
    'Wajib': 'Opsional',
    'Tipe Data': 'Angka / Teks',
    'Keterangan & Contoh': 'Kode barcode fisik produk (misal EAN-13). Jika kosong, sistem otomatis membuat barcode acak.',
  },
  {
    'Nama Kolom': 'Menu Unggulan (YA/TIDAK)',
    'Wajib': 'Opsional',
    'Tipe Data': 'YA / TIDAK',
    'Keterangan & Contoh': 'Isi YA jika menu ini merupakan Best Seller / menu unggulan. Default: TIDAK',
  },
  {
    'Nama Kolom': 'Deskripsi',
    'Wajib': 'Opsional',
    'Tipe Data': 'Teks',
    'Keterangan & Contoh': 'Penjelasan singkat mengenai komposisi atau rasa menu.',
  },
];

/**
 * Unduh template Excel (.xlsx) atau CSV (.csv)
 */
export function downloadMenuTemplate(format: 'xlsx' | 'csv' = 'xlsx') {
  if (format === 'csv') {
    const ws = XLSX.utils.json_to_sheet(SAMPLE_TEMPLATE_DATA);
    const csvOutput = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob(['\uFEFF' + csvOutput], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Template_Import_Menu_Menuin.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return;
  }

  // Buat workbook dengan 2 sheet
  const wb = XLSX.utils.book_new();

  // Sheet 1: Template Menu
  const wsTemplate = XLSX.utils.json_to_sheet(SAMPLE_TEMPLATE_DATA);
  
  // Atur lebar kolom agar rapi
  wsTemplate['!cols'] = [
    { wch: 30 }, // Nama Menu
    { wch: 20 }, // Kategori
    { wch: 15 }, // Harga Jual
    { wch: 15 }, // Harga Modal
    { wch: 10 }, // Stok
    { wch: 15 }, // Stok Minimum
    { wch: 22 }, // Lacak Stok
    { wch: 15 }, // SKU
    { wch: 20 }, // Barcode
    { wch: 25 }, // Menu Unggulan
    { wch: 50 }, // Deskripsi
  ];

  XLSX.utils.book_append_sheet(wb, wsTemplate, 'Template Menu');

  // Sheet 2: Petunjuk Pengisian
  const wsGuide = XLSX.utils.json_to_sheet(GUIDE_DATA);
  wsGuide['!cols'] = [
    { wch: 26 }, // Nama Kolom
    { wch: 12 }, // Wajib
    { wch: 15 }, // Tipe Data
    { wch: 75 }, // Keterangan & Contoh
  ];
  XLSX.utils.book_append_sheet(wb, wsGuide, 'Petunjuk Pengisian');

  // Unduh file
  XLSX.writeFile(wb, 'Template_Import_Menu_Menuin.xlsx');
}

/**
 * Ekspor daftar menu saat ini ke Excel (.xlsx)
 */
export function exportProductsToExcel(productsList: ProductDto[], outletName?: string) {
  const dataToExport = productsList.map((item) => ({
    'Nama Menu': item.name,
    'Kategori': item.categoryName || 'Tanpa Kategori',
    'Harga Jual': parseFloat(item.price || '0'),
    'Harga Modal': parseFloat(item.costPrice || '0'),
    'Stok': item.stock,
    'Stok Minimum': item.minStock,
    'Lacak Stok': item.trackStock !== false ? 'YA' : 'TIDAK',
    'SKU': item.sku || '',
    'Barcode': item.barcode || '',
    'Status': item.isActive !== false ? 'Aktif' : 'Nonaktif',
    'Menu Unggulan': item.isFeatured ? 'YA' : 'TIDAK',
    'Deskripsi': item.description || '',
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(dataToExport);

  // Auto lebar kolom
  ws['!cols'] = [
    { wch: 30 }, // Nama Menu
    { wch: 20 }, // Kategori
    { wch: 15 }, // Harga Jual
    { wch: 15 }, // Harga Modal
    { wch: 10 }, // Stok
    { wch: 15 }, // Stok Minimum
    { wch: 15 }, // Lacak Stok
    { wch: 18 }, // SKU
    { wch: 20 }, // Barcode
    { wch: 12 }, // Status
    { wch: 15 }, // Menu Unggulan
    { wch: 45 }, // Deskripsi
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Daftar Menu');

  const sanitizedOutlet = (outletName || 'Outlet').replace(/[^a-zA-Z0-9_-]/g, '_');
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `Menu_${sanitizedOutlet}_${dateStr}.xlsx`;

  XLSX.writeFile(wb, filename);
}

/**
 * Ekspor daftar menu ke format CSV (.csv)
 */
export function exportProductsToCsv(productsList: ProductDto[], outletName?: string) {
  const dataToExport = productsList.map((item) => ({
    'Nama Menu': item.name,
    'Kategori': item.categoryName || 'Tanpa Kategori',
    'Harga Jual': parseFloat(item.price || '0'),
    'Harga Modal': parseFloat(item.costPrice || '0'),
    'Stok': item.stock,
    'Stok Minimum': item.minStock,
    'Lacak Stok': item.trackStock !== false ? 'YA' : 'TIDAK',
    'SKU': item.sku || '',
    'Barcode': item.barcode || '',
    'Status': item.isActive !== false ? 'Aktif' : 'Nonaktif',
    'Menu Unggulan': item.isFeatured ? 'YA' : 'TIDAK',
    'Deskripsi': item.description || '',
  }));

  const ws = XLSX.utils.json_to_sheet(dataToExport);
  const csvOutput = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob(['\uFEFF' + csvOutput], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  
  const sanitizedOutlet = (outletName || 'Outlet').replace(/[^a-zA-Z0-9_-]/g, '_');
  const dateStr = new Date().toISOString().split('T')[0];
  link.setAttribute('download', `Menu_${sanitizedOutlet}_${dateStr}.csv`);
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
