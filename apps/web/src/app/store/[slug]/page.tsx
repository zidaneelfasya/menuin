import { db } from "@/lib/db";
import { categories, products, tenants, productModifierGroups, modifierGroups, transactionItems } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import { CatalogProductList } from "./catalog-product-list";
import { connection } from "next/server";
import { ActiveOrderBanner } from "./active-order-banner";

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
      description: products.description,
      isFeatured: products.isFeatured,
      categoryId: products.categoryId,
    })
    .from(products)
    .where(and(
      eq(products.tenantId, tenant.id),
      eq(products.isActive, true),
      eq(products.isAvailableOnline, true)
    ));

  // Fetch sales aggregation from transactionItems
  const salesData = await db
    .select({
      productId: transactionItems.productId,
      totalSold: sql<number>`COALESCE(SUM(${transactionItems.quantity}), 0)::int`,
    })
    .from(transactionItems)
    .where(eq(transactionItems.tenantId, tenant.id))
    .groupBy(transactionItems.productId);

  const salesMap = new Map<string, number>();
  salesData.forEach((s) => {
    salesMap.set(s.productId, Number(s.totalSold));
  });

  // Fetch product modifiers mapping
  const productMods = await db
    .select({
      productId: productModifierGroups.productId,
      modifierGroupId: productModifierGroups.modifierGroupId
    })
    .from(productModifierGroups)
    .innerJoin(products, eq(products.id, productModifierGroups.productId))
    .where(eq(products.tenantId, tenant.id));
    
  const productsWithMods = productsList.map(p => {
    return {
      ...p,
      modifierGroupIds: productMods.filter(pm => pm.productId === p.id).map(pm => pm.modifierGroupId),
      totalSold: salesMap.get(p.id) || 0,
    };
  });

  // Get all modifier groups for this tenant
  const tenantModGroups = await db.query.modifierGroups.findMany({
    where: eq(modifierGroups.tenantId, tenant.id),
    with: {
      modifiers: true
    }
  });

  // Get categories
  const categoryIds = Array.from(new Set(productsWithMods.map(p => p.categoryId).filter(Boolean))) as string[];
  
  let cats: any[] = [];
  if (categoryIds.length > 0) {
    const allCats = await db.select().from(categories).where(eq(categories.tenantId, tenant.id));
    cats = allCats.filter(c => categoryIds.includes(c.id));
  }

  // Group products by category ID
  const productsByCategory: Record<string, typeof productsWithMods> = {
    'uncategorized': productsWithMods.filter(p => !p.categoryId),
  };

  cats.forEach(c => {
    const catProducts = productsWithMods.filter(p => p.categoryId === c.id);
    if (catProducts.length > 0) {
      productsByCategory[c.id] = catProducts;
    }
  });

  // Best Seller: Products with highest sales count (max 5)
  const bestSellerProducts = productsWithMods
    .filter((p) => (p.totalSold || 0) > 0)
    .sort((a, b) => (b.totalSold || 0) - (a.totalSold || 0))
    .slice(0, 5);

  // Rekomendasi Outlet: Products explicitly toggled as featured
  const recommendedProducts = productsWithMods.filter((p) => p.isFeatured);

  return (
    <div className="space-y-4">
      {tableNumber && (
        <div className="bg-catalog-primary/5 border border-catalog-primary/20 text-catalog-primary px-3.5 py-2 rounded-xl flex items-center justify-between text-xs sm:text-sm font-medium shadow-2xs">
          <span>Pesanan untuk meja:</span>
          <span className="text-sm sm:text-base font-semibold">{tableNumber}</span>
        </div>
      )}

      <CatalogProductList 
        productsByCategory={productsByCategory} 
        categories={cats} 
        tenantSlug={tenant.slug!} 
        bestSellerProducts={bestSellerProducts}
        recommendedProducts={recommendedProducts}
        featuredProducts={recommendedProducts}
        modifierGroups={tenantModGroups}
      />
      <ActiveOrderBanner tenantSlug={tenant.slug!} />
    </div>
  );
}
