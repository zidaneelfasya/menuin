import { getTenantCatalogSettings } from "@/lib/actions/catalog";
import { AppearanceClient } from "./appearance-client";
import { connection } from "next/server";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Tampilan Storefront - Menuin',
};

async function AppearanceDataWrapper() {
  await connection();
  const settings = await getTenantCatalogSettings();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tampilan Storefront</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Sesuaikan logo, banner cover, deskripsi, dan warna utama katalog publik toko Anda.
        </p>
      </div>

      <AppearanceClient 
        initialSettings={{
          storeDescription: settings.storeDescription,
          storeLogoUrl: settings.storeLogoUrl,
          storeBannerUrl: settings.storeBannerUrl,
          primaryColor: settings.primaryColor,
        }} 
      />
    </div>
  );
}

export default function CatalogAppearancePage() {
  return (
    <Suspense fallback={<div className="p-6 flex justify-center"><Loader2 className="animate-spin h-6 w-6 text-muted-foreground" /></div>}>
      <AppearanceDataWrapper />
    </Suspense>
  );
}
