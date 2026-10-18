'use client';

import * as React from 'react';
import { GuidedField } from '../guideline-context';
import { UploadZone } from '@/components/verification/shared/upload-zone';
import {
  SearchableDropdown,
  type DropdownOption,
} from '@/components/verification/shared/searchable-dropdown';
import {
  INDONESIA_PROVINCES,
  getRegenciesByProvinceId,
  getDistrictsByRegencyId,
  findProvince,
  type RegionItem,
} from '@/lib/indonesia-regions';
import { LocateFixed, MapPin } from 'lucide-react';
import { toast } from 'sonner';

interface Step4OutletProps {
  formData: {
    address: string;
    province?: string;
    city: string;
    district?: string;
    postalCode: string;
    latitude?: number;
    longitude?: number;
    mapsUrl: string;
    storefrontPhotoUrl?: string;
    indoorPhotoUrl?: string;
  };
  onFormChange: (field: string, val: any) => void;
  isRepaired?: boolean;
  sectionReviewNote?: string | null;
  sectionReviewStatus?: string | null;
  documents: Record<string, any>;
  onPhotoUpload: (docType: string, file: File) => Promise<void>;
  onPhotoRemove: (docType: string) => void;
  storefrontPreviewUrl?: string | null;
  cashierPreviewUrl?: string | null;
  isUploading: boolean;
  isPreviewOnly?: boolean;
}

