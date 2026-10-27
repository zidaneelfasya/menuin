import { getProducts } from "@/lib/actions/products";
import { VisibilityClient } from "./visibility-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Suspense } from "react";
import { Metadata } from "next";
import CatalogVisibilityLoading from "./loading";

export const metadata: Metadata = {
  title: 'Visibilitas Produk - Menuin',
};

async function VisibilityDataWrapper() {
  const result = await getProducts();
  const products = result.success && result.data ? result.data : [];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Visibilitas Produk</h2>
        <p className="text-sm text-slate-500 mt-1">
          Tentukan produk mana yang akan ditampilkan di website katalog dan mana yang menjadi produk unggulan.
        </p>
      </div>

      <Card className="rounded-2xl border-none shadow-md bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900">Daftar Produk</CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Ubah status online dan fitur untuk setiap produk.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VisibilityClient products={products} />
        </CardContent>
      </Card>
    </div>
  );
}

export default function CatalogVisibilityPage() {
  return (
    <Suspense fallback={<CatalogVisibilityLoading />}>
      <VisibilityDataWrapper />
    </Suspense>
  );
}
