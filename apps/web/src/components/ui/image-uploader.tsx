'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Trash2, RefreshCw, Loader2, Image as ImageIcon } from 'lucide-react';
import { uploadImageToSupabase } from '@/lib/actions/storage';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ImageUploaderProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  bucket?: string;
  name?: string;
  label?: string;
  description?: string;
  aspectRatio?: 'square' | 'video' | 'wide' | 'auto';
  className?: string;
  previewHeight?: string;
}

export function ImageUploader({
  value,
  onChange,
  bucket = 'storefront_images',
  name,
  label,
  description,
  aspectRatio = 'auto',
  className,
  previewHeight = 'h-40',
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Berkas harus berupa gambar (JPG, PNG, WEBP, GIF)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran gambar maksimal 5MB');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await uploadImageToSupabase(formData, bucket);
      if (res.success && res.url) {
        onChange(res.url);
        toast.success('Gambar berhasil diunggah ke Supabase');
      } else {
        toast.error(res.error || 'Gagal mengunggah gambar');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Terjadi kesalahan saat upload');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const aspectClass = 
    aspectRatio === 'square' ? 'aspect-square max-w-[200px]' :
    aspectRatio === 'video' ? 'aspect-video max-w-full' :
    aspectRatio === 'wide' ? 'aspect-[3/1] max-w-full' :
    previewHeight;

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{label}</span>
          {isUploading && (
            <span className="text-xs text-primary flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" /> Mengunggah...
            </span>
          )}
        </div>
      )}

      {/* Hidden input to submit with standard form if used */}
      {name && <input type="hidden" name={name} value={value || ''} />}

      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleInputChange}
        disabled={isUploading}
      />

      {value ? (
        <div className="relative group rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
          <img
            src={value}
            alt="Preview"
            className={cn("w-full object-cover transition-opacity", aspectClass)}
          />

          {/* Overlay Actions */}
          <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2 backdrop-blur-xs">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="h-8 text-xs font-semibold rounded-lg shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Ganti
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={() => onChange(null)}
              disabled={isUploading}
              className="h-8 text-xs font-semibold rounded-lg shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Hapus
            </Button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2",
            isDragging
              ? "border-primary bg-primary/5 dark:bg-primary/10"
              : "border-slate-200 dark:border-slate-800 hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-900/50",
            isUploading && "opacity-60 cursor-not-allowed",
            previewHeight
          )}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <span className="text-xs font-semibold text-primary">Mengunggah ke Supabase Storage...</span>
            </div>
          ) : (
            <>
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Upload className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Pilih atau tarik file gambar ke sini
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Format JPG, PNG, WEBP hingga 5MB (Langsung ke Supabase)
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
