'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, FileSpreadsheet, Loader2, Download } from 'lucide-react';
import { importCategories } from '@/lib/actions/import';
import { toast } from 'sonner';

export function ImportCategoryDialog() {
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !file.name.endsWith('.csv')) {
        setErrorMsg('Format file tidak didukung. Harap gunakan file .xlsx');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleImport = () => {
    if (!selectedFile) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    startTransition(async () => {
      const res = await importCategories(formData);
      if (res.success) {
        setSuccessMsg(res.message || 'Berhasil mengimpor kategori');
        toast.success(res.message || 'Berhasil mengimpor kategori');
        setTimeout(() => {
          setOpen(false);
          setSelectedFile(null);
          setSuccessMsg(null);
        }, 1500);
      } else {
        setErrorMsg(res.error || 'Terjadi kesalahan saat mengimpor');
        toast.error(res.error || 'Gagal mengimpor kategori');
      }
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        setOpen(val);
        if (!val) {
          setSelectedFile(null);
          setErrorMsg(null);
          setSuccessMsg(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 rounded-xl">
          <Upload className="w-4 h-4" />
          Import Excel
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Import Kategori dari Excel</DialogTitle>
          <DialogDescription>
            Unggah file Excel (.xlsx) untuk menambahkan atau memperbarui kategori secara massal.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Download Template Banner */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/60 border border-border">
            <div className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground block">Belum punya formatnya?</span>
              Gunakan template resmi untuk kemudahan migrasi.
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              asChild
              className="gap-1.5 text-xs font-medium shrink-0 ml-2"
            >
              <a href="/api/templates/categories" download>
                <Download className="w-3.5 h-3.5" />
                Unduh Template
              </a>
            </Button>
          </div>

          <div
            className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${
              selectedFile
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50 hover:bg-card'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              className="hidden"
              accept=".xlsx, .xls, .csv"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            {selectedFile ? (
              <>
                <FileSpreadsheet className="w-8 h-8 text-primary mb-2" />
                <span className="text-sm font-medium text-foreground text-center max-w-[280px] truncate">
                  {selectedFile.name}
                </span>
                <span className="text-xs text-muted-foreground mt-1">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </span>
              </>
            ) : (
              <>
                <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                <span className="text-sm font-medium text-foreground">
                  Pilih atau drag & drop file Excel
                </span>
                <span className="text-xs text-muted-foreground mt-1">
                  Mendukung format .xlsx (.csv)
                </span>
              </>
            )}
          </div>

          {errorMsg && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800">
              {successMsg}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Batal
          </Button>
          <Button
            onClick={handleImport}
            disabled={!selectedFile || isPending}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isPending ? 'Mengimpor...' : 'Mulai Import'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
