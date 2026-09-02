import { getTenantCatalogSettings, updateCatalogOrdering } from "@/lib/actions/catalog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";

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

      <form action={async (formData) => { "use server"; await updateCatalogOrdering(formData); }} className="space-y-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tipe Pesanan (Order Types)</CardTitle>
            <CardDescription>
              Pilih metode layanan yang tersedia untuk pelanggan online.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="dineInEnabled" className="text-base cursor-pointer">Dine-In (Makan di Tempat)</Label>
              <Switch id="dineInEnabled" name="dineInEnabled" value="true" defaultChecked={settings.dineInEnabled} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="takeAwayEnabled" className="text-base cursor-pointer">Take Away (Bawa Pulang)</Label>
              <Switch id="takeAwayEnabled" name="takeAwayEnabled" value="true" defaultChecked={settings.takeAwayEnabled} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="deliveryEnabled" className="text-base cursor-pointer">Delivery (Pesan Antar)</Label>
              <Switch id="deliveryEnabled" name="deliveryEnabled" value="true" defaultChecked={settings.deliveryEnabled} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Formulir Pelanggan</CardTitle>
            <CardDescription>
              Informasi apa saja yang wajib diisi oleh pelanggan saat checkout.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="customerNameRequired" className="text-base cursor-pointer">Wajibkan Nama Pelanggan</Label>
              <Switch id="customerNameRequired" name="customerNameRequired" value="true" defaultChecked={settings.customerNameRequired} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="customerPhoneRequired" className="text-base cursor-pointer">Wajibkan Nomor Telepon</Label>
              <Switch id="customerPhoneRequired" name="customerPhoneRequired" value="true" defaultChecked={settings.customerPhoneRequired} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="tableNumberRequired" className="text-base cursor-pointer">Wajibkan Nomor Meja</Label>
              <Switch id="tableNumberRequired" name="tableNumberRequired" value="true" defaultChecked={settings.tableNumberRequired} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Mode Pemrosesan Pesanan (Dapur)</CardTitle>
            <CardDescription>
              Tentukan bagaimana pesanan online diproses oleh toko Anda.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="orderProcessType">Alur Pesanan</Label>
              <select 
                id="orderProcessType" 
                name="orderProcessType"
                defaultValue={settings.orderProcessType || "MANUAL"}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="MANUAL">MANUAL (Sistem Cafe: Pesanan Masuk ➔ Diproses ➔ Siap ➔ Selesai)</option>
                <option value="AUTO">AUTO (Langsung Selesai setelah dibayar. Cocok untuk toko ritel/kue)</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Metode Pembayaran Pelanggan</CardTitle>
            <CardDescription>
              Tentukan bagaimana pelanggan dapat membayar pesanannya melalui katalog.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-xl bg-slate-50">
              <div className="space-y-0.5">
                <Label htmlFor="onlinePaymentEnabled" className="text-base font-bold cursor-pointer">Aktifkan Pembayaran Non-Tunai (Online)</Label>
                <p className="text-sm text-muted-foreground max-w-md">
                  Mengizinkan pelanggan membayar menggunakan GoPay, OVO, QRIS, dll. <br/>
                  <span className="text-xs text-emerald-600 font-medium">Syarat: Anda harus sudah mengisi Kunci API Midtrans di menu <strong>Pengaturan</strong> utama.</span>
                </p>
              </div>
              <Switch 
                id="onlinePaymentEnabled" 
                name="onlinePaymentEnabled" 
                value="true" 
                defaultChecked={settings.onlinePaymentEnabled} 
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" className="gap-2">
            <Save className="h-4 w-4" />
            Simpan Pengaturan
          </Button>
        </div>
      </form>
    </div>
  );
}