export function Step4Outlet({
  formData,
  onFormChange,
  isRepaired = false,
  sectionReviewNote,
  sectionReviewStatus,
  documents,
  onPhotoUpload,
  onPhotoRemove,
  storefrontPreviewUrl,
  cashierPreviewUrl,
  isUploading,
  isPreviewOnly = false,
}: Step4OutletProps) {
  const isNeedsChanges = sectionReviewStatus === 'CHANGES_REQUESTED';
  const isDocRepaired = Boolean(documents['FOTO_TAMPAK_DEPAN']?.isNewlyUpdated || documents['FOTO_KASIR']?.isNewlyUpdated);
  const isSectionRepaired = Boolean(isRepaired || isDocRepaired);
  // Cascading Region States
  const [regencies, setRegencies] = React.useState<RegionItem[]>([]);
  const [districts, setDistricts] = React.useState<RegionItem[]>([]);
  const [isLoadingRegencies, setIsLoadingRegencies] = React.useState(false);
  const [isLoadingDistricts, setIsLoadingDistricts] = React.useState(false);

  // Internal matched IDs
  const [selectedProvinceId, setSelectedProvinceId] = React.useState<string>('');
  const [selectedRegencyId, setSelectedRegencyId] = React.useState<string>('');

  // 1. Province Options
  const provinceOptions: DropdownOption[] = React.useMemo(() => {
    return INDONESIA_PROVINCES.map((p) => ({
      id: p.id,
      value: p.name,
      label: p.name,
    }));
  }, []);

  // 2. Sync Province ID when formData.province exists
  React.useEffect(() => {
    if (formData.province) {
      const matchedProv = findProvince(formData.province);
      if (matchedProv && matchedProv.id !== selectedProvinceId) {
        setSelectedProvinceId(matchedProv.id);
      }
    } else {
      setSelectedProvinceId('');
      setRegencies([]);
      setSelectedRegencyId('');
      setDistricts([]);
    }
  }, [formData.province]);

  // 3. Load Regencies when selectedProvinceId changes
  React.useEffect(() => {
    if (!selectedProvinceId) {
      setRegencies([]);
      setSelectedRegencyId('');
      setDistricts([]);
      return;
    }

    let isMounted = true;
    setIsLoadingRegencies(true);
    getRegenciesByProvinceId(selectedProvinceId)
      .then((data) => {
        if (!isMounted) return;
        setRegencies(data);

        // If formData.city already exists, match its regency ID
        if (formData.city) {
          const matched = data.find(
            (r) =>
              r.name.toLowerCase() === formData.city.toLowerCase() ||
              r.name.toLowerCase().includes(formData.city.toLowerCase()) ||
              formData.city.toLowerCase().includes(r.name.toLowerCase())
          );
          if (matched) {
            setSelectedRegencyId(matched.id);
          }
        }
      })
      .finally(() => {
        if (isMounted) setIsLoadingRegencies(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedProvinceId]);

  // 4. Load Districts when selectedRegencyId changes
  React.useEffect(() => {
    if (!selectedRegencyId) {
      setDistricts([]);
      return;
    }

    let isMounted = true;
    setIsLoadingDistricts(true);
    getDistrictsByRegencyId(selectedRegencyId)
      .then((data) => {
        if (!isMounted) return;
        setDistricts(data);
      })
      .finally(() => {
        if (isMounted) setIsLoadingDistricts(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedRegencyId]);

  // Handlers for region cascading changes
  const handleProvinceChange = (val: string, opt?: DropdownOption) => {
    onFormChange('province', opt?.label || val);
    // Reset city and district when province changes
    onFormChange('city', '');
    onFormChange('district', '');
    setSelectedRegencyId('');
    setDistricts([]);

    if (opt?.id) {
      setSelectedProvinceId(opt.id);
    } else {
      const p = findProvince(val);
      setSelectedProvinceId(p?.id || '');
    }
  };

  const handleCityChange = (val: string, opt?: DropdownOption) => {
    onFormChange('city', opt?.label || val);
    // Reset district when city changes
    onFormChange('district', '');

    if (opt?.id) {
      setSelectedRegencyId(opt.id);
    } else {
      const r = regencies.find(
        (item) => item.name.toLowerCase() === val.toLowerCase()
      );
      setSelectedRegencyId(r?.id || '');
    }
  };

  const handleDistrictChange = (val: string, opt?: DropdownOption) => {
    onFormChange('district', opt?.label || val);
  };

  // Convert regencies and districts to DropdownOption arrays
  const regencyOptions: DropdownOption[] = React.useMemo(() => {
    return regencies.map((r) => ({
      id: r.id,
      value: r.name,
      label: r.name,
    }));
  }, [regencies]);

  const districtOptions: DropdownOption[] = React.useMemo(() => {
    return districts.map((d) => ({
      id: d.id,
      value: d.name,
      label: d.name,
    }));
  }, [districts]);

  // Auto parse Maps URL
  const handleMapsUrlChange = (url: string) => {
    onFormChange('mapsUrl', url);
    if (!url) return;

    const coordRegex =
      /@(-?\d+\.\d+),(-?\d+\.\d+)|[?&](?:q|ll)=(-?\d+\.\d+),(-?\d+\.\d+)|!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/;
    const match = url.match(coordRegex);

    if (match) {
      const lat = parseFloat(match[1] || match[3] || match[5]);
      const lng = parseFloat(match[2] || match[4] || match[6]);
      if (!isNaN(lat) && !isNaN(lng)) {
        onFormChange('latitude', lat);
        onFormChange('longitude', lng);
        toast.success(`Koordinat terdeteksi otomatis: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      }
    }
  };

  // Browser Geolocation
  const handleDetectCurrentLocation = () => {
    if (isPreviewOnly || isUploading) return;
    if (!navigator.geolocation) {
      toast.error('Browser Anda tidak mendukung deteksi lokasi.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onFormChange('latitude', pos.coords.latitude);
        onFormChange('longitude', pos.coords.longitude);
        toast.success(
          `Titik GPS terdeteksi: ${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`
        );
      },
      (err) => {
        toast.error('Gagal mendeteksi lokasi GPS: ' + err.message);
      }
    );
  };

  const coordinatesDisplay =
    formData.latitude && formData.longitude
      ? `${formData.latitude.toFixed(6)}, ${formData.longitude.toFixed(6)}`
      : 'Belum terdeteksi';

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 font-sans">
          Lokasi &amp; Kepatuhan Fisik Gerai
        </h2>
        <p className="text-xs text-slate-500 mt-1 font-sans">
          Alamat operasional fisik dan dokumentasi foto gerai untuk penerbitan QRIS cabang outlet ini.
        </p>
      </div>



      <div className="space-y-4">
        {/* Address */}
        <GuidedField guideKey="address" className="space-y-1.5 font-sans">
          <label className="text-xs font-semibold text-slate-700 font-sans">
            Alamat Lengkap Gerai <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={2}
            disabled={isPreviewOnly || isUploading}
            value={formData.address}
            onChange={(e) => onFormChange('address', e.target.value)}
            placeholder="Jalan, nomor bangunan, RT/RW, kelurahan..."
            className="w-full rounded-[6px] border border-slate-300 bg-white p-3 text-sm font-sans font-normal text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0e59f9] focus:ring-1 focus:ring-[#0e59f9] disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed resize-none transition-colors"
          />
        </GuidedField>

        {/* Cascading Region Grid: Provinsi, Kota/Kabupaten, Kecamatan, Kode Pos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* 1. Provinsi */}
          <GuidedField guideKey="address" className="space-y-1.5 font-sans">
            <label className="text-xs font-semibold text-slate-700 font-sans">
              Provinsi <span className="text-rose-500">*</span>
            </label>
            <SearchableDropdown
              value={formData.province || ''}
              onChange={handleProvinceChange}
              options={provinceOptions}
              placeholder="Pilih provinsi..."
              searchPlaceholder="Cari nama provinsi..."
              emptyText="Provinsi tidak ditemukan"
              disabled={isPreviewOnly || isUploading}
            />
          </GuidedField>

          {/* 2. Kota / Kabupaten */}
          <GuidedField guideKey="address" className="space-y-1.5 font-sans">
            <label className="text-xs font-semibold text-slate-700 font-sans">
              Kota / Kabupaten <span className="text-rose-500">*</span>
            </label>
            <SearchableDropdown
              value={formData.city || ''}
              onChange={handleCityChange}
              options={regencyOptions}
              placeholder="Pilih kabupaten/kota..."
              searchPlaceholder="Cari kabupaten atau kota..."
              emptyText="Kabupaten/kota tidak ditemukan"
              disabled={isPreviewOnly || isUploading || !formData.province}
              disabledPlaceholder="Pilih provinsi terlebih dahulu"
              loading={isLoadingRegencies}
              loadingText="Memuat kabupaten/kota..."
            />
          </GuidedField>

          {/* 3. Kecamatan */}
          <GuidedField guideKey="address" className="space-y-1.5 font-sans">
            <label className="text-xs font-semibold text-slate-700 font-sans">
              Kecamatan <span className="text-rose-500">*</span>
            </label>
            <SearchableDropdown
              value={formData.district || ''}
              onChange={handleDistrictChange}
              options={districtOptions}
              placeholder="Pilih kecamatan..."
              searchPlaceholder="Cari nama kecamatan..."
              emptyText="Kecamatan tidak ditemukan"
              disabled={isPreviewOnly || isUploading || !formData.city}
              disabledPlaceholder="Pilih kabupaten/kota terlebih dahulu"
              loading={isLoadingDistricts}
              loadingText="Memuat kecamatan..."
            />
          </GuidedField>

          {/* 4. Kode Pos */}
          <GuidedField guideKey="address" className="space-y-1.5 font-sans">
            <label className="text-xs font-semibold text-slate-700 font-sans">
              Kode Pos (5 Digit) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              maxLength={5}
              disabled={isPreviewOnly || isUploading}
              value={formData.postalCode}
              onChange={(e) => onFormChange('postalCode', e.target.value.replace(/\D/g, ''))}
              placeholder="Contoh: 68411"
              className="w-full h-10 rounded-[6px] border border-slate-300 bg-white px-3.5 text-sm font-sans font-normal text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0e59f9] focus:ring-1 focus:ring-[#0e59f9] disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
            />
          </GuidedField>
        </div>

        {/* Google Maps URL & GPS Helper */}
        <GuidedField guideKey="coordinates" className="space-y-2 pt-1 border-t border-slate-100 font-sans">
          <div className="flex items-center justify-between font-sans">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 font-sans">
              <MapPin className="w-3.5 h-3.5 text-[#0e59f9]" />
              <span>Link Google Maps / Titik Koordinat GPS</span>
            </label>
            <button
              type="button"
              onClick={handleDetectCurrentLocation}
              disabled={isPreviewOnly || isUploading}
              className="group inline-flex items-center gap-1.5 h-6 px-2 rounded-[6px] text-[11px] font-semibold text-[#0e59f9] bg-blue-50 hover:bg-[#0e59f9] hover:text-white border border-blue-100 hover:border-[#0e59f9] transition-all duration-200 ease-out active:scale-95 shadow-2xs cursor-pointer select-none disabled:opacity-40 disabled:cursor-not-allowed font-sans"
            >
              <LocateFixed className="w-3 h-3 transition-transform duration-300 group-hover:scale-110" />
              <span>Gunakan Lokasi Saat Ini</span>
            </button>
          </div>

          <input
            type="url"
            disabled={isPreviewOnly || isUploading}
            value={formData.mapsUrl}
            onChange={(e) => handleMapsUrlChange(e.target.value)}
            placeholder="Tempelkan link share Google Maps (contoh: https://maps.app.goo.gl/...)"
            className="w-full h-10 rounded-[6px] border border-slate-300 bg-white px-3.5 text-sm font-sans font-normal text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0e59f9] focus:ring-1 focus:ring-[#0e59f9] disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
          />

          <p className="text-[11px] text-slate-400 font-sans">
            Koordinat terdeteksi:{' '}
            <span className="font-sans text-slate-700 font-medium">
              {coordinatesDisplay}
            </span>
          </p>
        </GuidedField>

        {/* Storefront & Cashier Photos */}
        <div className="space-y-3 pt-2 border-t border-slate-100 font-sans">
          <GuidedField guideKey="storefront_photo">
            <UploadZone
              label="Foto Tampak Depan Gerai (Plang / Fasad)"
              required
              hint="Format: JPG atau PNG. Terlihat nama toko/plang dan pintu masuk gerai (Maks 5 MB)."
              previewUrl={storefrontPreviewUrl}
              currentFileName={documents['FOTO_TAMPAK_DEPAN']?.fileName}
              fileSizeBytes={documents['FOTO_TAMPAK_DEPAN']?.fileSizeBytes}
              storageKey={documents['FOTO_TAMPAK_DEPAN']?.storageKey}
              reviewStatus={documents['FOTO_TAMPAK_DEPAN']?.reviewStatus}
              reviewNote={documents['FOTO_TAMPAK_DEPAN']?.reviewNote}
              isNewlyUpdated={Boolean(documents['FOTO_TAMPAK_DEPAN']?.isNewlyUpdated)}
              isUploading={isUploading}
              disabled={isPreviewOnly || isUploading}
              onFileSelect={(file) => onPhotoUpload('FOTO_TAMPAK_DEPAN', file)}
              onRemove={() => onPhotoRemove('FOTO_TAMPAK_DEPAN')}
            />
          </GuidedField>

          <GuidedField guideKey="cashier_photo">
            <UploadZone
              label="Foto Area Kasir / Bagian Dalam Gerai"
              required
              hint="Format: JPG atau PNG. Terlihat meja kasir, etalase, atau area operasional (Maks 5 MB)."
              previewUrl={cashierPreviewUrl}
              currentFileName={documents['FOTO_KASIR']?.fileName}
              fileSizeBytes={documents['FOTO_KASIR']?.fileSizeBytes}
              storageKey={documents['FOTO_KASIR']?.storageKey}
              reviewStatus={documents['FOTO_KASIR']?.reviewStatus}
              reviewNote={documents['FOTO_KASIR']?.reviewNote}
              isNewlyUpdated={Boolean(documents['FOTO_KASIR']?.isNewlyUpdated)}
              isUploading={isUploading}
              disabled={isPreviewOnly || isUploading}
              onFileSelect={(file) => onPhotoUpload('FOTO_KASIR', file)}
              onRemove={() => onPhotoRemove('FOTO_KASIR')}
            />
          </GuidedField>
        </div>
      </div>
    </div>
  );
}
