'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Receipt, 
  Bike, 
  Sparkles, 
  Store, 
  Save, 
  Loader2, 
  Percent, 
  Layers, 
  CheckCircle2,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  updateTaxAndFeeSettings, 
  updatePlatformFeeSettings, 
  updateDisplaySettings, 
  updateStoreGeneralSettings 
} from '@/lib/actions/settings';

export function SettingsClient({ tenant }: { tenant: any }) {
  const [isSavingTax, setIsSavingTax] = React.useState(false);
  const [isSavingPlatform, setIsSavingPlatform] = React.useState(false);
  const [isSavingDisplay, setIsSavingDisplay] = React.useState(false);
  const [isSavingStore, setIsSavingStore] = React.useState(false);

  // Form states
  const [taxName, setTaxName] = React.useState(tenant?.taxName || 'Pajak (PB1)');
  const [posTaxRate, setPosTaxRate] = React.useState(tenant?.posTaxRate?.toString() || '0');
  const [serviceChargeRate, setServiceChargeRate] = React.useState(tenant?.serviceChargeRate?.toString() || '0');

  const [grabFoodFeeRate, setGrabFoodFeeRate] = React.useState(tenant?.grabFoodFeeRate?.toString() || '20');
  const [shopeeFoodFeeRate, setShopeeFoodFeeRate] = React.useState(tenant?.shopeeFoodFeeRate?.toString() || '20');
  const [goFoodFeeRate, setGoFoodFeeRate] = React.useState(tenant?.goFoodFeeRate?.toString() || '20');

  const [posPinBestSellers, setPosPinBestSellers] = React.useState(tenant?.posPinBestSellers ?? true);

  const [storeName, setStoreName] = React.useState(tenant?.name || '');
  const [storeDescription, setStoreDescription] = React.useState(tenant?.storeDescription || '');
  const [primaryColor, setPrimaryColor] = React.useState(tenant?.primaryColor || '#2563EB');

  // Handlers
  const handleSaveTax = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingTax(true);
    const fd = new FormData();
    fd.append('taxName', taxName);
    fd.append('posTaxRate', posTaxRate);
    fd.append('serviceChargeRate', serviceChargeRate);

    const res = await updateTaxAndFeeSettings(fd);
    setIsSavingTax(false);
    if (res.success) {
      toast.success('Pengaturan pajak & biaya layanan berhasil disimpan!');
    } else {
      toast.error(res.error || 'Gagal menyimpan pengaturan');
    }
  };

  const handleSavePlatformFees = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPlatform(true);
    const fd = new FormData();
    fd.append('grabFoodFeeRate', grabFoodFeeRate);
    fd.append('shopeeFoodFeeRate', shopeeFoodFeeRate);
    fd.append('goFoodFeeRate', goFoodFeeRate);

    const res = await updatePlatformFeeSettings(fd);
    setIsSavingPlatform(false);
    if (res.success) {
      toast.success('Potongan komisi platform online food berhasil disimpan!');
    } else {
      toast.error(res.error || 'Gagal menyimpan pengaturan');
    }
  };

  const handleSaveDisplay = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingDisplay(true);
    const fd = new FormData();
    fd.append('posPinBestSellers', posPinBestSellers.toString());

    const res = await updateDisplaySettings(fd);
    setIsSavingDisplay(false);
    if (res.success) {
      toast.success('Pengaturan tampilan Best Seller berhasil disimpan!');
    } else {
      toast.error(res.error || 'Gagal menyimpan pengaturan');
    }
  };

  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingStore(true);
    const fd = new FormData();
    fd.append('name', storeName);
    fd.append('storeDescription', storeDescription);
    fd.append('primaryColor', primaryColor);

    const res = await updateStoreGeneralSettings(fd);
    setIsSavingStore(false);
    if (res.success) {
      toast.success('Informasi toko berhasil disimpan!');
    } else {
      toast.error(res.error || 'Gagal menyimpan informasi');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pengaturan Toko & POS</h1>
        <p className="text-sm text-muted-foreground">
          Atur tarif pajak, potongan komisi platform online food (Grab/Shopee/GoFood), preferensi Best Seller, dan info toko.
        </p>
      </div>

      <Tabs defaultValue="tax" className="space-y-6">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 h-auto p-1 bg-muted rounded-xl gap-1">
          <TabsTrigger value="tax" className="rounded-lg py-2.5 flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            <span>Pajak & Layanan</span>
          </TabsTrigger>
          <TabsTrigger value="platform" className="rounded-lg py-2.5 flex items-center gap-2">
            <Bike className="h-4 w-4" />
            <span>Potongan Online Food</span>
          </TabsTrigger>
          <TabsTrigger value="bestseller" className="rounded-lg py-2.5 flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <span>Best Seller & Urutan</span>
          </TabsTrigger>
          <TabsTrigger value="store" className="rounded-lg py-2.5 flex items-center gap-2">
            <Store className="h-4 w-4" />
            <span>Profil Toko</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: PAJAK & SERVICE CHARGE */}
        <TabsContent value="tax" className="space-y-6">
          <form onSubmit={handleSaveTax} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-primary" />
                  Konfigurasi Pajak & Biaya Layanan
                </CardTitle>
                <CardDescription>
                  Pajak dan biaya layanan akan otomatis dihitung saat kasir memproses transaksi atau saat pelanggan memesan via katalog online.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="taxName" className="font-semibold">Nama Pajak</Label>
                    <Input
                      id="taxName"
                      value={taxName}
                      onChange={(e) => setTaxName(e.target.value)}
                      placeholder="Contoh: Pajak Resto (PB1) atau PPN"
                      className="bg-slate-50/50"
                    />
                    <p className="text-xs text-muted-foreground">Label yang akan dicetak di struk kasir.</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="posTaxRate" className="font-semibold">Tarif Pajak (%)</Label>
                    <div className="relative">
                      <Input
                        id="posTaxRate"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={posTaxRate}
                        onChange={(e) => setPosTaxRate(e.target.value)}
                        className="bg-slate-50/50 pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-semibold">%</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Masukkan 0 jika sudah termasuk pajak.</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="serviceChargeRate" className="font-semibold">Biaya Layanan / Service Charge (%)</Label>
                    <div className="relative">
                      <Input
                        id="serviceChargeRate"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={serviceChargeRate}
                        onChange={(e) => setServiceChargeRate(e.target.value)}
                        className="bg-slate-50/50 pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-semibold">%</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Biaya tambahan operasional / service fee (opsional).</p>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 p-4 rounded-xl flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-blue-900 dark:text-blue-300 leading-relaxed">
                    <strong>Contoh Perhitungan:</strong> Jika Subtotal = Rp 100.000, Pajak = 10%, Service Charge = 5%, maka total tagihan kasir menjadi <strong>Rp 115.000</strong>.
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={isSavingTax} className="min-w-[150px]">
                    {isSavingTax ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...</>
                    ) : (
                      <><Save className="mr-2 h-4 w-4" /> Simpan Pengaturan Pajak</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </TabsContent>

        {/* TAB 2: POTONGAN KOMISI ONLINE FOOD */}
        <TabsContent value="platform" className="space-y-6">
          <form onSubmit={handleSavePlatformFees} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bike className="h-5 w-5 text-primary" />
                  Atur Potongan Komisi Online Food (Grab, Shopee, GoFood)
                </CardTitle>
                <CardDescription>
                  Tentukan persentase potongan komisi yang dikenakan oleh platform pesan-antar makanan. Saat kasir memilih channel GrabFood/ShopeeFood/GoFood, sistem otomatis mengkalkulasi potongan dan estimasi pendapatan bersih yang Anda terima.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* GrabFood */}
                  <div className="p-4 border rounded-xl bg-slate-50/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-green-700 dark:text-green-400 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                        GrabFood
                      </span>
                      <span className="text-xs bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 px-2 py-0.5 rounded font-mono">
                        {grabFoodFeeRate}%
                      </span>
                    </div>
                    <Label htmlFor="grabFoodFeeRate" className="text-xs text-muted-foreground">Persentase Potongan (%)</Label>
                    <div className="relative">
                      <Input
                        id="grabFoodFeeRate"
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={grabFoodFeeRate}
                        onChange={(e) => setGrabFoodFeeRate(e.target.value)}
                        className="bg-white pr-8 font-semibold"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-semibold">%</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">Standar komisi GrabFood merchant (biasanya 20%).</p>
                  </div>

                  {/* ShopeeFood */}
                  <div className="p-4 border rounded-xl bg-slate-50/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-orange-700 dark:text-orange-400 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                        ShopeeFood
                      </span>
                      <span className="text-xs bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400 px-2 py-0.5 rounded font-mono">
                        {shopeeFoodFeeRate}%
                      </span>
                    </div>
                    <Label htmlFor="shopeeFoodFeeRate" className="text-xs text-muted-foreground">Persentase Potongan (%)</Label>
                    <div className="relative">
                      <Input
                        id="shopeeFoodFeeRate"
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={shopeeFoodFeeRate}
                        onChange={(e) => setShopeeFoodFeeRate(e.target.value)}
                        className="bg-white pr-8 font-semibold"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-semibold">%</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">Standar komisi ShopeeFood merchant (biasanya 20%).</p>
                  </div>

                  {/* GoFood */}
                  <div className="p-4 border rounded-xl bg-slate-50/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-red-700 dark:text-red-400 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                        GoFood (GoJek)
                      </span>
                      <span className="text-xs bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 px-2 py-0.5 rounded font-mono">
                        {goFoodFeeRate}%
                      </span>
                    </div>
                    <Label htmlFor="goFoodFeeRate" className="text-xs text-muted-foreground">Persentase Potongan (%)</Label>
                    <div className="relative">
                      <Input
                        id="goFoodFeeRate"
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={goFoodFeeRate}
                        onChange={(e) => setGoFoodFeeRate(e.target.value)}
                        className="bg-white pr-8 font-semibold"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-semibold">%</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">Standar komisi GoFood merchant (biasanya 20%).</p>
                  </div>
                </div>

                <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-4 rounded-xl flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-emerald-900 dark:text-emerald-300 leading-relaxed">
                    <strong>Manfaat Laporan Bersih:</strong> Saat kasir input pesanan dari GrabFood sebesar Rp 100.000 dengan komisi 20%, kasir dapat langsung melihat rincian: Potongan Grab Rp 20.000 dan Pendapatan Bersih Rp 80.000, sehingga data laporan omset riil tidak bias.
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={isSavingPlatform} className="min-w-[150px]">
                    {isSavingPlatform ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...</>
                    ) : (
                      <><Save className="mr-2 h-4 w-4" /> Simpan Potongan Online Food</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </TabsContent>

        {/* TAB 3: BEST SELLER & URUTAN */}
        <TabsContent value="bestseller" className="space-y-6">
          <form onSubmit={handleSaveDisplay} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Pengaturan Best Seller (Produk Unggulan)
                </CardTitle>
                <CardDescription>
                  Atur bagaimana produk Best Seller diprioritaskan di layar Kasir POS dan Katalog Online.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-xl bg-slate-50/50">
                  <div className="space-y-1">
                    <Label className="text-base font-semibold">Tampilkan Best Seller di Posisi Paling Atas</Label>
                    <p className="text-sm text-muted-foreground">
                      Produk yang ditandai sebagai <b>⭐ Best Seller (Unggulan)</b> akan selalu muncul di baris paling atas pada halaman Kasir POS dan Storefront untuk mempercepat proses transaksi.
                    </p>
                  </div>
                  <Switch checked={posPinBestSellers} onCheckedChange={setPosPinBestSellers} />
                </div>

                <div className="border rounded-xl p-5 bg-card space-y-4">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <Layers className="h-4 w-4 text-primary" />
                    Cara Menandai Produk Sebagai Best Seller:
                  </h4>
                  <ul className="text-xs text-muted-foreground space-y-2 list-disc list-inside">
                    <li>Buka menu <b>Produk</b> di sidebar, lalu klik icon bintang <b>⭐ Best Seller</b> pada baris produk yang ingin diunggulkan.</li>
                    <li>Atau buka menu <b>Katalog &gt; Visibilitas & Unggulan</b> dan aktifkan toggle "Produk Unggulan".</li>
                    <li>Produk unggulan akan otomatis memiliki lencana berkilau ⭐ Best Seller di POS Kasir.</li>
                  </ul>
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={isSavingDisplay} className="min-w-[150px]">
                    {isSavingDisplay ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...</>
                    ) : (
                      <><Save className="mr-2 h-4 w-4" /> Simpan Pengaturan Tampilan</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </TabsContent>

        {/* TAB 4: PROFIL TOKO */}
        <TabsContent value="store" className="space-y-6">
          <form onSubmit={handleSaveStore} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5 text-primary" />
                  Informasi & Branding Toko
                </CardTitle>
                <CardDescription>
                  Perbarui identitas toko, deskripsi singkat, dan warna tema aplikasi.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="storeName" className="font-semibold">Nama Toko / Resto <span className="text-destructive">*</span></Label>
                    <Input
                      id="storeName"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      placeholder="Bolu Anisa"
                      className="bg-slate-50/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="primaryColor" className="font-semibold">Warna Utama Tema</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        id="primaryColor"
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-14 h-10 p-1 cursor-pointer bg-slate-50/50"
                      />
                      <Input
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="font-mono bg-slate-50/50 flex-1 uppercase"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="storeDescription" className="font-semibold">Deskripsi Toko</Label>
                  <Textarea
                    id="storeDescription"
                    rows={3}
                    value={storeDescription}
                    onChange={(e) => setStoreDescription(e.target.value)}
                    placeholder="Tuliskan deskripsi singkat mengenai toko / menu Anda..."
                    className="bg-slate-50/50"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={isSavingStore} className="min-w-[150px]">
                    {isSavingStore ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...</>
                    ) : (
                      <><Save className="mr-2 h-4 w-4" /> Simpan Profil Toko</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
