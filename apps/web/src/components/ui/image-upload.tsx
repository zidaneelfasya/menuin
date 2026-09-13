'use client';

import * as React from 'react';
import { Upload, X, Loader2, Image as ImageIcon, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ImageUploadProps {
  value?: string | null;
  onChange: (url: string) => void;
  onRemove?: () => void;
  folder?: 'products' | 'logos' | 'banners' | 'receipts' | 'general';
  aspectRatio?: 'square' | 'video' | 'wide' | 'auto';
  label?: string;
  helperText?: string;
  disabled?: boolean;
  className?: string;
}

export function ImageUpload({
  value,
  onChange,
  onRemove,
  folder = 'general',
  aspectRatio = 'square',
  label,
  helperText,
  disabled = false,
  className = '',
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Format file tidak didukung. Harap pilih file gambar (JPG, PNG, WebP, SVG).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Ukuran gambar terlalu besar. Maksimal 10MB.');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal mengunggah gambar');
      }

      onChange(data.url);
      toast.success('Foto berhasil diunggah');
    } catch (err: any) {
      console.error('Upload error:', err);
      toast.error(err.message || 'Gagal mengunggah foto');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled || isUploading) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const getAspectClass = () => {
    switch (aspectRatio) {
      case 'square':
        return 'aspect-square max-w-[160px]';
      case 'video':
        return 'aspect-[16/9] w-full max-w-md';
      case 'wide':
        return 'aspect-[3/1] w-full max-w-lg';
      default:
        return 'min-h-[140px] w-full';
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && <label className="text-sm font-medium text-foreground block">{label}</label>}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
        className="hidden"
        disabled={disabled || isUploading}
      />

      {value ? (
        <div className="relative group inline-block">
          <div
            className={`relative overflow-hidden rounded-xl border border-border bg-muted/40 ${getAspectClass()}`}
          >
            <img
              src={value}
              alt="Preview"
              className="w-full h-full object-cover rounded-xl transition-transform duration-300 group-hover:scale-105"
            />
            {isUploading && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center text-white">
                <Loader2 className="w-6 h-6 animate-spin mb-1" />
                <span className="text-xs font-medium">Mengunggah...</span>
              </div>
            )}
          </div>

          {!disabled && !isUploading && (
            <div className="mt-2 flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs h-8 gap-1.5 rounded-lg"
              >
                <Upload className="w-3.5 h-3.5" />
                Ganti Foto
              </Button>
              {onRemove && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onRemove}
                  className="text-xs h-8 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg"
                >
                  <X className="w-3.5 h-3.5 mr-1" />
                  Hapus
                </Button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${getAspectClass()} ${
            isDragging
              ? 'border-primary bg-primary/10 scale-[1.01]'
              : 'border-border/80 hover:border-primary/60 hover:bg-muted/40 bg-muted/20'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center justify-center text-primary">
              <Loader2 className="w-7 h-7 animate-spin mb-2" />
              <span className="text-xs font-medium">Mengunggah file...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
                <Upload className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-foreground">Klik atau Tarik Foto ke sini</span>
              <span className="text-[11px] text-muted-foreground mt-0.5">JPG, PNG, WebP (Maks. 10MB)</span>
            </div>
          )}
        </div>
      )}

      {helperText && <p className="text-xs text-muted-foreground">{helperText}</p>}
    </div>
  );
}
