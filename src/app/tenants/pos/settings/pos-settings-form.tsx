"use client";

import { useState } from "react";
import { updatePosSettings } from "@/lib/actions/pos-settings";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChefHat, CreditCard, LayoutTemplate, Receipt, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function PosSettingsForm({ initialData }: { initialData: any }) {
  const [isSaving, setIsSaving] = useState(false);
  
  // State for form fields
  const [posKitchenSync, setPosKitchenSync] = useState(initialData.posKitchenSync ?? false);
  const [posOrderTypeSelection, setPosOrderTypeSelection] = useState(initialData.posOrderTypeSelection || "MANUAL");
  const [posTaxRate, setPosTaxRate] = useState(initialData.posTaxRate?.toString() || "0");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    const formData = new FormData();
    formData.append("posKitchenSync", posKitchenSync.toString());
    formData.append("posOrderTypeSelection", posOrderTypeSelection);
    formData.append("posTaxRate", posTaxRate);

    const result = await updatePosSettings(formData);
    
    setIsSaving(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Pengaturan kasir berhasil disimpan");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChefHat className="h-5 w-5 text-primary" />
            Sinkronisasi Dapur (Kitchen Sync)
          </CardTitle>
          <CardDescription>
            Menentukan apakah pesanan kasir masuk ke layar dapur atau langsung dianggap selesai.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-xl bg-slate-50/50">
            <div className="space-y-0.5">
              <Label className="text-base font-semibold">Kirim Pesanan ke Dapur</Label>
              <p className="text-sm text-muted-foreground">
                Aktifkan ini untuk bisnis kafe/resto. Saat pelanggan membayar di kasir, pesanan berstatus PENDING dan masuk ke Kanban Dapur.
              </p>
            </div>
            <Switch checked={posKitchenSync} onCheckedChange={setPosKitchenSync} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutTemplate className="h-5 w-5 text-primary" />
            Alur Checkout Kasir
          </CardTitle>
          <CardDescription>
            Konfigurasi form dan aturan wajib isi saat kasir menekan tombol Bayar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label className="text-base font-semibold">Pilihan Tipe Pesanan (Order Type)</Label>
            <p className="text-sm text-muted-foreground">
              Tentukan apakah kasir harus memilih tipe pesanan manual, atau otomatis tersetel ke tipe tertentu.
            </p>
            <Select value={posOrderTypeSelection} onValueChange={setPosOrderTypeSelection}>
              <SelectTrigger className="w-full h-11 bg-slate-50">
                <SelectValue placeholder="Pilih aturan tipe pesanan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MANUAL">Wajib Pilih Manual (Kasir memilih Dine In / Take Away)</SelectItem>
                <SelectItem value="DINE_IN">Otomatis Default: Dine-In</SelectItem>
                <SelectItem value="TAKEAWAY">Otomatis Default: Take Away</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            Pajak & Layanan
          </CardTitle>
          <CardDescription>
            Konfigurasi tarif pajak untuk transaksi yang dilakukan via sistem Kasir (POS).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-w-sm">
            <Label className="text-base font-semibold">Pajak Transaksi Kasir (%)</Label>
            <div className="relative">
              <Input 
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={posTaxRate}
                onChange={(e) => setPosTaxRate(e.target.value)}
                className="pl-4 pr-10 h-11 bg-slate-50" 
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-muted-foreground">
                %
              </div>
            </div>
            <p className="text-sm text-muted-foreground">Masukkan 0 jika harga sudah termasuk pajak.</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button disabled={isSaving} type="submit" size="lg" className="min-w-[150px] shadow-sm">
          {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...</> : <><Save className="mr-2 h-4 w-4" /> Simpan Pengaturan</>}
        </Button>
      </div>
    </form>
  );
}
