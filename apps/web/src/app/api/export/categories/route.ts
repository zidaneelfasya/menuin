import { NextResponse } from 'next/server';
import * as xlsx from 'xlsx';
import { db } from '@/lib/db';
import { categories, products } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/actions/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const categoryList = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        displayOrder: categories.displayOrder,
        productCount: sql<number>`count(${products.id})::int`,
      })
      .from(categories)
      .leftJoin(products, eq(categories.id, products.categoryId))
      .where(eq(categories.tenantId, user.tenantId))
      .groupBy(categories.id)
      .orderBy(categories.displayOrder, categories.name);

    const headers = ['Nama Kategori', 'Slug', 'Urutan Tampilan (Opsional)', 'Total Item'];
    const rows = categoryList.map((cat) => [
      cat.name,
      cat.slug,
      cat.displayOrder ?? 0,
      cat.productCount ?? 0,
    ]);

    const worksheetData = [headers, ...rows];
    const worksheet = xlsx.utils.aoa_to_sheet(worksheetData);

    worksheet['!cols'] = [
      { wch: 30 }, // Nama Kategori
      { wch: 25 }, // Slug
      { wch: 25 }, // Urutan Tampilan
      { wch: 15 }, // Total Item
    ];

    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Kategori');

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    const today = new Date().toISOString().slice(0, 10);
    const filename = `kategori_${user.outletKey || 'export'}_${today}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error: any) {
    console.error('Error exporting categories:', error);
    return NextResponse.json({ error: 'Gagal mengekspor data kategori' }, { status: 500 });
  }
}
