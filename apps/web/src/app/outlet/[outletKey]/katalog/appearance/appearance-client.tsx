'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ImageUploader } from '@/components/ui/image-uploader';
import { ColorPicker } from '@/components/ui/color-picker';
import { updateCatalogAppearance } from '@/lib/actions/catalog';
import { toast } from 'sonner';
import { Store, Clock, Wifi, Save, Loader2 } from 'lucide-react';

interface AppearanceClientProps {
  initialSettings: {
    storeDescription?: string | null;
    storeLogoUrl?: string | null;
    storeBannerUrl?: string | null;
    primaryColor?: string | null;
    openHours?: string | null;
    address?: string | null;
    city?: string | null;
    mapsUrl?: string | null;
    cuisineType?: string | null;
    wifiSsid?: string | null;
    wifiPassword?: string | null;
  };
}

export function AppearanceClient({ initialSettings }: AppearanceClientProps) {
  const [isPending, startTransition] = useTransition();

  const [storeDescription, setStoreDescription] = useState(initialSettings.storeDescription || '');
  const [storeLogoUrl, setStoreLogoUrl] = useState(initialSettings.storeLogoUrl || '');
  const [storeBannerUrl, setStoreBannerUrl] = useState(initialSettings.storeBannerUrl || '');
  const [primaryColor, setPrimaryColor] = useState(initialSettings.primaryColor || '#0e59f9');
  const [openHours, setOpenHours] = useState(initialSettings.openHours || '');
  const [address, setAddress] = useState(initialSettings.address || '');
  const [city, setCity] = useState(initialSettings.city || '');
  const [mapsUrl, setMapsUrl] = useState(initialSettings.mapsUrl || '');
  const [cuisineType, setCuisineType] = useState(initialSettings.cuisineType || '');
  const [wifiSsid, setWifiSsid] = useState(initialSettings.wifiSsid || '');
  const [wifiPassword, setWifiPassword] = useState(initialSettings.wifiPassword || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('storeDescription', storeDescription);
    formData.append('storeLogoUrl', storeLogoUrl);
    formData.append('storeBannerUrl', storeBannerUrl);
    formData.append('primaryColor', primaryColor);
    formData.append('openHours', openHours);
    formData.append('address', address);
    formData.append('city', city);
    formData.append('mapsUrl', mapsUrl);
    formData.append('cuisineType', cuisineType);
    formData.append('wifiSsid', wifiSsid);
    formData.append('wifiPassword', wifiPassword);

    startTransition(async () => {
      const res = await updateCatalogAppearance(formData);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success('Tampilan & Informasi Outlet berhasil disimpan');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('catalog-updated'));
        }
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      {/* 1. Branding & Media */}
      <Card className="rounded-2xl border-none shadow-md bg-white">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold tracking-tight text-slate-900 flex items-center gap-2">
            <Store className="w-5 h-5 text-[#0e59f9]" />
            <span>Branding & Media Outlet</span>
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Logo dan banner tampil di header utama katalog Self QR dan struk belanja pelanggan.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Logo Toko */}
          <div className="space-y-2">
            <ImageUploader
              label="Logo Toko / Outlet"
              description="Rasio 1:1 direkomendasikan. Tampil di header bulat outlet."
              value={storeLogoUrl}
              onChange={(url) => setStoreLogoUrl(url || '')}
              bucket="storefront_images"
              aspectRatio="square"
              previewHeight="h-32"
            />
          </div>

          {/* Banner Toko */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <ImageUploader
              label="Banner / Cover Toko"
              description="Rasio 16:9 atau lebar. Tampil sebagai latar belakang header utama toko online."
              value={storeBannerUrl}
              onChange={(url) => setStoreBannerUrl(url || '')}
              bucket="storefront_images"
              aspectRatio="video"
              previewHeight="h-44"
            />
          </div>

          {/* Kategori Kuliner */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <Label htmlFor="cuisineType" className="text-xs font-semibold text-slate-800">
              Kategori / Konsep Resto
            </Label>
            <Input
              id="cuisineType"
              value={cuisineType}
              onChange={(e) => setCuisineType(e.target.value)}
              placeholder="Contoh: Coffee, Pastry & Dine-in atau Aneka Nasi & Masakan Nusantara"
              className="h-9 text-xs rounded-full bg-white border-none shadow-sm-md px-3.5 focus-visible:ring-blue-600"
            />
            <p className="text-[11px] text-slate-400">
              Ditampilkan tepat di samping/bawah nama resto pada header storefront (seperti di Gojek).
            </p>
          </div>

          {/* Deskripsi Singkat */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <Label htmlFor="storeDescription" className="text-xs font-semibold text-slate-800">
              Deskripsi Singkat Toko
            </Label>
            <Textarea
              id="storeDescription"
              value={storeDescription}
              onChange={(e) => setStoreDescription(e.target.value)}
              placeholder="Deskripsikan cita rasa khas, keunggulan menu, atau suasana tempat Anda..."
              className="resize-none rounded-2xl bg-white border-none shadow-sm-md p-3 text-xs focus-visible:ring-blue-600"
              rows={3}
            />
          </div>

          {/* Warna Utama */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <Label className="text-xs font-semibold text-slate-800">
              Warna Tema Utama
            </Label>
            <ColorPicker
              value={primaryColor}
              onChange={setPrimaryColor}
            />
            <p className="text-[11px] text-slate-400">
              Digunakan untuk warna tombol, aksen badge, dan highlight pada katalog publik.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 2. Informasi Operasional & Lokasi */}
      <Card className="rounded-2xl border-none shadow-md bg-white">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold tracking-tight text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-600" />
            <span>Info Operasional & Lokasi Outlet</span>
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Informasi ini muncul pada card storefront atas dan kartu "Info Resto" modal detail.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Jam Operasional */}
          <div className="space-y-2">
            <Label htmlFor="openHours" className="text-xs font-semibold text-slate-800">
              Jam Operasional
            </Label>
            <Input
              id="openHours"
              value={openHours}
              onChange={(e) => setOpenHours(e.target.value)}
              placeholder="Contoh: 09:00 - 22:00 atau Setiap Hari: 10:00 - 23:00"
              className="h-9 text-xs rounded-full bg-white border-none shadow-sm-md px-3.5 focus-visible:ring-blue-600"
            />
            <p className="text-[11px] text-slate-400">
              Format yang disarankan: "09:00 - 22:00". Sistem akan otomatis menampilkan badge "Buka" hijau pada jam tersebut.
            </p>
          </div>

          {/* Kota / Kabupaten */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <Label htmlFor="city" className="text-xs font-semibold text-slate-800">
              Kota / Kabupaten
            </Label>
            <Input
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Contoh: Banyuwangi"
              className="h-9 text-xs rounded-full bg-white border-none shadow-sm-md px-3.5 focus-visible:ring-blue-600"
            />
          </div>

          {/* Alamat Fisik Lengkap */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <Label htmlFor="address" className="text-xs font-semibold text-slate-800">
              Alamat Lengkap Outlet
            </Label>
            <Textarea
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Contoh: Jl. Jaksa Agung Suprapto No. 7A, Kel. Penganjuran, Kec. Banyuwangi"
              className="resize-none rounded-2xl bg-white border-none shadow-sm-md p-3 text-xs focus-visible:ring-blue-600"
              rows={2}
            />
          </div>

          {/* Link Google Maps */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <Label htmlFor="mapsUrl" className="text-xs font-semibold text-slate-800">
              Tautan Google Maps Outlet
            </Label>
            <Input
              id="mapsUrl"
              value={mapsUrl}
              onChange={(e) => setMapsUrl(e.target.value)}
              placeholder="Contoh: https://maps.app.goo.gl/... atau https://google.com/maps?q=..."
              className="h-9 text-xs rounded-full bg-white border-none shadow-sm-md px-3.5 focus-visible:ring-blue-600"
            />
            <p className="text-[11px] text-slate-400">
              Ketika pelanggan mengetuk thumbnail peta rute di detail resto, tautan ini akan langsung terbuka di Google Maps.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 3. Fasilitas & Wi-Fi Tamu */}
      <Card className="rounded-2xl border-none shadow-md bg-white">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold tracking-tight text-slate-900 flex items-center gap-2">
            <Wifi className="w-5 h-5 text-slate-600" />
            <span>Fasilitas Wi-Fi Tamu</span>
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Bantu pelanggan yang melakukan scan self-order terhubung ke Wi-Fi outlet dengan fitur 1-klik salin password.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="wifiSsid" className="text-xs font-semibold text-slate-800">
                Nama Wi-Fi (SSID)
              </Label>
              <Input
                id="wifiSsid"
                value={wifiSsid}
                onChange={(e) => setWifiSsid(e.target.value)}
                placeholder="Misal: KopiJotos_Guest"
                className="h-9 text-xs rounded-full bg-white border-none shadow-sm-md px-3.5 focus-visible:ring-blue-600"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wifiPassword" className="text-xs font-semibold text-slate-800">
                Password Wi-Fi
              </Label>
              <Input
                id="wifiPassword"
                value={wifiPassword}
                onChange={(e) => setWifiPassword(e.target.value)}
                placeholder="Misal: jotoskopi123"
                className="h-9 text-xs rounded-full bg-white border-none shadow-sm-md px-3.5 focus-visible:ring-blue-600"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end pt-2">
        <Button 
          type="submit" 
          disabled={isPending} 
          className="gap-2 rounded-full font-semibold h-11 px-6 shadow-xs bg-[#0e59f9] hover:bg-[#0b4de0] text-white text-xs cursor-pointer flex items-center justify-center min-w-[180px]"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isPending ? 'Menyimpan...' : 'Simpan Semua Pengaturan'}
        </Button>
      </div>
    </form>
  );
}
