import { getTenantCatalogSettings } from "@/lib/actions/catalog";
import { OrderingClient } from "./ordering-client";

export default async function CatalogOrderingPage() {
  const settings = await getTenantCatalogSettings();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Pengaturan Pesanan & Pembayaran</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Atur tipe pesanan yang didukung dan hubungkan akun Midtrans Anda.
        </p>
      </div>

      <OrderingClient settings={settings} />
    </div>
  );
}
