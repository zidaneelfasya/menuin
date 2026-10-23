"use client";

import { useState } from "react";
import { updatePosSettings } from "@/lib/actions/pos-settings";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IconLoader2, IconDeviceFloppy } from "@tabler/icons-react";
import { toast } from "sonner";

export function PosSettingsForm({ initialData }: { initialData: any }) {
  const [isSaving, setIsSaving] = useState(false);
  
  // State for form fields
  const [posKitchenSync, setPosKitchenSync] = useState(initialData.posKitchenSync ?? false);
  const [posOrderTypeSelection, setPosOrderTypeSelection] = useState(initialData.posOrderTypeSelection || "MANUAL");
  const [posPinBestSellers, setPosPinBestSellers] = useState(initialData.posPinBestSellers ?? true);
  const [posRounding, setPosRounding] = useState(initialData.posRounding ?? false);

  const hasChanges = 
    posKitchenSync !== (initialData.posKitchenSync ?? false) ||
    posOrderTypeSelection !== (initialData.posOrderTypeSelection || "MANUAL") ||
    posPinBestSellers !== (initialData.posPinBestSellers ?? true) ||
    posRounding !== (initialData.posRounding ?? false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    const formData = new FormData();
    formData.append("posKitchenSync", posKitchenSync.toString());
    formData.append("posOrderTypeSelection", posOrderTypeSelection);
    formData.append("posPinBestSellers", posPinBestSellers.toString());
    formData.append("posRounding", posRounding.toString());

    const result = await updatePosSettings(formData);
    
    setIsSaving(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Pengaturan kasir berhasil disimpan");
    }
  };

  return (
    <div className="max-w-3xl space-y-5">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="pb-1">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Alur Kasir & Operasional POS
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Konfigurasi alur checkout kasir, pembulatan nominal, dan integrasi tiket pesanan dapur.
          </p>
        </div>

        <div className="space-y-1">
          {/* ROW 1: SINKRONISASI DAPUR */}
          <div className="flex items-center justify-between gap-6 py-3.5">
            <div className="space-y-0.5 max-w-xl">
              <Label htmlFor="posKitchenSync" className="text-sm font-semibold text-foreground">
                Kirim Pesanan Kasir ke Layar Dapur
              </Label>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Saat pesanan dibayar di kasir, otomatis masuk ke antrean dapur (Kanban Dapur).
              </p>
            </div>
            <Switch
              id="posKitchenSync"
              checked={posKitchenSync}
              onCheckedChange={setPosKitchenSync}
            />
          </div>

          {/* ROW 2: ORDER TYPE SELECTION */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-6 py-3.5 items-start">
            <div className="md:col-span-5 space-y-0.5">
              <Label className="text-sm font-semibold text-foreground">
                Pilihan Tipe Pesanan (Order Type)
              </Label>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Aturan pemilihan Dine In / Take Away saat kasir checkout.
              </p>
            </div>
            <div className="md:col-span-7">
              <Select value={posOrderTypeSelection} onValueChange={setPosOrderTypeSelection}>
                <SelectTrigger className="w-full max-w-md h-10 bg-background/80 hover:bg-background border-border/80 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
                  <SelectValue placeholder="Pilih aturan tipe pesanan" />
                </SelectTrigger>
                <SelectContent className="rounded-xl shadow-lg border-border/80">
                  <SelectItem value="MANUAL" className="rounded-lg text-sm py-2">Wajib Pilih Manual (Kasir memilih Dine In / Take Away)</SelectItem>
                  <SelectItem value="DINE_IN" className="rounded-lg text-sm py-2">Otomatis Default: Dine-In</SelectItem>
                  <SelectItem value="TAKEAWAY" className="rounded-lg text-sm py-2">Otomatis Default: Take Away</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ROW 3: PIN BEST SELLERS */}
          <div className="flex items-center justify-between gap-6 py-3.5">
            <div className="space-y-0.5 max-w-xl">
              <Label htmlFor="posPinBestSellersForm" className="text-sm font-semibold text-foreground">
                Sematkan Best Seller di Posisi Teratas
              </Label>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Produk unggulan / best seller otomatis ditampilkan di baris paling awal antarmuka kasir.
              </p>
            </div>
            <Switch
              id="posPinBestSellersForm"
              checked={posPinBestSellers}
              onCheckedChange={setPosPinBestSellers}
            />
          </div>

          {/* ROW 4: PEMBULATAN NOMINAL KE RATUSAN (ROUNDING 1-99) */}
          <div className="flex items-center justify-between gap-6 py-3.5">
            <div className="space-y-0.5 max-w-xl">
              <div className="flex items-center gap-2">
                <Label htmlFor="posRoundingForm" className="text-sm font-semibold text-foreground">
                  Pembulatan Nominal ke Ratusan (Rounding 1–99)
                </Label>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-[#0e59f9] border border-blue-200/60 dark:bg-blue-950/50 dark:text-blue-300">
                  Kasir POS & Struk
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Membulatkan total pembayaran ke atas ke ratusan rupiah terdekat jika terdapat pecahan 1–99 rupiah untuk mempermudah uang kembalian.
              </p>
            </div>
            <Switch
              id="posRoundingForm"
              checked={posRounding}
              onCheckedChange={setPosRounding}
            />
          </div>
        </div>

        <div className="flex justify-end pt-3">
          <Button 
            disabled={isSaving || !hasChanges} 
            type="submit" 
            className="min-w-[150px] h-10 rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs transition-all cursor-pointer"
          >
            {isSaving ? <><IconLoader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...</> : <><IconDeviceFloppy className="mr-2 h-4 w-4" /> Simpan Alur Kasir</>}
          </Button>
        </div>
      </form>
    </div>
  );
}
