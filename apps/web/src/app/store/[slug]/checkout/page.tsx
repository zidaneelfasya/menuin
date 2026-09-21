export const dynamic = 'force-dynamic';
import { db } from "@/lib/db";
import { tenants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
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

  return (
    <div className="max-w-xl mx-auto">
      <CheckoutClient tenantSlug={slug} settings={settings} />
    </div>
  );
}
