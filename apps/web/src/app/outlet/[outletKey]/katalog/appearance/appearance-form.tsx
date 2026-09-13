'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Save, Loader2 } from 'lucide-react';
import { ImageUpload } from '@/components/ui/image-upload';
import { updateCatalogAppearance } from '@/lib/actions/catalog';
import { toast } from 'sonner';

interface AppearanceFormProps {
  initialSettings: {
    storeDescription?: string | null;
    storeLogoUrl?: string | null;
    storeBannerUrl?: string | null;
    primaryColor?: string | null;
  };
}

export function AppearanceForm({ initialSettings }: AppearanceFormProps) {
  const [isPending, startTransition] = React.useTransition();
  const [storeDescription, setStoreDescription] = React.useState(initialSettings.storeDescription || '');
  const [storeLogoUrl, setStoreLogoUrl] = React.useState(initialSettings.storeLogoUrl || '');
  const [storeBannerUrl, setStoreBannerUrl] = React.useState(initialSettings.storeBannerUrl || '');
  const [primaryColor, setPrimaryColor] = React.useState(initialSettings.primaryColor || '#2563EB');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('storeDescription', storeDescription);
    formData.append('storeLogoUrl', storeLogoUrl);
    formData.append('storeBannerUrl', storeBannerUrl);
    formData.append('primaryColor', primaryColor);

    startTransition(async () => {
      const res = await updateCatalogAppearance(formData);
      if (res && res.error) {
        toast.error(res.error);
      } else {
        toast.success('Tampilan katalog berhasil diperbarui');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <Card className="rounded-2xl border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Branding Toko</CardTitle>
          <CardDescription>
            Informasi ini akan ditampilkan di halaman utama katalog publik dan struk pesanan Anda.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="storeDescription">Deskripsi Singkat</Label>
            <Textarea
              id="storeDescription"
              value={storeDescription}
              onChange={(e) => setStoreDescription(e.target.value)}
              placeholder="Deskripsi restoran atau toko Anda..."
              className="resize-none rounded-xl"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <ImageUpload
                label="Logo Toko"
                folder="logos"
                aspectRatio="square"
                value={storeLogoUrl}
                onChange={(url) => setStoreLogoUrl(url)}
                onRemove={() => setStoreLogoUrl('')}
                helperText="Upload gambar logo toko (rasio 1:1)."
              />
            </div>

            <div className="space-y-2">
              <ImageUpload
                label="Banner / Cover Toko"
                folder="banners"
                aspectRatio="video"
                value={storeBannerUrl}
                onChange={(url) => setStoreBannerUrl(url)}
                onRemove={() => setStoreBannerUrl('')}
                helperText="Upload gambar cover header (rasio 16:9)."
              />
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t">
            <Label htmlFor="primaryColor">Warna Utama (Hex)</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-10 h-10 rounded-lg border border-border cursor-pointer bg-transparent p-0.5"
              />
              <Input
                id="primaryColor"
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                placeholder="#2563EB"
                className="font-mono max-w-[150px] rounded-xl"
              />
            </div>
            <p className="text-xs text-muted-foreground">Digunakan untuk tombol dan aksen pada katalog publik.</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending} className="gap-2 rounded-xl">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isPending ? 'Menyimpan...' : 'Simpan Tampilan'}
        </Button>
      </div>
    </form>
  );
}
