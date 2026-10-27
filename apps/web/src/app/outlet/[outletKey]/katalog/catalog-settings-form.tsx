"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ExternalLink, Save, Loader2 } from "lucide-react";
import { updateCatalogStatus } from "@/lib/actions/catalog";
import { toast } from "sonner";

export function CatalogSettingsForm({ settings, domain, catalogUrl }: { settings: any, domain: string, catalogUrl: string | null }) {
  const [isSaving, setIsSaving] = useState(false);
  const [storefrontEnabled, setStorefrontEnabled] = useState(settings.storefrontEnabled ?? false);
  const [slug, setSlug] = useState(settings.slug || "");

  const hasChanges = storefrontEnabled !== (settings.storefrontEnabled ?? false) || slug !== (settings.slug || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    const formData = new FormData();
    formData.append("storefrontEnabled", storefrontEnabled.toString());
    formData.append("slug", slug);

    try {
      await updateCatalogStatus(formData);
      toast.success("Pengaturan katalog berhasil disimpan");
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("catalog-updated"));
      }
    } catch (error) {
      toast.error("Gagal menyimpan pengaturan katalog");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <Card className="rounded-2xl shadow-md border-none bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900">Status Website Katalog</CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Jika dinonaktifkan, pelanggan tidak dapat mengakses katalog online Anda.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="storefrontEnabled" className="text-sm font-medium text-slate-900 cursor-pointer">Aktifkan Katalog Publik</Label>
              <p className="text-xs text-slate-500">Katalog dapat diakses melalui URL khusus Anda.</p>
            </div>
            <Switch 
              id="storefrontEnabled" 
              checked={storefrontEnabled}
              onCheckedChange={setStorefrontEnabled}
              className="data-[state=checked]:bg-[#0e59f9]"
            />
          </div>
          
          <div className="space-y-2 pt-4 border-t border-slate-100">
            <Label htmlFor="slug" className="text-xs font-medium text-slate-700">URL Katalog (Subdomain)</Label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 flex-shrink-0">https://</span>
              <Input 
                id="slug" 
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="nama-restoran" 
                className="max-w-[220px] h-9 text-xs rounded-full bg-white border-none shadow-sm-md px-3.5 focus-visible:ring-blue-600"
              />
              <span className="text-xs text-slate-500 font-medium flex-shrink-0">.{domain}</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Gunakan huruf kecil, angka, dan tanda hubung (-). Contoh: kopi-kenangan
            </p>
          </div>
        </CardContent>
      </Card>

      {catalogUrl && (
        <div className="bg-blue-50/70 rounded-2xl shadow-md p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-blue-700">Katalog Anda Live di:</p>
            <a href={catalogUrl} target="_blank" rel="noopener noreferrer" className="text-base font-semibold text-[#0e59f9] hover:underline flex items-center gap-1.5 mt-0.5">
              {settings.slug}.{domain}
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
          <Button asChild variant="outline" className="h-9 px-4 rounded-full bg-white hover:bg-slate-100 text-[#0e59f9] border-none shadow-sm-md text-xs font-semibold cursor-pointer">
            <a href={catalogUrl} target="_blank" rel="noopener noreferrer">Buka Katalog</a>
          </Button>
        </div>
      )}

      <div className="flex justify-end">
        <Button 
          disabled={isSaving || !hasChanges} 
          type="submit" 
          className="h-11 px-6 rounded-full bg-[#0e59f9] hover:bg-[#0b4de0] text-white shadow-xs font-semibold text-xs min-w-[160px] cursor-pointer flex items-center justify-center gap-2"
        >
          {isSaving ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Menyimpan...</>
          ) : (
            <><Save className="h-4 w-4" /> Simpan Perubahan</>
          )}
        </Button>
      </div>
    </form>
  );
}
