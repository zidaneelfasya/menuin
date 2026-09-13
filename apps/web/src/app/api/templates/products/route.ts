import { NextResponse } from 'next/server';
import * as xlsx from 'xlsx';

export async function GET() {
  try {
    const workbook = xlsx.utils.book_new();

    const headers = [
      'Nama Item',
      'Kategori',
      'Harga Jual',
      'Harga Modal (Opsional)',
      'Stok (Opsional)',
      'Stok Minimal (Opsional)',
      'Lacak Stok (YA/TIDAK)',
      'Best Seller (YA/TIDAK)',
    ];

    const sampleData = [
      ['Nasi Goreng Spesial', 'Makanan Utama', 28000, 15000, 50, 10, 'YA', 'YA'],
      ['Kopi Susu Gula Aren', 'Minuman & Kopi', 18000, 8000, 100, 15, 'YA', 'YA'],
      ['Kentang Goreng Krispi', 'Camilan & Snack', 15000, 7000, 30, 5, 'YA', 'TIDAK'],
      ['Air Mineral Dingin', 'Minuman & Kopi', 5000, 2500, 200, 20, 'TIDAK', 'TIDAK'],
    ];

    const worksheetData = [headers, ...sampleData];
    const worksheet = xlsx.utils.aoa_to_sheet(worksheetData);

    // Set column widths
    worksheet['!cols'] = [
      { wch: 30 }, // Nama Item
      { wch: 22 }, // Kategori
      { wch: 15 }, // Harga Jual
      { wch: 18 }, // Harga Modal
      { wch: 15 }, // Stok
      { wch: 20 }, // Stok Minimal
      { wch: 20 }, // Lacak Stok
      { wch: 20 }, // Best Seller
    ];

    xlsx.utils.book_append_sheet(workbook, worksheet, 'Template Item');

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="template_menu_item_menuin.xlsx"',
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error: any) {
    console.error('Error generating product template:', error);
    return NextResponse.json({ error: 'Gagal membuat template menu item' }, { status: 500 });
  }
}
