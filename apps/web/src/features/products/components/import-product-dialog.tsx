'use client';

import * as React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, FileSpreadsheet, Loader2 } from 'lucide-react';
import { importProducts } from '@/lib/actions/import';

export function ImportProductDialog() {
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
      if (!file.name.endsWith('.xlsx')) {
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

    if (!confirm("Apakah Anda yakin ingin mengimport file ini?")) return;

    const formData = new FormData();
    formData.append('file', selectedFile);

    startTransition(async () => {
      const res = await importProducts(formData);
      if (res.success) {
        setSuccessMsg(res.message || 'Berhasil mengimpor produk');
        setTimeout(() => {
          setOpen(false);
          setSelectedFile(null);
          setSuccessMsg(null);
        }, 2000);
      } else {
        setErrorMsg(res.error || 'Terjadi kesalahan saat mengimpor');
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      setOpen(val);
      if (!val) {
        setSelectedFile(null);
        setErrorMsg(null);
        setSuccessMsg(null);
      }
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="w-4 h-4" />
          Import Excel
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Import Produk dari Excel</DialogTitle>
          <DialogDescription>
            Pilih file Produk.xlsx yang telah Anda isi. Sistem otomatis membuat Kategori dan Barcode bila kosong.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div 
            className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${
              selectedFile ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-card'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              className="hidden" 
              accept=".xlsx" 
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            {selectedFile ? (
              <>
                <FileSpreadsheet className="w-8 h-8 text-primary mb-2" />
                <span className="text-sm font-medium text-foreground">{selectedFile.name}</span>
                <span className="text-xs text-muted-foreground mt-1">{(selectedFile.size / 1024).toFixed(1)} KB</span>
              </>
            ) : (
              <>
                <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                <span className="text-sm font-medium text-foreground">Klik untuk memilih file Excel</span>
                <span className="text-xs text-muted-foreground mt-1">Hanya mendukung format .xlsx</span>
              </>
            )}
          </div>

          {errorMsg && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="text-sm text-success bg-success/10 p-3 rounded-lg border border-success/20">
              {successMsg}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Batal
          </Button>
          <Button onClick={handleImport} disabled={!selectedFile || isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isPending ? 'Mengimpor...' : 'Mulai Import'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
