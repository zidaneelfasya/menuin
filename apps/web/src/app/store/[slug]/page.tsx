import { db } from "@/lib/db";
import { categories, products, tenants, productModifierGroups, modifierGroups, modifiers } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
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
      isFeatured: products.isFeatured,
      categoryId: products.categoryId,
    })
    .from(products)
    .where(and(
      eq(products.tenantId, tenant.id),
      eq(products.isAvailableOnline, true)
    ));

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
      modifierGroupIds: productMods.filter(pm => pm.productId === p.id).map(pm => pm.modifierGroupId)
    }
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

  return (
    <div className="space-y-4">
      {tableNumber && (
        <div className="bg-catalog-primary/10 border border-catalog-primary/20 text-catalog-primary px-4 py-3 rounded-xl flex items-center justify-between text-sm font-medium shadow-sm">
          <div className="flex items-center gap-2">
            <span>Pesanan untuk meja:</span>
          </div>
          <strong className="text-lg font-bold">{tableNumber}</strong>
        </div>
      )}

      <CatalogProductList 
        productsByCategory={productsByCategory} 
        categories={cats} 
        tenantSlug={tenant.slug!} 
        featuredProducts={productsWithMods.filter(p => p.isFeatured)}
        modifierGroups={tenantModGroups}
      />
      <ActiveOrderBanner tenantSlug={tenant.slug!} />
    </div>
  );
}
