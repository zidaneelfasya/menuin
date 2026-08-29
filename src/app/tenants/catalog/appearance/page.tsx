import { getTenantCatalogSettings, updateCatalogAppearance } from "@/lib/actions/catalog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";

export default async function CatalogAppearancePage() {
  const settings = await getTenantCatalogSettings();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Tampilan Storefront</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Sesuaikan logo, banner, deskripsi, dan warna utama katalog publik Anda.
        </p>
      </div>

      <form action={async (formData) => { "use server"; await updateCatalogAppearance(formData); }} className="space-y-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Branding Toko</CardTitle>
            <CardDescription>
              Informasi ini akan ditampilkan di halaman utama katalog Anda.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="storeDescription">Deskripsi Singkat</Label>
              <Textarea 
                id="storeDescription" 
                name="storeDescription" 
                defaultValue={settings.storeDescription || ""} 
                placeholder="Deskripsi restoran atau toko Anda..." 
                className="resize-none"
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="storeLogoUrl">URL Logo (Opsional)</Label>
              <Input 
                id="storeLogoUrl" 
                name="storeLogoUrl" 
                defaultValue={settings.storeLogoUrl || ""} 
                placeholder="https://contoh.com/logo.png" 
              />
              <p className="text-xs text-muted-foreground">URL gambar logo (rasio 1:1 direkomendasikan).</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="storeBannerUrl">URL Banner/Cover (Opsional)</Label>
              <Input 
                id="storeBannerUrl" 
                name="storeBannerUrl" 
                defaultValue={settings.storeBannerUrl || ""} 
                placeholder="https://contoh.com/banner.jpg" 
              />
              <p className="text-xs text-muted-foreground">URL gambar banner untuk header toko (rasio 16:9 direkomendasikan).</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="primaryColor">Warna Utama (Hex)</Label>
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-md border shadow-sm flex-shrink-0" 
                  style={{ backgroundColor: settings.primaryColor || "#2563EB" }}
                />
                <Input 
                  id="primaryColor" 
                  name="primaryColor" 
                  type="text"
                  defaultValue={settings.primaryColor || "#2563EB"} 
                  placeholder="#2563EB" 
                  className="font-mono max-w-[150px]"
                />
              </div>
              <p className="text-xs text-muted-foreground">Digunakan untuk tombol dan aksen pada katalog publik.</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" className="gap-2">
            <Save className="h-4 w-4" />
            Simpan Tampilan
          </Button>
        </div>
      </form>
    </div>
  );
}
