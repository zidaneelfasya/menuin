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

  const hasChanges = 
    posKitchenSync !== (initialData.posKitchenSync ?? false) ||
    posOrderTypeSelection !== (initialData.posOrderTypeSelection || "MANUAL") ||
    posPinBestSellers !== (initialData.posPinBestSellers ?? true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    const formData = new FormData();
    formData.append("posKitchenSync", posKitchenSync.toString());
    formData.append("posOrderTypeSelection", posOrderTypeSelection);
    formData.append("posPinBestSellers", posPinBestSellers.toString());

    const result = await updatePosSettings(formData);
    
    setIsSaving(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Pengaturan kasir berhasil disimpan");
    }
  };

  return (
    <div className="bg-card border border-border/70 rounded-2xl p-6 sm:p-8 shadow-xs">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="pb-5 border-b border-border/60">
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            Alur Kasir & Operasional POS
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Konfigurasi alur checkout kasir dan integrasi tiket pesanan dapur.
          </p>
        </div>

        <div className="divide-y divide-border/60">
          {/* ROW 1: SINKRONISASI DAPUR */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-8 py-5 items-center">
            <div className="md:col-span-8 space-y-0.5">
              <Label htmlFor="posKitchenSync" className="text-sm font-semibold text-foreground">
                Kirim Pesanan Kasir ke Layar Dapur
              </Label>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Saat pesanan dibayar di kasir, otomatis masuk ke antrean dapur (Kanban Dapur).
              </p>
            </div>
            <div className="md:col-span-4 flex justify-start md:justify-end">
              <Switch
                id="posKitchenSync"
                checked={posKitchenSync}
                onCheckedChange={setPosKitchenSync}
              />
            </div>
          </div>

          {/* ROW 2: ORDER TYPE SELECTION */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-8 py-5 items-start">
            <div className="md:col-span-4 space-y-0.5">
              <Label className="text-sm font-semibold text-foreground">
                Pilihan Tipe Pesanan (Order Type)
              </Label>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Aturan pemilihan Dine In / Take Away saat kasir checkout.
              </p>
            </div>
            <div className="md:col-span-8">
              <Select value={posOrderTypeSelection} onValueChange={setPosOrderTypeSelection}>
                <SelectTrigger className="w-full h-11 bg-background/80 hover:bg-background border-border/80 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
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
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-8 py-5 items-center">
            <div className="md:col-span-8 space-y-0.5">
              <Label htmlFor="posPinBestSellersForm" className="text-sm font-semibold text-foreground">
                Sematkan Best Seller di Posisi Teratas
              </Label>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Produk unggulan / best seller otomatis ditampilkan di baris paling awal antarmuka kasir.
              </p>
            </div>
            <div className="md:col-span-4 flex justify-start md:justify-end">
              <Switch
                id="posPinBestSellersForm"
                checked={posPinBestSellers}
                onCheckedChange={setPosPinBestSellers}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-5 border-t border-border/60">
          <Button 
            disabled={isSaving || !hasChanges} 
            type="submit" 
            className="min-w-[150px] h-11 rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all cursor-pointer"
          >
            {isSaving ? <><IconLoader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...</> : <><IconDeviceFloppy className="mr-2 h-4 w-4" /> Simpan Alur Kasir</>}
          </Button>
        </div>
      </form>
    </div>
  );
}
