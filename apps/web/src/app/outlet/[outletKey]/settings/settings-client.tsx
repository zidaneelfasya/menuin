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
  activateDokuSubAccount,
  updateReceiptSettings,
  updateKitchenTicketSettings
} from '@/lib/actions/settings';
import { uploadImageToSupabase } from '@/lib/actions/storage';
import { PosSettingsForm } from './pos-settings-form';
import { cn } from '@/lib/utils';
import { usePageTransition } from '@/components/providers/page-transition-provider';
import { ColorPicker } from '@/components/ui/color-picker';
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

  React.useEffect(() => {
    const handleCustomTab = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        setActiveTab(customEvent.detail);
      }
    };
    window.addEventListener('menuin:settings-tab', handleCustomTab);
    return () => window.removeEventListener('menuin:settings-tab', handleCustomTab);
  }, []);

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `${pathname}?tab=${val}`);
      window.dispatchEvent(new CustomEvent('menuin:settings-tab', { detail: val }));
    }
  };

  const [isSavingTax, setIsSavingTax] = React.useState(false);
  const [isSavingPlatform, setIsSavingPlatform] = React.useState(false);
  const [isSavingDisplay, setIsSavingDisplay] = React.useState(false);
  const [isSavingStore, setIsSavingStore] = React.useState(false);
  const [isSavingPayment, setIsSavingPayment] = React.useState(false);
  const [isSavingReceipt, setIsSavingReceipt] = React.useState(false);
  const [isSavingKitchen, setIsSavingKitchen] = React.useState(false);

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

  const paymentGateway = tenant?.paymentGateway as
    | {
        platformConfigured: boolean;
        environment: 'sandbox' | 'production' | null;
        subAccountRequired: boolean;
        subAccountId: string | null;
        subAccountStatus: string | null;
      }
    | undefined;

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
    fd.append('storeLogoUrl', storeLogoUrl || '');
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

  const handleActivatePayment = async () => {
    setIsSavingPayment(true);
    const res = await activateDokuSubAccount();
    setIsSavingPayment(false);
    if (res.success) {
      toast.success('Akun pembayaran online berhasil diaktifkan');
      router.refresh();
    } else {
      toast.error(res.error || 'Gagal mengaktifkan akun pembayaran');
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
            <div className="bg-white border-none rounded-2xl p-6 sm:p-8 shadow-sm-md hover:shadow-md transition-all">
              <form onSubmit={handleSaveStore} className="space-y-6">
                <div className="flex items-center gap-3.5 pb-5 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-[#0e59f9] text-white flex items-center justify-center shrink-0">
                    <IconBuildingStore className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                      Profil & Identitas Toko
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Atur nama toko, tautan publik katalog digital, logo, dan tema warna utama.
                    </p>
                  </div>
                </div>

                <div className="divide-y divide-slate-100">
                  {/* ROW 1: LOGO OUTLET */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-8 py-5 items-start">
                    <div className="md:col-span-4 space-y-0.5">
                      <Label className="text-sm font-semibold text-slate-900">
                        Logo Outlet
                      </Label>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Tampil di header aplikasi, katalog digital, dan struk kasir.
                      </p>
                    </div>
                    <div className="md:col-span-8">
                      <div className="flex items-center gap-4">
                        <div className="relative w-18 h-18 rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 flex items-center justify-center shrink-0 shadow-sm-md">
                          {storeLogoUrl ? (
                            <img
                              src={storeLogoUrl}
                              alt="Logo Toko"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-slate-400 text-lg font-semibold">
                              {storeName ? storeName.slice(0, 2).toUpperCase() : 'MN'}
                            </span>
                          )}
                          {isUploadingLogo && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-xs">
                              <IconLoader2 className="w-5 h-5 text-white animate-spin" />
                            </div>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => logoInputRef.current?.click()}
                              disabled={isUploadingLogo}
                              className="h-9 px-4 text-xs font-semibold rounded-full border-none bg-white shadow-sm-md hover:bg-slate-100 text-slate-700 transition-all cursor-pointer"
                            >
                              <IconUpload className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                              {isUploadingLogo ? 'Mengunggah...' : 'Upload Logo'}
                            </Button>
                            {storeLogoUrl && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setStoreLogoUrl(null)}
                                disabled={isUploadingLogo}
                                className="h-9 px-4 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-full transition-all cursor-pointer border-none"
                              >
                                <IconTrash className="w-3.5 h-3.5 mr-1.5" />
                                Hapus
                              </Button>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400">
                            Format PNG, JPG, WebP. Rasio 1:1, maks 5MB.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ROW 2: BANNER / COVER OUTLET */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-8 py-5 items-start">
                    <div className="md:col-span-4 space-y-0.5">
                      <Label className="text-sm font-semibold text-slate-900">
                        Banner Sampul
                      </Label>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Banner utama yang tampil pada header katalog digital toko Anda.
                      </p>
                    </div>
                    <div className="md:col-span-8 space-y-3">
                      {storeBannerUrl ? (
                        <div className="relative rounded-2xl overflow-hidden border-none shadow-sm-md aspect-[3/1] max-w-md bg-slate-50">
                          <img
                            src={storeBannerUrl}
                            alt="Banner Toko"
                            className="w-full h-full object-cover"
                          />
                          {isUploadingBanner && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-xs">
                              <IconLoader2 className="w-5 h-5 text-white animate-spin" />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-slate-200 p-4 max-w-md bg-slate-50/50 text-center">
                          <p className="text-xs text-slate-400">Belum ada banner sampul</p>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => bannerInputRef.current?.click()}
                          disabled={isUploadingBanner}
                          className="h-9 px-4 text-xs font-semibold rounded-full border-none bg-white shadow-sm-md hover:bg-slate-100 text-slate-700 transition-all cursor-pointer"
                        >
                          <IconCamera className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                          {isUploadingBanner ? 'Mengunggah...' : storeBannerUrl ? 'Ganti Banner' : 'Upload Banner'}
                        </Button>
                        {storeBannerUrl && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setStoreBannerUrl(null)}
                            disabled={isUploadingBanner}
                            className="h-9 px-4 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-full transition-all cursor-pointer border-none"
                          >
                            <IconTrash className="w-3.5 h-3.5 mr-1.5" />
                            Hapus
                          </Button>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Format landscape disarankan (rasio 3:1), maks 5MB.
                      </p>
                    </div>
                  </div>

                  {/* ROW 3: NAMA TOKO */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-8 py-5 items-start">
                    <div className="md:col-span-4 space-y-0.5">
                      <Label htmlFor="storeName" className="text-sm font-semibold text-slate-900">
                        Nama Toko
                      </Label>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Nama resmi toko atau outlet Anda.
                      </p>
                    </div>
                    <div className="md:col-span-8">
                      <Input
                        id="storeName"
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        placeholder="Contoh: Kopi Titik Temu"
                        className="rounded-full h-10 px-4 bg-slate-50 border-none shadow-sm-md text-xs sm:text-sm font-medium focus-visible:ring-2 focus-visible:ring-[#0e59f9] focus:outline-none transition-all text-slate-800 placeholder:text-slate-400"
                        required
                      />
                    </div>
                  </div>

                  {/* ROW 4: USERNAME / SLUG */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-8 py-5 items-start">
                    <div className="md:col-span-4 space-y-0.5">
                      <Label htmlFor="storeSlug" className="text-sm font-semibold text-slate-900">
                        Username / Slug Toko
                      </Label>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        URL publik katalog online toko Anda.
                      </p>
                    </div>
                    <div className="md:col-span-8">
                      <div className="flex items-center rounded-full bg-slate-50 shadow-sm-md border-none overflow-hidden focus-within:ring-2 focus-within:ring-[#0e59f9] transition-all">
                        <div className="px-4 py-2.5 bg-slate-100/80 border-r border-slate-200 text-xs font-mono text-slate-500 font-medium select-none rounded-l-full">
                          menuin.id/store/
                        </div>
                        <Input
                          id="storeSlug"
                          value={storeSlug}
                          onChange={(e) => setStoreSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                          placeholder="kopi-titik-temu"
                          className="border-0 rounded-none h-10 bg-transparent text-xs sm:text-sm font-mono focus-visible:ring-0 focus-visible:ring-offset-0 px-3.5 focus:outline-none"
                        />
                        <div className="mr-3 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                          <IconCheck className="w-3 h-3 stroke-[2.5]" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ROW 5: DESKRIPSI TOKO */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-8 py-5 items-start">
                    <div className="md:col-span-4 space-y-0.5">
                      <Label htmlFor="storeDescription" className="text-sm font-semibold text-slate-900">
                        Deskripsi Toko
                      </Label>
                      <p className="text-xs text-slate-500 leading-relaxed">
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
                        className="rounded-2xl bg-slate-50 border-none shadow-md text-xs sm:text-sm font-normal resize-none focus-visible:ring-2 focus-visible:ring-[#0e59f9] focus:outline-none transition-all p-4 text-slate-800 placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  {/* ROW 6: WARNA TEMA / BRANDING */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-8 py-5 items-start">
                    <div className="md:col-span-4 space-y-0.5">
                      <Label className="text-sm font-semibold text-slate-900">
                        Warna Tema Utama
                      </Label>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Warna aksen utama tema dan katalog toko.
                      </p>
                    </div>
                    <div className="md:col-span-8">
                      <ColorPicker
                        value={primaryColor}
                        onChange={setPrimaryColor}
                      />
                    </div>
                  </div>

                  {/* ROW 7: FORMAT KODE PESANAN (ORDER PREFIX) */}
                  <div className="py-5">
                    <OrderPrefixPicker
                      value={orderPrefix}
                      onChange={setOrderPrefix}
                      outletName={storeName}
                    />
                  </div>
                </div>

                {/* SAVE ACTION BAR */}
                <div className="flex items-center justify-end pt-5 border-t border-slate-100">
                  <Button
                    disabled={isSavingStore || !hasStoreChanges}
                    type="submit"
                    className="min-w-[150px] h-10 px-5 rounded-full text-xs font-semibold bg-[#0e59f9] hover:bg-[#0b4de0] text-white shadow-md transition-all cursor-pointer border-none"
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
            <div className="bg-white border-none rounded-2xl p-6 sm:p-8 shadow-sm-md hover:shadow-md transition-all">
              <form onSubmit={handleSaveTax} className="space-y-6">
                <div className="flex items-center gap-3.5 pb-5 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-[#0e59f9] text-white flex items-center justify-center shrink-0">
                    <IconReceipt className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                      Pajak Restoran & Biaya Layanan
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Atur persentase pajak PB1 dan service charge yang otomatis dihitung pada pesanan kasir POS.
                    </p>
                  </div>
                </div>

                <div className="divide-y divide-slate-100">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-8 py-5 items-start">
                    <div className="md:col-span-4 space-y-0.5">
                      <Label htmlFor="taxName" className="text-sm font-semibold text-slate-900">
                        Nama Label Pajak
                      </Label>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Label yang tercetak pada struk kasir pelanggan.
                      </p>
                    </div>
                    <div className="md:col-span-8">
                      <Input
                        id="taxName"
                        value={taxName}
                        onChange={(e) => setTaxName(e.target.value)}
                        placeholder="Contoh: Pajak Restoran (PB1)"
                        className="rounded-full h-10 px-4 bg-slate-50 border-none shadow-sm-md text-xs sm:text-sm font-medium focus-visible:ring-2 focus-visible:ring-[#0e59f9] focus:outline-none transition-all text-slate-800 placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-8 py-5 items-start">
                    <div className="md:col-span-4 space-y-0.5">
                      <Label htmlFor="posTaxRate" className="text-sm font-semibold text-slate-900">
                        Tarif Pajak POS (%)
                      </Label>
                      <p className="text-xs text-slate-500 leading-relaxed">
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
                          className="rounded-full h-10 px-4 bg-slate-50 border-none shadow-sm-md text-xs sm:text-sm font-medium pr-10 focus-visible:ring-2 focus-visible:ring-[#0e59f9] focus:outline-none transition-all text-slate-800 placeholder:text-slate-400"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">%</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-8 py-5 items-start">
                    <div className="md:col-span-4 space-y-0.5">
                      <Label htmlFor="serviceChargeRate" className="text-sm font-semibold text-slate-900">
                        Biaya Layanan (%)
                      </Label>
                      <p className="text-xs text-slate-500 leading-relaxed">
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
                          className="rounded-full h-10 px-4 bg-slate-50 border-none shadow-sm-md text-xs sm:text-sm font-medium pr-10 focus-visible:ring-2 focus-visible:ring-[#0e59f9] focus:outline-none transition-all text-slate-800 placeholder:text-slate-400"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-5 border-t border-slate-100">
                  <Button disabled={isSavingTax || !hasTaxChanges} type="submit" className="min-w-[150px] h-10 px-5 rounded-full text-xs font-semibold bg-[#0e59f9] hover:bg-[#0b4de0] text-white shadow-md transition-all cursor-pointer border-none">
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
            <div className="bg-white border-none rounded-2xl p-6 sm:p-8 shadow-sm-md hover:shadow-md transition-all">
              <form onSubmit={handleSavePlatformFees} className="space-y-6">
                <div className="flex items-center gap-3.5 pb-5 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-[#0e59f9] text-white flex items-center justify-center shrink-0">
                    <IconMoped className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                      Potongan Komisi Online Food
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Potongan komisi mitra pesan-antar makanan untuk kalkulasi estimasi pendapatan bersih.
                    </p>
                  </div>
                </div>

                <div className="divide-y divide-slate-100">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-8 py-5 items-start">
                    <div className="md:col-span-4 space-y-0.5">
                      <Label htmlFor="grabFoodFeeRate" className="text-sm font-semibold text-slate-900">
                        GrabFood (%)
                      </Label>
                      <p className="text-xs text-slate-500 leading-relaxed">
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
                          className="rounded-full h-10 px-4 bg-slate-50 border-none shadow-sm-md text-xs sm:text-sm font-medium pr-10 focus-visible:ring-2 focus-visible:ring-[#0e59f9] focus:outline-none transition-all text-slate-800 placeholder:text-slate-400"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">%</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-8 py-5 items-start">
                    <div className="md:col-span-4 space-y-0.5">
                      <Label htmlFor="shopeeFoodFeeRate" className="text-sm font-semibold text-slate-900">
                        ShopeeFood (%)
                      </Label>
                      <p className="text-xs text-slate-500 leading-relaxed">
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
                          className="rounded-full h-10 px-4 bg-slate-50 border-none shadow-sm-md text-xs sm:text-sm font-medium pr-10 focus-visible:ring-2 focus-visible:ring-[#0e59f9] focus:outline-none transition-all text-slate-800 placeholder:text-slate-400"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">%</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-8 py-5 items-start">
                    <div className="md:col-span-4 space-y-0.5">
                      <Label htmlFor="goFoodFeeRate" className="text-sm font-semibold text-slate-900">
                        GoFood (%)
                      </Label>
                      <p className="text-xs text-slate-500 leading-relaxed">
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
                          className="rounded-full h-10 px-4 bg-slate-50 border-none shadow-sm-md text-xs sm:text-sm font-medium pr-10 focus-visible:ring-2 focus-visible:ring-[#0e59f9] focus:outline-none transition-all text-slate-800 placeholder:text-slate-400"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-5 border-t border-slate-100">
                  <Button disabled={isSavingPlatform || !hasPlatformChanges} type="submit" className="min-w-[150px] h-10 px-5 rounded-full text-xs font-semibold bg-[#0e59f9] hover:bg-[#0b4de0] text-white shadow-md transition-all cursor-pointer border-none">
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

          {/* TAB 4: PEMBAYARAN ONLINE (DOKU) */}
          {isOwnerOnly && (
            <TabsContent value="payment" className="mt-0 outline-none">
              <div className="bg-white border-none rounded-2xl p-6 sm:p-8 shadow-sm-md hover:shadow-md transition-all space-y-6">
                <div className="flex items-center gap-3.5 pb-5 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-[#0e59f9] text-white flex items-center justify-center shrink-0">
                    <IconCreditCard className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                          Pembayaran Online (DOKU)
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Terima QRIS, Virtual Account, e-wallet, dan kartu dari pesanan online.
                        </p>
                      </div>
                      {paymentGateway?.environment === 'sandbox' && (
                        <span className="shrink-0 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border-none">
                          Mode Uji Coba
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {!paymentGateway?.platformConfigured ? (
                  <p className="text-sm text-slate-500">
                    Payment gateway belum dikonfigurasi di platform. Hubungi tim Menuin.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-8 py-5 items-start">
                      <div className="md:col-span-4 space-y-0.5">
                        <Label className="text-sm font-semibold text-slate-900">Akun Pembayaran Outlet</Label>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Sub Account DOKU tempat dana pesanan online outlet ini diterima.
                        </p>
                      </div>
                      <div className="md:col-span-8 space-y-3">
                        {paymentGateway.subAccountId ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs px-2.5 py-1.5 rounded-xl bg-slate-100 text-slate-800">
                              {paymentGateway.subAccountId}
                            </span>
                            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border-none">
                              {paymentGateway.subAccountStatus || 'ACTIVE'}
                            </span>
                          </div>
                        ) : (
                          <>
                            <p className="text-xs text-slate-500 leading-relaxed">
                              {paymentGateway.subAccountRequired
                                ? 'Belum aktif. Aktifkan agar pelanggan bisa membayar online.'
                                : 'Belum aktif. Selama mode uji coba, pembayaran tetap bisa dites tanpa akun outlet.'}
                              {paymentGateway.subAccountStatus === 'FAILED' && ' Percobaan terakhir gagal, silakan coba lagi.'}
                            </p>
                            <Button
                              type="button"
                              onClick={handleActivatePayment}
                              disabled={isSavingPayment}
                              className="min-w-[180px] h-10 px-5 rounded-full text-xs font-semibold bg-[#0e59f9] hover:bg-[#0b4de0] text-white shadow-md transition-all cursor-pointer border-none"
                            >
                              {isSavingPayment ? (
                                <><IconLoader2 className="mr-2 h-4 w-4 animate-spin" /> Mengaktifkan...</>
                              ) : (
                                <><IconCreditCard className="mr-2 h-4 w-4" /> Aktifkan Akun Pembayaran</>
                              )}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <p className="text-xs text-slate-400 pt-5 border-t border-slate-100">
                  Pembayaran online untuk pelanggan dinyalakan/dimatikan di menu Katalog → Pemesanan.
                </p>
              </div>
            </TabsContent>
          )}

          {/* TAB 5: PREFERENSI TAMPILAN */}
          <TabsContent value="bestseller" className="mt-0 outline-none">
            <div className="bg-white border-none rounded-2xl p-6 sm:p-8 shadow-sm-md hover:shadow-md transition-all">
              <form onSubmit={handleSaveDisplay} className="space-y-6">
                <div className="flex items-center gap-3.5 pb-5 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-[#0e59f9] text-white flex items-center justify-center shrink-0">
                    <IconAdjustmentsHorizontal className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                      Preferensi Tampilan Katalog POS
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Sesuaikan urutan dan tata letak produk di katalog kasir.
                    </p>
                  </div>
                </div>

                <div className="p-4.5 rounded-2xl border-none bg-slate-50/80 shadow-sm-md flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="posPinBestSellers" className="text-sm font-semibold text-slate-900">
                      Sematkan Menu Terlaris di Paling Atas
                    </Label>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Tampilkan produk dengan riwayat penjualan tertinggi di deretan pertama katalog kasir.
                    </p>
                  </div>
                  <Switch
                    id="posPinBestSellers"
                    checked={posPinBestSellers}
                    onCheckedChange={setPosPinBestSellers}
                  />
                </div>

                <div className="flex justify-end pt-5 border-t border-slate-100">
                  <Button disabled={isSavingDisplay || !hasDisplayChanges} type="submit" className="min-w-[150px] h-10 px-5 rounded-full text-xs font-semibold bg-[#0e59f9] hover:bg-[#0b4de0] text-white shadow-md transition-all cursor-pointer border-none">
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
                <div className="bg-white border-none rounded-2xl p-6 sm:p-8 shadow-sm-md hover:shadow-md transition-all space-y-6">
                  <div className="flex items-center gap-3.5 pb-5 border-b border-slate-100">
                    <div className="w-10 h-10 rounded-full bg-[#0e59f9] text-white flex items-center justify-center shrink-0">
                      <IconPrinter className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                        Struk Kasir & Tiket Dapur
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Kustomisasi header, footer, dan format cetak struk kasir serta slip order dapur.
                      </p>
                    </div>
                  </div>

                  <Tabs defaultValue="customer_receipt" className="w-full">
                    <TabsList className="grid grid-cols-2 w-full mb-6 bg-slate-100 p-1 rounded-full h-auto">
                      <TabsTrigger 
                        value="customer_receipt" 
                        className="rounded-full text-xs font-semibold py-2 transition-all cursor-pointer text-slate-500 data-[state=active]:bg-[#0e59f9] data-[state=active]:text-white data-[state=active]:shadow-sm-md shadow-none"
                      >
                        <IconReceipt2 className="h-4 w-4 mr-1.5" /> Struk Pelanggan
                      </TabsTrigger>
                      <TabsTrigger 
                        value="kitchen_ticket" 
                        className="rounded-full text-xs font-semibold py-2 transition-all cursor-pointer text-slate-500 data-[state=active]:bg-[#0e59f9] data-[state=active]:text-white data-[state=active]:shadow-sm-md shadow-none"
                      >
                        <IconChefHat className="h-4 w-4 mr-1.5" /> Tiket Dapur (Slip)
                      </TabsTrigger>
                    </TabsList>

                    {/* SUB-FORM 1: STRUK PELANGGAN */}
                    <TabsContent value="customer_receipt" className="mt-0">
                      <form onSubmit={handleSaveReceipt} className="space-y-6">
                        <div className="divide-y divide-slate-100">
                          {/* HEADER TEXT */}
                          <div className="py-4 space-y-1.5">
                            <Label htmlFor="receiptHeader" className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                              Header Struk (Alamat & Kontak Outlet)
                            </Label>
                            <Textarea
                              id="receiptHeader"
                              rows={3}
                              value={receiptHeader}
                              onChange={(e) => setReceiptHeader(e.target.value)}
                              placeholder="Jl. Thamrin No. 12, Jakarta Pusat&#10;Telp: 0812-3456-7890"
                              className="rounded-2xl bg-slate-50 border-none shadow-md font-mono text-xs resize-none focus-visible:ring-2 focus-visible:ring-[#0e59f9] focus:outline-none transition-all p-3.5 text-slate-800 placeholder:text-slate-400"
                            />
                          </div>

                          {/* FOOTER TEXT */}
                          <div className="py-4 space-y-1.5">
                            <Label htmlFor="receiptFooter" className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                              Footer Struk (Pesan Penutup)
                            </Label>
                            <Textarea
                              id="receiptFooter"
                              rows={2}
                              value={receiptFooter}
                              onChange={(e) => setReceiptFooter(e.target.value)}
                              placeholder="Terima kasih atas kunjungan Anda!&#10;Follow IG: @outlet_resmi"
                              className="rounded-2xl bg-slate-50 border-none shadow-md font-mono text-xs resize-none focus-visible:ring-2 focus-visible:ring-[#0e59f9] focus:outline-none transition-all p-3.5 text-slate-800 placeholder:text-slate-400"
                            />
                          </div>

                          {/* WIFI NOTE */}
                          <div className="py-4 space-y-1.5">
                            <Label htmlFor="receiptCustomNote" className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                              Catatan Khusus / Info WiFi
                            </Label>
                            <Input
                              id="receiptCustomNote"
                              value={receiptCustomNote}
                              onChange={(e) => setReceiptCustomNote(e.target.value)}
                              placeholder="WiFi: TamuResto / Pass: ngopidulu"
                              className="rounded-full h-10 px-4 bg-slate-50 border-none shadow-sm-md text-xs sm:text-sm font-medium focus-visible:ring-2 focus-visible:ring-[#0e59f9] focus:outline-none transition-all text-slate-800 placeholder:text-slate-400"
                            />
                          </div>

                          {/* TOGGLES LIST */}
                          <div className="py-4 space-y-2">
                            <div className="rounded-2xl border-none bg-slate-50/80 shadow-sm-md divide-y divide-slate-100 overflow-hidden">
                              <div className="flex items-center justify-between p-3.5 hover:bg-slate-100/50 transition-colors">
                                <div className="space-y-0.5">
                                  <Label className="font-semibold text-xs text-slate-900">Logo Toko di Header</Label>
                                  <p className="text-[11px] text-slate-500">Cetak logo di bagian paling atas struk</p>
                                </div>
                                <Switch checked={receiptShowLogo} onCheckedChange={setReceiptShowLogo} />
                              </div>

                              <div className="flex items-center justify-between p-3.5 hover:bg-slate-100/50 transition-colors">
                                <div className="space-y-0.5">
                                  <Label className="font-semibold text-xs text-slate-900">Nama Kasir</Label>
                                  <p className="text-[11px] text-slate-500">Tampilkan nama kasir yang melayani transaksi</p>
                                </div>
                                <Switch checked={receiptShowCashier} onCheckedChange={setReceiptShowCashier} />
                              </div>

                              <div className="flex items-center justify-between p-3.5 hover:bg-slate-100/50 transition-colors">
                                <div className="space-y-0.5">
                                  <Label className="font-semibold text-xs text-slate-900">Nama Pelanggan</Label>
                                  <p className="text-[11px] text-slate-500">Tampilkan nama pemesan</p>
                                </div>
                                <Switch checked={receiptShowCustomer} onCheckedChange={setReceiptShowCustomer} />
                              </div>

                              <div className="flex items-center justify-between p-3.5 hover:bg-slate-100/50 transition-colors">
                                <div className="space-y-0.5">
                                  <Label className="font-semibold text-xs text-slate-900">Nomor Meja</Label>
                                  <p className="text-[11px] text-slate-500">Tampilkan nomor meja (Dine-In)</p>
                                </div>
                                <Switch checked={receiptShowTable} onCheckedChange={setReceiptShowTable} />
                              </div>

                              <div className="flex items-center justify-between p-3.5 hover:bg-slate-100/50 transition-colors">
                                <div className="space-y-0.5">
                                  <Label className="font-semibold text-xs text-slate-900">Catatan Item & WiFi</Label>
                                  <p className="text-[11px] text-slate-500">Cetak baris catatan item dan kotak info WiFi</p>
                                </div>
                                <Switch checked={receiptShowNotes} onCheckedChange={setReceiptShowNotes} />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t border-slate-100">
                          <Button disabled={isSavingReceipt || !hasReceiptChanges} type="submit" className="min-w-[150px] h-10 px-5 rounded-full text-xs font-semibold bg-[#0e59f9] hover:bg-[#0b4de0] text-white shadow-md transition-all cursor-pointer border-none">
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
                        <div className="divide-y divide-slate-100">
                          {/* MASTER TOGGLE */}
                          <div className="py-3">
                            <div className="flex items-center justify-between p-4 border-none shadow-sm-md rounded-2xl bg-blue-50/70">
                              <div className="space-y-0.5">
                                <Label className="font-semibold text-xs text-slate-900">
                                  Otomatis Cetak Tiket Dapur Bersama Struk
                                </Label>
                                <p className="text-[11px] text-slate-500">
                                  Jika aktif, setiap mencetak struk (di kasir atau modal pesanan) akan otomatis mencetak struk pelanggan dan tiket dapur sekaligus dalam sekali proses print.
                                </p>
                              </div>
                              <Switch checked={kitchenPrintEnabled} onCheckedChange={setKitchenPrintEnabled} />
                            </div>
                          </div>

                          {/* TITLE */}
                          <div className="py-4 space-y-1.5">
                            <Label htmlFor="kitchenTicketTitle" className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                              Judul Tiket Dapur
                            </Label>
                            <Input
                              id="kitchenTicketTitle"
                              value={kitchenTicketTitle}
                              onChange={(e) => setKitchenTicketTitle(e.target.value)}
                              placeholder="TIKET DAPUR / BAR"
                              className="rounded-full h-10 px-4 bg-slate-50 border-none shadow-sm-md text-xs font-semibold focus-visible:ring-2 focus-visible:ring-[#0e59f9] focus:outline-none transition-all text-slate-800 placeholder:text-slate-400"
                            />
                          </div>

                          {/* NOTES */}
                          <div className="py-4 space-y-1.5">
                            <Label htmlFor="kitchenTicketNotes" className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                              Catatan Kaki Dapur
                            </Label>
                            <Input
                              id="kitchenTicketNotes"
                              value={kitchenTicketNotes}
                              onChange={(e) => setKitchenTicketNotes(e.target.value)}
                              placeholder="Harap periksa kelengkapan pesanan sebelum disajikan"
                              className="rounded-full h-10 px-4 bg-slate-50 border-none shadow-sm-md text-xs sm:text-sm font-medium focus-visible:ring-2 focus-visible:ring-[#0e59f9] focus:outline-none transition-all text-slate-800 placeholder:text-slate-400"
                            />
                          </div>

                          {/* TOGGLES LIST */}
                          <div className="py-4 space-y-2">
                            <div className="rounded-2xl border-none bg-slate-50/80 shadow-sm-md divide-y divide-slate-100 overflow-hidden">
                              <div className="flex items-center justify-between p-3.5 hover:bg-slate-100/50 transition-colors">
                                <div className="space-y-0.5">
                                  <Label className="font-semibold text-xs text-slate-900">Nomor Meja & Channel</Label>
                                  <p className="text-[11px] text-slate-500">Cetak nomor meja dan tipe order (Dine In / Take Away)</p>
                                </div>
                                <Switch checked={kitchenShowTable} onCheckedChange={setKitchenShowTable} />
                              </div>

                              <div className="flex items-center justify-between p-3.5 hover:bg-slate-100/50 transition-colors">
                                <div className="space-y-0.5">
                                  <Label className="font-semibold text-xs text-slate-900">Nama Pelanggan</Label>
                                  <p className="text-[11px] text-slate-500">Tampilkan nama pemesan di tiket dapur</p>
                                </div>
                                <Switch checked={kitchenShowCustomer} onCheckedChange={setKitchenShowCustomer} />
                              </div>

                              <div className="flex items-center justify-between p-3.5 hover:bg-slate-100/50 transition-colors">
                                <div className="space-y-0.5">
                                  <Label className="font-semibold text-xs text-slate-900">Nama Kasir / Staf</Label>
                                  <p className="text-[11px] text-slate-500">Tampilkan nama staf pembuat order</p>
                                </div>
                                <Switch checked={kitchenShowCashier} onCheckedChange={setKitchenShowCashier} />
                              </div>

                              <div className="flex items-center justify-between p-3.5 hover:bg-slate-100/50 transition-colors">
                                <div className="space-y-0.5">
                                  <Label className="font-semibold text-xs text-slate-900">Catatan Khusus Pesanan</Label>
                                  <p className="text-[11px] text-slate-500">Cetak instruksi memasak (Pedas, Less Ice, Tanpa Bawang, dll)</p>
                                </div>
                                <Switch checked={kitchenShowNotes} onCheckedChange={setKitchenShowNotes} />
                              </div>

                              <div className="flex items-center justify-between p-3.5 hover:bg-slate-100/50 transition-colors">
                                <div className="space-y-0.5">
                                  <Label className="font-semibold text-xs text-slate-900">Pemisah Potong Kertas</Label>
                                  <p className="text-[11px] text-slate-500">Cetak garis pemotong jika 1 printer dipakai bersama</p>
                                </div>
                                <Switch checked={kitchenAutoCut} onCheckedChange={setKitchenAutoCut} />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t border-slate-100">
                          <Button disabled={isSavingKitchen || !hasKitchenChanges} type="submit" className="min-w-[150px] h-10 px-5 rounded-full text-xs font-semibold bg-[#0e59f9] hover:bg-[#0b4de0] text-white shadow-md transition-all cursor-pointer border-none">
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
                  <div className="flex items-center justify-between bg-slate-100 p-1 rounded-full border-none shadow-sm-md">
                    <button
                      type="button"
                      onClick={() => setPreviewTab('customer')}
                      className={cn(
                        "flex-1 text-xs font-semibold py-2 px-3 rounded-full transition-all cursor-pointer",
                        previewTab === 'customer'
                          ? "bg-[#0e59f9] shadow-sm-md text-white font-semibold"
                          : "text-slate-500 hover:text-slate-900"
                      )}
                    >
                      Preview Struk Kasir
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewTab('kitchen')}
                      className={cn(
                        "flex-1 text-xs font-semibold py-2 px-3 rounded-full transition-all cursor-pointer",
                        previewTab === 'kitchen'
                          ? "bg-[#0e59f9] shadow-sm-md text-white font-semibold"
                          : "text-slate-500 hover:text-slate-900"
                      )}
                    >
                      Preview Tiket Dapur
                    </button>
                  </div>

                  {/* PREVIEW STRUK */}
                  {previewTab === 'customer' && (
                    <div className="bg-white p-6 sm:p-7 rounded-2xl shadow-sm-md border-none font-mono text-xs leading-relaxed text-zinc-900 select-none">
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
                              <div className="h-10 w-10 rounded-full bg-zinc-900 text-white flex items-center justify-center font-semibold text-xs tracking-wider">
                                {storeName?.slice(0, 2)?.toUpperCase() || 'MN'}
                              </div>
                            )}
                          </div>
                        )}
                        <div className="font-semibold text-sm tracking-wider uppercase">
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
                          <span className="font-semibold">#TRX-8921</span>
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
                            <span className="font-semibold">NO. 05</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-zinc-500">METODE</span>
                          <span>QRIS</span>
                        </div>
                      </div>

                      <div className="py-3 border-b border-dashed border-zinc-300 space-y-2">
                        <div>
                          <div className="flex justify-between font-semibold text-[11px]">
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
                          <div className="flex justify-between font-semibold text-[11px]">
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
                        <div className="flex justify-between font-semibold text-sm text-zinc-900">
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
                          <div className="text-[10px] font-semibold tracking-wider text-zinc-700">TERIMA KASIH</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* PREVIEW TIKET DAPUR */}
                  {previewTab === 'kitchen' && (
                    <div className="bg-white p-6 sm:p-7 rounded-2xl shadow-sm-md border-none font-mono text-xs leading-relaxed text-zinc-900 select-none">
                      <div className="text-center space-y-1 pb-3 border-b border-zinc-900">
                        <div className="font-semibold text-sm tracking-wider uppercase">
                          {kitchenTicketTitle || 'TIKET DAPUR'}
                        </div>
                        <div className="text-[10px] text-zinc-500">
                          {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })} 14:30:22
                        </div>
                      </div>

                      <div className="py-2.5 border-b border-dashed border-zinc-300 space-y-1 text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-zinc-500">CHANNEL</span>
                          <span className="font-semibold">DINE_IN</span>
                        </div>
                        {kitchenShowTable && (
                          <div className="flex justify-between text-sm font-semibold pt-0.5">
                            <span>MEJA</span>
                            <span>NO. 05</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-zinc-500">NO. ORDER</span>
                          <span className="font-semibold">#TRX-8921</span>
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
                        <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                          Pesanan Masak:
                        </div>
                        <div className="space-y-0.5 pb-1.5 border-b border-zinc-100">
                          <div className="flex justify-between items-baseline font-semibold text-[11px]">
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
                          <div className="flex justify-between items-baseline font-semibold text-[11px]">
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

                      <div className="py-2.5 flex justify-between font-semibold text-[11px] border-b border-zinc-900">
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
