'use client';

import * as React from 'react';
import { GuidedField } from '../guideline-context';
import { UploadZone } from '@/components/verification/shared/upload-zone';
import { BankDropdown } from '@/components/verification/shared/bank-dropdown';
import { Landmark, Plus, Check, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { calculateNameMatchScore } from '@/lib/verification/settlement-utils';

interface Step3SettlementProps {
  existingAccounts: any[];
  selectedAccountId: string;
  onSelectAccountId: (id: string) => void;
  isAddingNew: boolean;
  onToggleAddingNew: (val: boolean) => void;
  isEditingExisting?: boolean;
  onToggleEditingExisting?: (val: boolean) => void;
  isRepaired?: boolean;
  sectionReviewNote?: string | null;
  sectionReviewStatus?: string | null;
  formData: {
    bankName: string;
    customBankName: string;
    bankAccountNumber: string;
    bankAccountHolder: string;
    isDefault: boolean;
  };
  onFormChange: (field: string, val: any) => void;
  picName: string;
  businessName: string;
  proofDocument?: any;
  proofPreviewUrl?: string | null;
  onProofUpload: (file: File) => Promise<void>;
  onProofRemove: () => void;
  isUploading: boolean;
  isPreviewOnly?: boolean;
}

export function Step3Settlement({
  existingAccounts,
  selectedAccountId,
  onSelectAccountId,
  isAddingNew,
  onToggleAddingNew,
  isEditingExisting = false,
  onToggleEditingExisting,
  isRepaired = false,
  sectionReviewNote,
  sectionReviewStatus,
  formData,
  onFormChange,
  picName,
  businessName,
  proofDocument,
  proofPreviewUrl,
  onProofUpload,
  onProofRemove,
  isUploading,
  isPreviewOnly = false,
}: Step3SettlementProps) {
  const hasExistingAccounts = existingAccounts.length > 0;
  const isNeedsChanges = sectionReviewStatus === 'CHANGES_REQUESTED';
  const selectedAccount = existingAccounts.find((a) => a.id === selectedAccountId);

  const isSectionRepaired = Boolean(
    isRepaired ||
      ((isAddingNew || isEditingExisting) &&
        formData.bankAccountNumber.trim() &&
        formData.bankAccountHolder.trim())
  );

  // Real-time name match score calculation
  const matchScore = React.useMemo(() => {
    if (!formData.bankAccountHolder.trim()) return null;
    const scorePic = calculateNameMatchScore(formData.bankAccountHolder, picName);
    const scoreBiz = calculateNameMatchScore(formData.bankAccountHolder, businessName);
    return Math.max(scorePic, scoreBiz);
  }, [formData.bankAccountHolder, picName, businessName]);

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 font-sans">
          Rekening Settlement Bank
        </h2>
        <p className="text-xs text-slate-500 mt-1 font-sans">
          Rekening penampungan pencairan otomatis seluruh hasil transaksi pembayaran QRIS dinamis outlet.
        </p>
      </div>



      {/* Existing Accounts List */}
      {hasExistingAccounts && (
        <div className="space-y-3 font-sans">
          <label className="text-xs font-semibold text-slate-700 block font-sans">
            Pilihan Rekening Terdaftar
          </label>

          <div className="space-y-2">
            {existingAccounts.map((acc) => {
              const isSelected = !isAddingNew && selectedAccountId === acc.id;
              const isRejected = acc.verificationStatus === 'rejected';

              return (
                <div
                  key={acc.id}
                  onClick={() => {
                    if (isPreviewOnly || isUploading) return;
                    onToggleAddingNew(false);
                    onSelectAccountId(acc.id);
                    if (isRejected) {
                      onToggleEditingExisting?.(true);
                      if (!formData.bankName) onFormChange('bankName', acc.bankName);
                      if (!formData.bankAccountHolder) onFormChange('bankAccountHolder', acc.bankAccountHolder);
                    } else {
                      onToggleEditingExisting?.(false);
                    }
                  }}
                  className={cn(
                    'p-3.5 rounded-[6px] border transition-colors flex items-center justify-between',
                    isPreviewOnly || isUploading
                      ? 'border-slate-200 bg-slate-50 opacity-70 cursor-not-allowed'
                      : isRejected
                      ? isSelected
                        ? 'border-rose-400 bg-rose-50/40 shadow-xs cursor-pointer'
                        : 'border-rose-200 bg-white hover:border-rose-300 cursor-pointer'
                      : isSelected
                      ? 'border-[#0e59f9] bg-[#0e59f9]/5 shadow-xs cursor-pointer'
                      : 'border-slate-200 bg-white hover:border-slate-300 cursor-pointer'
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-[6px] flex items-center justify-center flex-shrink-0 transition-colors',
                        isRejected
                          ? 'bg-rose-100 text-rose-600'
                          : isSelected
                          ? 'bg-[#0e59f9] text-white'
                          : 'bg-slate-100 text-slate-600'
                      )}
                    >
                      <Landmark className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-slate-900 truncate">
                          {acc.bankName} &bull; {acc.bankAccountNumberMasked}
                        </span>
                        {acc.verificationStatus === 'verified' && (
                          <span className="px-2 py-0.5 rounded-xl text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                            Terverifikasi
                          </span>
                        )}
                        {isRejected && (
                          <span className="px-2 py-0.5 rounded-xl text-[10px] font-semibold bg-rose-50 text-rose-700">
                            Ditolak
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        a/n {acc.bankAccountHolder}
                      </p>
                      {isRejected && acc.verificationNotes && (
                        <p className="text-[11px] text-rose-600 mt-1 font-medium">
                          Catatan penolakan: {acc.verificationNotes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    {isRejected && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectAccountId(acc.id);
                          onToggleAddingNew(false);
                          onToggleEditingExisting?.(true);
                          onFormChange('bankName', acc.bankName);
                          onFormChange('bankAccountHolder', acc.bankAccountHolder);
                        }}
                        className="group inline-flex items-center gap-1.5 h-7 px-2.5 rounded-[6px] text-xs font-semibold text-[#0e59f9] bg-blue-50 hover:bg-[#0e59f9] hover:text-white border border-blue-200/60 hover:border-[#0e59f9] transition-all duration-200 ease-out active:scale-95 shadow-2xs hover:shadow-xs cursor-pointer select-none"
                      >
                        <RefreshCw className="w-3.5 h-3.5 transition-transform duration-500 ease-out group-hover:rotate-180" />
                        <span>Perbaiki Rekening</span>
                      </button>
                    )}
                    <div
                      className={cn(
                        'w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0',
                        isSelected ? 'border-[#0e59f9] bg-[#0e59f9] text-white' : 'border-slate-300 bg-white'
                      )}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[2.5]" />}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Option to Add New Bank Account */}
            <div
              onClick={() => {
                if (isPreviewOnly || isUploading) return;
                onToggleAddingNew(true);
                onToggleEditingExisting?.(false);
              }}
              className={cn(
                'p-3.5 rounded-[6px] border transition-colors flex items-center justify-between',
                isPreviewOnly || isUploading
                  ? 'border-slate-200 bg-slate-50 opacity-70 cursor-not-allowed'
                  : isAddingNew
                  ? 'border-[#0e59f9] bg-[#0e59f9]/5 shadow-xs cursor-pointer'
                  : 'border-dashed border-slate-300 bg-white hover:border-slate-400 cursor-pointer'
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'w-8 h-8 rounded-[6px] flex items-center justify-center flex-shrink-0 transition-colors',
                    isAddingNew ? 'bg-[#0e59f9] text-white' : 'bg-slate-100 text-slate-600'
                  )}
                >
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-900">
                    Tambah Rekening Bank Baru
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Daftarkan nomor rekening bank penampungan lain untuk gerai ini.
                  </p>
                </div>
              </div>

              <div
                className={cn(
                  'w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ml-3',
                  isAddingNew ? 'border-[#0e59f9] bg-[#0e59f9] text-white' : 'border-slate-300 bg-white'
                )}
              >
                {isAddingNew && <Check className="w-3 h-3 stroke-[2.5]" />}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Account Form (For New or Repaired Account) */}
      {(!hasExistingAccounts || isAddingNew || isEditingExisting) && (
        <div className="space-y-4 pt-2 border-t border-slate-100 font-sans">
          <div>
            <span className="text-xs font-semibold text-slate-800 block font-sans">
              {isEditingExisting && selectedAccount
                ? 'Perbaiki Informasi Rekening'
                : 'Formulir Rekening Baru'}
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {isEditingExisting && selectedAccount
                ? `Perbarui detail nomor rekening ${selectedAccount.bankName} (${selectedAccount.bankAccountNumberMasked}) untuk diajukan ulang.`
                : 'Daftarkan nomor rekening bank penampungan baru untuk gerai ini.'}
            </p>
          </div>

          {/* Bank Selector */}
          <GuidedField guideKey="bank_account" className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Pilihan Bank <span className="text-rose-500">*</span>
            </label>
            <BankDropdown
              value={formData.bankName}
              onChange={(val) => onFormChange('bankName', val)}
              disabled={isPreviewOnly || isUploading}
            />

            {formData.bankName === 'BANK LAINNYA' && (
              <input
                type="text"
                disabled={isPreviewOnly || isUploading}
                value={formData.customBankName}
                onChange={(e) => onFormChange('customBankName', e.target.value)}
                placeholder="Tuliskan nama bank resmi..."
                className="w-full h-10 rounded-[6px] border border-slate-300 bg-white px-3.5 text-sm font-normal text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0e59f9] focus:ring-1 focus:ring-[#0e59f9] disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors mt-2"
              />
            )}
          </GuidedField>

          {/* Account Number */}
          <GuidedField guideKey="bank_account" className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Nomor Rekening Bank <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              disabled={isPreviewOnly || isUploading}
              value={formData.bankAccountNumber}
              onChange={(e) => onFormChange('bankAccountNumber', e.target.value.replace(/\D/g, ''))}
              placeholder="Contoh: 1234567890 (hanya angka)"
              className="w-full h-10 rounded-[6px] border border-slate-300 bg-white px-3.5 text-sm font-sans font-normal text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0e59f9] focus:ring-1 focus:ring-[#0e59f9] disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
            />
          </GuidedField>

          {/* Account Holder Name */}
          <GuidedField guideKey="bank_holder" className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">
                Nama Pemilik Rekening (Sesuai Buku Tabungan) <span className="text-rose-500">*</span>
              </label>
              {matchScore !== null && (
                <span
                  className={cn(
                    'text-[10px] font-semibold px-2 py-0.5 rounded-xl',
                    matchScore >= 80 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  )}
                >
                  {matchScore}% Cocok dengan Data PIC
                </span>
              )}
            </div>
            <input
              type="text"
              disabled={isPreviewOnly || isUploading}
              value={formData.bankAccountHolder}
              onChange={(e) => onFormChange('bankAccountHolder', e.target.value)}
              placeholder="Contoh: BUDI SANTOSO"
              className="w-full h-10 rounded-[6px] border border-slate-300 bg-white px-3.5 text-sm font-normal text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0e59f9] focus:ring-1 focus:ring-[#0e59f9] disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
            />
          </GuidedField>

          {/* Passbook / Proof Upload */}
          <GuidedField guideKey="bank_proof" className="pt-2">
            <UploadZone
              label="Foto Buku Tabungan / Mutasi Rekening (Opsional)"
              hint="Format: JPG, PNG, atau PDF. Nomor & nama pemilik terlihat jelas (Maks 5 MB)."
              currentFileName={proofDocument?.fileName}
              fileSizeBytes={proofDocument?.fileSizeBytes}
              previewUrl={proofPreviewUrl || proofDocument?.previewUrl}
              storageKey={proofDocument?.storageKey}
              reviewStatus={proofDocument?.reviewStatus}
              reviewNote={proofDocument?.reviewNote}
              isNewlyUpdated={Boolean(proofDocument?.isNewlyUpdated)}
              isUploading={isUploading}
              disabled={isPreviewOnly || isUploading}
              onFileSelect={onProofUpload}
              onRemove={onProofRemove}
            />
          </GuidedField>
        </div>
      )}
    </div>
  );
}
