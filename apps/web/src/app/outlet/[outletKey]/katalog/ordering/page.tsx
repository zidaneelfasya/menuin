import { getTenantCatalogSettings } from "@/lib/actions/catalog";
import { OrderingClient } from "./ordering-client";
import { Suspense } from "react";
import { Metadata } from "next";
import CatalogOrderingLoading from "./loading";

export const metadata: Metadata = {
  title: 'Pengaturan Pesanan - Menuin',
};

async function OrderingDataWrapper() {
  const settings = await getTenantCatalogSettings();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Pengaturan Pesanan & Pembayaran</h2>
        <p className="text-sm text-slate-500 mt-1">
          Atur tipe pesanan yang didukung dan pembayaran online.
        </p>
      </div>

      <OrderingClient settings={settings} />
    </div>
  );
}

export default function CatalogOrderingPage() {
  return (
    <Suspense fallback={<CatalogOrderingLoading />}>
      <OrderingDataWrapper />
    </Suspense>
  );
}
