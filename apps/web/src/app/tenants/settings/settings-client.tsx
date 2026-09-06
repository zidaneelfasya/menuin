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
  CreditCard,
  Layers, 
  CheckCircle2,
  Info,
  Eye,
  EyeOff,
  Copy,
  LayoutTemplate
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  updateTaxAndFeeSettings, 
  updatePlatformFeeSettings, 
  updateDisplaySettings, 
  updateStoreGeneralSettings,
  updatePaymentIntegration
} from '@/lib/actions/settings';
import { PosSettingsForm } from './pos-settings-form';

export function SettingsClient({ tenant, catalogSettings }: { tenant: any, catalogSettings: any }) {
  const [isSavingTax, setIsSavingTax] = React.useState(false);
  const [isSavingPlatform, setIsSavingPlatform] = React.useState(false);
  const [isSavingDisplay, setIsSavingDisplay] = React.useState(false);
  const [isSavingStore, setIsSavingStore] = React.useState(false);
  const [isSavingPayment, setIsSavingPayment] = React.useState(false);
  const [showServerKey, setShowServerKey] = React.useState(false);

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

  const [midtransEnvironment, setMidtransEnvironment] = React.useState(tenant?.midtransEnvironment || 'sandbox');
  const [midtransServerKey, setMidtransServerKey] = React.useState(tenant?.midtransServerKey || '');
  const [midtransClientKey, setMidtransClientKey] = React.useState(tenant?.midtransClientKey || '');

  const hasStoreChanges = 
    storeName !== (tenant?.name || '') ||
    storeDescription !== (tenant?.storeDescription || '') ||
    primaryColor !== (tenant?.primaryColor || '#2563EB');

  const hasTaxChanges = 
    taxName !== (tenant?.taxName || 'Pajak (PB1)') ||
    posTaxRate !== (tenant?.posTaxRate?.toString() || '0') ||
    serviceChargeRate !== (tenant?.serviceChargeRate?.toString() || '0');

  const hasPlatformChanges = 
    grabFoodFeeRate !== (tenant?.grabFoodFeeRate?.toString() || '20') ||
    shopeeFoodFeeRate !== (tenant?.shopeeFoodFeeRate?.toString() || '20') ||
    goFoodFeeRate !== (tenant?.goFoodFeeRate?.toString() || '20');

  const hasDisplayChanges = 
    posPinBestSellers !== (tenant?.posPinBestSellers ?? true);

  const hasPaymentChanges = 
    midtransEnvironment !== (tenant?.midtransEnvironment || 'sandbox') ||
    midtransServerKey !== (tenant?.midtransServerKey || '') ||
    midtransClientKey !== (tenant?.midtransClientKey || '');

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

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPayment(true);
    const fd = new FormData();
    fd.append('midtransEnvironment', midtransEnvironment);
    fd.append('midtransServerKey', midtransServerKey);
    fd.append('midtransClientKey', midtransClientKey);

    const res = await updatePaymentIntegration(fd);
    setIsSavingPayment(false);
    if (res.success) {
      toast.success('Pengaturan integrasi pembayaran (Midtrans) berhasil disimpan!');
    } else {
      toast.error(res.error || 'Gagal menyimpan integrasi pembayaran');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pengaturan Global</h1>
        <p className="text-sm text-muted-foreground">
          Kelola profil toko, integrasi pembayaran, pengaturan pajak, dan biaya operasional.
        </p>
      </div>

      <Tabs defaultValue="store" orientation="vertical" className="flex flex-col md:flex-row gap-8">
        <TabsList className="flex flex-col h-auto bg-transparent items-stretch w-full md:w-72 space-y-2 p-0">
          
          <TabsTrigger 
            value="store" 
            className="justify-start px-4 py-3 rounded-xl data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none hover:bg-slate-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Store className="h-5 w-5" />
              <div className="flex flex-col items-start">
                <span className="font-semibold text-sm">Profil Toko</span>
                <span className="font-normal text-xs text-muted-foreground opacity-80">Nama & Branding</span>
              </div>
            </div>
          </TabsTrigger>
          
          <TabsTrigger 
            value="tax" 
            className="justify-start px-4 py-3 rounded-xl data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none hover:bg-slate-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Receipt className="h-5 w-5" />
              <div className="flex flex-col items-start">
                <span className="font-semibold text-sm">Pajak & Biaya</span>
                <span className="font-normal text-xs text-muted-foreground opacity-80">PB1 & Layanan</span>
              </div>
            </div>
          </TabsTrigger>

          <TabsTrigger 
            value="platform" 
            className="justify-start px-4 py-3 rounded-xl data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none hover:bg-slate-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Bike className="h-5 w-5" />
              <div className="flex flex-col items-start">
                <span className="font-semibold text-sm">Aplikasi Ojol</span>
                <span className="font-normal text-xs text-muted-foreground opacity-80">Potongan Komisi Food</span>
              </div>
            </div>
          </TabsTrigger>

          <TabsTrigger 
            value="payment" 
            className="justify-start px-4 py-3 rounded-xl data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-700 data-[state=active]:shadow-none hover:bg-slate-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5" />
              <div className="flex flex-col items-start">
                <span className="font-semibold text-sm">Integrasi Pembayaran</span>
                <span className="font-normal text-xs text-muted-foreground opacity-80">Keamanan & Midtrans API</span>
              </div>
            </div>
          </TabsTrigger>

          <TabsTrigger 
            value="bestseller" 
            className="justify-start px-4 py-3 rounded-xl data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none hover:bg-slate-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5" />
              <div className="flex flex-col items-start">
                <span className="font-semibold text-sm">Preferensi Tampilan</span>
                <span className="font-normal text-xs text-muted-foreground opacity-80">Menu POS & Urutan</span>
              </div>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="pos" 
            className="justify-start px-4 py-3 rounded-xl data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none hover:bg-slate-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <LayoutTemplate className="h-5 w-5" />
              <div className="flex flex-col items-start">
                <span className="font-semibold text-sm">Pengaturan POS</span>
                <span className="font-normal text-xs text-muted-foreground opacity-80">Alur Pesanan Kasir</span>
              </div>
            </div>
          </TabsTrigger>
          
        </TabsList>

        <div className="flex-1 w-full max-w-3xl">
          {/* TAB 1: PROFIL TOKO */}
          <TabsContent value="store" className="mt-0 outline-none">
            <form onSubmit={handleSaveStore} className="space-y-6">
              <Card className="border-0 shadow-sm ring-1 ring-slate-200">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl">Informasi & Branding Toko</CardTitle>
                  <CardDescription>
                    Perbarui identitas toko, deskripsi singkat, dan warna tema aplikasi.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="storeName" className="font-semibold">Nama Toko / Resto <span className="text-destructive">*</span></Label>
                      <Input
                        id="storeName"
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        placeholder="Bolu Anisa"
                        className="bg-slate-50/50 h-11"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="primaryColor" className="font-semibold">Warna Utama Tema</Label>
                      <div className="flex items-center gap-3">
                        <Input
                          id="primaryColor"
                          type="color"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="w-14 h-11 p-1 cursor-pointer bg-slate-50/50 rounded-lg"
                        />
                        <Input
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="font-mono bg-slate-50/50 flex-1 uppercase h-11"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="storeDescription" className="font-semibold">Deskripsi Toko</Label>
                    <Textarea
                      id="storeDescription"
                      rows={4}
                      value={storeDescription}
                      onChange={(e) => setStoreDescription(e.target.value)}
                      placeholder="Tuliskan deskripsi singkat mengenai toko / menu Anda..."
                      className="bg-slate-50/50 resize-none"
                    />
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button disabled={isSavingStore || !hasStoreChanges} type="submit" size="lg" className="min-w-[150px] shadow-sm">
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

          {/* TAB 2: PAJAK & SERVICE CHARGE */}
          <TabsContent value="tax" className="mt-0 outline-none">
            <form onSubmit={handleSaveTax} className="space-y-6">
              <Card className="border-0 shadow-sm ring-1 ring-slate-200">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl">Konfigurasi Pajak & Biaya Layanan</CardTitle>
                  <CardDescription>
                    Pajak dan biaya layanan akan otomatis dihitung saat kasir memproses transaksi atau saat pelanggan memesan via katalog online.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3 md:col-span-2">
                      <Label htmlFor="taxName" className="font-semibold">Nama Pajak</Label>
                      <Input
                        id="taxName"
                        value={taxName}
                        onChange={(e) => setTaxName(e.target.value)}
                        placeholder="Contoh: Pajak Resto (PB1) atau PPN"
                        className="bg-slate-50/50 h-11"
                      />
                      <p className="text-xs text-muted-foreground">Label yang akan dicetak di struk kasir.</p>
                    </div>

                    <div className="space-y-3">
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
                          className="bg-slate-50/50 pr-8 h-11"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-semibold">%</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Masukkan 0 jika sudah termasuk pajak.</p>
                    </div>

                    <div className="space-y-3">
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
                          className="bg-slate-50/50 pr-8 h-11"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-semibold">%</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Biaya tambahan operasional (opsional).</p>
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 p-4 rounded-xl flex items-start gap-3 mt-4">
                    <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-900 dark:text-blue-300 leading-relaxed">
                      <strong>Contoh Perhitungan:</strong> Jika Subtotal = Rp 100.000, Pajak = 10%, Service Charge = 5%, maka total tagihan kasir menjadi <strong>Rp 115.000</strong>.
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button disabled={isSavingTax || !hasTaxChanges} type="submit" size="lg" className="min-w-[150px] shadow-sm">
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

          {/* TAB 3: POTONGAN KOMISI ONLINE FOOD */}
          <TabsContent value="platform" className="mt-0 outline-none">
            <form onSubmit={handleSavePlatformFees} className="space-y-6">
              <Card className="border-0 shadow-sm ring-1 ring-slate-200">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl">Potongan Komisi Online Food</CardTitle>
                  <CardDescription>
                    Tentukan persentase potongan komisi platform. Sistem otomatis mengkalkulasi potongan dan estimasi pendapatan bersih.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* GrabFood */}
                    <div className="p-5 border rounded-xl bg-slate-50/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-green-700 dark:text-green-400 flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-green-500"></span>
                          GrabFood
                        </span>
                        <span className="text-xs bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 px-2.5 py-1 rounded-md font-mono font-bold">
                          {grabFoodFeeRate}%
                        </span>
                      </div>
                      <Label htmlFor="grabFoodFeeRate" className="text-xs text-muted-foreground mt-2 block">Persentase Potongan</Label>
                      <div className="relative">
                        <Input
                          id="grabFoodFeeRate"
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={grabFoodFeeRate}
                          onChange={(e) => setGrabFoodFeeRate(e.target.value)}
                          className="bg-white pr-8 font-semibold h-11"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">%</span>
                      </div>
                    </div>

                    {/* ShopeeFood */}
                    <div className="p-5 border rounded-xl bg-slate-50/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-orange-700 dark:text-orange-400 flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                          ShopeeFood
                        </span>
                        <span className="text-xs bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400 px-2.5 py-1 rounded-md font-mono font-bold">
                          {shopeeFoodFeeRate}%
                        </span>
                      </div>
                      <Label htmlFor="shopeeFoodFeeRate" className="text-xs text-muted-foreground mt-2 block">Persentase Potongan</Label>
                      <div className="relative">
                        <Input
                          id="shopeeFoodFeeRate"
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={shopeeFoodFeeRate}
                          onChange={(e) => setShopeeFoodFeeRate(e.target.value)}
                          className="bg-white pr-8 font-semibold h-11"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">%</span>
                      </div>
                    </div>

                    {/* GoFood */}
                    <div className="p-5 border rounded-xl bg-slate-50/50 space-y-3 md:col-span-2 md:w-1/2 mx-auto">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-red-700 dark:text-red-400 flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-red-500"></span>
                          GoFood
                        </span>
                        <span className="text-xs bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 px-2.5 py-1 rounded-md font-mono font-bold">
                          {goFoodFeeRate}%
                        </span>
                      </div>
                      <Label htmlFor="goFoodFeeRate" className="text-xs text-muted-foreground mt-2 block">Persentase Potongan</Label>
                      <div className="relative">
                        <Input
                          id="goFoodFeeRate"
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={goFoodFeeRate}
                          onChange={(e) => setGoFoodFeeRate(e.target.value)}
                          className="bg-white pr-8 font-semibold h-11"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">%</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button disabled={isSavingPlatform || !hasPlatformChanges} type="submit" size="lg" className="min-w-[150px] shadow-sm">
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
          
          {/* TAB 4: INTEGRASI PEMBAYARAN (MIDTRANS) */}
          <TabsContent value="payment" className="mt-0 outline-none">
            <form onSubmit={handleSavePayment} className="space-y-6">
              <Card className="border border-emerald-100 shadow-sm ring-1 ring-emerald-500/20 bg-emerald-50/30">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl text-emerald-900 flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Kredensial Keamanan Pembayaran
                  </CardTitle>
                  <CardDescription className="text-emerald-700/80">
                    Kunci rahasia API Midtrans Anda disimpan dengan sangat terenkripsi di modul ini. Jangan pernah membagikan <strong>Server Key</strong> kepada siapapun.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  <div className="space-y-3">
                    <Label htmlFor="midtransEnvironment" className="font-semibold text-emerald-900">Lingkungan Server (Environment)</Label>
                    <select 
                      id="midtransEnvironment" 
                      value={midtransEnvironment}
                      onChange={(e) => setMidtransEnvironment(e.target.value)}
                      className="flex h-11 w-full items-center justify-between rounded-md border border-emerald-200 bg-white px-3 py-2 text-sm focus:ring-emerald-500"
                    >
                      <option value="sandbox">Sandbox (Testing / Percobaan)</option>
                      <option value="production">Production (Live / Uang Asli)</option>
                    </select>
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="midtransClientKey" className="font-semibold text-emerald-900">Client Key (Publik)</Label>
                    <Input 
                      id="midtransClientKey" 
                      value={midtransClientKey} 
                      onChange={(e) => setMidtransClientKey(e.target.value)}
                      placeholder="SB-Mid-client-xxxxxxxxx" 
                      className="bg-white border-emerald-200 font-mono h-11"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="midtransServerKey" className="font-semibold text-emerald-900 flex justify-between">
                      <span>Server Key (Sangat Rahasia)</span>
                      <span className="text-xs font-normal text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">Disembunyikan di Frontend</span>
                    </Label>
                    <div className="relative">
                      <Input 
                        id="midtransServerKey" 
                        type={showServerKey ? "text" : "password"}
                        value={midtransServerKey} 
                        onChange={(e) => setMidtransServerKey(e.target.value)}
                        placeholder="SB-Mid-server-xxxxxxxxx" 
                        className="bg-white border-emerald-200 font-mono h-11 pr-24"
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <Button 
                          type="button"
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                          onClick={() => setShowServerKey(!showServerKey)}
                          title={showServerKey ? "Sembunyikan" : "Tampilkan"}
                        >
                          {showServerKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button 
                          type="button"
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                          onClick={() => {
                            navigator.clipboard.writeText(midtransServerKey);
                            toast.success("Server Key disalin ke clipboard!");
                          }}
                          title="Copy"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-emerald-100/50 p-4 rounded-xl flex items-start gap-3 mt-4 border border-emerald-200">
                    <Info className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="text-sm text-emerald-800 leading-relaxed">
                      <strong>Info Penting:</strong> Setelah kunci Midtrans disimpan di sini, Anda masih perlu menghidupkan tuas <strong>"Aktifkan Pembayaran Non-Tunai (Online)"</strong> di menu <strong>Katalog &gt; Pesanan & Pembayaran</strong> agar pelanggan bisa membayarnya.
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-emerald-100">
                    <Button type="submit" disabled={isSavingPayment || !hasPaymentChanges} className="min-w-[150px] h-11 bg-emerald-600 hover:bg-emerald-700 text-white">
                      {isSavingPayment ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Mengamankan Kunci...</>
                      ) : (
                        <><Save className="mr-2 h-4 w-4" /> Simpan Kredensial Midtrans</>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          </TabsContent>

          {/* TAB 5: BEST SELLER & URUTAN */}
          <TabsContent value="bestseller" className="mt-0 outline-none">
            <form onSubmit={handleSaveDisplay} className="space-y-6">
              <Card className="border-0 shadow-sm ring-1 ring-slate-200">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl">Pengaturan Best Seller (Produk Unggulan)</CardTitle>
                  <CardDescription>
                    Atur bagaimana produk Best Seller diprioritaskan di layar Kasir POS dan Katalog Online.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-5 border rounded-xl bg-slate-50/50">
                    <div className="space-y-1">
                      <Label className="text-base font-semibold">Tampilkan Best Seller di Posisi Paling Atas</Label>
                      <p className="text-sm text-muted-foreground max-w-lg leading-relaxed">
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
                    <ul className="text-sm text-muted-foreground space-y-3 list-disc list-inside">
                      <li>Buka menu <b>Produk</b> di sidebar, lalu klik icon bintang <b>⭐ Best Seller</b> pada baris produk yang ingin diunggulkan.</li>
                      <li>Atau buka menu <b>Katalog &gt; Visibilitas & Unggulan</b> dan aktifkan toggle "Produk Unggulan".</li>
                      <li>Produk unggulan akan otomatis memiliki lencana berkilau ⭐ Best Seller di POS Kasir.</li>
                    </ul>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button disabled={isSavingDisplay || !hasDisplayChanges} type="submit" size="lg" className="min-w-[150px] shadow-sm">
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

          {/* TAB 6: POS SETTINGS */}
          <TabsContent value="pos" className="mt-0 outline-none">
            <PosSettingsForm initialData={catalogSettings} />
          </TabsContent>

        </div>
      </Tabs>
    </div>
  );
}
