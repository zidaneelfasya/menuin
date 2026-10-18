'use client';

import * as React from 'react';
import { GuidedField } from '../guideline-context';
import { UploadZone } from '@/components/verification/shared/upload-zone';
import { EntityDropdown } from '@/components/verification/shared/entity-dropdown';
import { Building2, Plus, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EntityType } from '@menuin/types';

interface Step1BusinessProfileProps {
  availableProfiles: any[];
  selectedProfileId: string;
  onSelectProfileId: (id: string) => void;
  isCreatingNew: boolean;
  onToggleCreatingNew: (val: boolean) => void;
  isEditingSelectedProfile?: boolean;
  onToggleEditingSelectedProfile?: (val: boolean) => void;
  isRepaired?: boolean;
  sectionReviewNote?: string | null;
  sectionReviewStatus?: string | null;
  formData: {
    name: string;
    entityType: EntityType;
    taxId: string;
    businessLicenseNumber: string;
  };
  onFormChange: (field: string, val: any) => void;
  documents: Record<string, any>;
  docPreviews?: Record<string, string>;
  onDocumentUpload: (docType: string, file: File) => Promise<void>;
  onDocumentRemove: (docType: string) => void;
  isUploading: boolean;
  isPreviewOnly?: boolean;
}

export function Step1BusinessProfile({
  availableProfiles,
  selectedProfileId,
  onSelectProfileId,
  isCreatingNew,
  onToggleCreatingNew,
  isEditingSelectedProfile = false,
  onToggleEditingSelectedProfile,
  isRepaired = false,
  sectionReviewNote,
  sectionReviewStatus,
  formData,
  onFormChange,
  documents,
  docPreviews,
  onDocumentUpload,
  onDocumentRemove,
  isUploading,
  isPreviewOnly = false,
}: Step1BusinessProfileProps) {
  const hasExistingProfiles = availableProfiles.length > 0;
  const showForm = true;

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 font-sans">
          Profil Usaha &amp; Legalitas
        </h2>
        <p className="text-xs text-slate-500 mt-1 font-sans">
          Pilih profil bisnis yang sudah terdaftar atau daftarkan profil legal baru untuk outlet ini.
        </p>
      </div>

      {/* Multi-Outlet Reusability Section */}
      {hasExistingProfiles && (
        <div className="space-y-3 font-sans">
          <label className="text-xs font-semibold text-slate-700 block font-sans">
            Pilihan Profil Bisnis
          </label>

          <div className="space-y-2">
            {availableProfiles.map((p) => {
              const isSelected = !isCreatingNew && selectedProfileId === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => {
                    if (isPreviewOnly || isUploading) return;
                    onToggleCreatingNew(false);
                    onSelectProfileId(p.id);
                  }}
                  className={cn(
                    'p-3.5 rounded-[6px] border transition-colors flex items-center justify-between',
                    isPreviewOnly || isUploading
                      ? 'border-slate-200 bg-slate-50 opacity-70 cursor-not-allowed'
                      : isSelected
                      ? 'border-[#0e59f9] bg-[#0e59f9]/5 shadow-xs cursor-pointer'
                      : 'border-slate-200 bg-white hover:border-slate-300 cursor-pointer'
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-[6px] flex items-center justify-center flex-shrink-0 transition-colors',
                        isSelected ? 'bg-[#0e59f9] text-white' : 'bg-slate-100 text-slate-600'
                      )}
                    >
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-slate-900 truncate">
                          {p.name}
                        </span>
                        <span className="px-2 py-0.5 rounded-xl text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {p.entityType}
                        </span>
                        {p.verificationStatus === 'verified' && (
                          <span className="px-2 py-0.5 rounded-xl text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                            Terverifikasi
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {p.taxId ? `NPWP: ${p.taxId}` : 'Belum ada NPWP'} &bull;{' '}
                        {p.businessLicenseNumber ? `NIB: ${p.businessLicenseNumber}` : 'NIB belum diisi'}
                      </p>
                    </div>
                  </div>

                  <div
                    className={cn(
                      'w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ml-3',
                      isSelected ? 'border-[#0e59f9] bg-[#0e59f9] text-white' : 'border-slate-300 bg-white'
                    )}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[2.5]" />}
                  </div>
                </div>
              );
            })}

            {/* Option to create brand new profile */}
            <div
              onClick={() => {
                if (isPreviewOnly || isUploading) return;
                onToggleCreatingNew(true);
              }}
              className={cn(
                'p-3.5 rounded-[6px] border transition-colors flex items-center justify-between',
                isPreviewOnly || isUploading
                  ? 'border-slate-200 bg-slate-50 opacity-70 cursor-not-allowed'
                  : isCreatingNew
                  ? 'border-[#0e59f9] bg-[#0e59f9]/5 shadow-xs cursor-pointer'
                  : 'border-dashed border-slate-300 bg-white hover:border-slate-400 cursor-pointer'
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'w-8 h-8 rounded-[6px] flex items-center justify-center flex-shrink-0 transition-colors',
                    isCreatingNew ? 'bg-[#0e59f9] text-white' : 'bg-slate-100 text-slate-600'
                  )}
                >
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-900">
                    Daftarkan Profil Bisnis Baru
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Buat entitas hukum atau kepemilikan bisnis baru yang terpisah.
                  </p>
                </div>
              </div>

              <div
                className={cn(
                  'w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ml-3',
                  isCreatingNew ? 'border-[#0e59f9] bg-[#0e59f9] text-white' : 'border-slate-300 bg-white'
                )}
              >
                {isCreatingNew && <Check className="w-3 h-3 stroke-[2.5]" />}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form Fields: Displayed if creating new, no existing profiles, or editing/repairing selected profile */}
      {showForm && (
        <div className="space-y-4 pt-2 border-t border-slate-100 font-sans">


          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 block font-sans">
              {isCreatingNew ? 'Formulir Profil Usaha Baru' : 'Data Legalitas Usaha'}
            </span>
          </div>

          {/* Entity Type Selector */}
          <GuidedField guideKey="entity_type" className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Bentuk Entitas Usaha <span className="text-rose-500">*</span>
            </label>
            <EntityDropdown
              value={formData.entityType}
              onChange={(val) => onFormChange('entityType', val)}
              disabled={isPreviewOnly || isUploading}
            />
          </GuidedField>

          {/* Business Name */}
          <GuidedField guideKey="business_name" className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Nama Legal Usaha / Badan Usaha <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              disabled={isPreviewOnly || isUploading}
              value={formData.name}
              onChange={(e) => onFormChange('name', e.target.value)}
              placeholder="Contoh: PT Solusi Kuliner Nusantara"
              className="w-full h-10 rounded-[6px] border border-slate-300 bg-white px-3.5 text-sm font-normal text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0e59f9] focus:ring-1 focus:ring-[#0e59f9] disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
            />
          </GuidedField>

          {/* NIB & Document */}
          <GuidedField guideKey="nib" className="space-y-2.5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Nomor Induk Berusaha (NIB)
              </label>
              <input
                type="text"
                disabled={isPreviewOnly || isUploading}
                value={formData.businessLicenseNumber}
                onChange={(e) => onFormChange('businessLicenseNumber', e.target.value)}
                placeholder="Contoh: 0220108230192 (13 digit)"
                className="w-full h-10 rounded-[6px] border border-slate-300 bg-white px-3.5 text-sm font-normal text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0e59f9] focus:ring-1 focus:ring-[#0e59f9] disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
              />
            </div>

            <UploadZone
              label="Dokumen NIB (Nomor Induk Berusaha)"
              hint="Format: PDF, JPG, atau PNG. Lampirkan seluruh halaman (Maks 5 MB)."
              currentFileName={documents['NIB']?.fileName}
              fileSizeBytes={documents['NIB']?.fileSizeBytes}
              previewUrl={documents['NIB']?.previewUrl || docPreviews?.['NIB']}
              storageKey={documents['NIB']?.storageKey}
              reviewStatus={documents['NIB']?.reviewStatus}
              reviewNote={documents['NIB']?.reviewNote}
              isNewlyUpdated={Boolean(documents['NIB']?.isNewlyUpdated)}
              isUploading={isUploading}
              disabled={isPreviewOnly || isUploading}
              onFileSelect={(file) => onDocumentUpload('NIB', file)}
              onRemove={() => onDocumentRemove('NIB')}
            />
          </GuidedField>

          {/* NPWP & Document */}
          <GuidedField guideKey="npwp" className="space-y-2.5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Nomor Pokok Wajib Pajak (NPWP 16 Digit)
              </label>
              <input
                type="text"
                disabled={isPreviewOnly || isUploading}
                value={formData.taxId}
                onChange={(e) => onFormChange('taxId', e.target.value)}
                placeholder="Contoh: 01.234.567.8-012.000"
                className="w-full h-10 rounded-[6px] border border-slate-300 bg-white px-3.5 text-sm font-normal text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0e59f9] focus:ring-1 focus:ring-[#0e59f9] disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
              />
            </div>

            <UploadZone
              label="Foto Kartu / Surat Keterangan NPWP"
              hint="Format: JPG, PNG, atau PDF. Maksimal 5 MB."
              currentFileName={documents['NPWP']?.fileName}
              fileSizeBytes={documents['NPWP']?.fileSizeBytes}
              previewUrl={documents['NPWP']?.previewUrl || docPreviews?.['NPWP']}
              storageKey={documents['NPWP']?.storageKey}
              reviewStatus={documents['NPWP']?.reviewStatus}
              reviewNote={documents['NPWP']?.reviewNote}
              isNewlyUpdated={Boolean(documents['NPWP']?.isNewlyUpdated)}
              isUploading={isUploading}
              disabled={isPreviewOnly || isUploading}
              onFileSelect={(file) => onDocumentUpload('NPWP', file)}
              onRemove={() => onDocumentRemove('NPWP')}
            />
          </GuidedField>
        </div>
      )}
    </div>
  );
}
