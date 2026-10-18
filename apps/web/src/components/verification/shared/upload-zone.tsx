'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import {
  Upload,
  FileText,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Trash2,
  ExternalLink,
  ShieldCheck,
  FileCheck,
  X,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { getVerificationDocumentSignedUrlAction } from '@/lib/actions/verification-storage';

interface UploadZoneProps {
  label?: string;
  required?: boolean;
  hint?: string;
  accept?: string;
  maxSizeBytes?: number;
  currentFileName?: string;
  fileSizeBytes?: number;
  previewUrl?: string | null;
  storageKey?: string;
  reviewStatus?: 'PENDING' | 'ACCEPTED' | 'REJECTED' | null;
  reviewNote?: string | null;
  isNewlyUpdated?: boolean;
  isUploading?: boolean;
  disabled?: boolean;
  onFileSelect: (file: File) => Promise<void> | void;
  onRemove?: () => void;
  className?: string;
}

function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return '';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function UploadZone({
  label,
  required,
  hint = 'Format: JPG, PNG, atau PDF. Maksimal 5 MB.',
  accept = 'image/jpeg,image/png,image/webp,application/pdf',
  maxSizeBytes = 5 * 1024 * 1024,
  currentFileName,
  fileSizeBytes,
  previewUrl,
  storageKey,
  reviewStatus,
  reviewNote,
  isNewlyUpdated = false,
  isUploading = false,
  disabled = false,
  onFileSelect,
  onRemove,
  className,
}: UploadZoneProps) {
  const [mounted, setMounted] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const [localFile, setLocalFile] = React.useState<File | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = React.useState<string | null>(null);
  const [showPreview, setShowPreview] = React.useState(false);
  const [isLoadingSignedUrl, setIsLoadingSignedUrl] = React.useState(false);
  const [fetchedSignedUrl, setFetchedSignedUrl] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Clean up object URLs on unmount
  React.useEffect(() => {
    return () => {
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl);
      }
    };
  }, [localPreviewUrl]);

  // Lock body scroll and listen for Escape when modal preview is active
  React.useEffect(() => {
    if (!showPreview) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowPreview(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showPreview]);

  const handleDragOver = (e: React.DragEvent) => {
    if (disabled || isUploading) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    if (disabled || isUploading) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      await validateAndUpload(file);
    }
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await validateAndUpload(file);
    }
    if (inputRef.current) inputRef.current.value = '';
  };

  const validateAndUpload = async (file: File) => {
    if (file.size > maxSizeBytes) {
      toast.error('Ukuran file melebihi batas maksimal 5 MB.');
      return;
    }

    try {
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl);
      }
      const objUrl = URL.createObjectURL(file);
      setLocalFile(file);
      setLocalPreviewUrl(objUrl);
      setFetchedSignedUrl(null);
      await onFileSelect(file);
    } catch {
      toast.error('Gagal memproses file.');
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLocalFile(null);
    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl);
      setLocalPreviewUrl(null);
    }
    setFetchedSignedUrl(null);
    setShowPreview(false);
    onRemove?.();
  };

  const effectiveFileName = currentFileName || localFile?.name || '';
  const effectiveFileSize = fileSizeBytes || localFile?.size;
  const effectivePreviewUrl = previewUrl || localPreviewUrl || fetchedSignedUrl || null;
  const hasFile = Boolean(effectiveFileName || effectivePreviewUrl);

  const isPdf =
    Boolean(effectiveFileName && effectiveFileName.toLowerCase().endsWith('.pdf')) ||
    localFile?.type === 'application/pdf' ||
    Boolean(effectivePreviewUrl && effectivePreviewUrl.toLowerCase().includes('.pdf'));

  const isImage =
    !isPdf &&
    Boolean(
      effectivePreviewUrl ||
      (localFile && localFile.type.startsWith('image/')) ||
      (effectiveFileName && /\.(jpe?g|png|webp|gif|svg)$/i.test(effectiveFileName))
    );

  const handleViewFile = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (effectivePreviewUrl) {
      setShowPreview(true);
      return;
    }

    const keyToFetch = storageKey;
    if (keyToFetch) {
      setIsLoadingSignedUrl(true);
      try {
        const res = await getVerificationDocumentSignedUrlAction(keyToFetch);
        if (res.success && res.signedUrl) {
          setFetchedSignedUrl(res.signedUrl);
          setShowPreview(true);
        } else {
          toast.error(res.error || 'Gagal memuat pratinjau dokumen.');
        }
      } catch {
        toast.error('Gagal memuat pratinjau dokumen.');
      } finally {
        setIsLoadingSignedUrl(false);
      }
      return;
    }

    setShowPreview(true);
  };

  const isUpdated = Boolean(isNewlyUpdated || localFile);
  const isRejected = reviewStatus === 'REJECTED' && !isUpdated;

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <div className="flex items-center justify-between gap-2">
          <label className="text-xs font-semibold text-slate-700 tracking-tight flex items-center gap-1">
            <span>{label}</span>
            {required && <span className="text-rose-500">*</span>}
          </label>

          {/* Right side alert icon with hover tooltip */}
          {isRejected && (
            <div className="relative group/fieldalert inline-flex items-center">
              <button
                type="button"
                className="text-amber-500 hover:text-amber-600 transition-colors p-0.5 rounded cursor-pointer focus:outline-none flex items-center gap-1"
                aria-label="Lihat catatan perbaikan"
              >
                <AlertCircle className="w-4 h-4 text-amber-500 stroke-[2.2]" />
              </button>
              {/* Tooltip on hover */}
              <div className="absolute right-0 bottom-full mb-1.5 hidden group-hover/fieldalert:flex group-focus-within/fieldalert:flex flex-col z-50 pointer-events-none w-64 p-2.5 bg-slate-900 text-white rounded-[6px] shadow-xl text-xs font-normal animate-in fade-in-0 zoom-in-95 duration-100">
                <div className="flex items-center gap-1.5 text-amber-400 font-semibold mb-1">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <span>Catatan Perbaikan</span>
                </div>
                <p className="text-slate-200 text-[11px] leading-relaxed">
                  {reviewNote || 'Dokumen belum sesuai. Harap unggah ulang dokumen yang valid dan terbaca jelas.'}
                </p>
                <div className="absolute top-full right-2 -mt-1 border-4 border-transparent border-t-slate-900" />
              </div>
            </div>
          )}

          {/* Right side Data Baru Diperbarui indicator */}
          {isUpdated && (
            <span className="inline-flex items-center text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-xl">
              <span>Data Baru Diperbarui</span>
            </span>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        disabled={disabled || isUploading}
        className="hidden"
      />

      {hasFile ? (
        <div className="space-y-2">
          {/* File Attached State: Clean, Professional Card. Click filename to view, with Ganti & Hapus buttons */}
          <div className="rounded-[6px] border border-[#CED3DC] bg-white p-2.5 sm:p-3 flex items-center justify-between gap-3 shadow-2xs hover:border-slate-400 transition-colors relative z-25">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Thumbnail / Icon (Clickable for preview) */}
            <button
              id={`upload-thumb-btn-${(label || 'file').toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
              type="button"
              onClick={handleViewFile}
              disabled={disabled || isUploading}
              data-allow-preview-click="true"
              title={`Klik untuk melihat isi file: ${effectiveFileName}`}
              className={cn(
                'flex-shrink-0 group relative focus:outline-none rounded-[6px]',
                disabled || isUploading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
              )}
            >
              {isImage && effectivePreviewUrl ? (
                <div className="w-11 h-11 rounded-[6px] border border-slate-200 overflow-hidden bg-slate-100 flex-shrink-0 relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={effectivePreviewUrl}
                    alt={effectiveFileName}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-medium">
                    Lihat
                  </div>
                </div>
              ) : isPdf ? (
                <div className="w-11 h-11 rounded-[6px] bg-rose-50 text-rose-600 border border-rose-100 flex flex-col items-center justify-center flex-shrink-0 group-hover:bg-rose-100/70 transition-colors">
                  <FileText className="w-5 h-5" />
                  <span className="text-[9px] font-semibold leading-none mt-0.5 font-sans">
                    PDF
                  </span>
                </div>
              ) : (
                <div className="w-11 h-11 rounded-[6px] bg-blue-50 text-[#0e59f9] border border-blue-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100/70 transition-colors">
                  <FileText className="w-5 h-5" />
                </div>
              )}
            </button>

            {/* Real File Name (Clickable to preview) & Status Info */}
            <div className="min-w-0 flex-1">
              <button
                id={`upload-filename-btn-${(label || 'file').toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                type="button"
                onClick={handleViewFile}
                data-allow-preview-click="true"
                disabled={isLoadingSignedUrl || disabled || isUploading}
                className={cn(
                  'text-left text-xs font-semibold text-slate-900 truncate transition-colors focus:outline-none block group max-w-full',
                  disabled || isUploading
                    ? 'cursor-not-allowed opacity-60'
                    : 'hover:text-[#0e59f9] cursor-pointer'
                )}
                title={`Klik untuk melihat isi file: ${effectiveFileName}`}
              >
                {isLoadingSignedUrl ? (
                  <span className="inline-flex items-center gap-1.5 text-slate-500">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0e59f9]" />
                    <span>Memuat dokumen...</span>
                  </span>
                ) : (
                  <span className="truncate">{effectiveFileName}</span>
                )}
              </button>
              <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-500 font-normal whitespace-nowrap overflow-hidden">
                {effectiveFileSize ? (
                  <span>{formatBytes(effectiveFileSize)}</span>
                ) : null}

                {reviewStatus === 'ACCEPTED' && (
                  <span className="inline-flex items-center text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-xl">
                    <span>Disetujui</span>
                  </span>
                )}
                {isUpdated && (
                  <span className="inline-flex items-center text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-xl">
                    <span>Data Baru Diperbarui</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons: Ganti dan Hapus */}
          <div className="flex items-center gap-1.5 flex-shrink-0">

            <button
              id={`upload-replace-btn-${(label || 'file').toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
              type="button"
              disabled={disabled || isUploading}
              onClick={() => inputRef.current?.click()}
              className="h-8 px-2.5 sm:px-3 rounded-[6px] border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
              title="Ganti dengan file lain"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span>Ganti</span>
            </button>

            {onRemove && (
              <button
                id={`upload-remove-btn-${(label || 'file').toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                type="button"
                disabled={disabled || isUploading}
                onClick={handleRemove}
                className="h-8 w-8 rounded-[6px] border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-200 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
                title="Hapus file"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
      ) : (
        /* Empty Upload Zone: Fully Clickable Container */
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !disabled && !isUploading) {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          onClick={() => !disabled && !isUploading && inputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'group rounded-[6px] border transition-all p-3 sm:p-3.5 flex items-center justify-between gap-3 select-none',
            disabled || isUploading
              ? 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
              : isDragging
              ? 'border-[#0e59f9] bg-blue-50/50 cursor-pointer shadow-xs'
              : 'border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50/50 cursor-pointer'
          )}
        >
          {isUploading ? (
            <div className="flex items-center gap-3 py-1">
              <Loader2 className="w-5 h-5 animate-spin text-[#0e59f9]" />
              <p className="text-xs text-slate-600 font-medium">Mengunggah file...</p>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3 min-w-0 flex-1">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-9 h-9 rounded-[4px] bg-blue-50 text-[#0e59f9] flex items-center justify-center flex-shrink-0 transition-colors group-hover:bg-[#0e59f9] group-hover:text-white">
                  <Upload className="w-4 h-4 transition-colors" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-800 truncate group-hover:text-[#0e59f9] transition-colors">
                    Unggah atau seret file ke sini
                  </p>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">{hint}</p>
                </div>
              </div>

            </div>
          )}
        </div>
      )}

      {/* Modal Pratinjau Dokumen (Direct Portal to Body, 100% Reliable without pointer locks) */}
      {showPreview &&
        mounted &&
        createPortal(
          <div
            id="preview-file-modal-root"
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6"
            role="dialog"
            aria-modal="true"
          >
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity cursor-pointer"
              onClick={() => setShowPreview(false)}
            />

            {/* Modal Card */}
            <div
              className="relative z-10 w-full max-w-3xl sm:max-w-4xl max-h-[90vh] bg-white rounded-xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 bg-white">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-[6px] bg-blue-50 text-[#0e59f9] flex items-center justify-center flex-shrink-0">
                    <FileCheck className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm sm:text-base font-semibold text-slate-900 tracking-tight truncate">
                      {label || 'Pratinjau Dokumen'}
                    </h3>
                    <div className="text-xs text-slate-500 font-normal mt-0.5 flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-slate-700 truncate max-w-[280px] sm:max-w-md">
                        {effectiveFileName}
                      </span>
                      {effectiveFileSize ? (
                        <>
                          <span className="text-slate-300">•</span>
                          <span>{formatBytes(effectiveFileSize)}</span>
                        </>
                      ) : null}
                      <span className="text-slate-300">•</span>
                      <span className="text-emerald-600 font-medium inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        Terlampir
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {effectivePreviewUrl && (
                    <a
                      href={effectivePreviewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-8 px-2.5 rounded-[6px] border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Buka dokumen di tab baru"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                      <span className="hidden sm:inline">Buka Penuh</span>
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowPreview(false)}
                    className="w-8 h-8 rounded-[6px] border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
                    title="Tutup (Esc)"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex items-center justify-center bg-slate-50 min-h-[300px]">
                {isImage && effectivePreviewUrl ? (
                  <div className="w-full flex items-center justify-center bg-slate-900 rounded-[8px] p-3 sm:p-4 shadow-inner overflow-hidden max-h-[62vh]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={effectivePreviewUrl}
                      alt={effectiveFileName}
                      className="max-h-[58vh] w-auto max-w-full object-contain rounded-[4px] shadow-sm select-none"
                    />
                  </div>
                ) : isPdf && effectivePreviewUrl ? (
                  <div className="w-full h-[62vh] rounded-[8px] overflow-hidden border border-slate-200 bg-white shadow-xs">
                    <iframe
                      src={`${effectivePreviewUrl}#toolbar=1&navpanes=0`}
                      title={effectiveFileName}
                      className="w-full h-full border-0"
                    />
                  </div>
                ) : (
                  <div className="py-10 px-6 text-center space-y-3 max-w-md mx-auto">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#0e59f9] flex items-center justify-center mx-auto">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{effectiveFileName}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Dokumen telah berhasil dilampirkan dan disimpan secara aman.
                      </p>
                    </div>
                    {effectivePreviewUrl && (
                      <a
                        href={effectivePreviewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[6px] bg-[#0e59f9] text-white text-xs font-medium hover:bg-[#0b46c7] transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Buka Dokumen
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-3 sm:p-4 border-t border-slate-100 bg-white flex items-center justify-between gap-3">
                <div className="text-[11px] text-slate-400 hidden sm:flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Dokumen dienkripsi dan diproses sesuai regulasi Bank Indonesia.</span>
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    disabled={disabled || isUploading}
                    onClick={() => {
                      setShowPreview(false);
                      inputRef.current?.click();
                    }}
                    className="h-8 px-3 rounded-[6px] border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                    <span>Ganti File</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowPreview(false)}
                    className="h-8 px-4 rounded-[6px] bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
