'use client';

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import {
  IconBuildingStore,
  IconArrowLeft,
  IconLoader2,
  IconAlertCircle,
  IconChevronDown,
  IconShieldCheck,
  IconLogout,
  IconReceipt2,
  IconUsers,
  IconDeviceDesktopAnalytics,
  IconCheck,
  IconHelpCircle,
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { signOutAction } from '@/lib/actions/auth';
import { createTenantAction } from '@/lib/actions/tenant';
import { usePageTransition } from '@/components/providers/page-transition-provider';
import { OrderPrefixPicker } from '@/components/shared/order-prefix-picker';
import { createAvatar } from '@dicebear/core';
import { openPeeps } from '@dicebear/collection';

export interface AccountInfo {
  id: string;
  email: string;
  name?: string | null;
}

interface CreateTenantClientProps {
  account: AccountInfo | null;
  isAdmin?: boolean;
}

// Ambient Blurry Menuin 'M' Emblem Watermark for Cards
function MenuinMWatermark({ className }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute select-none overflow-hidden transition-all duration-500 ${className || ''}`}
      aria-hidden="true"
    >
      <svg
        viewBox="260 380 300 190"
        className="w-full h-full fill-current"
      >
        <path
          d="M0 0 C3.00222412 2.67977915 5.9093898 5.40983348 8.65234375 8.35546875 C10.15145643 9.90745404 10.15145643 9.90745404 13.06640625 10.65234375 C13.288125 10.09160156 13.50984375 9.53085937 13.73828125 8.953125 C19.91716038 -1.75087443 35.09804735 -8.60826205 46.31640625 -12.16015625 C54.83438067 -14.35367385 62.87347198 -15.7144374 71.69140625 -15.66015625 C73.12818726 -15.65278442 73.12818726 -15.65278442 74.59399414 -15.64526367 C97.37588825 -15.27403702 119.91910897 -8.01433679 136.51611328 8.01611328 C144.50261498 16.44533129 149.5251973 26.68935103 153.06640625 37.65234375 C153.39279083 38.59193436 153.71917542 39.53152496 154.05545044 40.49958801 C158.25354021 53.59170486 157.32520647 67.53800795 157.26171875 81.109375 C157.25798248 83.46733988 157.25513841 85.82530632 157.25314331 88.18327332 C157.24555523 94.34974554 157.2259488 100.51612158 157.20373535 106.68255615 C157.1831723 112.9908315 157.17411935 119.29912258 157.1640625 125.60742188 C157.14269785 137.95577794 157.10755566 150.30403775 157.06640625 162.65234375 C142.21640625 162.65234375 127.36640625 162.65234375 112.06640625 162.65234375 C112.02773438 151.72560547 112.02773438 151.72560547 111.98828125 140.578125 C111.96309336 135.94332495 111.93674537 131.30858889 111.90625 126.67382812 C111.85803281 119.32901833 111.81394376 111.98435681 111.79541016 104.6394043 C111.78018578 98.71291304 111.74563761 92.78681161 111.69809723 86.86049461 C111.68334296 84.60770253 111.67536868 82.35485478 111.6745224 80.10201454 C111.78821682 57.27617867 111.78821682 57.27617867 101.06640625 37.65234375 C89.9721561 28.44087693 78.05292218 26.75366909 64.06640625 27.65234375 C54.98523609 28.88285461 46.94873006 33.995105 41.109375 41 C31.73103682 54.66818631 33.87690467 71.36685935 33.75 87.26171875 C33.72939411 89.44175579 33.70839678 91.62178916 33.68702698 93.80181885 C33.63218133 99.5029806 33.58260873 105.20417612 33.53417969 110.90539551 C33.47479054 117.76556033 33.40877167 124.62566425 33.3438797 131.48577881 C33.24634306 141.87459618 33.1571642 152.263455 33.06640625 162.65234375 C17.88640625 162.65234375 2.70640625 162.65234375 -12.93359375 162.65234375 C-12.97097656 155.4284375 -13.00835937 148.20453125 -13.046875 140.76171875 C-13.07717351 136.16794551 -13.10833378 131.57421014 -13.14257812 126.98046875 C-13.19677507 119.69923883 -13.24789011 112.4180838 -13.2800293 105.13671875 C-13.30615944 99.26215392 -13.34663025 93.38784251 -13.39678001 87.51343536 C-13.41338321 85.27935198 -13.42493804 83.04522484 -13.43120766 80.81108856 C-13.29212151 58.41066128 -13.29212151 58.41066128 -22.93359375 38.65234375 C-32.66819717 29.30067504 -43.10899121 27.29885333 -56.24609375 27.5078125 C-66.79860565 27.92141731 -75.32873183 31.55427711 -82.74609375 39.27734375 C-87.89171644 45.56643815 -92.02264759 54.77029176 -92.09181213 62.96134949 C-92.10649536 64.28014351 -92.10649536 64.28014351 -92.12147522 65.62557983 C-92.12723068 66.58727081 -92.13298615 67.54896179 -92.13891602 68.53979492 C-92.14881561 69.55460434 -92.15871521 70.56941376 -92.16891479 71.61497498 C-92.20054584 74.97506361 -92.22529366 78.33516639 -92.25 81.6953125 C-92.27056813 84.02273428 -92.29156457 86.35015232 -92.31297302 88.67756653 C-92.36820817 94.80794238 -92.41761113 100.93835203 -92.46582031 107.06878662 C-92.52484927 114.42181857 -92.5910852 121.77478866 -92.6561203 129.12776947 C-92.75414798 140.30258984 -92.84299171 151.47744959 -92.93359375 162.65234375 C-108.11359375 162.65234375 -123.29359375 162.65234375 -138.93359375 162.65234375 C-139.05392018 138.12803511 -139.05392018 138.12803511 -139.08007812 127.58007812 C-139.09793047 120.41553992 -139.11892528 113.25111801 -139.15991211 106.08666992 C-139.19278833 100.30298027 -139.21050571 94.51941554 -139.21822548 88.73563957 C-139.2237187 86.54192072 -139.23444368 84.34820779 -139.25078392 82.15454292 C-139.37743587 64.42772947 -138.45854302 48.03864039 -130.93359375 31.65234375 C-130.44117188 30.57339844 -129.94875 29.49445313 -129.44140625 28.3828125 C-125.174207 19.77695374 -119.70074478 13.330971 -112.93359375 6.65234375 C-112.25296875 5.97300781 -111.57234375 5.29367187 -110.87109375 4.59375 C-83.15295722 -21.33425688 -29.61263306 -23.69799264 0 0 Z"
          transform="translate(400.93359375, 405.34765625)"
        />
      </svg>
    </div>
  );
}

export function CreateTenantClient({ account, isAdmin }: CreateTenantClientProps) {
  const { navigateWithTransition } = usePageTransition();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [orderPrefix, setOrderPrefix] = useState('');

  // User avatar identical to select-tenant
  const userAvatarUri = useMemo(() => {
    try {
      const seed = (account?.email || account?.name || 'user').trim().toLowerCase();
      const avatar = createAvatar(openPeeps, {
        seed,
        backgroundColor: ['dbeafe', 'eff6ff', 'e0f2fe', 'fef3c7', 'fce7f3', 'dcfce7'],
        scale: 90,
      });
      return avatar.toDataUri();
    } catch {
      return null;
    }
  }, [account?.email, account?.name]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(event.currentTarget);
    formData.append('orderPrefix', orderPrefix);

    try {
      const result = await createTenantAction(formData);

      if (result?.error) {
        setError(result.error);
        setLoading(false);
      } else {
        navigateWithTransition('/select-tenant');
      }
    } catch (err: any) {
      setError('Terjadi kendala saat mendaftarkan cabang. Silakan coba kembali.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-slate-50/60 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between relative overflow-hidden">
      {/* Subtle Ambient Background Gradient */}
      <div
        className="absolute inset-0 pointer-events-none -z-10"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% -10%, rgba(37, 99, 235, 0.08) 0%, rgba(99, 102, 241, 0.04) 35%, transparent 70%),
            radial-gradient(circle at 10% 90%, rgba(59, 130, 246, 0.03) 0%, transparent 50%),
            radial-gradient(circle at 90% 80%, rgba(147, 51, 234, 0.03) 0%, transparent 50%)
          `,
        }}
      />

      {/* Top Navbar */}
      <header className="w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigateWithTransition('/select-tenant')}
              className="flex items-center gap-2 group cursor-pointer focus:outline-none"
              aria-label="Menuin, kembali ke pilih outlet"
            >
              <Image
                src="/menuin.png"
                alt="Menuin"
                width={220}
                height={60}
                className="h-7 w-auto md:h-8 transition-transform group-hover:scale-[1.01] dark:hidden"
                priority
              />
              <Image
                src="/menuin-putih.png"
                alt="Menuin"
                width={220}
                height={60}
                className="h-7 w-auto md:h-8 transition-transform group-hover:scale-[1.01] hidden dark:block"
                priority
              />
            </button>
          </div>

          {/* Right Header Navigation & Profile */}
          <div className="flex items-center gap-2.5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 p-1 pl-2.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors cursor-pointer select-none shadow-2xs"
                >
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300 max-w-[150px] truncate hidden sm:inline">
                    {account?.name || account?.email}
                  </span>
                  {userAvatarUri ? (
                    <img
                      src={userAvatarUri}
                      alt={account?.name || 'User'}
                      className="w-7 h-7 rounded-lg object-cover bg-blue-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-2xs"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold text-xs flex items-center justify-center border border-blue-100 dark:border-blue-900/40">
                      {account?.name?.charAt(0).toUpperCase() || account?.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                  <IconChevronDown className="w-3.5 h-3.5 text-slate-400 mr-1" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60 p-1.5 rounded-xl shadow-lg border-slate-200 dark:border-slate-800 text-xs">
                <div className="px-2.5 py-2 border-b border-slate-100 dark:border-slate-800">
                  <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {account?.name || 'Pengguna Menuin'}
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                    {account?.email}
                  </p>
                </div>

                {isAdmin && (
                  <DropdownMenuItem
                    onClick={() => navigateWithTransition('/system-admin')}
                    className="flex items-center gap-2 cursor-pointer py-2 px-2.5 rounded-lg text-slate-700 dark:text-slate-300 mt-1"
                  >
                    <IconShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Konsol System Admin</span>
                  </DropdownMenuItem>
                )}

                <form action={signOutAction} className="w-full mt-1">
                  <button
                    type="submit"
                    className="w-full flex items-center gap-2 cursor-pointer py-2 px-2.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-left"
                  >
                    <IconLogout className="w-4 h-4" />
                    <span>Keluar dari Akun</span>
                  </button>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="space-y-6">
          {/* Back Button & Breadcrumbs */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigateWithTransition('/select-tenant')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer"
            >
              <IconArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Daftar Outlet</span>
            </button>

            <span className="text-slate-300 dark:text-slate-700">/</span>

            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Buat Cabang Baru
            </span>
          </div>

          {/* Page Title & Subtitle */}
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
              Daftarkan Cabang Restoran Baru
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Buat cabang atau gerai baru untuk mulai mengatur kasir, menu digital, dan operasional bisnis Anda.
            </p>
          </div>

          {/* Form & Info Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-2">
            {/* Left Column: Form Card */}
            <div className="lg:col-span-8">
              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
                <MenuinMWatermark className="w-48 h-48 -right-8 -bottom-8 text-blue-500/5 dark:text-blue-400/5" />

                <div className="flex items-center gap-3 pb-6 border-b border-slate-100 dark:border-slate-800/80 mb-6">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#0e59f9] flex items-center justify-center shadow-2xs shrink-0">
                    <IconBuildingStore className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
                      Informasi Cabang
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Nama outlet akan digunakan pada struk belanja, pesanan QR, dan laporan shift kasir.
                    </p>
                  </div>
                </div>

                <form onSubmit={onSubmit} className="space-y-6">
                  {error && (
                    <div className="bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/70 dark:border-rose-900/60 flex items-center gap-2.5 p-3.5 rounded-xl text-xs font-medium">
                      <IconAlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                      <p>{error}</p>
                    </div>
                  )}

                  {/* Restaurant Name Input */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="restaurantName" className="text-xs font-semibold text-slate-900 dark:text-slate-200">
                        Nama Restoran / Brand Cabang
                      </Label>
                      <span className="text-[11px] text-slate-400">Wajib diisi</span>
                    </div>
                    <div className="relative">
                      <Input
                        id="restaurantName"
                        name="restaurantName"
                        value={restaurantName}
                        onChange={(e) => setRestaurantName(e.target.value)}
                        placeholder="Contoh: Kopi Kenangan - Cabang Senopati"
                        required
                        disabled={loading}
                        className="h-11 text-xs sm:text-sm bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 rounded-xl focus:ring-blue-500 focus:border-blue-500 shadow-2xs"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                      Gunakan nama yang mudah dikenali oleh pelanggan dan staf Anda.
                    </p>
                  </div>

                  {/* Order Prefix Picker */}
                  <div className="pt-2">
                    <OrderPrefixPicker
                      value={orderPrefix}
                      onChange={setOrderPrefix}
                      outletName={restaurantName}
                      disabled={loading}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-center gap-3">
                    <Button
                      type="submit"
                      disabled={loading || !restaurantName.trim()}
                      className="w-full sm:w-auto h-11 px-6 rounded-xl text-xs sm:text-sm font-semibold bg-[#0e59f9] hover:bg-blue-600 text-white shadow-xs cursor-pointer transition-colors"
                    >
                      {loading ? (
                        <>
                          <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                          Mendaftarkan Cabang...
                        </>
                      ) : (
                        'Daftarkan Cabang Restoran'
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigateWithTransition('/select-tenant')}
                      disabled={loading}
                      className="w-full sm:w-auto h-11 px-5 rounded-xl text-xs sm:text-sm font-medium border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer shadow-2xs"
                    >
                      Batal
                    </Button>
                  </div>
                </form>
              </div>
            </div>

            {/* Right Column: Benefits & Guidance Cards */}
            <div className="lg:col-span-4 space-y-5">
              {/* Card 1: Fitur yang Otomatis Siap */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800/80">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <IconDeviceDesktopAnalytics className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    Fitur Otomatis di Cabang Baru
                  </h3>
                </div>

                <div className="space-y-3.5 text-xs">
                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                      <IconCheck className="w-3 h-3 stroke-[2.5]" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">Sistem Kasir & POS Terintegrasi</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Siap mencatat pesanan dine-in, takeaway, dan cetak struk kasir thermal.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                      <IconCheck className="w-3 h-3 stroke-[2.5]" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">Format Order Number Unik</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Prefix kode pesanan eksklusif mencegah tertukarnya nomor antrean antar cabang.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                      <IconCheck className="w-3 h-3 stroke-[2.5]" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">Audit Shift & Kas Laci</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Rekonsiliasi otomatis selisih kas fisik per sesi kasir.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Panduan Naming */}
              <div className="bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/40 rounded-3xl p-5 shadow-2xs space-y-2.5">
                <div className="flex items-center gap-2">
                  <IconHelpCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <h4 className="text-xs font-semibold text-blue-950 dark:text-blue-200">
                    Tips Penamaan Cabang
                  </h4>
                </div>
                <p className="text-[11px] text-blue-900/80 dark:text-blue-300 leading-relaxed">
                  Jika Anda memiliki lebih dari satu cabang, sertakan nama area atau lokasi cabang (misal: <em>Kopi Kenangan - Senopati</em>) agar tim dan kasir tidak keliru saat login sesi kerja.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-4 text-center text-xs text-slate-400 dark:text-slate-600 border-t border-slate-200/60 dark:border-slate-900">
        &copy; {new Date().getFullYear()} MENUIN
      </footer>
    </div>
  );
}
