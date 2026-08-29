import { getProducts } from "@/lib/actions/products";
import { VisibilityClient } from "./visibility-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function CatalogVisibilityPage() {
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
