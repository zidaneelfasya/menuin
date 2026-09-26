'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Save, Loader2, Store, Image as ImageIcon } from 'lucide-react';
import { ImageUploader } from '@/components/ui/image-uploader';
import { updateCatalogAppearance } from '@/lib/actions/catalog';
import { toast } from 'sonner';

interface AppearanceClientProps {
  initialSettings: {
    storeDescription: string | null;
    storeLogoUrl: string | null;
    storeBannerUrl: string | null;
    primaryColor: string | null;
  };
}

export function AppearanceClient({ initialSettings }: AppearanceClientProps) {
  const [storeDescription, setStoreDescription] = React.useState(initialSettings.storeDescription || '');
  const [storeLogoUrl, setStoreLogoUrl] = React.useState<string | null>(initialSettings.storeLogoUrl || null);
  const [storeBannerUrl, setStoreBannerUrl] = React.useState<string | null>(initialSettings.storeBannerUrl || null);
  const [primaryColor, setPrimaryColor] = React.useState(initialSettings.primaryColor || '#2563EB');
  const [isPending, startTransition] = React.useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('storeDescription', storeDescription);
    if (storeLogoUrl) formData.append('storeLogoUrl', storeLogoUrl);
    if (storeBannerUrl) formData.append('storeBannerUrl', storeBannerUrl);
    formData.append('primaryColor', primaryColor);

    startTransition(async () => {
      const res = await updateCatalogAppearance(formData);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success('Tampilan storefront berhasil disimpan');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-xs">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Store className="w-5 h-5 text-primary" />
            <span>Branding & Media Storefront</span>
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Semua logo dan banner diunggah langsung ke Supabase Storage Bucket dan tampil di katalog publik Anda.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 1. Logo Toko */}
          <div className="space-y-2">
            <ImageUploader
              label="Logo Toko / Outlet (Supabase Storage)"
              description="Rasio 1:1 persegi direkomendasikan. Tampil di header, navbar, dan struk."
              value={storeLogoUrl}
              onChange={setStoreLogoUrl}
              bucket="storefront_images"
              aspectRatio="square"
              previewHeight="h-36"
            />
          </div>

          {/* 2. Banner Toko */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <ImageUploader
              label="Banner / Cover Storefront (Supabase Storage)"
              description="Rasio 16:9 atau lebar direkomendasikan. Tampil sebagai header utama toko online."
              value={storeBannerUrl}
              onChange={setStoreBannerUrl}
              bucket="storefront_images"
              aspectRatio="video"
              previewHeight="h-48"
            />
          </div>

          {/* 3. Deskripsi Singkat */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Label htmlFor="storeDescription" className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Deskripsi Singkat Toko
            </Label>
            <Textarea
              id="storeDescription"
              value={storeDescription}
              onChange={(e) => setStoreDescription(e.target.value)}
              placeholder="Deskripsikan konsep resto, menu signature, atau jam operasional Anda..."
              className="resize-none rounded-xl text-sm"
              rows={3}
            />
          </div>

          {/* 4. Warna Utama */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Label htmlFor="primaryColor" className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Warna Tema Utama (Hex)
            </Label>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs flex-shrink-0"
                style={{ backgroundColor: primaryColor }}
              />
              <Input
                id="primaryColor"
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                placeholder="#2563EB"
                className="font-mono max-w-[150px] uppercase rounded-xl"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Digunakan untuk warna tombol, aksen badge, dan highlight pada katalog publik.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button 
          type="submit" 
          disabled={isPending} 
          className="gap-2 rounded-xl font-bold h-10 px-5 shadow-xs bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isPending ? 'Menyimpan...' : 'Simpan Tampilan Storefront'}
        </Button>
      </div>
    </form>
  );
}
