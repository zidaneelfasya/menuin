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
  LayoutTemplate,
  Printer,
  ReceiptText,
  UtensilsCrossed,
  ChefHat,
  QrCode
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  updateTaxAndFeeSettings, 
  updatePlatformFeeSettings, 
  updateDisplaySettings, 
  updateStoreGeneralSettings,
  updatePaymentIntegration,
  updateReceiptSettings,
  updateKitchenTicketSettings
} from '@/lib/actions/settings';
import { PosSettingsForm } from './pos-settings-form';

export function SettingsClient({ 
  tenant, 
  catalogSettings, 
  userRole 
}: { 
  tenant: any; 
  catalogSettings: any; 
  userRole?: string;
}) {
  const isOwner = userRole === 'OWNER' || userRole === 'MANAGER' || userRole === 'SYSTEM_ADMIN' || !userRole;
  const isOwnerOnly = userRole === 'OWNER' || userRole === 'SYSTEM_ADMIN' || !userRole;

  const [isSavingTax, setIsSavingTax] = React.useState(false);
  const [isSavingPlatform, setIsSavingPlatform] = React.useState(false);
  const [isSavingDisplay, setIsSavingDisplay] = React.useState(false);
  const [isSavingStore, setIsSavingStore] = React.useState(false);
  const [isSavingPayment, setIsSavingPayment] = React.useState(false);
  const [isSavingReceipt, setIsSavingReceipt] = React.useState(false);
  const [isSavingKitchen, setIsSavingKitchen] = React.useState(false);
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

  // Receipt form states
  const [receiptLogoUrl, setReceiptLogoUrl] = React.useState(tenant?.receiptLogoUrl || '');
  const [receiptHeader, setReceiptHeader] = React.useState(tenant?.receiptHeader || '');
  const [receiptFooter, setReceiptFooter] = React.useState(tenant?.receiptFooter || 'Terima kasih atas kunjungan Anda!\nFollow IG kami @menuin.app');
  const [receiptShowLogo, setReceiptShowLogo] = React.useState(tenant?.receiptShowLogo ?? true);
  const [receiptShowCustomer, setReceiptShowCustomer] = React.useState(tenant?.receiptShowCustomer ?? true);
  const [receiptShowCashier, setReceiptShowCashier] = React.useState(tenant?.receiptShowCashier ?? true);
  const [receiptShowTable, setReceiptShowTable] = React.useState(tenant?.receiptShowTable ?? true);
  const [receiptShowNotes, setReceiptShowNotes] = React.useState(tenant?.receiptShowNotes ?? true);
  const [receiptCustomNote, setReceiptCustomNote] = React.useState(tenant?.receiptCustomNote || 'WiFi: TamuResto / Pass: selamatmakan');

  // Kitchen Ticket form states
  const [kitchenPrintEnabled, setKitchenPrintEnabled] = React.useState(tenant?.kitchenPrintEnabled ?? false);
  const [kitchenTicketTitle, setKitchenTicketTitle] = React.useState(tenant?.kitchenTicketTitle || 'TIKET DAPUR');
  const [kitchenTicketNotes, setKitchenTicketNotes] = React.useState(tenant?.kitchenTicketNotes || 'Harap segera disajikan panas');
  const [kitchenShowCustomer, setKitchenShowCustomer] = React.useState(tenant?.kitchenShowCustomer ?? true);
  const [kitchenShowCashier, setKitchenShowCashier] = React.useState(tenant?.kitchenShowCashier ?? true);
  const [kitchenShowTable, setKitchenShowTable] = React.useState(tenant?.kitchenShowTable ?? true);
  const [kitchenShowNotes, setKitchenShowNotes] = React.useState(tenant?.kitchenShowNotes ?? true);
  const [kitchenAutoCut, setKitchenAutoCut] = React.useState(tenant?.kitchenAutoCut ?? true);

  // Preview sub-tab state ('customer' | 'kitchen')
  const [previewTab, setPreviewTab] = React.useState<'customer' | 'kitchen'>('customer');

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

  const hasReceiptChanges = 
    receiptLogoUrl !== (tenant?.receiptLogoUrl || '') ||
    receiptHeader !== (tenant?.receiptHeader || '') ||
    receiptFooter !== (tenant?.receiptFooter || 'Terima kasih atas kunjungan Anda!\nFollow IG kami @menuin.app') ||
    receiptShowLogo !== (tenant?.receiptShowLogo ?? true) ||
    receiptShowCustomer !== (tenant?.receiptShowCustomer ?? true) ||
    receiptShowCashier !== (tenant?.receiptShowCashier ?? true) ||
    receiptShowTable !== (tenant?.receiptShowTable ?? true) ||
    receiptShowNotes !== (tenant?.receiptShowNotes ?? true) ||
    receiptCustomNote !== (tenant?.receiptCustomNote || 'WiFi: TamuResto / Pass: selamatmakan');

  const hasKitchenChanges =
    kitchenPrintEnabled !== (tenant?.kitchenPrintEnabled ?? false) ||
    kitchenTicketTitle !== (tenant?.kitchenTicketTitle || 'TIKET DAPUR') ||
    kitchenTicketNotes !== (tenant?.kitchenTicketNotes || 'Harap segera disajikan panas') ||
    kitchenShowCustomer !== (tenant?.kitchenShowCustomer ?? true) ||
    kitchenShowCashier !== (tenant?.kitchenShowCashier ?? true) ||
    kitchenShowTable !== (tenant?.kitchenShowTable ?? true) ||
    kitchenShowNotes !== (tenant?.kitchenShowNotes ?? true) ||
    kitchenAutoCut !== (tenant?.kitchenAutoCut ?? true);

  // Handlers
  const handleSaveReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingReceipt(true);
    const fd = new FormData();
    fd.append('receiptLogoUrl', receiptLogoUrl);
    fd.append('receiptHeader', receiptHeader);
    fd.append('receiptFooter', receiptFooter);
    fd.append('receiptShowLogo', receiptShowLogo.toString());
    fd.append('receiptShowCustomer', receiptShowCustomer.toString());
    fd.append('receiptShowCashier', receiptShowCashier.toString());
    fd.append('receiptShowTable', receiptShowTable.toString());
    fd.append('receiptShowNotes', receiptShowNotes.toString());
    fd.append('receiptCustomNote', receiptCustomNote);

    const res = await updateReceiptSettings(fd);
    setIsSavingReceipt(false);
    if (res.success) {
      toast.success('Pengaturan kustomisasi struk berhasil disimpan');
    } else {
      toast.error(res.error || 'Gagal menyimpan pengaturan struk');
    }
  };

  const handleSaveKitchen = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingKitchen(true);
    const fd = new FormData();
    fd.append('kitchenPrintEnabled', kitchenPrintEnabled.toString());
    fd.append('kitchenTicketTitle', kitchenTicketTitle);
    fd.append('kitchenTicketNotes', kitchenTicketNotes);
    fd.append('kitchenShowCustomer', kitchenShowCustomer.toString());
    fd.append('kitchenShowCashier', kitchenShowCashier.toString());
    fd.append('kitchenShowTable', kitchenShowTable.toString());
    fd.append('kitchenShowNotes', kitchenShowNotes.toString());
    fd.append('kitchenAutoCut', kitchenAutoCut.toString());

    const res = await updateKitchenTicketSettings(fd);
    setIsSavingKitchen(false);
    if (res.success) {
      toast.success('Pengaturan tiket dapur berhasil disimpan');
    } else {
      toast.error(res.error || 'Gagal menyimpan pengaturan tiket dapur');
    }
  };

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
      toast.success('Pengaturan pajak & biaya layanan berhasil disimpan');
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
      toast.success('Potongan komisi platform online food berhasil disimpan');
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
      toast.success('Pengaturan tampilan Best Seller berhasil disimpan');
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
      toast.success('Informasi toko berhasil disimpan');
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
      toast.success('Pengaturan integrasi pembayaran (Midtrans) berhasil disimpan');
    } else {
      toast.error(res.error || 'Gagal menyimpan integrasi pembayaran');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pengaturan Outlet</h1>
        <p className="text-sm text-muted-foreground">
          Kelola profil toko, integrasi pembayaran, format cetak struk kasir, tiket dapur, dan biaya operasional.
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

          {isOwnerOnly && (
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
          )}

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

          <TabsTrigger 
            value="receipt" 
            className="justify-start px-4 py-3 rounded-xl data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none hover:bg-slate-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Printer className="h-5 w-5" />
              <div className="flex flex-col items-start">
                <span className="font-semibold text-sm">Struk & Tiket Dapur</span>
                <span className="font-normal text-xs text-muted-foreground opacity-80">Kasir & Kitchen Slip</span>
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
                      <Label htmlFor="storeName" className="font-semibold text-sm">Nama Toko / Outlet</Label>
                      <Input
                        id="storeName"
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        placeholder="Contoh: Kopi Kenangan"
                        className="bg-slate-50/50"
                        required
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="primaryColor" className="font-semibold text-sm">Warna Tema Utama</Label>
                      <div className="flex gap-3">
                        <Input
                          id="primaryColor"
                          type="color"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="w-12 h-10 p-1 cursor-pointer bg-slate-50/50"
                        />
                        <Input
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="bg-slate-50/50 font-mono uppercase"
                          maxLength={7}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="storeDescription" className="font-semibold text-sm">Deskripsi Toko</Label>
                    <Textarea
                      id="storeDescription"
                      rows={3}
                      value={storeDescription}
                      onChange={(e) => setStoreDescription(e.target.value)}
                      placeholder="Tuliskan deskripsi singkat mengenai outlet Anda..."
                      className="bg-slate-50/50"
                    />
                  </div>

                  <div className="flex justify-end pt-4 border-t">
                    <Button disabled={isSavingStore || !hasStoreChanges} type="submit" size="lg" className="min-w-[140px] shadow-sm">
                      {isSavingStore ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...</>
                      ) : (
                        <><Save className="mr-2 h-4 w-4" /> Simpan Profil</>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          </TabsContent>

          {/* TAB 2: PAJAK & BIAYA LAYANAN */}
          <TabsContent value="tax" className="mt-0 outline-none">
            <form onSubmit={handleSaveTax} className="space-y-6">
              <Card className="border-0 shadow-sm ring-1 ring-slate-200">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl">Pajak Restoran & Biaya Layanan</CardTitle>
                  <CardDescription>
                    Atur tarif pajak PB1 atau service charge yang otomatis dihitung pada setiap pesanan POS.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="taxName" className="font-semibold text-sm">Nama Label Pajak</Label>
                    <Input
                      id="taxName"
                      value={taxName}
                      onChange={(e) => setTaxName(e.target.value)}
                      placeholder="Contoh: Pajak Restoran (PB1)"
                      className="bg-slate-50/50"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="posTaxRate" className="font-semibold text-sm">Persentase Pajak (%)</Label>
                      <Input
                        id="posTaxRate"
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={posTaxRate}
                        onChange={(e) => setPosTaxRate(e.target.value)}
                        placeholder="10"
                        className="bg-slate-50/50"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="serviceChargeRate" className="font-semibold text-sm">Biaya Layanan / Service (%)</Label>
                      <Input
                        id="serviceChargeRate"
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={serviceChargeRate}
                        onChange={(e) => setServiceChargeRate(e.target.value)}
                        placeholder="5"
                        className="bg-slate-50/50"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t">
                    <Button disabled={isSavingTax || !hasTaxChanges} type="submit" size="lg" className="min-w-[140px] shadow-sm">
                      {isSavingTax ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...</>
                      ) : (
                        <><Save className="mr-2 h-4 w-4" /> Simpan Pajak</>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          </TabsContent>

          {/* TAB 3: KOMISI ONLINE FOOD */}
          <TabsContent value="platform" className="mt-0 outline-none">
            <form onSubmit={handleSavePlatformFees} className="space-y-6">
              <Card className="border-0 shadow-sm ring-1 ring-slate-200">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl">Potongan Komisi Online Food</CardTitle>
                  <CardDescription>
                    Potongan komisi yang dikenakan oleh platform pesan-antar makanan. Digunakan untuk perhitungan pendapatan bersih laporan penjualan.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="grabFoodFeeRate" className="font-semibold text-sm">GrabFood (%)</Label>
                      <Input
                        id="grabFoodFeeRate"
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={grabFoodFeeRate}
                        onChange={(e) => setGrabFoodFeeRate(e.target.value)}
                        className="bg-slate-50/50"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="shopeeFoodFeeRate" className="font-semibold text-sm">ShopeeFood (%)</Label>
                      <Input
                        id="shopeeFoodFeeRate"
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={shopeeFoodFeeRate}
                        onChange={(e) => setShopeeFoodFeeRate(e.target.value)}
                        className="bg-slate-50/50"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="goFoodFeeRate" className="font-semibold text-sm">GoFood (%)</Label>
                      <Input
                        id="goFoodFeeRate"
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={goFoodFeeRate}
                        onChange={(e) => setGoFoodFeeRate(e.target.value)}
                        className="bg-slate-50/50"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t">
                    <Button disabled={isSavingPlatform || !hasPlatformChanges} type="submit" size="lg" className="min-w-[140px] shadow-sm">
                      {isSavingPlatform ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...</>
                      ) : (
                        <><Save className="mr-2 h-4 w-4" /> Simpan Potongan</>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          </TabsContent>

          {/* TAB 4: INTEGRASI MIDTRANS (KHUSUS OWNER) */}
          {isOwnerOnly && (
            <TabsContent value="payment" className="mt-0 outline-none">
              <form onSubmit={handleSavePayment} className="space-y-6">
                <Card className="border-0 shadow-sm ring-1 ring-slate-200">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-emerald-500/10 text-emerald-600 rounded-xl flex items-center justify-center">
                        <CreditCard className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">Integrasi Midtrans Snap</CardTitle>
                        <CardDescription>
                          Konfigurasi kredensial Payment Gateway Midtrans untuk pembayaran QRIS & Virtual Account.
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      <Label htmlFor="midtransEnvironment" className="font-semibold text-sm">Environment Mode</Label>
                      <select
                        id="midtransEnvironment"
                        value={midtransEnvironment}
                        onChange={(e) => setMidtransEnvironment(e.target.value)}
                        className="w-full h-10 px-3 rounded-md border border-input bg-slate-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="sandbox">Sandbox (Pengujian / Demo)</option>
                        <option value="production">Production (Live Transaksi Nyata)</option>
                      </select>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="midtransClientKey" className="font-semibold text-sm">Midtrans Client Key</Label>
                      <Input
                        id="midtransClientKey"
                        value={midtransClientKey}
                        onChange={(e) => setMidtransClientKey(e.target.value)}
                        placeholder="SB-Mid-client-..."
                        className="bg-slate-50/50 font-mono text-sm"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="midtransServerKey" className="font-semibold text-sm">Midtrans Server Key</Label>
                      <div className="relative">
                        <Input
                          id="midtransServerKey"
                          type={showServerKey ? 'text' : 'password'}
                          value={midtransServerKey}
                          onChange={(e) => setMidtransServerKey(e.target.value)}
                          placeholder="SB-Mid-server-..."
                          className="bg-slate-50/50 font-mono text-sm pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowServerKey(!showServerKey)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showServerKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t">
                      <Button disabled={isSavingPayment || !hasPaymentChanges} type="submit" size="lg" className="min-w-[140px] shadow-sm">
                        {isSavingPayment ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...</>
                        ) : (
                          <><Save className="mr-2 h-4 w-4" /> Simpan Kredensial</>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </form>
            </TabsContent>
          )}

          {/* TAB 5: PREFERENSI TAMPILAN */}
          <TabsContent value="bestseller" className="mt-0 outline-none">
            <form onSubmit={handleSaveDisplay} className="space-y-6">
              <Card className="border-0 shadow-sm ring-1 ring-slate-200">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl">Preferensi Tampilan Katalog POS</CardTitle>
                  <CardDescription>
                    Sesuaikan urutan dan tata letak produk di katalog kasir.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 border rounded-xl bg-slate-50/50">
                    <div className="space-y-1">
                      <Label htmlFor="posPinBestSellers" className="font-semibold text-sm">Sematkan Menu Terlaris di Atas</Label>
                      <p className="text-xs text-muted-foreground">
                        Tampilkan produk dengan penjualan tertinggi di baris paling awal katalog kasir.
                      </p>
                    </div>
                    <Switch
                      id="posPinBestSellers"
                      checked={posPinBestSellers}
                      onCheckedChange={setPosPinBestSellers}
                    />
                  </div>

                  <div className="flex justify-end pt-4 border-t">
                    <Button disabled={isSavingDisplay || !hasDisplayChanges} type="submit" size="lg" className="min-w-[140px] shadow-sm">
                      {isSavingDisplay ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...</>
                      ) : (
                        <><Save className="mr-2 h-4 w-4" /> Simpan Preferensi</>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          </TabsContent>

          {/* TAB 6: PENGATURAN POS */}
          <TabsContent value="pos" className="mt-0 outline-none">
            <PosSettingsForm initialData={catalogSettings || {}} />
          </TabsContent>

          {/* TAB 7: STRUK KASIR & TIKET DAPUR */}
          <TabsContent value="receipt" className="mt-0 outline-none">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* FORM CONTROLS (7 COLS) */}
                <div className="lg:col-span-7 space-y-6">
                  
                  <Tabs defaultValue="customer_receipt" className="w-full">
                    <TabsList className="grid grid-cols-2 w-full mb-4 bg-slate-100 p-1 rounded-xl">
                      <TabsTrigger value="customer_receipt" className="rounded-lg text-xs font-semibold py-2">
                        <ReceiptText className="h-4 w-4 mr-2" /> Struk Pelanggan
                      </TabsTrigger>
                      <TabsTrigger value="kitchen_ticket" className="rounded-lg text-xs font-semibold py-2">
                        <ChefHat className="h-4 w-4 mr-2" /> Tiket Dapur (Slip)
                      </TabsTrigger>
                    </TabsList>

                    {/* SUB-FORM 1: STRUK PELANGGAN */}
                    <TabsContent value="customer_receipt" className="mt-0">
                      <form onSubmit={handleSaveReceipt} className="space-y-6">
                        <Card className="border-0 shadow-sm ring-1 ring-slate-200">
                          <CardHeader className="pb-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                              <ReceiptText className="h-5 w-5 text-primary" />
                              Format Struk Pembayaran Pelanggan
                            </CardTitle>
                            <CardDescription>
                              Sesuaikan logo, alamat, footer, dan informasi pembayaran pada struk kasir termal.
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-5">
                            {/* LOGO URL */}
                            <div className="space-y-2">
                              <Label htmlFor="receiptLogoUrl" className="font-semibold text-xs uppercase tracking-wider text-slate-700">
                                URL / Link Gambar Logo Struk
                              </Label>
                              <Input
                                id="receiptLogoUrl"
                                type="url"
                                value={receiptLogoUrl}
                                onChange={(e) => setReceiptLogoUrl(e.target.value)}
                                placeholder="https://example.com/logo.png"
                                className="bg-slate-50/50 text-sm h-10"
                              />
                              <p className="text-xs text-muted-foreground">
                                Masukkan link langsung gambar logo. Kosongkan jika ingin menggunakan logo utama toko.
                              </p>
                            </div>

                            {/* HEADER */}
                            <div className="space-y-2">
                              <Label htmlFor="receiptHeader" className="font-semibold text-xs uppercase tracking-wider text-slate-700">
                                Header Struk (Alamat & Kontak)
                              </Label>
                              <Textarea
                                id="receiptHeader"
                                rows={3}
                                value={receiptHeader}
                                onChange={(e) => setReceiptHeader(e.target.value)}
                                placeholder="Jl. Merdeka No. 45, Jakarta Pusat&#10;Telp: 0812-3456-7890"
                                className="bg-slate-50/50 font-mono text-xs resize-none"
                              />
                            </div>

                            {/* FOOTER */}
                            <div className="space-y-2">
                              <Label htmlFor="receiptFooter" className="font-semibold text-xs uppercase tracking-wider text-slate-700">
                                Footer Struk (Pesan Penutup)
                              </Label>
                              <Textarea
                                id="receiptFooter"
                                rows={2}
                                value={receiptFooter}
                                onChange={(e) => setReceiptFooter(e.target.value)}
                                placeholder="Terima kasih atas kunjungan Anda!&#10;Follow IG: @boluanisa_official"
                                className="bg-slate-50/50 font-mono text-xs resize-none"
                              />
                            </div>

                            {/* CUSTOM NOTE / WIFI */}
                            <div className="space-y-2">
                              <Label htmlFor="receiptCustomNote" className="font-semibold text-xs uppercase tracking-wider text-slate-700">
                                Catatan Khusus / Info WiFi
                              </Label>
                              <Input
                                id="receiptCustomNote"
                                value={receiptCustomNote}
                                onChange={(e) => setReceiptCustomNote(e.target.value)}
                                placeholder="WiFi: TamuResto / Pass: selamatmakan"
                                className="bg-slate-50/50 text-sm h-10"
                              />
                            </div>

                            {/* TOGGLES */}
                            <div className="pt-3 border-t space-y-3">
                              <h4 className="font-semibold text-xs uppercase tracking-wider text-slate-700">Tampilan Elemen:</h4>

                              <div className="flex items-center justify-between p-3 border rounded-xl bg-slate-50/50">
                                <div className="space-y-0.5">
                                  <Label className="font-medium text-sm">Logo Toko di Header</Label>
                                  <p className="text-xs text-muted-foreground">Cetak logo di bagian paling atas struk</p>
                                </div>
                                <Switch checked={receiptShowLogo} onCheckedChange={setReceiptShowLogo} />
                              </div>

                              <div className="flex items-center justify-between p-3 border rounded-xl bg-slate-50/50">
                                <div className="space-y-0.5">
                                  <Label className="font-medium text-sm">Nama Kasir</Label>
                                  <p className="text-xs text-muted-foreground">Tampilkan nama kasir yang melayani</p>
                                </div>
                                <Switch checked={receiptShowCashier} onCheckedChange={setReceiptShowCashier} />
                              </div>

                              <div className="flex items-center justify-between p-3 border rounded-xl bg-slate-50/50">
                                <div className="space-y-0.5">
                                  <Label className="font-medium text-sm">Nama Pelanggan</Label>
                                  <p className="text-xs text-muted-foreground">Tampilkan nama pemesan</p>
                                </div>
                                <Switch checked={receiptShowCustomer} onCheckedChange={setReceiptShowCustomer} />
                              </div>

                              <div className="flex items-center justify-between p-3 border rounded-xl bg-slate-50/50">
                                <div className="space-y-0.5">
                                  <Label className="font-medium text-sm">Nomor Meja</Label>
                                  <p className="text-xs text-muted-foreground">Tampilkan nomor meja (Dine In)</p>
                                </div>
                                <Switch checked={receiptShowTable} onCheckedChange={setReceiptShowTable} />
                              </div>

                              <div className="flex items-center justify-between p-3 border rounded-xl bg-slate-50/50">
                                <div className="space-y-0.5">
                                  <Label className="font-medium text-sm">Catatan Item & WiFi</Label>
                                  <p className="text-xs text-muted-foreground">Cetak baris catatan item dan kotak info WiFi</p>
                                </div>
                                <Switch checked={receiptShowNotes} onCheckedChange={setReceiptShowNotes} />
                              </div>
                            </div>

                            <div className="flex justify-end pt-4 border-t">
                              <Button disabled={isSavingReceipt || !hasReceiptChanges} type="submit" size="lg" className="min-w-[170px] shadow-sm">
                                {isSavingReceipt ? (
                                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...</>
                                ) : (
                                  <><Save className="mr-2 h-4 w-4" /> Simpan Struk Pelanggan</>
                                )}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </form>
                    </TabsContent>

                    {/* SUB-FORM 2: TIKET DAPUR (KITCHEN SLIP) */}
                    <TabsContent value="kitchen_ticket" className="mt-0">
                      <form onSubmit={handleSaveKitchen} className="space-y-6">
                        <Card className="border-0 shadow-sm ring-1 ring-slate-200">
                          <CardHeader className="pb-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                              <ChefHat className="h-5 w-5 text-orange-600" />
                              Format Tiket Pesanan Dapur (Kitchen Slip)
                            </CardTitle>
                            <CardDescription>
                              Salinan tiket ringkas khusus koki/barista tanpa mencantumkan harga dan nominal uang.
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-5">
                            
                            {/* MASTER TOGGLE */}
                            <div className="flex items-center justify-between p-4 border-2 border-orange-200 rounded-xl bg-orange-50/40">
                              <div className="space-y-1">
                                <Label className="font-bold text-sm text-orange-950">Otomatis Cetak Tiket Dapur Saat Bayar</Label>
                                <p className="text-xs text-muted-foreground">
                                  Jika aktif, sistem otomatis mencetak salinan tiket pesanan untuk tim dapur setiap transaksi kasir selesai.
                                </p>
                              </div>
                              <Switch checked={kitchenPrintEnabled} onCheckedChange={setKitchenPrintEnabled} />
                            </div>

                            {/* TITLE */}
                            <div className="space-y-2">
                              <Label htmlFor="kitchenTicketTitle" className="font-semibold text-xs uppercase tracking-wider text-slate-700">
                                Judul Tiket Dapur
                              </Label>
                              <Input
                                id="kitchenTicketTitle"
                                value={kitchenTicketTitle}
                                onChange={(e) => setKitchenTicketTitle(e.target.value)}
                                placeholder="TIKET DAPUR / BAR"
                                className="bg-slate-50/50 text-sm h-10 font-bold"
                              />
                            </div>

                            {/* NOTES */}
                            <div className="space-y-2">
                              <Label htmlFor="kitchenTicketNotes" className="font-semibold text-xs uppercase tracking-wider text-slate-700">
                                Catatan Kaki Dapur
                              </Label>
                              <Input
                                id="kitchenTicketNotes"
                                value={kitchenTicketNotes}
                                onChange={(e) => setKitchenTicketNotes(e.target.value)}
                                placeholder="Harap periksa kelengkapan pesanan sebelum disajikan"
                                className="bg-slate-50/50 text-sm h-10"
                              />
                            </div>

                            {/* TOGGLES */}
                            <div className="pt-3 border-t space-y-3">
                              <h4 className="font-semibold text-xs uppercase tracking-wider text-slate-700">Tampilan Elemen Tiket Dapur:</h4>

                              <div className="flex items-center justify-between p-3 border rounded-xl bg-slate-50/50">
                                <div className="space-y-0.5">
                                  <Label className="font-medium text-sm">Nomor Meja & Channel</Label>
                                  <p className="text-xs text-muted-foreground">Cetak nomor meja dan tipe order (Dine In / Take Away) dengan ukuran besar</p>
                                </div>
                                <Switch checked={kitchenShowTable} onCheckedChange={setKitchenShowTable} />
                              </div>

                              <div className="flex items-center justify-between p-3 border rounded-xl bg-slate-50/50">
                                <div className="space-y-0.5">
                                  <Label className="font-medium text-sm">Nama Pelanggan</Label>
                                  <p className="text-xs text-muted-foreground">Tampilkan nama pemesan di tiket dapur</p>
                                </div>
                                <Switch checked={kitchenShowCustomer} onCheckedChange={setKitchenShowCustomer} />
                              </div>

                              <div className="flex items-center justify-between p-3 border rounded-xl bg-slate-50/50">
                                <div className="space-y-0.5">
                                  <Label className="font-medium text-sm">Nama Kasir / Waitstaff</Label>
                                  <p className="text-xs text-muted-foreground">Tampilkan nama staf pembuat pesanan</p>
                                </div>
                                <Switch checked={kitchenShowCashier} onCheckedChange={setKitchenShowCashier} />
                              </div>

                              <div className="flex items-center justify-between p-3 border rounded-xl bg-slate-50/50">
                                <div className="space-y-0.5">
                                  <Label className="font-medium text-sm">Catatan Modifiers & Item Khusus</Label>
                                  <p className="text-xs text-muted-foreground">Cetak instruksi memasak (contoh: Pedas Level 3, Less Ice, Tanpa Bawang)</p>
                                </div>
                                <Switch checked={kitchenShowNotes} onCheckedChange={setKitchenShowNotes} />
                              </div>

                              <div className="flex items-center justify-between p-3 border rounded-xl bg-slate-50/50">
                                <div className="space-y-0.5">
                                  <Label className="font-medium text-sm">Pemisah Gunting Kertas</Label>
                                  <p className="text-xs text-muted-foreground">Cetak garis pemotong jika menggunakan 1 printer thermal bersama</p>
                                </div>
                                <Switch checked={kitchenAutoCut} onCheckedChange={setKitchenAutoCut} />
                              </div>
                            </div>

                            <div className="flex justify-end pt-4 border-t">
                              <Button disabled={isSavingKitchen || !hasKitchenChanges} type="submit" size="lg" className="min-w-[170px] shadow-sm">
                                {isSavingKitchen ? (
                                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...</>
                                ) : (
                                  <><Save className="mr-2 h-4 w-4" /> Simpan Tiket Dapur</>
                                )}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </form>
                    </TabsContent>
                  </Tabs>

                </div>

                {/* LIVE RECEIPT & TICKET PREVIEW (5 COLS) */}
                <div className="lg:col-span-5">
                  <div className="sticky top-6 space-y-3">
                    
                    {/* PREVIEW SWITCHER */}
                    <div className="flex items-center justify-between bg-slate-100 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setPreviewTab('customer')}
                        className={`flex-1 text-xs font-semibold py-1.5 px-3 rounded-lg transition-all ${previewTab === 'customer' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}
                      >
                        Preview Struk Kasir
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewTab('kitchen')}
                        className={`flex-1 text-xs font-semibold py-1.5 px-3 rounded-lg transition-all ${previewTab === 'kitchen' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}
                      >
                        Preview Tiket Dapur
                      </button>
                    </div>

                    {/* PREVIEW 1: STRUK PELANGGAN */}
                    {previewTab === 'customer' && (
                      <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-200/80 font-mono text-xs leading-relaxed text-slate-900 transition-all select-none" style={{ fontFamily: "'JetBrains Mono', 'SF Mono', 'Roboto Mono', 'Menlo', 'Consolas', monospace" }}>
                        {/* HEADER LOGO & NAME */}
                        <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-300">
                          {receiptShowLogo && (
                            <div className="flex justify-center mb-2">
                              {(receiptLogoUrl || tenant?.storeLogoUrl) ? (
                                <img 
                                  src={receiptLogoUrl || tenant?.storeLogoUrl} 
                                  alt="Logo" 
                                  className="h-10 w-10 object-contain rounded-full border border-slate-200" 
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs tracking-wider">
                                  {tenant?.name?.slice(0, 2)?.toUpperCase() || 'MN'}
                                </div>
                              )}
                            </div>
                          )}
                          <div className="font-bold text-sm tracking-wider uppercase">
                            {tenant?.name || 'NAMA OUTLET RESTO'}
                          </div>
                          {receiptHeader ? (
                            <div className="text-[11px] text-slate-600 whitespace-pre-line leading-normal">
                              {receiptHeader}
                            </div>
                          ) : (
                            <div className="text-[11px] text-slate-400 italic">
                              (Alamat outlet belum diatur)
                            </div>
                          )}
                        </div>

                        {/* ORDER INFO */}
                        <div className="py-2 text-[11px] border-b border-dashed border-slate-300 space-y-0.5">
                          <div className="flex justify-between">
                            <span className="text-slate-600">WAKTU</span>
                            <span>{new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })} 14:30</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">NO. STRUK</span>
                            <span className="font-bold">#TRX-8921</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">CHANNEL</span>
                            <span>DINE_IN</span>
                          </div>
                          {receiptShowCashier && (
                            <div className="flex justify-between">
                              <span className="text-slate-600">KASIR</span>
                              <span>Sarah</span>
                            </div>
                          )}
                          {receiptShowCustomer && (
                            <div className="flex justify-between">
                              <span className="text-slate-600">PELANGGAN</span>
                              <span>Bpk. Hendra</span>
                            </div>
                          )}
                          {receiptShowTable && (
                            <div className="flex justify-between">
                              <span className="text-slate-600">MEJA</span>
                              <span className="font-bold">NO. 05</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-slate-600">METODE</span>
                            <span>QRIS</span>
                          </div>
                        </div>

                        {/* ITEMS LIST */}
                        <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1.5">
                          <div>
                            <div className="flex justify-between font-bold text-[11px]">
                              <span>Nasi Goreng Spesial</span>
                            </div>
                            <div className="flex justify-between text-[11px] text-slate-700">
                              <span>1 x 35.000</span>
                              <span>35.000</span>
                            </div>
                            {receiptShowNotes && (
                              <div className="text-[10px] text-slate-500 pl-2">
                                - Pedas Level 2, Telur Dadar
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="flex justify-between font-bold text-[11px]">
                              <span>Es Teh Manis</span>
                            </div>
                            <div className="flex justify-between text-[11px] text-slate-700">
                              <span>2 x 8.000</span>
                              <span>16.000</span>
                            </div>
                            {receiptShowNotes && (
                              <div className="text-[10px] text-slate-500 pl-2">
                                - Less Sugar, Less Ice
                              </div>
                            )}
                          </div>
                        </div>

                        {/* SUMMARY */}
                        <div className="py-2 text-[11px] space-y-0.5 border-b border-dashed border-slate-300 text-slate-700">
                          <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span>51.000</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Pajak (PB1)</span>
                            <span>5.100</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Layanan</span>
                            <span>2.500</span>
                          </div>
                        </div>

                        {/* TOTAL */}
                        <div className="py-2 border-b border-slate-900">
                          <div className="flex justify-between font-bold text-sm text-slate-900">
                            <span>TOTAL</span>
                            <span>Rp 58.600</span>
                          </div>
                        </div>

                        {/* PAYMENT DETAILS */}
                        <div className="py-2 text-[11px] border-b border-dashed border-slate-300 space-y-0.5 text-slate-700">
                          <div className="flex justify-between">
                            <span>Bayar</span>
                            <span>58.600</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Kembali</span>
                            <span>0</span>
                          </div>
                        </div>

                        {/* CUSTOM NOTE BOX */}
                        {receiptShowNotes && receiptCustomNote && (
                          <div className="my-2.5 p-2 border border-slate-300 rounded text-center text-[10px] text-slate-700">
                            {receiptCustomNote}
                          </div>
                        )}

                        {/* FOOTER */}
                        <div className="text-center pt-2 space-y-1">
                          {receiptFooter ? (
                            <div className="text-[10px] text-slate-600 whitespace-pre-line leading-relaxed">
                              {receiptFooter}
                            </div>
                          ) : (
                            <div className="text-[10px] font-bold tracking-wider text-slate-700">TERIMA KASIH</div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* PREVIEW 2: TIKET PESANAN DAPUR (KITCHEN SLIP) */}
                    {previewTab === 'kitchen' && (
                      <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-200/80 font-mono text-xs leading-relaxed text-slate-900 transition-all select-none" style={{ fontFamily: "'JetBrains Mono', 'SF Mono', 'Roboto Mono', 'Menlo', 'Consolas', monospace" }}>
                        
                        {/* KITCHEN HEADER */}
                        <div className="text-center space-y-1 pb-2.5 border-b border-slate-900">
                          <div className="font-bold text-sm tracking-wider uppercase">
                            {kitchenTicketTitle || 'TIKET DAPUR'}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })} 14:30:22
                          </div>
                        </div>

                        {/* TABLE & CHANNEL */}
                        <div className="py-2 border-b border-dashed border-slate-300 space-y-0.5 text-[11px]">
                          <div className="flex justify-between">
                            <span className="text-slate-600">CHANNEL</span>
                            <span className="font-bold">DINE_IN</span>
                          </div>
                          {kitchenShowTable && (
                            <div className="flex justify-between text-sm font-bold pt-0.5">
                              <span>MEJA</span>
                              <span>NO. 05</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-slate-600">NO. ORDER</span>
                            <span className="font-bold">#TRX-8921</span>
                          </div>
                          {kitchenShowCustomer && (
                            <div className="flex justify-between">
                              <span className="text-slate-600">PELANGGAN</span>
                              <span>Bpk. Hendra</span>
                            </div>
                          )}
                          {kitchenShowCashier && (
                            <div className="flex justify-between">
                              <span className="text-slate-600">KASIR</span>
                              <span>Sarah</span>
                            </div>
                          )}
                        </div>

                        {/* KITCHEN ITEMS LIST */}
                        <div className="py-2.5 border-b border-dashed border-slate-300 space-y-2">
                          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            Pesanan Masak:
                          </div>

                          <div className="space-y-0.5 pb-1 border-b border-slate-100">
                            <div className="flex justify-between items-baseline font-bold text-[11px]">
                              <span>Nasi Goreng Spesial</span>
                              <span>x1</span>
                            </div>
                            {kitchenShowNotes && (
                              <div className="text-[10px] text-slate-700 pl-2 font-medium">
                                * Catatan: Pedas Level 2, Telur Dadar
                              </div>
                            )}
                          </div>

                          <div className="space-y-0.5">
                            <div className="flex justify-between items-baseline font-bold text-[11px]">
                              <span>Es Teh Manis</span>
                              <span>x2</span>
                            </div>
                            {kitchenShowNotes && (
                              <div className="text-[10px] text-slate-700 pl-2 font-medium">
                                * Catatan: Less Sugar, Less Ice
                              </div>
                            )}
                          </div>
                        </div>

                        {/* TOTAL QTY COUNT */}
                        <div className="py-2 flex justify-between font-bold text-[11px] border-b border-slate-900">
                          <span>TOTAL ITEM</span>
                          <span>3 Pcs</span>
                        </div>

                        {/* KITCHEN FOOTER NOTE */}
                        {kitchenTicketNotes && (
                          <div className="mt-2.5 p-2 border border-slate-300 rounded text-center text-[10px] text-slate-700">
                            {kitchenTicketNotes}
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                </div>

              </div>
            </TabsContent>

        </div>
      </Tabs>
    </div>
  );
}
