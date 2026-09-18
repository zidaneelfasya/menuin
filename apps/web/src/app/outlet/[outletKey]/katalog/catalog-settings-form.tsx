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
    } catch (error) {
      toast.error("Gagal menyimpan pengaturan katalog");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <Card className="rounded-xl shadow-sm border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Status Website Katalog</CardTitle>
          <CardDescription>
            Jika dinonaktifkan, pelanggan tidak dapat mengakses katalog online Anda.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="storefrontEnabled" className="text-base">Aktifkan Katalog Publik</Label>
              <p className="text-sm text-muted-foreground">Katalog dapat diakses melalui URL khusus Anda.</p>
            </div>
            <Switch 
              id="storefrontEnabled" 
              checked={storefrontEnabled}
              onCheckedChange={setStorefrontEnabled}
            />
          </div>
          
          <div className="space-y-2 pt-4 border-t">
            <Label htmlFor="slug">URL Katalog (Subdomain)</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground flex-shrink-0">https://</span>
              <Input 
                id="slug" 
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="nama-restoran" 
                className="max-w-[200px]"
              />
              <span className="text-sm text-muted-foreground flex-shrink-0">.{domain}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Gunakan huruf kecil, angka, dan tanda hubung (-). Contoh: kopi-kenangan
            </p>
          </div>
        </CardContent>
      </Card>

      {catalogUrl && (
        <Card className="bg-primary/5 border-primary/20 rounded-xl shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-primary">Katalog Anda Live di:</p>
              <a href={catalogUrl} target="_blank" rel="noopener noreferrer" className="text-lg font-bold text-primary hover:underline flex items-center gap-2 mt-1">
                {settings.slug}.{domain}
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
            <Button asChild variant="outline" className="bg-white shadow-sm rounded-xl">
              <a href={catalogUrl} target="_blank" rel="noopener noreferrer">Buka Katalog</a>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button disabled={isSaving || !hasChanges} type="submit" size="lg" className="min-w-[150px] shadow-sm">
          {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...</> : <><Save className="mr-2 h-4 w-4" /> Simpan Perubahan</>}
        </Button>
      </div>
    </form>
  );
}
