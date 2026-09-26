'use client';

import * as React from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  IconReceipt, 
  IconMoped, 
  IconAdjustmentsHorizontal, 
  IconBuildingStore, 
  IconDeviceFloppy, 
  IconLoader2, 
  IconCreditCard, 
  IconCircleCheck,
  IconEye,
  IconEyeOff,
  IconLayout,
  IconPrinter,
  IconReceipt2,
  IconChefHat,
  IconCamera,
  IconUpload,
  IconTrash,
  IconCheck,
  IconDeviceMobile
} from '@tabler/icons-react';
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
import { uploadImageToSupabase } from '@/lib/actions/storage';
import { PosSettingsForm } from './pos-settings-form';
import { cn } from '@/lib/utils';
import { usePageTransition } from '@/components/providers/page-transition-provider';

const COLOR_PRESETS = [
  { name: 'Royal Blue', hex: '#2563EB' },
  { name: 'Emerald', hex: '#10B981' },
  { name: 'Violet', hex: '#8B5CF6' },
  { name: 'Amber', hex: '#F59E0B' },
  { name: 'Rose', hex: '#F43F5E' },
  { name: 'Slate Dark', hex: '#1E293B' },
];
import { OrderPrefixPicker } from '@/components/shared/order-prefix-picker';

export function SettingsClient({ 
  tenant, 
  catalogSettings, 
  userRole 
}: { 
  tenant: any; 
  catalogSettings: any; 
  userRole?: string;
}) {
  const isOwnerOnly = userRole === 'OWNER' || userRole === 'SYSTEM_ADMIN' || !userRole;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { navigateWithTransition } = usePageTransition();
  const outletKey = tenant?.outletKey || tenant?.slug || '';
  
  const tabFromUrl = searchParams.get('tab') || 'store';
  const [activeTab, setActiveTab] = React.useState(tabFromUrl);

  React.useEffect(() => {
    if (tabFromUrl && ['store', 'receipt', 'pos', 'tax', 'platform', 'bestseller', 'payment'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    router.replace(`${pathname}?tab=${val}`, { scroll: false });
  };

  const [isSavingTax, setIsSavingTax] = React.useState(false);
  const [isSavingPlatform, setIsSavingPlatform] = React.useState(false);
  const [isSavingDisplay, setIsSavingDisplay] = React.useState(false);
  const [isSavingStore, setIsSavingStore] = React.useState(false);
  const [isSavingPayment, setIsSavingPayment] = React.useState(false);
  const [isSavingReceipt, setIsSavingReceipt] = React.useState(false);
  const [isSavingKitchen, setIsSavingKitchen] = React.useState(false);
  const [showServerKey, setShowServerKey] = React.useState(false);

  // Upload states
  const [isUploadingLogo, setIsUploadingLogo] = React.useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = React.useState(false);
  const logoInputRef = React.useRef<HTMLInputElement>(null);
  const bannerInputRef = React.useRef<HTMLInputElement>(null);

  // Store General Form State
  const [storeName, setStoreName] = React.useState(tenant?.name || '');
  const [storeSlug, setStoreSlug] = React.useState(tenant?.slug || tenant?.outletKey || '');
  const [storeDescription, setStoreDescription] = React.useState(tenant?.storeDescription || '');
  const [storeLogoUrl, setStoreLogoUrl] = React.useState<string | null>(tenant?.storeLogoUrl || null);
  const [storeBannerUrl, setStoreBannerUrl] = React.useState<string | null>(tenant?.storeBannerUrl || null);
  const [primaryColor, setPrimaryColor] = React.useState(tenant?.primaryColor || '#2563EB');
  const [orderPrefix, setOrderPrefix] = React.useState(tenant?.orderPrefix || '');

  // Tax and Fees Form State
  const [taxName, setTaxName] = React.useState(tenant?.taxName || 'Pajak (PB1)');
  const [posTaxRate, setPosTaxRate] = React.useState(tenant?.posTaxRate?.toString() || '0');
  const [serviceChargeRate, setServiceChargeRate] = React.useState(tenant?.serviceChargeRate?.toString() || '0');

  // Platform Fees Form State
  const [grabFoodFeeRate, setGrabFoodFeeRate] = React.useState(tenant?.grabFoodFeeRate?.toString() || '20');
  const [shopeeFoodFeeRate, setShopeeFoodFeeRate] = React.useState(tenant?.shopeeFoodFeeRate?.toString() || '20');
  const [goFoodFeeRate, setGoFoodFeeRate] = React.useState(tenant?.goFoodFeeRate?.toString() || '20');

  // Display Form State
  const [posPinBestSellers, setPosPinBestSellers] = React.useState(tenant?.posPinBestSellers ?? true);

  // Midtrans Payment Form State
  const [midtransEnvironment, setMidtransEnvironment] = React.useState(tenant?.midtransEnvironment || 'sandbox');
  const [midtransServerKey, setMidtransServerKey] = React.useState(tenant?.midtransServerKey || '');
  const [midtransClientKey, setMidtransClientKey] = React.useState(tenant?.midtransClientKey || '');

  // Receipt form states
  const [receiptLogoUrl, setReceiptLogoUrl] = React.useState(tenant?.receiptLogoUrl || '');
  const [receiptHeader, setReceiptHeader] = React.useState(tenant?.receiptHeader || '');
  const [receiptFooter, setReceiptFooter] = React.useState(tenant?.receiptFooter || '');
  const [receiptShowLogo, setReceiptShowLogo] = React.useState(tenant?.receiptShowLogo ?? true);
  const [receiptShowCustomer, setReceiptShowCustomer] = React.useState(tenant?.receiptShowCustomer ?? true);
  const [receiptShowCashier, setReceiptShowCashier] = React.useState(tenant?.receiptShowCashier ?? true);
  const [receiptShowTable, setReceiptShowTable] = React.useState(tenant?.receiptShowTable ?? true);
  const [receiptShowNotes, setReceiptShowNotes] = React.useState(tenant?.receiptShowNotes ?? true);
  const [receiptCustomNote, setReceiptCustomNote] = React.useState(tenant?.receiptCustomNote || '');

  // Kitchen Ticket form states
  const [kitchenPrintEnabled, setKitchenPrintEnabled] = React.useState(tenant?.kitchenPrintEnabled ?? false);
  const [kitchenTicketTitle, setKitchenTicketTitle] = React.useState(tenant?.kitchenTicketTitle || 'TIKET DAPUR');
  const [kitchenTicketNotes, setKitchenTicketNotes] = React.useState(tenant?.kitchenTicketNotes || '');
  const [kitchenShowCustomer, setKitchenShowCustomer] = React.useState(tenant?.kitchenShowCustomer ?? true);
  const [kitchenShowCashier, setKitchenShowCashier] = React.useState(tenant?.kitchenShowCashier ?? true);
  const [kitchenShowTable, setKitchenShowTable] = React.useState(tenant?.kitchenShowTable ?? true);
  const [kitchenShowNotes, setKitchenShowNotes] = React.useState(tenant?.kitchenShowNotes ?? true);
  const [kitchenAutoCut, setKitchenAutoCut] = React.useState(tenant?.kitchenAutoCut ?? true);

  // Preview sub-tab state ('customer' | 'kitchen')
  const [previewTab, setPreviewTab] = React.useState<'customer' | 'kitchen'>('customer');

  // Change detection
  const hasStoreChanges = 
    storeName !== (tenant?.name || '') ||
    storeSlug !== (tenant?.slug || tenant?.outletKey || '') ||
    storeDescription !== (tenant?.storeDescription || '') ||
    storeLogoUrl !== (tenant?.storeLogoUrl || null) ||
    storeBannerUrl !== (tenant?.storeBannerUrl || null) ||
    primaryColor !== (tenant?.primaryColor || '#2563EB') ||
    orderPrefix !== (tenant?.orderPrefix || '');

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
    receiptFooter !== (tenant?.receiptFooter || '') ||
    receiptShowLogo !== (tenant?.receiptShowLogo ?? true) ||
    receiptShowCustomer !== (tenant?.receiptShowCustomer ?? true) ||
    receiptShowCashier !== (tenant?.receiptShowCashier ?? true) ||
    receiptShowTable !== (tenant?.receiptShowTable ?? true) ||
    receiptShowNotes !== (tenant?.receiptShowNotes ?? true) ||
    receiptCustomNote !== (tenant?.receiptCustomNote || '');

  const hasKitchenChanges =
    kitchenPrintEnabled !== (tenant?.kitchenPrintEnabled ?? false) ||
    kitchenTicketTitle !== (tenant?.kitchenTicketTitle || 'TIKET DAPUR') ||
    kitchenTicketNotes !== (tenant?.kitchenTicketNotes || '') ||
    kitchenShowCustomer !== (tenant?.kitchenShowCustomer ?? true) ||
    kitchenShowCashier !== (tenant?.kitchenShowCashier ?? true) ||
    kitchenShowTable !== (tenant?.kitchenShowTable ?? true) ||
    kitchenShowNotes !== (tenant?.kitchenShowNotes ?? true) ||
    kitchenAutoCut !== (tenant?.kitchenAutoCut ?? true);

  // Upload handlers
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Ukuran file maksimal 5MB');
        return;
      }
      setIsUploadingLogo(true);
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await uploadImageToSupabase(formData, 'storefront_images');
        if (res.success && res.url) {
          setStoreLogoUrl(res.url);
          toast.success('Logo berhasil diunggah');
        } else {
          toast.error(res.error || 'Gagal mengunggah logo');
        }
      } catch (err: any) {
        toast.error(err?.message || 'Terjadi kesalahan saat upload logo');
      } finally {
        setIsUploadingLogo(false);
      }
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Ukuran file banner maksimal 5MB');
        return;
      }
      setIsUploadingBanner(true);
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await uploadImageToSupabase(formData, 'storefront_images');
        if (res.success && res.url) {
          setStoreBannerUrl(res.url);
          toast.success('Banner toko berhasil diunggah');
        } else {
          toast.error(res.error || 'Gagal mengunggah banner');
        }
      } catch (err: any) {
        toast.error(err?.message || 'Terjadi kesalahan saat upload banner');
      } finally {
        setIsUploadingBanner(false);
      }
    }
  };

  // Form submit handlers
  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingStore(true);
    const fd = new FormData();
    fd.append('name', storeName);
    fd.append('slug', storeSlug);
    fd.append('storeDescription', storeDescription);
    if (storeLogoUrl) fd.append('storeLogoUrl', storeLogoUrl);
    if (storeBannerUrl) fd.append('storeBannerUrl', storeBannerUrl);
    fd.append('primaryColor', primaryColor);
    if (orderPrefix) fd.append('orderPrefix', orderPrefix);

    const res = await updateStoreGeneralSettings(fd);
    setIsSavingStore(false);
    if (res.success) {
      toast.success('Informasi profil toko berhasil disimpan');
    } else {
      toast.error(res.error || 'Gagal menyimpan informasi');
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
      toast.success('Preferensi tampilan katalog POS berhasil disimpan');
    } else {
      toast.error(res.error || 'Gagal menyimpan preferensi');
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
      toast.success('Pengaturan Midtrans berhasil disimpan');
    } else {
      toast.error(res.error || 'Gagal menyimpan integrasi pembayaran');
    }
  };

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
      toast.success('Format struk kasir berhasil disimpan');
    } else {
      toast.error(res.error || 'Gagal menyimpan format struk');
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
      toast.error(res.error || 'Gagal menyimpan tiket dapur');
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={logoInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleLogoUpload}
      />
      <input
        type="file"
        ref={bannerInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleBannerUpload}
      />

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        {/* MAIN FORM PANELS */}
        <div className="w-full">
          {/* TAB 1: PROFIL TOKO */}
          <TabsContent value="store" className="mt-0 outline-none">
            <div className="bg-card border border-border/70 rounded-2xl p-6 sm:p-8 shadow-xs">
              <form onSubmit={handleSaveStore} className="space-y-6">
                <div className="pb-5 border-b border-border/60">
                  <h2 className="text-lg font-bold tracking-tight text-foreground">
                    Informasi & Identitas Toko
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Atur nama toko, tautan publik katalog digital, logo, dan tema warna utama.
                  </p>
                </div>

                {/* TOP BANNER & AVATAR CONTAINER */}
                <div className="relative rounded-2xl border border-border/70 bg-gradient-to-b from-muted/40 to-muted/15 p-5 sm:p-6 overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                    {/* Left: Avatar / Logo Card */}
                    <div className="flex items-center gap-4">
                      <div className="relative shrink-0">
                        <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl overflow-hidden border-2 border-background shadow-md bg-muted/70 flex items-center justify-center">
                          {storeLogoUrl ? (
                            <img
                              src={storeLogoUrl}
                              alt="Logo Toko"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-foreground text-xl font-bold tracking-wider">
                              {storeName ? storeName.slice(0, 2).toUpperCase() : 'MN'}
                            </span>
                          )}
                        </div>
                        {isUploadingLogo && (
                          <div className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center backdrop-blur-xs">
                            <IconLoader2 className="w-5 h-5 text-white animate-spin" />
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <h3 className="text-base sm:text-lg font-bold text-foreground">
                          {storeName || 'Nama Outlet Anda'}
                        </h3>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-mono">
                          <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                          menuin.id/store/{storeSlug || 'outlet'}
                        </p>
                        <div className="pt-2 flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => logoInputRef.current?.click()}
                            disabled={isUploadingLogo}
                            className="h-8 text-xs font-medium rounded-xl hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all cursor-pointer"
                          >
                            <IconUpload className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                            Ganti Logo
                          </Button>
                          {storeLogoUrl && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setStoreLogoUrl(null)}
                              disabled={isUploadingLogo}
                              className="h-8 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl cursor-pointer"
                            >
                              Hapus
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Add Cover Image Button */}
                    <div className="flex items-center">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => bannerInputRef.current?.click()}
                        disabled={isUploadingBanner}
                        className="h-9 text-xs font-medium rounded-xl hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all cursor-pointer"
                      >
                        {isUploadingBanner ? (
                          <><IconLoader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Mengunggah...</>
                        ) : (
                          <><IconCamera className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" /> {storeBannerUrl ? 'Ganti Cover' : 'Tambah Cover Toko'}</>
                        )}
                      </Button>
                    </div>
                  </div>

                  {storeBannerUrl && (
                    <div className="mt-4 pt-3.5 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                      <span className="truncate max-w-xs font-mono">Cover aktif: {storeBannerUrl.split('/').pop()}</span>
                      <button
                        type="button"
                        onClick={() => setStoreBannerUrl(null)}
                        className="text-rose-600 hover:text-rose-700 hover:underline text-xs font-medium cursor-pointer"
                      >
                        Hapus cover
                      </button>
                    </div>
                  )}
                </div>

                {/* 2-COLUMN FORM ROWS */}
                <div className="divide-y divide-border/60">
                  {/* ROW 1: FULL NAME / NAMA TOKO */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-8 py-5 items-start">
                    <div className="md:col-span-4 space-y-0.5">
                      <Label htmlFor="storeName" className="text-sm font-semibold text-foreground">
                        Nama Toko
                      </Label>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Nama resmi toko atau outlet Anda.
                      </p>
                    </div>
                    <div className="md:col-span-8">
                      <Input
                        id="storeName"
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        placeholder="Contoh: Kopi Titik Temu"
                        className="rounded-xl h-11 bg-background/80 hover:bg-background focus:bg-background border-border/80 text-sm focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all"
                        required
                      />
                    </div>
                  </div>

                  {/* ROW 2: USERNAME / SLUG */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-8 py-5 items-start">
                    <div className="md:col-span-4 space-y-0.5">
                      <Label htmlFor="storeSlug" className="text-sm font-semibold text-foreground">
                        Username / Slug Toko
                      </Label>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        URL publik katalog online toko Anda.
                      </p>
                    </div>
                    <div className="md:col-span-8">
                      <div className="flex items-center rounded-xl border border-border/80 bg-background/80 hover:bg-background focus-within:bg-background overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                        <div className="px-3.5 py-2.5 bg-muted/50 border-r border-border/80 text-xs font-mono text-muted-foreground font-medium select-none">
                          menuin.id/store/
                        </div>
                        <Input
                          id="storeSlug"
                          value={storeSlug}
                          onChange={(e) => setStoreSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                          placeholder="kopi-titik-temu"
                          className="border-0 rounded-none h-11 bg-transparent text-sm font-mono focus-visible:ring-0 focus-visible:ring-offset-0 px-3.5"
                        />
                        <div className="pr-3.5 text-primary shrink-0">
                          <IconCircleCheck className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ROW 3: PROFILE PHOTO / LOGO */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-8 py-5 items-start">
                    <div className="md:col-span-4 space-y-0.5">
                      <Label className="text-sm font-semibold text-foreground">
                        Logo Toko
                      </Label>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Tampil di katalog online dan header struk kasir.
                      </p>
                    </div>
                    <div className="md:col-span-8 flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl overflow-hidden border border-border/80 bg-muted/40 flex items-center justify-center shrink-0">
                        {storeLogoUrl ? (
                          <img src={storeLogoUrl} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-muted-foreground text-sm font-bold">
                            {storeName ? storeName.slice(0, 2).toUpperCase() : 'MN'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => logoInputRef.current?.click()}
                          disabled={isUploadingLogo}
                          className="h-10 px-3.5 text-xs font-medium rounded-xl hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all cursor-pointer"
                        >
                          <IconUpload className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                          {isUploadingLogo ? 'Mengunggah...' : 'Upload Logo Baru'}
                        </Button>
                        {storeLogoUrl && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setStoreLogoUrl(null)}
                            className="h-10 px-3 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl cursor-pointer"
                          >
                            <IconTrash className="w-3.5 h-3.5 mr-1.5" />
                            Hapus
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ROW 4: DESKRIPSI TOKO */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-8 py-5 items-start">
                    <div className="md:col-span-4 space-y-0.5">
                      <Label htmlFor="storeDescription" className="text-sm font-semibold text-foreground">
                        Deskripsi Toko
                      </Label>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Deskripsi singkat outlet untuk katalog digital.
                      </p>
                    </div>
                    <div className="md:col-span-8">
                      <Textarea
                        id="storeDescription"
                        rows={3}
                        value={storeDescription}
                        onChange={(e) => setStoreDescription(e.target.value)}
                        placeholder="Tuliskan deskripsi singkat mengenai outlet Anda..."
                        className="rounded-xl bg-background/80 hover:bg-background focus:bg-background border-border/80 text-sm resize-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all p-3.5"
                      />
                    </div>
                  </div>

                  {/* ROW 5: WARNA TEMA / BRANDING */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-8 py-5 items-start">
                    <div className="md:col-span-4 space-y-0.5">
                      <Label className="text-sm font-semibold text-foreground">
                        Warna Tema Utama
                      </Label>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Warna aksen utama tema dan katalog toko.
                      </p>
                    </div>
                    <div className="md:col-span-8 space-y-3">
                      <div className="flex flex-wrap items-center gap-2.5">
                        {COLOR_PRESETS.map((preset) => {
                          const isSelected = primaryColor.toUpperCase() === preset.hex.toUpperCase();
                          return (
                            <button
                              key={preset.hex}
                              type="button"
                              onClick={() => setPrimaryColor(preset.hex)}
                              className={cn(
                                "w-9 h-9 rounded-xl flex items-center justify-center transition-all relative border cursor-pointer",
                                isSelected ? "border-foreground ring-2 ring-primary/30 scale-105 shadow-sm" : "border-transparent opacity-85 hover:opacity-100 hover:scale-105"
                              )}
                              style={{ backgroundColor: preset.hex }}
                              title={preset.name}
                            >
                              {isSelected && <IconCheck className="w-4 h-4 text-white" />}
                            </button>
                          );
                        })}

                        <div className="flex items-center gap-2 pl-2 border-l border-border/80">
                          <Input
                            type="color"
                            value={primaryColor}
                            onChange={(e) => setPrimaryColor(e.target.value)}
                            className="w-9 h-9 p-0.5 rounded-xl cursor-pointer bg-background/80 border-border/80"
                          />
                          <Input
                            value={primaryColor}
                            onChange={(e) => setPrimaryColor(e.target.value)}
                            maxLength={7}
                            className="w-24 h-9 font-mono text-xs uppercase bg-background/80 border-border/80 rounded-xl px-2.5"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ROW 6: FORMAT KODE PESANAN (ORDER PREFIX) */}
                  <div className="py-5">
                    <OrderPrefixPicker
                      value={orderPrefix}
                      onChange={setOrderPrefix}
                      outletName={storeName}
                    />
                  </div>
                </div>

                {/* SAVE ACTION BAR */}
                <div className="flex items-center justify-end pt-5 border-t border-border/60">
                  <Button
                    disabled={isSavingStore || !hasStoreChanges}
                    type="submit"
                    className="min-w-[150px] h-11 rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all cursor-pointer"
                  >
                    {isSavingStore ? (
                      <><IconLoader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...</>
                    ) : (
                      <><IconDeviceFloppy className="mr-2 h-4 w-4" /> Simpan Profil Toko</>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </TabsContent>

          {/* TAB 2: PAJAK & BIAYA LAYANAN */}
          <TabsContent value="tax" className="mt-0 outline-none">
            <div className="bg-card border border-border/70 rounded-2xl p-6 sm:p-8 shadow-xs">
              <form onSubmit={handleSaveTax} className="space-y-6">
                <div className="pb-5 border-b border-border/60">
                  <h2 className="text-lg font-bold tracking-tight text-foreground">
                    Pajak Restoran & Biaya Layanan
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Atur persentase pajak PB1 dan service charge yang otomatis dihitung pada pesanan kasir POS.
                  </p>
                </div>

                <div className="divide-y divide-border/60">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-8 py-5 items-start">
                    <div className="md:col-span-4 space-y-0.5">
                      <Label htmlFor="taxName" className="text-sm font-semibold text-foreground">
                        Nama Label Pajak
                      </Label>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Label yang tercetak pada struk kasir pelanggan.
                      </p>
                    </div>
                    <div className="md:col-span-8">
                      <Input
                        id="taxName"
                        value={taxName}
                        onChange={(e) => setTaxName(e.target.value)}
                        placeholder="Contoh: Pajak Restoran (PB1)"
                        className="rounded-xl h-11 bg-background/80 hover:bg-background focus:bg-background border-border/80 text-sm focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-8 py-5 items-start">
                    <div className="md:col-span-4 space-y-0.5">
                      <Label htmlFor="posTaxRate" className="text-sm font-semibold text-foreground">
                        Tarif Pajak POS (%)
                      </Label>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Persentase pajak yang dibebankan ke subtotal order kasir.
                      </p>
                    </div>
                    <div className="md:col-span-8">
                      <div className="relative">
                        <Input
                          id="posTaxRate"
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={posTaxRate}
                          onChange={(e) => setPosTaxRate(e.target.value)}
                          placeholder="10"
                          className="rounded-xl h-11 bg-background/80 hover:bg-background focus:bg-background border-border/80 text-sm pr-10 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">%</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-8 py-5 items-start">
                    <div className="md:col-span-4 space-y-0.5">
                      <Label htmlFor="serviceChargeRate" className="text-sm font-semibold text-foreground">
                        Biaya Layanan (%)
                      </Label>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Persentase biaya layanan untuk pesanan dine-in.
                      </p>
                    </div>
                    <div className="md:col-span-8">
                      <div className="relative">
                        <Input
                          id="serviceChargeRate"
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={serviceChargeRate}
                          onChange={(e) => setServiceChargeRate(e.target.value)}
                          placeholder="5"
                          className="rounded-xl h-11 bg-background/80 hover:bg-background focus:bg-background border-border/80 text-sm pr-10 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-5 border-t border-border/60">
                  <Button disabled={isSavingTax || !hasTaxChanges} type="submit" className="min-w-[150px] h-11 rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all cursor-pointer">
                    {isSavingTax ? (
                      <><IconLoader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...</>
                    ) : (
                      <><IconDeviceFloppy className="mr-2 h-4 w-4" /> Simpan Pajak</>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </TabsContent>

          {/* TAB 3: KOMISI ONLINE FOOD */}
          <TabsContent value="platform" className="mt-0 outline-none">
            <div className="bg-card border border-border/70 rounded-2xl p-6 sm:p-8 shadow-xs">
              <form onSubmit={handleSavePlatformFees} className="space-y-6">
                <div className="pb-5 border-b border-border/60">
                  <h2 className="text-lg font-bold tracking-tight text-foreground">
                    Potongan Komisi Online Food
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Potongan komisi mitra pesan-antar makanan untuk kalkulasi estimasi pendapatan bersih.
                  </p>
                </div>

                <div className="divide-y divide-border/60">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-8 py-5 items-start">
                    <div className="md:col-span-4 space-y-0.5">
                      <Label htmlFor="grabFoodFeeRate" className="text-sm font-semibold text-foreground">
                        GrabFood (%)
                      </Label>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Persentase komisi bagi hasil GrabFood.
                      </p>
                    </div>
                    <div className="md:col-span-8">
                      <div className="relative">
                        <Input
                          id="grabFoodFeeRate"
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={grabFoodFeeRate}
                          onChange={(e) => setGrabFoodFeeRate(e.target.value)}
                          className="rounded-xl h-11 bg-background/80 hover:bg-background focus:bg-background border-border/80 text-sm pr-10 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">%</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-8 py-5 items-start">
                    <div className="md:col-span-4 space-y-0.5">
                      <Label htmlFor="shopeeFoodFeeRate" className="text-sm font-semibold text-foreground">
                        ShopeeFood (%)
                      </Label>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Persentase komisi bagi hasil ShopeeFood.
                      </p>
                    </div>
                    <div className="md:col-span-8">
                      <div className="relative">
                        <Input
                          id="shopeeFoodFeeRate"
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={shopeeFoodFeeRate}
                          onChange={(e) => setShopeeFoodFeeRate(e.target.value)}
                          className="rounded-xl h-11 bg-background/80 hover:bg-background focus:bg-background border-border/80 text-sm pr-10 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">%</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-8 py-5 items-start">
                    <div className="md:col-span-4 space-y-0.5">
                      <Label htmlFor="goFoodFeeRate" className="text-sm font-semibold text-foreground">
                        GoFood (%)
                      </Label>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Persentase komisi bagi hasil GoFood.
                      </p>
                    </div>
                    <div className="md:col-span-8">
                      <div className="relative">
                        <Input
                          id="goFoodFeeRate"
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={goFoodFeeRate}
                          onChange={(e) => setGoFoodFeeRate(e.target.value)}
                          className="rounded-xl h-11 bg-background/80 hover:bg-background focus:bg-background border-border/80 text-sm pr-10 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-5 border-t border-border/60">
                  <Button disabled={isSavingPlatform || !hasPlatformChanges} type="submit" className="min-w-[150px] h-11 rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all cursor-pointer">
                    {isSavingPlatform ? (
                      <><IconLoader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...</>
                    ) : (
                      <><IconDeviceFloppy className="mr-2 h-4 w-4" /> Simpan Potongan</>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </TabsContent>

          {/* TAB 4: INTEGRASI MIDTRANS */}
          {isOwnerOnly && (
            <TabsContent value="payment" className="mt-0 outline-none">
              <div className="bg-card border border-border/70 rounded-2xl p-6 sm:p-8 shadow-xs">
                <form onSubmit={handleSavePayment} className="space-y-6">
                  <div className="pb-5 border-b border-border/60">
                    <h2 className="text-lg font-bold tracking-tight text-foreground">
                      Integrasi Midtrans Snap API
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1">
                      Kredensial payment gateway Midtrans untuk transaksi QRIS dinamis & Virtual Account otomatis.
                    </p>
                  </div>

                  <div className="divide-y divide-border/60">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-8 py-5 items-start">
                      <div className="md:col-span-4 space-y-0.5">
                        <Label htmlFor="midtransEnvironment" className="text-sm font-semibold text-foreground">
                          Environment Mode
                        </Label>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Pilih Sandbox untuk uji coba, atau Production untuk transaksi asli.
                        </p>
                      </div>
                      <div className="md:col-span-8">
                        <select
                          id="midtransEnvironment"
                          value={midtransEnvironment}
                          onChange={(e) => setMidtransEnvironment(e.target.value)}
                          className="w-full h-11 px-3.5 rounded-xl border border-border/80 bg-background/80 hover:bg-background text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        >
                          <option value="sandbox">Sandbox (Mode Percobaan / Demo)</option>
                          <option value="production">Production (Mode Transaksi Asli / Live)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-8 py-5 items-start">
                      <div className="md:col-span-4 space-y-0.5">
                        <Label htmlFor="midtransClientKey" className="text-sm font-semibold text-foreground">
                          Midtrans Client Key
                        </Label>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Kunci publik Midtrans untuk antarmuka Snap.
                        </p>
                      </div>
                      <div className="md:col-span-8">
                        <Input
                          id="midtransClientKey"
                          value={midtransClientKey}
                          onChange={(e) => setMidtransClientKey(e.target.value)}
                          placeholder="SB-Mid-client-..."
                          className="rounded-xl h-11 bg-background/80 hover:bg-background focus:bg-background border-border/80 font-mono text-xs focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-8 py-5 items-start">
                      <div className="md:col-span-4 space-y-0.5">
                        <Label htmlFor="midtransServerKey" className="text-sm font-semibold text-foreground">
                          Midtrans Server Key
                        </Label>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Kunci privat server untuk verifikasi transaksi.
                        </p>
                      </div>
                      <div className="md:col-span-8">
                        <div className="relative">
                          <Input
                            id="midtransServerKey"
                            type={showServerKey ? 'text' : 'password'}
                            value={midtransServerKey}
                            onChange={(e) => setMidtransServerKey(e.target.value)}
                            placeholder="SB-Mid-server-..."
                            className="rounded-xl h-11 bg-background/80 hover:bg-background focus:bg-background border-border/80 font-mono text-xs pr-10 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowServerKey(!showServerKey)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                          >
                            {showServerKey ? <IconEyeOff className="w-4 h-4" /> : <IconEye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-5 border-t border-border/60">
                    <Button disabled={isSavingPayment || !hasPaymentChanges} type="submit" className="min-w-[150px] h-11 rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all cursor-pointer">
                      {isSavingPayment ? (
                        <><IconLoader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...</>
                      ) : (
                        <><IconDeviceFloppy className="mr-2 h-4 w-4" /> Simpan Kredensial</>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </TabsContent>
          )}

          {/* TAB 5: PREFERENSI TAMPILAN */}
          <TabsContent value="bestseller" className="mt-0 outline-none">
            <div className="bg-card border border-border/70 rounded-2xl p-6 sm:p-8 shadow-xs">
              <form onSubmit={handleSaveDisplay} className="space-y-6">
                <div className="pb-5 border-b border-border/60">
                  <h2 className="text-lg font-bold tracking-tight text-foreground">
                    Preferensi Tampilan Katalog POS
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Sesuaikan urutan dan tata letak produk di katalog kasir.
                  </p>
                </div>

                <div className="p-4.5 rounded-2xl border border-border/70 bg-muted/20 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="posPinBestSellers" className="text-sm font-semibold text-foreground">
                      Sematkan Menu Terlaris di Paling Atas
                    </Label>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Tampilkan produk dengan riwayat penjualan tertinggi di deretan pertama katalog kasir.
                    </p>
                  </div>
                  <Switch
                    id="posPinBestSellers"
                    checked={posPinBestSellers}
                    onCheckedChange={setPosPinBestSellers}
                  />
                </div>

                <div className="flex justify-end pt-5 border-t border-border/60">
                  <Button disabled={isSavingDisplay || !hasDisplayChanges} type="submit" className="min-w-[150px] h-11 rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all cursor-pointer">
                    {isSavingDisplay ? (
                      <><IconLoader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...</>
                    ) : (
                      <><IconDeviceFloppy className="mr-2 h-4 w-4" /> Simpan Preferensi</>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </TabsContent>

          {/* TAB 6: PENGATURAN POS */}
          <TabsContent value="pos" className="mt-0 outline-none">
            <PosSettingsForm initialData={catalogSettings || {}} />
          </TabsContent>

          {/* TAB 7: STRUK KASIR & TIKET DAPUR */}
          <TabsContent value="receipt" className="mt-0 outline-none">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* FORM CONTROLS (7 COLS) */}
              <div className="lg:col-span-7">
                <div className="bg-card border border-border/70 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
                  <Tabs defaultValue="customer_receipt" className="w-full">
                    <TabsList className="grid grid-cols-2 w-full mb-6 bg-muted/60 p-1 rounded-xl">
                      <TabsTrigger value="customer_receipt" className="rounded-lg text-xs font-semibold py-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs shadow-none cursor-pointer">
                        <IconReceipt2 className="h-4 w-4 mr-1.5" /> Struk Pelanggan
                      </TabsTrigger>
                      <TabsTrigger value="kitchen_ticket" className="rounded-lg text-xs font-semibold py-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs shadow-none cursor-pointer">
                        <IconChefHat className="h-4 w-4 mr-1.5" /> Tiket Dapur (Slip)
                      </TabsTrigger>
                    </TabsList>

                    {/* SUB-FORM 1: STRUK PELANGGAN */}
                    <TabsContent value="customer_receipt" className="mt-0">
                      <form onSubmit={handleSaveReceipt} className="space-y-6">
                        <div className="divide-y divide-border/60">
                          {/* HEADER TEXT */}
                          <div className="py-4 space-y-1.5">
                            <Label htmlFor="receiptHeader" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                              Header Struk (Alamat & Kontak Outlet)
                            </Label>
                            <Textarea
                              id="receiptHeader"
                              rows={3}
                              value={receiptHeader}
                              onChange={(e) => setReceiptHeader(e.target.value)}
                              placeholder="Jl. Thamrin No. 12, Jakarta Pusat&#10;Telp: 0812-3456-7890"
                              className="rounded-xl bg-background/80 hover:bg-background focus:bg-background border-border/80 font-mono text-xs resize-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all p-3.5"
                            />
                          </div>

                          {/* FOOTER TEXT */}
                          <div className="py-4 space-y-1.5">
                            <Label htmlFor="receiptFooter" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                              Footer Struk (Pesan Penutup)
                            </Label>
                            <Textarea
                              id="receiptFooter"
                              rows={2}
                              value={receiptFooter}
                              onChange={(e) => setReceiptFooter(e.target.value)}
                              placeholder="Terima kasih atas kunjungan Anda!&#10;Follow IG: @outlet_resmi"
                              className="rounded-xl bg-background/80 hover:bg-background focus:bg-background border-border/80 font-mono text-xs resize-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all p-3.5"
                            />
                          </div>

                          {/* WIFI NOTE */}
                          <div className="py-4 space-y-1.5">
                            <Label htmlFor="receiptCustomNote" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                              Catatan Khusus / Info WiFi
                            </Label>
                            <Input
                              id="receiptCustomNote"
                              value={receiptCustomNote}
                              onChange={(e) => setReceiptCustomNote(e.target.value)}
                              placeholder="WiFi: TamuResto / Pass: ngopidulu"
                              className="rounded-xl h-11 bg-background/80 hover:bg-background focus:bg-background border-border/80 text-xs focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all"
                            />
                          </div>

                          {/* TOGGLES LIST */}
                          <div className="py-4 space-y-2">
                            <div className="rounded-2xl border border-border/60 bg-muted/15 divide-y divide-border/40 overflow-hidden">
                              <div className="flex items-center justify-between p-3.5 hover:bg-muted/30 transition-colors">
                                <div className="space-y-0.5">
                                  <Label className="font-semibold text-xs text-foreground">Logo Toko di Header</Label>
                                  <p className="text-[11px] text-muted-foreground">Cetak logo di bagian paling atas struk</p>
                                </div>
                                <Switch checked={receiptShowLogo} onCheckedChange={setReceiptShowLogo} />
                              </div>

                              <div className="flex items-center justify-between p-3.5 hover:bg-muted/30 transition-colors">
                                <div className="space-y-0.5">
                                  <Label className="font-semibold text-xs text-foreground">Nama Kasir</Label>
                                  <p className="text-[11px] text-muted-foreground">Tampilkan nama kasir yang melayani transaksi</p>
                                </div>
                                <Switch checked={receiptShowCashier} onCheckedChange={setReceiptShowCashier} />
                              </div>

                              <div className="flex items-center justify-between p-3.5 hover:bg-muted/30 transition-colors">
                                <div className="space-y-0.5">
                                  <Label className="font-semibold text-xs text-foreground">Nama Pelanggan</Label>
                                  <p className="text-[11px] text-muted-foreground">Tampilkan nama pemesan</p>
                                </div>
                                <Switch checked={receiptShowCustomer} onCheckedChange={setReceiptShowCustomer} />
                              </div>

                              <div className="flex items-center justify-between p-3.5 hover:bg-muted/30 transition-colors">
                                <div className="space-y-0.5">
                                  <Label className="font-semibold text-xs text-foreground">Nomor Meja</Label>
                                  <p className="text-[11px] text-muted-foreground">Tampilkan nomor meja (Dine-In)</p>
                                </div>
                                <Switch checked={receiptShowTable} onCheckedChange={setReceiptShowTable} />
                              </div>

                              <div className="flex items-center justify-between p-3.5 hover:bg-muted/30 transition-colors">
                                <div className="space-y-0.5">
                                  <Label className="font-semibold text-xs text-foreground">Catatan Item & WiFi</Label>
                                  <p className="text-[11px] text-muted-foreground">Cetak baris catatan item dan kotak info WiFi</p>
                                </div>
                                <Switch checked={receiptShowNotes} onCheckedChange={setReceiptShowNotes} />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t border-border/60">
                          <Button disabled={isSavingReceipt || !hasReceiptChanges} type="submit" className="min-w-[150px] h-11 rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all cursor-pointer">
                            {isSavingReceipt ? (
                              <><IconLoader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...</>
                            ) : (
                              <><IconDeviceFloppy className="mr-2 h-4 w-4" /> Simpan Struk</>
                            )}
                          </Button>
                        </div>
                      </form>
                    </TabsContent>

                    {/* SUB-FORM 2: TIKET DAPUR */}
                    <TabsContent value="kitchen_ticket" className="mt-0">
                      <form onSubmit={handleSaveKitchen} className="space-y-6">
                        <div className="divide-y divide-border/60">
                          {/* MASTER TOGGLE */}
                          <div className="py-3">
                            <div className="flex items-center justify-between p-4 border border-primary/20 rounded-2xl bg-primary/5">
                              <div className="space-y-0.5">
                                <Label className="font-bold text-xs text-foreground">
                                  Otomatis Cetak Tiket Dapur Saat Bayar
                                </Label>
                                <p className="text-[11px] text-muted-foreground">
                                  Cetak salinan slip pesanan khusus koki/barista setiap transaksi kasir selesai.
                                </p>
                              </div>
                              <Switch checked={kitchenPrintEnabled} onCheckedChange={setKitchenPrintEnabled} />
                            </div>
                          </div>

                          {/* TITLE */}
                          <div className="py-4 space-y-1.5">
                            <Label htmlFor="kitchenTicketTitle" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                              Judul Tiket Dapur
                            </Label>
                            <Input
                              id="kitchenTicketTitle"
                              value={kitchenTicketTitle}
                              onChange={(e) => setKitchenTicketTitle(e.target.value)}
                              placeholder="TIKET DAPUR / BAR"
                              className="rounded-xl h-11 bg-background/80 hover:bg-background focus:bg-background border-border/80 text-xs font-semibold focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all"
                            />
                          </div>

                          {/* NOTES */}
                          <div className="py-4 space-y-1.5">
                            <Label htmlFor="kitchenTicketNotes" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                              Catatan Kaki Dapur
                            </Label>
                            <Input
                              id="kitchenTicketNotes"
                              value={kitchenTicketNotes}
                              onChange={(e) => setKitchenTicketNotes(e.target.value)}
                              placeholder="Harap periksa kelengkapan pesanan sebelum disajikan"
                              className="rounded-xl h-11 bg-background/80 hover:bg-background focus:bg-background border-border/80 text-xs focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all"
                            />
                          </div>

                          {/* TOGGLES LIST */}
                          <div className="py-4 space-y-2">
                            <div className="rounded-2xl border border-border/60 bg-muted/15 divide-y divide-border/40 overflow-hidden">
                              <div className="flex items-center justify-between p-3.5 hover:bg-muted/30 transition-colors">
                                <div className="space-y-0.5">
                                  <Label className="font-semibold text-xs text-foreground">Nomor Meja & Channel</Label>
                                  <p className="text-[11px] text-muted-foreground">Cetak nomor meja dan tipe order (Dine In / Take Away)</p>
                                </div>
                                <Switch checked={kitchenShowTable} onCheckedChange={setKitchenShowTable} />
                              </div>

                              <div className="flex items-center justify-between p-3.5 hover:bg-muted/30 transition-colors">
                                <div className="space-y-0.5">
                                  <Label className="font-semibold text-xs text-foreground">Nama Pelanggan</Label>
                                  <p className="text-[11px] text-muted-foreground">Tampilkan nama pemesan di tiket dapur</p>
                                </div>
                                <Switch checked={kitchenShowCustomer} onCheckedChange={setKitchenShowCustomer} />
                              </div>

                              <div className="flex items-center justify-between p-3.5 hover:bg-muted/30 transition-colors">
                                <div className="space-y-0.5">
                                  <Label className="font-semibold text-xs text-foreground">Nama Kasir / Staf</Label>
                                  <p className="text-[11px] text-muted-foreground">Tampilkan nama staf pembuat order</p>
                                </div>
                                <Switch checked={kitchenShowCashier} onCheckedChange={setKitchenShowCashier} />
                              </div>

                              <div className="flex items-center justify-between p-3.5 hover:bg-muted/30 transition-colors">
                                <div className="space-y-0.5">
                                  <Label className="font-semibold text-xs text-foreground">Catatan Khusus Pesanan</Label>
                                  <p className="text-[11px] text-muted-foreground">Cetak instruksi memasak (Pedas, Less Ice, Tanpa Bawang, dll)</p>
                                </div>
                                <Switch checked={kitchenShowNotes} onCheckedChange={setKitchenShowNotes} />
                              </div>

                              <div className="flex items-center justify-between p-3.5 hover:bg-muted/30 transition-colors">
                                <div className="space-y-0.5">
                                  <Label className="font-semibold text-xs text-foreground">Pemisah Potong Kertas</Label>
                                  <p className="text-[11px] text-muted-foreground">Cetak garis pemotong jika 1 printer dipakai bersama</p>
                                </div>
                                <Switch checked={kitchenAutoCut} onCheckedChange={setKitchenAutoCut} />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t border-border/60">
                          <Button disabled={isSavingKitchen || !hasKitchenChanges} type="submit" className="min-w-[150px] h-11 rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all cursor-pointer">
                            {isSavingKitchen ? (
                              <><IconLoader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...</>
                            ) : (
                              <><IconDeviceFloppy className="mr-2 h-4 w-4" /> Simpan Tiket Dapur</>
                            )}
                          </Button>
                        </div>
                      </form>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>

              {/* LIVE THERMAL PREVIEW (5 COLS) */}
              <div className="lg:col-span-5">
                <div className="sticky top-6 space-y-3">
                  <div className="flex items-center justify-between bg-muted/60 p-1 rounded-xl border border-border/60">
                    <button
                      type="button"
                      onClick={() => setPreviewTab('customer')}
                      className={cn(
                        "flex-1 text-xs font-semibold py-2 px-3 rounded-lg transition-all cursor-pointer",
                        previewTab === 'customer'
                          ? "bg-background shadow-xs text-foreground font-bold"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Preview Struk Kasir
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewTab('kitchen')}
                      className={cn(
                        "flex-1 text-xs font-semibold py-2 px-3 rounded-lg transition-all cursor-pointer",
                        previewTab === 'kitchen'
                          ? "bg-background shadow-xs text-foreground font-bold"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Preview Tiket Dapur
                    </button>
                  </div>

                  {/* PREVIEW STRUK */}
                  {previewTab === 'customer' && (
                    <div className="bg-white p-6 sm:p-7 rounded-2xl shadow-md border border-border/80 font-mono text-xs leading-relaxed text-zinc-900 select-none">
                      <div className="text-center space-y-1 pb-3 border-b border-dashed border-zinc-300">
                        {receiptShowLogo && (
                          <div className="flex justify-center mb-2">
                            {(receiptLogoUrl || storeLogoUrl) ? (
                              <img 
                                src={receiptLogoUrl || storeLogoUrl || ''} 
                                alt="Logo" 
                                className="h-10 w-10 object-contain rounded-full border border-zinc-200" 
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-xs tracking-wider">
                                {storeName?.slice(0, 2)?.toUpperCase() || 'MN'}
                              </div>
                            )}
                          </div>
                        )}
                        <div className="font-bold text-sm tracking-wider uppercase">
                          {storeName || 'NAMA OUTLET'}
                        </div>
                        {receiptHeader ? (
                          <div className="text-[11px] text-zinc-600 whitespace-pre-line leading-normal">
                            {receiptHeader}
                          </div>
                        ) : (
                          <div className="text-[11px] text-zinc-400 italic">
                            (Alamat outlet belum diatur)
                          </div>
                        )}
                      </div>

                      <div className="py-2.5 text-[11px] border-b border-dashed border-zinc-300 space-y-1">
                        <div className="flex justify-between">
                          <span className="text-zinc-500">WAKTU</span>
                          <span>{new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })} 14:30</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">NO. STRUK</span>
                          <span className="font-bold">#TRX-8921</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">CHANNEL</span>
                          <span>DINE_IN</span>
                        </div>
                        {receiptShowCashier && (
                          <div className="flex justify-between">
                            <span className="text-zinc-500">KASIR</span>
                            <span>Sarah</span>
                          </div>
                        )}
                        {receiptShowCustomer && (
                          <div className="flex justify-between">
                            <span className="text-zinc-500">PELANGGAN</span>
                            <span>Bpk. Hendra</span>
                          </div>
                        )}
                        {receiptShowTable && (
                          <div className="flex justify-between">
                            <span className="text-zinc-500">MEJA</span>
                            <span className="font-bold">NO. 05</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-zinc-500">METODE</span>
                          <span>QRIS</span>
                        </div>
                      </div>

                      <div className="py-3 border-b border-dashed border-zinc-300 space-y-2">
                        <div>
                          <div className="flex justify-between font-bold text-[11px]">
                            <span>Nasi Goreng Spesial</span>
                          </div>
                          <div className="flex justify-between text-[11px] text-zinc-700">
                            <span>1 x 35.000</span>
                            <span>35.000</span>
                          </div>
                          {receiptShowNotes && (
                            <div className="text-[10px] text-zinc-500 pl-2">
                              - Pedas Level 2, Telur Dadar
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="flex justify-between font-bold text-[11px]">
                            <span>Es Teh Manis</span>
                          </div>
                          <div className="flex justify-between text-[11px] text-zinc-700">
                            <span>2 x 8.000</span>
                            <span>16.000</span>
                          </div>
                          {receiptShowNotes && (
                            <div className="text-[10px] text-zinc-500 pl-2">
                              - Less Sugar, Less Ice
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="py-2.5 text-[11px] space-y-1 border-b border-dashed border-zinc-300 text-zinc-700">
                        <div className="flex justify-between">
                          <span>Subtotal</span>
                          <span>51.000</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{taxName}</span>
                          <span>5.100</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Layanan</span>
                          <span>2.500</span>
                        </div>
                      </div>

                      <div className="py-2.5 border-b border-zinc-900">
                        <div className="flex justify-between font-bold text-sm text-zinc-900">
                          <span>TOTAL</span>
                          <span>Rp 58.600</span>
                        </div>
                      </div>

                      {receiptShowNotes && receiptCustomNote && (
                        <div className="my-3 p-2.5 border border-zinc-300 rounded-xl text-center text-[10px] text-zinc-700 bg-zinc-50/50">
                          {receiptCustomNote}
                        </div>
                      )}

                      <div className="text-center pt-3 space-y-1">
                        {receiptFooter ? (
                          <div className="text-[10px] text-zinc-600 whitespace-pre-line leading-relaxed">
                            {receiptFooter}
                          </div>
                        ) : (
                          <div className="text-[10px] font-bold tracking-wider text-zinc-700">TERIMA KASIH</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* PREVIEW TIKET DAPUR */}
                  {previewTab === 'kitchen' && (
                    <div className="bg-white p-6 sm:p-7 rounded-2xl shadow-md border border-border/80 font-mono text-xs leading-relaxed text-zinc-900 select-none">
                      <div className="text-center space-y-1 pb-3 border-b border-zinc-900">
                        <div className="font-bold text-sm tracking-wider uppercase">
                          {kitchenTicketTitle || 'TIKET DAPUR'}
                        </div>
                        <div className="text-[10px] text-zinc-500">
                          {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })} 14:30:22
                        </div>
                      </div>

                      <div className="py-2.5 border-b border-dashed border-zinc-300 space-y-1 text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-zinc-500">CHANNEL</span>
                          <span className="font-bold">DINE_IN</span>
                        </div>
                        {kitchenShowTable && (
                          <div className="flex justify-between text-sm font-bold pt-0.5">
                            <span>MEJA</span>
                            <span>NO. 05</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-zinc-500">NO. ORDER</span>
                          <span className="font-bold">#TRX-8921</span>
                        </div>
                        {kitchenShowCustomer && (
                          <div className="flex justify-between">
                            <span className="text-zinc-500">PELANGGAN</span>
                            <span>Bpk. Hendra</span>
                          </div>
                        )}
                        {kitchenShowCashier && (
                          <div className="flex justify-between">
                            <span className="text-zinc-500">KASIR</span>
                            <span>Sarah</span>
                          </div>
                        )}
                      </div>

                      <div className="py-3 border-b border-dashed border-zinc-300 space-y-2.5">
                        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                          Pesanan Masak:
                        </div>
                        <div className="space-y-0.5 pb-1.5 border-b border-zinc-100">
                          <div className="flex justify-between items-baseline font-bold text-[11px]">
                            <span>Nasi Goreng Spesial</span>
                            <span>x1</span>
                          </div>
                          {kitchenShowNotes && (
                            <div className="text-[10px] text-zinc-700 pl-2 font-normal">
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
                            <div className="text-[10px] text-zinc-700 pl-2 font-normal">
                              * Catatan: Less Sugar, Less Ice
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="py-2.5 flex justify-between font-bold text-[11px] border-b border-zinc-900">
                        <span>TOTAL ITEM</span>
                        <span>3 Pcs</span>
                      </div>

                      {kitchenTicketNotes && (
                        <div className="mt-3 p-2.5 border border-zinc-300 rounded-xl text-center text-[10px] text-zinc-700 bg-zinc-50/50">
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
