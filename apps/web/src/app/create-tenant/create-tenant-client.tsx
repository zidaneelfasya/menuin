'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import {
  IconArrowLeft,
  IconLoader2,
  IconAlertCircle,
  IconInfoCircle,
  IconX,
  IconPhoto,
  IconBuildingStore,
  IconReceipt2,
  IconChefHat,
  IconCoffee,
  IconToolsKitchen2,
  IconBurger,
  IconCup,
  IconCake,
  IconSoup,
} from '@tabler/icons-react';
import { Check } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { createTenantAction } from '@/lib/actions/tenant';
import { usePageTransition } from '@/components/providers/page-transition-provider';
import { OrderPrefixPicker } from '@/components/shared/order-prefix-picker';
import {
  BUSINESS_CATEGORIES,
} from '@/lib/constants/business-categories';
import { cn } from '@/lib/utils';

export interface AccountInfo {
  id: string;
  email: string;
  name?: string | null;
}

interface CreateTenantClientProps {
  account: AccountInfo | null;
  isAdmin?: boolean;
}

// Ambient Blurry Menuin 'M' Emblem Watermark
function MenuinMWatermark({ className }: { className?: string }) {
  return (
    <div
      className={cn('pointer-events-none absolute select-none overflow-hidden transition-all duration-500', className)}
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

export function CreateTenantClient({ account: _account, isAdmin: _isAdmin }: CreateTenantClientProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [restaurantName, setRestaurantName] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['coffee_shop']);
  const [orderPrefix, setOrderPrefix] = useState('KSR');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTipsOpen, setIsTipsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { navigateWithTransition } = usePageTransition();

  const handleNextFromStep1 = () => {
    if (!restaurantName.trim()) {
      setError('Silakan masukkan nama cabang restoran Anda.');
      return;
    }
    setError('');
    setCurrentStep(2);
  };

  const handleNextFromStep2 = () => {
    if (selectedCategories.length === 0) {
      setError('Silakan pilih minimal satu kategori usaha.');
      return;
    }
    setError('');
    setCurrentStep(3);
  };

  const handleNextFromStep3 = () => {
    setError('');
    setCurrentStep(4);
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(categoryId)) {
        if (prev.length === 1) {
          return prev;
        }
        return prev.filter((id) => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
    if (error) setError('');
  };

  const handleProcessFile = (file: File) => {
    if (file.size > 12 * 1024 * 1024) {
      setError('Ukuran file melebihi batas 12 MB.');
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Format file tidak didukung. Gunakan format .jpeg atau .png.');
      return;
    }

    setError('');
    setPhotoFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    handleProcessFile(file);
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (currentStep === 1) {
      handleNextFromStep1();
      return;
    }

    if (currentStep === 2) {
      handleNextFromStep2();
      return;
    }

    if (currentStep === 3) {
      handleNextFromStep3();
      return;
    }

    if (!restaurantName.trim()) {
      setError('Silakan masukkan nama cabang restoran Anda.');
      setCurrentStep(1);
      return;
    }

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('restaurantName', restaurantName);
    formData.append('businessCategories', JSON.stringify(selectedCategories));
    formData.append('orderPrefix', orderPrefix);
    if (photoPreview) {
      formData.append('storefrontPhotoUrl', photoPreview);
    }

    try {
      const result = await createTenantAction(formData);
      if (result.success && result.tenantSlug) {
        navigateWithTransition(`/outlet/${result.tenantSlug}`);
      } else {
        setError(result.error || 'Terjadi kesalahan sistem saat membuat cabang.');
        setLoading(false);
      }
    } catch (err: any) {
      setError(err?.message || 'Terjadi kesalahan tak terduga.');
      setLoading(false);
    }
  };

  const steps = [
    {
      number: 1,
      title: 'Identitas Cabang',
      subtitle: 'Nama gerai & brand resto',
      icon: IconBuildingStore,
    },
    {
      number: 2,
      title: 'Kategori Usaha',
      subtitle: 'Fokus & jenis menu usaha',
      icon: IconChefHat,
    },
    {
      number: 3,
      title: 'Kode Nota Kasir',
      subtitle: 'Singkatan outlet di struk & antrean',
      icon: IconReceipt2,
    },
    {
      number: 4,
      title: 'Logo Usaha',
      subtitle: 'Identitas brand resto (opsional)',
      icon: IconPhoto,
    },
  ];

  const renderCategoryIcon = (iconName: string) => {
    const iconClass = 'w-9 h-9 stroke-[1.5] transition-colors';
    switch (iconName) {
      case 'coffee':
        return <IconCoffee className={iconClass} />;
      case 'restaurant':
        return <IconToolsKitchen2 className={iconClass} />;
      case 'fast_food':
        return <IconBurger className={iconClass} />;
      case 'boba_drink':
        return <IconCup className={iconClass} />;
      case 'bakery_dessert':
        return <IconCake className={iconClass} />;
      case 'street_food':
        return <IconSoup className={iconClass} />;
      default:
        return <IconChefHat className={iconClass} />;
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-white text-slate-900 font-sans relative overflow-x-hidden">
      {/* LEFT SIDEBAR: Deep Blue Brand Panel with Stepper */}
      <aside className="w-full md:w-[360px] lg:w-[400px] flex-shrink-0 bg-[#0055D6] text-white p-6 sm:p-8 md:p-10 flex flex-col justify-between relative overflow-hidden select-none">
        {/* Ambient Blurry Menuin 'M' Emblem Watermark in the corner */}
        <MenuinMWatermark
          className="-bottom-16 -left-14 w-80 h-64 text-white opacity-15 blur-[5px] scale-110"
        />

        {/* Top: Logo & Exit Link */}
        <div className="relative z-10 space-y-6">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigateWithTransition('/select-tenant')}
              className="flex items-center gap-2 group cursor-pointer focus:outline-none"
              aria-label="Menuin, kembali ke pilih outlet"
            >
              <Image
                src="/menuin-putih.png"
                alt="Menuin"
                width={200}
                height={55}
                className="h-7 w-auto transition-transform group-hover:scale-[1.02]"
                priority
              />
            </button>

            <button
              type="button"
              onClick={() => navigateWithTransition('/select-tenant')}
              className="inline-flex md:hidden items-center gap-1.5 text-xs text-white/80 hover:text-white"
            >
              <IconArrowLeft className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>
        </div>

        {/* Center: Vertical Stepper Timeline */}
        <div className="my-8 md:my-auto relative z-10">
          <div className="space-y-6 sm:space-y-7">
            {steps.map((step, idx) => {
              const isCurrent = currentStep === step.number;
              const isComplete =
                step.number < currentStep ||
                (step.number === 4 && Boolean(photoPreview));
              const isLast = idx === steps.length - 1;
              const IconComponent = step.icon;

              return (
                <div key={step.number} className="relative flex items-start gap-4">
                  {/* Connecting Line Column */}
                  <div className="flex flex-col items-center flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        if (step.number === 1) setCurrentStep(1);
                        else if (step.number === 2) {
                          if (restaurantName.trim()) setCurrentStep(2);
                          else setError('Silakan masukkan nama cabang restoran Anda.');
                        } else if (step.number === 3) {
                          if (restaurantName.trim()) setCurrentStep(3);
                          else setError('Silakan masukkan nama cabang restoran Anda.');
                        } else if (step.number === 4) {
                          if (restaurantName.trim()) setCurrentStep(4);
                          else setError('Silakan masukkan nama cabang restoran Anda.');
                        }
                      }}
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer',
                        isCurrent
                          ? 'bg-white text-[#0055D6] shadow-sm'
                          : isComplete
                          ? 'bg-white/25 text-white border border-white/40 hover:bg-white/35'
                          : 'bg-white/10 text-white/70 border border-white/20 hover:bg-white/20'
                      )}
                      aria-label={step.title}
                    >
                      {isComplete ? (
                        <Check className="w-5 h-5 stroke-[2.2]" />
                      ) : (
                        <IconComponent className="w-5 h-5 stroke-[1.8]" />
                      )}
                    </button>

                    {!isLast && (
                      <div
                        className={cn(
                          'w-[2px] my-1.5 transition-colors',
                          isComplete ? 'bg-white/60 h-8 sm:h-10' : 'bg-white/20 h-8 sm:h-10'
                        )}
                      />
                    )}
                  </div>

                  {/* Step Title & Subtitle */}
                  <div className="pt-1.5 min-w-0">
                    <button
                      type="button"
                      onClick={() => {
                        if (step.number === 1) setCurrentStep(1);
                        else if (step.number === 2) {
                          if (restaurantName.trim()) setCurrentStep(2);
                          else setError('Silakan masukkan nama cabang restoran Anda.');
                        } else if (step.number === 3) {
                          if (restaurantName.trim()) setCurrentStep(3);
                          else setError('Silakan masukkan nama cabang restoran Anda.');
                        } else if (step.number === 4) {
                          if (restaurantName.trim()) setCurrentStep(4);
                          else setError('Silakan masukkan nama cabang restoran Anda.');
                        }
                      }}
                      className="text-left cursor-pointer group focus:outline-none"
                    >
                      <p
                        className={cn(
                          'text-sm font-semibold tracking-wide transition-colors',
                          isCurrent ? 'text-white' : 'text-white/85 group-hover:text-white'
                        )}
                      >
                        {step.title}
                      </p>
                      <p className="text-xs text-white/65 mt-0.5 leading-relaxed">
                        {step.subtitle}
                      </p>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Link: Kembali ke Daftar Outlet */}
        <div className="relative z-10 hidden md:block pt-4 border-t border-white/15">
          <button
            type="button"
            onClick={() => navigateWithTransition('/select-tenant')}
            className="inline-flex items-center gap-2 text-xs font-medium text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <IconArrowLeft className="w-4 h-4" />
            <span>Kembali ke Daftar Outlet</span>
          </button>
        </div>
      </aside>

      {/* RIGHT MAIN WORKSPACE */}
      <main className="flex-1 min-w-0 flex flex-col bg-white relative overflow-y-auto">
        {/* Form Container */}
        <div className="w-full max-w-4xl mx-auto px-6 sm:px-12 md:px-16 py-10 md:py-14 flex-1 flex flex-col justify-center relative z-10">
          {/* Step Eyebrow */}
          <span className="text-xs font-semibold text-slate-400 block mb-1.5">
            Step {currentStep}/4
          </span>

          {/* Step Main Title */}
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 leading-tight">
            {currentStep === 1
              ? 'Basic Info'
              : currentStep === 2
              ? 'Apa fokus usaha resto Anda?'
              : currentStep === 3
              ? 'Kode Nota Kasir & Antrean'
              : 'Logo Usaha (Opsional)'}
          </h1>

          {/* Step Subtitle / Description */}
          <p className="text-xs sm:text-sm text-slate-500 mt-2 mb-8 leading-relaxed max-w-2xl">
            {currentStep === 1
              ? 'Masukkan nama cabang restoran Anda untuk memulai operasional akun POS dan sistem kasir.'
              : currentStep === 2
              ? 'Pilih satu atau beberapa kategori untuk menyesuaikan opsi varian dan menu kasir Anda.'
              : currentStep === 3
              ? 'Tentukan singkatan nama outlet untuk dicetak di awal nomor struk kasir dan tiket pesanan dapur pelanggan.'
              : 'Unggah logo usaha restoran atau gerai Anda. Langkah ini opsional dan dapat dilewati sekarang.'}
          </p>

          <form onSubmit={onSubmit} className="space-y-6">
            {error && (
              <div className="bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-2.5 p-3.5 rounded-lg text-xs font-medium">
                <IconAlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <p>{error}</p>
              </div>
            )}

            {/* STEP 1: RESTAURANT NAME */}
            {currentStep === 1 && (
              <div className="space-y-6 max-w-2xl">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="restaurantName" className="text-xs font-semibold text-slate-800">
                      Nama Restoran / Brand Cabang
                    </Label>
                    <span className="text-[11px] text-slate-400">Wajib diisi</span>
                  </div>
                  <input
                    id="restaurantName"
                    name="restaurantName"
                    value={restaurantName}
                    onChange={(e) => {
                      setRestaurantName(e.target.value);
                      if (error) setError('');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleNextFromStep1();
                      }
                    }}
                    placeholder="Contoh: Kopi Kenangan - Senopati"
                    required
                    autoFocus
                    disabled={loading}
                    className="w-full h-11 rounded-lg border border-slate-300 bg-white px-3.5 text-sm font-normal text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0055D6] focus:ring-1 focus:ring-[#0055D6] disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed transition-all"
                  />
                  <p className="text-[11px] text-slate-400 pt-0.5">
                    Gunakan nama yang mudah dikenali pelanggan dan staf kasir.
                  </p>
                </div>

                {/* Primary Action Buttons */}
                <div className="pt-3 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleNextFromStep1()}
                    disabled={loading || !restaurantName.trim()}
                    className="min-w-[130px] px-8 h-9 rounded-full text-xs sm:text-sm font-semibold bg-[#0055D6] hover:bg-blue-700 text-white inline-flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
                  >
                    Next
                  </button>

                  <button
                    type="button"
                    onClick={() => navigateWithTransition('/select-tenant')}
                    className="min-w-[110px] px-7 h-9 rounded-full text-xs sm:text-sm font-semibold border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 inline-flex items-center justify-center transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: BUSINESS CATEGORIES PICKER (Matches Reference Design) */}
            {currentStep === 2 && (
              <div className="space-y-6">
                {/* 3 Columns x 2 Rows Grid matching reference image */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {BUSINESS_CATEGORIES.map((cat) => {
                    const isSelected = selectedCategories.includes(cat.id);
                    return (
                      <button
                        type="button"
                        key={cat.id}
                        onClick={() => toggleCategory(cat.id)}
                        className={cn(
                          'flex flex-col items-center text-center p-6 rounded-2xl border transition-all cursor-pointer select-none relative group',
                          isSelected
                            ? 'border-2 border-[#0055D6] bg-[#F8FAFF]'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/40'
                        )}
                      >
                        {/* Centered Outline Icon */}
                        <div
                          className={cn(
                            'mb-4 flex items-center justify-center transition-colors',
                            isSelected ? 'text-[#0055D6]' : 'text-slate-400 group-hover:text-slate-600'
                          )}
                        >
                          {renderCategoryIcon(cat.icon)}
                        </div>

                        {/* Title */}
                        <h3 className="text-sm sm:text-base font-semibold text-slate-900 mb-1.5 leading-snug">
                          {cat.title}
                        </h3>

                        {/* Subtitle */}
                        <p className="text-xs text-slate-500 leading-relaxed max-w-[210px] mx-auto">
                          {cat.subtitle}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* Primary Action Buttons */}
                <div className="pt-4 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleNextFromStep2()}
                    disabled={loading || selectedCategories.length === 0}
                    className="min-w-[130px] px-8 h-9 rounded-full text-xs sm:text-sm font-semibold bg-[#0055D6] hover:bg-blue-700 text-white inline-flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
                  >
                    Next
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    disabled={loading}
                    className="min-w-[110px] px-7 h-9 rounded-full text-xs sm:text-sm font-semibold border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 inline-flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Back
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: ORDER PREFIX PICKER */}
            {currentStep === 3 && (
              <div className="space-y-6 max-w-2xl">
                <OrderPrefixPicker
                  value={orderPrefix}
                  onChange={setOrderPrefix}
                  outletName={restaurantName}
                  disabled={loading}
                />

                {/* Action Buttons */}
                <div className="pt-3 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleNextFromStep3()}
                    disabled={loading}
                    className="min-w-[130px] px-8 h-9 rounded-full text-xs sm:text-sm font-semibold bg-[#0055D6] hover:bg-blue-700 text-white inline-flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
                  >
                    Next
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    disabled={loading}
                    className="min-w-[110px] px-7 h-9 rounded-full text-xs sm:text-sm font-semibold border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 inline-flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Back
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: LOGO USAHA (OPSIONAL) */}
            {currentStep === 4 && (
              <div className="space-y-6 max-w-2xl">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                  id="storefrontPhotoInput"
                />

                {/* Dropzone Area */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleProcessFile(file);
                  }}
                  className={cn(
                    'w-full bg-[#F8F9FA] hover:bg-slate-100/70 rounded-2xl p-8 sm:p-12 flex flex-col items-center justify-center text-center transition-all border border-slate-200/80',
                    isDragging ? 'ring-2 ring-[#0055D6] bg-blue-50/40 border-[#0055D6]' : ''
                  )}
                >
                  {!photoPreview ? (
                    <>
                      <div className="relative inline-block select-none mb-4">
                        <div className="w-24 h-20 bg-white rounded-2xl shadow-sm border border-slate-100/90 flex items-center justify-center">
                          <svg viewBox="0 0 48 40" className="w-12 h-10">
                            <circle cx="16" cy="12" r="3" fill="#E2E8F0" />
                            <path
                              d="M8 32 L22 16 L32 27 L38 21 L44 32 Z"
                              fill="#CBD5E1"
                              opacity="0.8"
                            />
                          </svg>
                        </div>
                        <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-[#0055D6] rounded-full flex items-center justify-center shadow-md ring-2 ring-white">
                          <svg
                            className="w-3.5 h-3.5 stroke-white stroke-[2.5]"
                            viewBox="0 0 24 24"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <line x1="12" y1="19" x2="12" y2="5" />
                            <polyline points="5 12 12 5 19 12" />
                          </svg>
                        </div>
                      </div>

                      <p className="text-sm text-slate-800 font-normal">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="underline underline-offset-2 font-medium text-slate-900 hover:text-[#0055D6] transition-colors cursor-pointer"
                        >
                          Click to upload
                        </button>{' '}
                        or Drag &amp; Drop
                      </p>
                      <p className="text-xs text-slate-400 mt-2 font-normal">
                        Supported formats: .jpeg, .png
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5 font-normal">
                        Maximum file size of 12MB.
                      </p>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-24 h-24 rounded-2xl overflow-hidden bg-white shadow-sm border border-slate-200/80 p-1 flex items-center justify-center">
                        <img
                          src={photoPreview}
                          alt="Preview Logo Usaha"
                          className="max-w-full max-h-full object-contain rounded-xl"
                        />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-900 max-w-[240px] truncate">
                          {photoFile?.name || 'logo-usaha.png'}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {photoFile
                            ? `${(photoFile.size / (1024 * 1024)).toFixed(2)} MB`
                            : 'Logo Terpilih'}{' '}
                          &bull; Siap digunakan
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-xs font-medium text-[#0055D6] hover:underline cursor-pointer"
                        >
                          Ganti Logo
                        </button>
                        <span className="text-slate-300">&bull;</span>
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="text-xs font-medium text-rose-600 hover:underline cursor-pointer"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="pt-3 flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={loading || !restaurantName.trim()}
                    className="min-w-[150px] px-8 h-9 rounded-full text-xs sm:text-sm font-semibold bg-[#0055D6] hover:bg-blue-700 text-white inline-flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
                  >
                    {loading ? (
                      <>
                        <IconLoader2 className="mr-1.5 h-4 w-4 animate-spin text-white" />
                        Mendaftarkan...
                      </>
                    ) : photoPreview ? (
                      'Simpan & Selesai'
                    ) : (
                      'Lewati & Selesai'
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    disabled={loading}
                    className="min-w-[110px] px-7 h-9 rounded-full text-xs sm:text-sm font-semibold border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 inline-flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Back
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </main>

      {/* Floating Tips Button & Panel */}
      <aside aria-label="Tips pengisian cabang">
        <button
          type="button"
          onClick={() => setIsTipsOpen(!isTipsOpen)}
          className={cn(
            'fixed bottom-6 right-6 z-40 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full border transition-all text-xs font-semibold cursor-pointer shadow-md',
            isTipsOpen
              ? 'bg-[#0055D6] text-white border-[#0055D6]'
              : 'bg-white text-slate-700 hover:text-slate-900 border-slate-200 hover:border-slate-300 shadow-slate-200/60'
          )}
        >
          <IconInfoCircle className={cn('w-4 h-4', isTipsOpen ? 'text-white' : 'text-[#0055D6]')} />
          <span>Tips</span>
        </button>

        {isTipsOpen && (
          <div className="fixed bottom-20 right-4 sm:right-6 z-50 w-[350px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl border border-slate-200 p-5 shadow-2xl flex flex-col space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-150 font-sans">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-[11px] font-semibold text-slate-400 block">
                Tips Langkah {currentStep} dari 4
              </span>
              <button
                type="button"
                onClick={() => setIsTipsOpen(false)}
                className="w-5 h-5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Tutup panduan"
              >
                <IconX className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Title & Description per Step */}
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                {currentStep === 1
                  ? 'Tips Nama Cabang'
                  : currentStep === 2
                  ? 'Tips Kategori Usaha'
                  : currentStep === 3
                  ? 'Tips Kode Nota Kasir'
                  : 'Tips Logo Usaha'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {currentStep === 1
                  ? 'Nama cabang yang tepat mempermudah pencarian outlet dan koordinasi operasional tim.'
                  : currentStep === 2
                  ? 'Kategori usaha membantu menyiapkan varian & modifier default otomatis yang relevan untuk kasir Anda.'
                  : currentStep === 3
                  ? 'Singkatan kode nota memudahkan kasir dan dapur melacak nomor pesanan pelanggan.'
                  : 'Logo usaha yang menarik membantu pelanggan mengenali brand dan outlet Anda.'}
              </p>
            </div>

            {/* Numbered Points Checklist per Step */}
            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-semibold text-slate-700 block">
                Ketentuan &amp; Tips:
              </span>
              <ul className="space-y-2 text-xs text-slate-600 leading-relaxed">
                {currentStep === 1 ? (
                  <>
                    <li className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-blue-50 text-[#0055D6] text-[10px] font-semibold flex items-center justify-center flex-shrink-0 mt-0.5">
                        1
                      </span>
                      <span>Sertakan nama area atau lokasi cabang jika berencana membuka banyak outlet (contoh: <em>Senopati</em>).</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-blue-50 text-[#0055D6] text-[10px] font-semibold flex items-center justify-center flex-shrink-0 mt-0.5">
                        2
                      </span>
                      <span>Gunakan nama yang mudah diingat pelanggan pada struk pembayaran dan menu QR digital.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-blue-50 text-[#0055D6] text-[10px] font-semibold flex items-center justify-center flex-shrink-0 mt-0.5">
                        3
                      </span>
                      <span>Nama cabang dapat diubah sewaktu-waktu melalui menu Pengaturan Outlet.</span>
                    </li>
                  </>
                ) : currentStep === 2 ? (
                  <>
                    <li className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-blue-50 text-[#0055D6] text-[10px] font-semibold flex items-center justify-center flex-shrink-0 mt-0.5">
                        1
                      </span>
                      <span>Pilih satu atau beberapa kategori yang paling sesuai dengan jenis produk outlet Anda.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-blue-50 text-[#0055D6] text-[10px] font-semibold flex items-center justify-center flex-shrink-0 mt-0.5">
                        2
                      </span>
                      <span>Sistem akan menyiapkan grup varian dasar untuk kasir Anda (misalnya Ukuran Gelas, Tingkat Manis, atau Level Pedas).</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-blue-50 text-[#0055D6] text-[10px] font-semibold flex items-center justify-center flex-shrink-0 mt-0.5">
                        3
                      </span>
                      <span>Varian dan harga dapat diubah, ditambah, atau dihapus kapan saja melalui menu katalog.</span>
                    </li>
                  </>
                ) : currentStep === 3 ? (
                  <>
                    <li className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-blue-50 text-[#0055D6] text-[10px] font-semibold flex items-center justify-center flex-shrink-0 mt-0.5">
                        1
                      </span>
                      <span>Gunakan 2 hingga 4 huruf singkatan nama outlet Anda (contoh: <em>KSR</em>, <em>OTL</em>, atau <em>CBG</em>).</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-blue-50 text-[#0055D6] text-[10px] font-semibold flex items-center justify-center flex-shrink-0 mt-0.5">
                        2
                      </span>
                      <span>Kode ini akan dicetak otomatis di bagian atas nomor struk kasir dan tiket pesanan dapur (#KSR-001).</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-blue-50 text-[#0055D6] text-[10px] font-semibold flex items-center justify-center flex-shrink-0 mt-0.5">
                        3
                      </span>
                      <span>Nomor antrean pesanan harian akan di-reset otomatis setiap pergantian sesi kasir.</span>
                    </li>
                  </>
                ) : (
                  <>
                    <li className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-blue-50 text-[#0055D6] text-[10px] font-semibold flex items-center justify-center flex-shrink-0 mt-0.5">
                        1
                      </span>
                      <span>Langkah ini opsional. Anda bisa langsung klik tombol &quot;Lewati &amp; Selesai&quot; jika belum menyiapkan logo usaha.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-blue-50 text-[#0055D6] text-[10px] font-semibold flex items-center justify-center flex-shrink-0 mt-0.5">
                        2
                      </span>
                      <span>Gunakan logo berformat PNG atau JPG berlatar transparan atau terang agar terlihat jelas di struk kasir dan dashboard.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-blue-50 text-[#0055D6] text-[10px] font-semibold flex items-center justify-center flex-shrink-0 mt-0.5">
                        3
                      </span>
                      <span>Logo usaha dapat diunggah, diganti, atau dihapus kapan saja melalui Pengaturan Outlet.</span>
                    </li>
                  </>
                )}
              </ul>
            </div>

            {/* Note box per Step */}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-[11px] text-slate-500">
              <span className="font-semibold text-slate-700 block mb-0.5">Catatan:</span>
              {currentStep === 1
                ? 'Nama tidak boleh mengandung simbol khusus agar tautan menu tetap rapi.'
                : currentStep === 2
                ? 'Modifier yang dibuat otomatis dapat langsung dihubungkan ke produk di katalog kasir Anda.'
                : currentStep === 3
                ? 'Kode nota hanya berlaku khusus untuk gerai ini dan dapat disesuaikan kembali nanti.'
                : 'Ukuran file maksimal 12 MB dengan format gambar JPG, PNG, atau WebP.'}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
