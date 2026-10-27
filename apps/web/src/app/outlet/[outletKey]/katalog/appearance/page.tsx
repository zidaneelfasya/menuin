import { getTenantCatalogSettings } from "@/lib/actions/catalog";
import { AppearanceClient } from "./appearance-client";
import { Suspense } from "react";
import { Metadata } from "next";
import CatalogAppearanceLoading from "./loading";

export const metadata: Metadata = {
  title: 'Tampilan Self QR - Menuin',
};

async function AppearanceDataWrapper() {
  const settings = await getTenantCatalogSettings();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Tampilan Self QR</h1>
        <p className="text-sm text-slate-500 mt-1">
          Sesuaikan logo, banner cover, deskripsi, dan warna utama Self QR publik toko Anda.
        </p>
      </div>

      <AppearanceClient 
        initialSettings={{
          storeDescription: settings.storeDescription,
          storeLogoUrl: settings.storeLogoUrl,
          storeBannerUrl: settings.storeBannerUrl,
          primaryColor: settings.primaryColor,
          openHours: settings.openHours,
          address: settings.address,
          city: settings.city,
          mapsUrl: settings.mapsUrl,
          cuisineType: settings.cuisineType,
          wifiSsid: settings.wifiSsid,
          wifiPassword: settings.wifiPassword,
        }} 
      />
    </div>
  );
}

export default function CatalogAppearancePage() {
  return (
    <Suspense fallback={<CatalogAppearanceLoading />}>
      <AppearanceDataWrapper />
    </Suspense>
  );
}
