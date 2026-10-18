'use client';

import * as React from 'react';
import {
  Building2,
  UserRound,
  Landmark,
  Store,
  Edit3,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step5ReviewProps {
  businessProfileData: {
    name: string;
    entityType: string;
    businessLicenseNumber?: string;
    taxId?: string;
  };
  representativeData: {
    responsiblePersonName: string;
    responsiblePersonNik: string;
    responsiblePersonContact: string;
    responsiblePersonPosition?: string;
    responsiblePersonPhone?: string;
    responsiblePersonEmail?: string;
    responsiblePersonNationality?: string;
  };
  settlementData: {
    bankName: string;
    bankAccountNumber: string;
    bankAccountHolder: string;
  };
  outletData: {
    name: string;
    address: string;
    province?: string;
    city: string;
    district?: string;
    postalCode: string;
    mapsUrl?: string;
    latitude?: number;
    longitude?: number;
  };
  documents: Record<string, any>;
  onJumpToStep: (stepNumber: number) => void;
  isAgreed: boolean;
  onToggleAgree: (val: boolean) => void;
  isUploading?: boolean;
  isPreviewOnly?: boolean;
}

const ENTITY_LABEL_MAP: Record<string, string> = {
  INDIVIDUAL: 'Perorangan',
  PT: 'Perseroan Terbatas (PT)',
  CV: 'Persekutuan Komanditer (CV)',
  YAYASAN: 'Yayasan',
  KOPERASI: 'Koperasi',
};

export function Step5Review({
  businessProfileData,
  representativeData,
  settlementData,
  outletData,
  documents,
  onJumpToStep,
  isAgreed,
  onToggleAgree,
  isUploading = false,
  isPreviewOnly = false,
}: Step5ReviewProps) {
  const maskedNik =
    representativeData.responsiblePersonNik.length === 16
      ? `${representativeData.responsiblePersonNik.slice(0, 4)}••••••••${representativeData.responsiblePersonNik.slice(-4)}`
      : representativeData.responsiblePersonNik || '-';

  const maskedAccount =
    settlementData.bankAccountNumber.length > 4
      ? `•••••• ${settlementData.bankAccountNumber.slice(-4)}`
      : settlementData.bankAccountNumber || '-';

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 font-sans">
          Review &amp; Konfirmasi Pengajuan
        </h2>
        <p className="text-xs text-slate-500 mt-1 font-sans">
          Periksa kembali seluruh informasi data legalitas, rekening, dan lokasi fisik sebelum dikirim ke tim kepatuhan.
        </p>
      </div>

      <div className="space-y-3">
        {/* Card 1: Profil Usaha */}
        <div className="bg-white rounded-[6px] border border-slate-200 p-4 space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#0e59f9]" />
              <span className="text-xs font-semibold text-slate-900">
                1. Profil Legal Usaha
              </span>
            </div>
            <button
              type="button"
              disabled={isUploading}
              onClick={() => onJumpToStep(1)}
              className={cn(
                "group inline-flex items-center gap-1 h-6 px-2 rounded-[6px] text-xs font-semibold text-[#0e59f9] bg-blue-50/80 hover:bg-[#0e59f9] hover:text-white border border-blue-100/60 hover:border-[#0e59f9] transition-all duration-200 ease-out active:scale-95 shadow-2xs font-sans",
                isUploading ? "cursor-not-allowed opacity-40" : "cursor-pointer select-none"
              )}
            >
              <Edit3 className="w-3 h-3 transition-transform duration-200 group-hover:scale-110" />
              <span>Ubah</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-500 block text-[11px] font-medium">Nama Usaha</span>
              <span className="font-semibold text-slate-800">{businessProfileData.name || '-'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px] font-medium">Bentuk Entitas</span>
              <span className="font-semibold text-slate-800">
                {ENTITY_LABEL_MAP[businessProfileData.entityType] || businessProfileData.entityType || '-'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px] font-medium">NIB</span>
              <span className="font-semibold text-slate-800">{businessProfileData.businessLicenseNumber || '-'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px] font-medium">NPWP</span>
              <span className="font-semibold text-slate-800">{businessProfileData.taxId || '-'}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Perwakilan Bisnis */}
        <div className="bg-white rounded-[6px] border border-slate-200 p-4 space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <UserRound className="w-4 h-4 text-[#0e59f9]" />
              <span className="text-xs font-semibold text-slate-900">
                2. Perwakilan Bisnis (PIC)
              </span>
            </div>
            <button
              type="button"
              disabled={isUploading}
              onClick={() => onJumpToStep(2)}
              className={cn(
                "group inline-flex items-center gap-1 h-6 px-2 rounded-[6px] text-xs font-semibold text-[#0e59f9] bg-blue-50/80 hover:bg-[#0e59f9] hover:text-white border border-blue-100/60 hover:border-[#0e59f9] transition-all duration-200 ease-out active:scale-95 shadow-2xs font-sans",
                isUploading ? "cursor-not-allowed opacity-40" : "cursor-pointer select-none"
              )}
            >
              <Edit3 className="w-3 h-3 transition-transform duration-200 group-hover:scale-110" />
              <span>Ubah</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-500 block text-[11px] font-medium">Nama Penanggung Jawab</span>
              <span className="font-semibold text-slate-800">
                {representativeData.responsiblePersonName || '-'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px] font-medium">Jabatan</span>
              <span className="font-semibold text-slate-800">
                {representativeData.responsiblePersonPosition || 'Pemilik'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px] font-medium">NIK</span>
              <span className="font-semibold text-slate-800 font-sans">{maskedNik}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px] font-medium">Kewarganegaraan</span>
              <span className="font-semibold text-slate-800 font-sans">
                {representativeData.responsiblePersonNationality || 'Indonesia'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px] font-medium">Nomor Telepon</span>
              <span className="font-semibold text-slate-800 font-sans">
                {representativeData.responsiblePersonPhone || representativeData.responsiblePersonContact || '-'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px] font-medium">Email</span>
              <span className="font-semibold text-slate-800 font-sans">
                {representativeData.responsiblePersonEmail || '-'}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Rekening Settlement */}
        <div className="bg-white rounded-[6px] border border-slate-200 p-4 space-y-2 font-sans">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 font-sans">
            <div className="flex items-center gap-2">
              <Landmark className="w-4 h-4 text-[#0e59f9]" />
              <span className="text-xs font-semibold text-slate-900 font-sans">
                3. Rekening Settlement Bank
              </span>
            </div>
            <button
              type="button"
              disabled={isUploading}
              onClick={() => onJumpToStep(3)}
              className={cn(
                "group inline-flex items-center gap-1 h-6 px-2 rounded-[6px] text-xs font-semibold text-[#0e59f9] bg-blue-50/80 hover:bg-[#0e59f9] hover:text-white border border-blue-100/60 hover:border-[#0e59f9] transition-all duration-200 ease-out active:scale-95 shadow-2xs font-sans",
                isUploading ? "cursor-not-allowed opacity-40" : "cursor-pointer select-none"
              )}
            >
              <Edit3 className="w-3 h-3 transition-transform duration-200 group-hover:scale-110" />
              <span>Ubah</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-sans">
            <div>
              <span className="text-slate-500 block text-[11px] font-medium">Bank</span>
              <span className="font-semibold text-slate-800 font-sans">{settlementData.bankName || '-'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px] font-medium">Nomor Rekening</span>
              <span className="font-semibold text-slate-800 font-sans">{maskedAccount}</span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-500 block text-[11px] font-medium">Nama Pemilik Rekening</span>
              <span className="font-semibold text-slate-800">
                {settlementData.bankAccountHolder || '-'}
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Lokasi Gerai */}
        <div className="bg-white rounded-[6px] border border-slate-200 p-4 space-y-2 font-sans">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 font-sans">
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-[#0e59f9]" />
              <span className="text-xs font-semibold text-slate-900 font-sans">
                4. Lokasi &amp; Fisik Gerai
              </span>
            </div>
            <button
              type="button"
              disabled={isUploading}
              onClick={() => onJumpToStep(4)}
              className={cn(
                "group inline-flex items-center gap-1 h-6 px-2 rounded-[6px] text-xs font-semibold text-[#0e59f9] bg-blue-50/80 hover:bg-[#0e59f9] hover:text-white border border-blue-100/60 hover:border-[#0e59f9] transition-all duration-200 ease-out active:scale-95 shadow-2xs font-sans",
                isUploading ? "cursor-not-allowed opacity-40" : "cursor-pointer select-none"
              )}
            >
              <Edit3 className="w-3 h-3 transition-transform duration-200 group-hover:scale-110" />
              <span>Ubah</span>
            </button>
          </div>

          <div className="space-y-1.5 text-xs font-sans">
            <div>
              <span className="text-slate-500 block text-[11px] font-medium">Alamat Gerai</span>
              <span className="font-semibold text-slate-800 font-sans">{outletData.address || '-'}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-sans">
              <div>
                <span className="text-slate-500 block text-[11px] font-medium">Provinsi</span>
                <span className="font-semibold text-slate-800 font-sans">{outletData.province || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px] font-medium">Kota / Kabupaten</span>
                <span className="font-semibold text-slate-800 font-sans">{outletData.city || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px] font-medium">Kecamatan</span>
                <span className="font-semibold text-slate-800 font-sans">{outletData.district || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px] font-medium">Kode Pos</span>
                <span className="font-semibold text-slate-800 font-sans">{outletData.postalCode || '-'}</span>
              </div>
            </div>
            <div className="pt-2 flex items-center gap-3 text-[11px] text-slate-600">
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Foto Fasad Depan Terlampir
              </span>
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Foto Area Kasir Terlampir
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Agreement Checkbox */}
      <div className={cn(
        "rounded-[6px] border p-4 space-y-3 transition-colors",
        isPreviewOnly || isUploading
          ? "border-slate-200 bg-slate-50 text-slate-400"
          : "border-blue-100 bg-blue-50/40 text-slate-700"
      )}>
        <label className={cn(
          "flex items-start gap-2.5 select-none",
          isPreviewOnly || isUploading ? "cursor-not-allowed opacity-60" : "cursor-pointer"
        )}>
          <input
            type="checkbox"
            checked={isAgreed}
            disabled={isPreviewOnly || isUploading}
            onChange={(e) => onToggleAgree(e.target.checked)}
            className="w-4 h-4 rounded-[4px] text-[#0e59f9] focus:ring-[#0e59f9] border-slate-300 mt-0.5 flex-shrink-0 disabled:opacity-50"
          />
          <span className="text-xs leading-relaxed font-medium">
            Saya menyatakan bahwa seluruh informasi dan dokumen yang dilampirkan adalah benar, sah, dan sesuai dengan ketentuan hukum yang berlaku di Republik Indonesia. Saya menyetujui syarat &amp; ketentuan verifikasi bisnis Menuin.
          </span>
        </label>
      </div>
    </div>
  );
}
