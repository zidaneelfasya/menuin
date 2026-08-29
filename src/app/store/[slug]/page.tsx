import { db } from "@/lib/db";
import { categories, products, tenants } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { CatalogProductList } from "./catalog-product-list";
import { connection } from "next/server";

export default async function StorePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ table?: string }>;
}) {
  await connection();
  const { table } = await searchParams;
  const { slug } = await params;
  const tableNumber = table || null;

  // Get tenant
  const tenantResult = await db.select().from(tenants).where(eq(tenants.slug, slug)).limit(1);
  if (tenantResult.length === 0) notFound();
  const tenant = tenantResult[0];

  // Get products available online
  const productsList = await db
    .select({
      id: products.id,
      name: products.name,
      price: products.price,
      imageUrl: products.imageUrl,
      isFeatured: products.isFeatured,
      categoryId: products.categoryId,
    })
    .from(products)
    .where(and(
      eq(products.tenantId, tenant.id),
      eq(products.isAvailableOnline, true)
    ));

  // Get categories
  const categoryIds = Array.from(new Set(productsList.map(p => p.categoryId).filter(Boolean))) as string[];
  
  let cats: any[] = [];
  if (categoryIds.length > 0) {
    const allCats = await db.select().from(categories).where(eq(categories.tenantId, tenant.id));
    cats = allCats.filter(c => categoryIds.includes(c.id));
  }

  // Group products by category ID
  const productsByCategory: Record<string, typeof productsList> = {
    'uncategorized': productsList.filter(p => !p.categoryId),
  };

  cats.forEach(c => {
    const catProducts = productsList.filter(p => p.categoryId === c.id);
    if (catProducts.length > 0) {
      productsByCategory[c.id] = catProducts;
    }
  });

  return (
    <div className="space-y-4">
      {tableNumber && (
        <div className="bg-catalog-primary/10 border border-catalog-primary/20 text-catalog-primary px-4 py-3 rounded-xl flex items-center justify-between text-sm font-medium shadow-sm">
          <div className="flex items-center gap-2">
            <span>🍽️</span> Pesanan untuk meja: 
          </div>
          <strong className="text-lg">{tableNumber}</strong>
        </div>
      )}

      <CatalogProductList 
        productsByCategory={productsByCategory} 
        categories={cats} 
        tenantSlug={tenant.slug!} 
        featuredProducts={productsList.filter(p => p.isFeatured)}
      />
    </div>
  );
}
