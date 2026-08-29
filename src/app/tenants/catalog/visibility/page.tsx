import { getProducts } from "@/lib/actions/products";
import { VisibilityClient } from "./visibility-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { connection } from "next/server";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";

async function VisibilityDataWrapper() {
  await connection();
  const result = await getProducts();
  const products = result.success && result.data ? result.data : [];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Visibilitas Produk</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Tentukan produk mana yang akan ditampilkan di website katalog dan mana yang menjadi produk unggulan.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Daftar Produk</CardTitle>
          <CardDescription>
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
    <Suspense fallback={<div className="p-6 flex justify-center"><Loader2 className="animate-spin h-6 w-6 text-muted-foreground" /></div>}>
      <VisibilityDataWrapper />
    </Suspense>
  );
}
