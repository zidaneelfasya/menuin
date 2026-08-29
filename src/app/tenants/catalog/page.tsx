import { getTenantCatalogSettings } from "@/lib/actions/catalog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ExternalLink, Save } from "lucide-react";
import { updateCatalogStatus } from "@/lib/actions/catalog";

export default async function CatalogOverviewPage() {
  const settings = await getTenantCatalogSettings();
  
  // The catalog URL based on the slug. For local development it uses .localhost:3000
  // For production it would use .menuin.id
  const isDev = process.env.NODE_ENV !== "production";
  const domain = isDev ? "localhost:3000" : "menuin.id";
  const catalogUrl = settings.slug ? `http://${settings.slug}.${domain}` : null;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Status & Overview</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Aktifkan website katalog menu untuk pelanggan Anda.
        </p>
      </div>

      <form action={async (formData) => { "use server"; await updateCatalogStatus(formData); }} className="space-y-6 max-w-2xl">
        <Card>
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
                name="storefrontEnabled" 
                value="true"
                defaultChecked={settings.storefrontEnabled} 
              />
            </div>
            
            <div className="space-y-2 pt-4 border-t">
              <Label htmlFor="slug">URL Katalog (Subdomain)</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground flex-shrink-0">https://</span>
                <Input 
                  id="slug" 
                  name="slug" 
                  defaultValue={settings.slug || ""} 
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
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary">Katalog Anda Live di:</p>
                <a href={catalogUrl} target="_blank" rel="noopener noreferrer" className="text-lg font-bold text-primary hover:underline flex items-center gap-2 mt-1">
                  {settings.slug}.{domain}
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
              <Button asChild variant="outline" className="bg-white">
                <a href={catalogUrl} target="_blank" rel="noopener noreferrer">Buka Katalog</a>
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end">
          <Button type="submit" className="gap-2">
            <Save className="h-4 w-4" />
            Simpan Perubahan
          </Button>
        </div>
      </form>
    </div>
  );
}
