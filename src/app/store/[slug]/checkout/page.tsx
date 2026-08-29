import { db } from "@/lib/db";
import { tenants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { CheckoutClient } from "./checkout-client";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenantResult = await db.select().from(tenants).where(eq(tenants.slug, slug)).limit(1);
  if (tenantResult.length === 0) notFound();
  
  const tenant = tenantResult[0];
  
  if (!tenant.storefrontEnabled) {
    notFound();
  }

  const settings = {
    dineInEnabled: tenant.dineInEnabled,
    takeAwayEnabled: tenant.takeAwayEnabled,
    deliveryEnabled: tenant.deliveryEnabled,
    customerNameRequired: tenant.customerNameRequired,
    customerPhoneRequired: tenant.customerPhoneRequired,
    tableNumberRequired: tenant.tableNumberRequired,
    midtransEnvironment: tenant.midtransEnvironment,
    midtransClientKey: tenant.midtransClientKey,
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="bg-white p-5 rounded-2xl border shadow-sm">
        <h2 className="font-bold text-xl mb-6 text-gray-800">Ringkasan Pesanan Anda</h2>
        <CheckoutClient tenantSlug={slug} settings={settings} />
      </div>
    </div>
  );
}
