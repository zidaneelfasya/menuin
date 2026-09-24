export const dynamic = 'force-dynamic';
import { db } from "@/lib/db";
import { tenants, products, productModifierGroups, modifierGroups } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { CheckoutClient } from "./checkout-client";

import { connection } from "next/server";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await connection();
  const { slug } = await params;
  const tenantResult = await db.select().from(tenants).where(eq(tenants.slug, slug)).limit(1);
  if (tenantResult.length === 0) notFound();
  
  const tenant = tenantResult[0];
  
  if (!tenant.storefrontEnabled) {
    notFound();
  }

  const settings = {
    tenantName: tenant.name,
    dineInEnabled: tenant.dineInEnabled,
    takeAwayEnabled: tenant.takeAwayEnabled,
    deliveryEnabled: tenant.deliveryEnabled,
    customerNameRequired: tenant.customerNameRequired,
    customerPhoneRequired: tenant.customerPhoneRequired,
    tableNumberRequired: tenant.tableNumberRequired,
    midtransEnvironment: tenant.midtransEnvironment,
    midtransClientKey: tenant.midtransClientKey,
    onlinePaymentEnabled: tenant.onlinePaymentEnabled,
    taxRate: parseFloat(tenant.posTaxRate || '0'),
    taxName: tenant.taxName || 'Pajak (PB1)',
    serviceChargeRate: parseFloat(tenant.serviceChargeRate || '0'),
  };

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

  // Fetch product modifiers mapping
  const productMods = await db
    .select({
      productId: productModifierGroups.productId,
      modifierGroupId: productModifierGroups.modifierGroupId,
    })
    .from(productModifierGroups)
    .where(eq(productModifierGroups.tenantId, tenant.id));
    
  const productsWithMods = productsList.map((p) => ({
    ...p,
    modifierGroupIds: productMods
      .filter((pm) => pm.productId === p.id)
      .map((pm) => pm.modifierGroupId),
  }));

  // Get all modifier groups for this tenant
  const tenantModGroups = await db.query.modifierGroups.findMany({
    where: eq(modifierGroups.tenantId, tenant.id),
    with: {
      modifiers: true,
    },
  });

  return (
    <CheckoutClient
      tenantSlug={slug}
      settings={settings}
      products={productsWithMods}
      modifierGroups={tenantModGroups as any}
    />
  );
}
