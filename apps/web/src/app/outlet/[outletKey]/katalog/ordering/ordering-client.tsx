'use client';

import { useState } from "react";
import { updateCatalogOrdering } from "@/lib/actions/catalog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function OrderingClient({ settings }: { settings: any }) {
  const [isSaving, setIsSaving] = useState(false);
  
  const [dineInEnabled, setDineInEnabled] = useState(settings.dineInEnabled ?? true);
  const [takeAwayEnabled, setTakeAwayEnabled] = useState(settings.takeAwayEnabled ?? true);
  const [deliveryEnabled, setDeliveryEnabled] = useState(settings.deliveryEnabled ?? false);
  const [customerNameRequired, setCustomerNameRequired] = useState(settings.customerNameRequired ?? true);
  const [customerPhoneRequired, setCustomerPhoneRequired] = useState(settings.customerPhoneRequired ?? false);
  const [tableNumberRequired, setTableNumberRequired] = useState(settings.tableNumberRequired ?? false);
  const [orderProcessType, setOrderProcessType] = useState(settings.orderProcessType || "MANUAL");
  const [onlinePaymentEnabled, setOnlinePaymentEnabled] = useState(settings.onlinePaymentEnabled ?? false);

  const hasChanges = 
    dineInEnabled !== (settings.dineInEnabled ?? true) ||
    takeAwayEnabled !== (settings.takeAwayEnabled ?? true) ||
    deliveryEnabled !== (settings.deliveryEnabled ?? false) ||
    customerNameRequired !== (settings.customerNameRequired ?? true) ||
    customerPhoneRequired !== (settings.customerPhoneRequired ?? false) ||
    tableNumberRequired !== (settings.tableNumberRequired ?? false) ||
    orderProcessType !== (settings.orderProcessType || "MANUAL") ||
    onlinePaymentEnabled !== (settings.onlinePaymentEnabled ?? false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    const formData = new FormData();
    formData.append("dineInEnabled", dineInEnabled.toString());
    formData.append("takeAwayEnabled", takeAwayEnabled.toString());
    formData.append("deliveryEnabled", deliveryEnabled.toString());
    formData.append("customerNameRequired", customerNameRequired.toString());
    formData.append("customerPhoneRequired", customerPhoneRequired.toString());
    formData.append("tableNumberRequired", tableNumberRequired.toString());
    formData.append("orderProcessType", orderProcessType);
    formData.append("onlinePaymentEnabled", onlinePaymentEnabled.toString());

    const result = await updateCatalogOrdering(formData);
    
    setIsSaving(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Pengaturan pesanan & pembayaran berhasil disimpan");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
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
            <Switch id="dineInEnabled" checked={dineInEnabled} onCheckedChange={setDineInEnabled} />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="takeAwayEnabled" className="text-base cursor-pointer">Take Away (Bawa Pulang)</Label>
            <Switch id="takeAwayEnabled" checked={takeAwayEnabled} onCheckedChange={setTakeAwayEnabled} />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="deliveryEnabled" className="text-base cursor-pointer">Delivery (Pesan Antar)</Label>
            <Switch id="deliveryEnabled" checked={deliveryEnabled} onCheckedChange={setDeliveryEnabled} />
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
            <Switch id="customerNameRequired" checked={customerNameRequired} onCheckedChange={setCustomerNameRequired} />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="customerPhoneRequired" className="text-base cursor-pointer">Wajibkan Nomor Telepon</Label>
            <Switch id="customerPhoneRequired" checked={customerPhoneRequired} onCheckedChange={setCustomerPhoneRequired} />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="tableNumberRequired" className="text-base cursor-pointer">Wajibkan Nomor Meja</Label>
            <Switch id="tableNumberRequired" checked={tableNumberRequired} onCheckedChange={setTableNumberRequired} />
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
              value={orderProcessType}
              onChange={(e) => setOrderProcessType(e.target.value)}
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
              checked={onlinePaymentEnabled} 
              onCheckedChange={setOnlinePaymentEnabled} 
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSaving || !hasChanges} className="gap-2 min-w-[150px]">
          {isSaving ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...</>
          ) : (
            <><Save className="h-4 w-4" /> Simpan Pengaturan</>
          )}
        </Button>
      </div>
    </form>
  );
}
