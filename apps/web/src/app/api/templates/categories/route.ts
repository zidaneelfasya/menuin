import { NextResponse } from 'next/server';
import * as xlsx from 'xlsx';

export async function GET() {
  try {
    const workbook = xlsx.utils.book_new();

    const headers = ['Nama Kategori', 'Urutan Tampilan (Opsional)'];
    const sampleData = [
      ['Makanan Utama', 1],
      ['Minuman & Kopi', 2],
      ['Camilan & Snack', 3],
      ['Dessert', 4],
    ];

    const worksheetData = [headers, ...sampleData];
    const worksheet = xlsx.utils.aoa_to_sheet(worksheetData);

    // Set column widths
    worksheet['!cols'] = [
      { wch: 30 }, // Nama Kategori
      { wch: 25 }, // Urutan Tampilan
    ];

    xlsx.utils.book_append_sheet(workbook, worksheet, 'Template Kategori');

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="template_kategori_menuin.xlsx"',
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error: any) {
    console.error('Error generating category template:', error);
    return NextResponse.json({ error: 'Gagal membuat template kategori' }, { status: 500 });
  }
}
