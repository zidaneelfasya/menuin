import { getTenantCatalogSettings } from "@/lib/actions/catalog";
import { AppearanceForm } from "./appearance-form";
import { connection } from "next/server";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tampilan Storefront - Menuin",
};

async function AppearanceDataWrapper() {
  await connection();
  const settings = await getTenantCatalogSettings();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Tampilan Storefront</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Sesuaikan logo, banner, deskripsi, dan warna utama katalog publik Anda melalui upload gambar langsung.
        </p>
      </div>

      <AppearanceForm initialSettings={settings} />
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
