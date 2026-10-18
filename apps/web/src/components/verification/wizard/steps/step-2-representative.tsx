'use client';

import * as React from 'react';
import { GuidedField } from '../guideline-context';
import { UploadZone } from '@/components/verification/shared/upload-zone';
import { NationalityDropdown } from '@/components/verification/shared/nationality-dropdown';
import { PositionDropdown } from '@/components/verification/shared/position-dropdown';
import { UserRound, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step2RepresentativeProps {
  isUsingExistingProfile: boolean;
  existingProfile?: any;
  isRepaired?: boolean;
  sectionReviewNote?: string | null;
  sectionReviewStatus?: string | null;
  formData: {
    responsiblePersonName: string;
    responsiblePersonNik: string;
    responsiblePersonContact: string;
    responsiblePersonPosition?: string;
    responsiblePersonPhone?: string;
    responsiblePersonEmail?: string;
    responsiblePersonNationality?: string;
  };
  onFormChange: (field: string, val: any) => void;
  documents: Record<string, any>;
  ktpPreviewUrl?: string | null;
  onDocumentUpload: (docType: string, file: File) => Promise<void>;
  onDocumentRemove: (docType: string) => void;
  isUploading: boolean;
  isPreviewOnly?: boolean;
}

export function Step2Representative({
  isUsingExistingProfile,
  existingProfile,
  isRepaired = false,
  sectionReviewNote,
  sectionReviewStatus,
  formData,
  onFormChange,
  documents,
  ktpPreviewUrl,
  onDocumentUpload,
  onDocumentRemove,
  isUploading,
  isPreviewOnly = false,
}: Step2RepresentativeProps) {
  const isNeedsChanges = sectionReviewStatus === 'CHANGES_REQUESTED';
  const isDocRepaired = Boolean(documents['KTP']?.isNewlyUpdated);
  const isSectionRepaired = Boolean(isRepaired || isDocRepaired);
  // Derive phone digits without +62 or leading 0 for the input field
  const currentPhoneDigits = (formData.responsiblePersonPhone || formData.responsiblePersonContact || '')
    .replace(/^(\+62\s*|62|0)/, '')
    .replace(/\D/g, '');

  const handlePhoneInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '');
    onFormChange('responsiblePersonPhone', digits ? `+62 ${digits}` : '');
    onFormChange('responsiblePersonContact', digits ? `0${digits}` : '');
  };

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 font-sans">
          Informasi Perwakilan Bisnis
        </h2>
        <p className="text-xs text-slate-500 mt-1 font-sans">
          Identitas resmi penanggung jawab usaha atau direktur utama yang sah sesuai e-KTP.
        </p>
      </div>



      {isUsingExistingProfile && existingProfile && !isNeedsChanges && !isSectionRepaired && (
        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-[6px] bg-blue-50/70 border border-blue-200/60 text-xs font-semibold text-[#0e59f9]">
          <Check className="w-4 h-4 text-[#0e59f9] flex-shrink-0" />
          <span>Menggunakan data penanggung jawab dari profil usaha terdaftar</span>
        </div>
      )}

      <div className="space-y-4">
        {/* 1. Nama Penanggung Jawab */}
        <GuidedField guideKey="pic_name" className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700">
            Nama Penanggung Jawab
          </label>
          <input
            type="text"
            disabled={isPreviewOnly || isUploading}
            value={formData.responsiblePersonName}
            onChange={(e) => onFormChange('responsiblePersonName', e.target.value)}
            placeholder="Contoh: Budi Santoso"
            className="w-full h-10 rounded-[6px] border border-slate-300 bg-white px-3.5 text-sm font-normal text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0e59f9] focus:ring-1 focus:ring-[#0e59f9] disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
          />
        </GuidedField>

        {/* 2. Jabatan di Company */}
        <GuidedField guideKey="pic_position" className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700">
            Jabatan di Company
          </label>
          <PositionDropdown
            value={formData.responsiblePersonPosition || ''}
            onChange={(val) => onFormChange('responsiblePersonPosition', val)}
            disabled={isPreviewOnly || isUploading}
          />
        </GuidedField>

        {/* 3. Nomor Telepon & Email (Grid 2 Kolom) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nomor Telepon */}
          <GuidedField guideKey="pic_contact" className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Nomor Telepon
            </label>
            <div className="flex items-center gap-2">
              {/* Clean Country Code Prefix Badge */}
              <div className="w-14 h-10 rounded-[6px] border border-slate-300 bg-slate-50 flex items-center justify-center text-sm font-medium text-slate-700 select-none flex-shrink-0">
                +62
              </div>

              {/* Phone Input without duplicate label */}
              <div className="relative flex-1">
                <input
                  type="tel"
                  disabled={isPreviewOnly || isUploading}
                  value={currentPhoneDigits}
                  onChange={handlePhoneInputChange}
                  placeholder="81234567890"
                  className="w-full h-10 rounded-[6px] border border-slate-300 bg-white px-3.5 text-sm font-normal text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0e59f9] focus:ring-1 focus:ring-[#0e59f9] disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
                />
              </div>
            </div>
          </GuidedField>

          {/* Email */}
          <GuidedField guideKey="pic_email" className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Email
            </label>
            <input
              type="email"
              disabled={isPreviewOnly || isUploading}
              value={formData.responsiblePersonEmail || ''}
              onChange={(e) => onFormChange('responsiblePersonEmail', e.target.value)}
              placeholder="nama@email.com"
              className="w-full h-10 rounded-[6px] border border-slate-300 bg-white px-3.5 text-sm font-normal text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0e59f9] focus:ring-1 focus:ring-[#0e59f9] disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
            />
          </GuidedField>
        </div>

        {/* 4. Kewarganegaraan */}
        <GuidedField guideKey="pic_nationality" className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700">
            Kewarganegaraan
          </label>
          <NationalityDropdown
            value={formData.responsiblePersonNationality || ''}
            onChange={(val) => onFormChange('responsiblePersonNationality', val)}
            disabled={isPreviewOnly || isUploading}
          />
        </GuidedField>

        {/* 5. No. KTP (NIK) - Half Width matching column 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <GuidedField guideKey="pic_nik" className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              No. KTP (NIK)
            </label>
            <input
              type="text"
              maxLength={16}
              disabled={isPreviewOnly || isUploading}
              value={formData.responsiblePersonNik}
              onChange={(e) => onFormChange('responsiblePersonNik', e.target.value.replace(/\D/g, ''))}
              placeholder="Contoh: 3510xxxxxxxxxxxx (16 digit)"
              className="w-full h-10 rounded-[6px] border border-slate-300 bg-white px-3.5 text-sm font-sans font-normal text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0e59f9] focus:ring-1 focus:ring-[#0e59f9] disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
            />
          </GuidedField>
        </div>

        {/* 6. Kartu Tanda Penduduk */}
        <GuidedField guideKey="ktp" className="space-y-1.5">
          <UploadZone
            label="Kartu Tanda Penduduk"
            previewUrl={ktpPreviewUrl}
            currentFileName={documents['KTP']?.fileName}
            fileSizeBytes={documents['KTP']?.fileSizeBytes}
            storageKey={documents['KTP']?.storageKey}
            reviewStatus={documents['KTP']?.reviewStatus}
            reviewNote={documents['KTP']?.reviewNote}
            isNewlyUpdated={Boolean(documents['KTP']?.isNewlyUpdated)}
            isUploading={isUploading}
            disabled={isPreviewOnly || isUploading}
            onFileSelect={(file) => onDocumentUpload('KTP', file)}
            onRemove={() => onDocumentRemove('KTP')}
          />
        </GuidedField>
      </div>
    </div>
  );
}
