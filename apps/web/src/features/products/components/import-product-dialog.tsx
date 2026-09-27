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
import { 
  Upload, 
  FileSpreadsheet, 
  Loader2, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  FileText, 
  Eye, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { importProducts } from '@/lib/actions/import';
import { downloadMenuTemplate } from '@/features/products/utils/menu-excel';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { formatCurrency } from '@/lib/utils/format';

interface PreviewRow {
  name: string;
  category?: string;
  price?: number;
  stock?: number;
  sku?: string;
}

export function ImportProductDialog() {
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [previewRows, setPreviewRows] = React.useState<PreviewRow[]>([]);
  const [totalParsedRows, setTotalParsedRows] = React.useState<number>(0);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const resetState = () => {
    setSelectedFile(null);
    setPreviewRows([]);
    setTotalParsedRows(0);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setPreviewRows([]);
    setTotalParsedRows(0);

    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext !== 'xlsx' && ext !== 'xls' && ext !== 'csv') {
        setErrorMsg('Format file tidak didukung. Harap gunakan file .xlsx, .xls, atau .csv');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);

      // Parse preview client-side
      try {
        const buffer = await file.arrayBuffer();
        const wb = XLSX.read(buffer, { type: 'buffer' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

        if (!rawData || rawData.length === 0) {
          setErrorMsg('File kosong.');
          return;
        }

        // Cari header
        let headerRow = 0;
        let nameIdx = 0;
        let catIdx = 1;
        let priceIdx = 2;
        let stockIdx = 4;
        let skuIdx = 7;

        for (let r = 0; r < Math.min(rawData.length, 10); r++) {
          const row = rawData[r];
          if (!row) continue;
          const normalized = row.map((c) => (c ? c.toString().toLowerCase() : ''));
          if (normalized.some((c) => c.includes('nama') || c.includes('produk') || c.includes('menu'))) {
            headerRow = r;
            normalized.forEach((c, idx) => {
              if (c.includes('nama') || c.includes('produk') || c.includes('menu')) nameIdx = idx;
              if (c.includes('kategori') || c.includes('category')) catIdx = idx;
              if (c.includes('harga') || c.includes('price')) priceIdx = idx;
              if (c.includes('stok') || c.includes('stock')) stockIdx = idx;
              if (c.includes('sku') || c.includes('kode')) skuIdx = idx;
            });
            break;
          }
        }

        const validRows: PreviewRow[] = [];
        for (let i = headerRow + 1; i < rawData.length; i++) {
          const row = rawData[i];
          if (!row || !row[nameIdx]) continue;
          const name = row[nameIdx]?.toString().trim();
          if (!name) continue;

          let rawPrice = row[priceIdx];
          let priceNum = 0;
          if (typeof rawPrice === 'number') priceNum = rawPrice;
          else if (typeof rawPrice === 'string') {
            const cleaned = rawPrice.replace(/[^0-9.-]/g, '');
            priceNum = parseFloat(cleaned) || 0;
          }

          validRows.push({
            name,
            category: row[catIdx]?.toString().trim() || 'Lainnya',
            price: priceNum,
            stock: parseInt(row[stockIdx]) || 0,
            sku: row[skuIdx]?.toString().trim() || '-',
          });
        }

        setTotalParsedRows(validRows.length);
        setPreviewRows(validRows.slice(0, 4)); // Preview top 4 rows
      } catch (err) {
        console.error('Error parsing file preview:', err);
      }
    }
  };

  const handleImport = () => {
    if (!selectedFile) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    startTransition(async () => {
      const res = await importProducts(formData);
      if (res.success) {
        toast.success(res.message || 'Berhasil mengimpor produk');
        setSuccessMsg(res.message || 'Berhasil mengimpor produk');
        setTimeout(() => {
          setOpen(false);
          resetState();
        }, 1800);
      } else {
        setErrorMsg(res.error || 'Terjadi kesalahan saat mengimpor data');
        toast.error(res.error || 'Gagal mengimpor menu');
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      setOpen(val);
      if (!val) resetState();
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 rounded-xl font-medium shadow-xs">
          <Upload className="w-4 h-4 text-primary" />
          <span>Import Excel</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[560px] p-0 overflow-hidden rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl">
        <DialogHeader className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50">
          <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <span>Import Menu dari Excel / CSV</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Unggah file spreadsheet untuk menambahkan banyak menu sekaligus. Kategori, Barcode, & SKU otomatis dilengkapi.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Template Download Banner */}
          <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 dark:bg-primary/10 space-y-2.5">
            <div className="flex items-start gap-2.5">
              <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 block">
                  Gunakan Template Standar Menuin
                </span>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Agar proses import berjalan mulus, silakan unduh format template kami yang telah disertai contoh data menu dan petunjuk pengisian.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1 pl-6.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => downloadMenuTemplate('xlsx')}
                className="h-8 text-xs font-medium rounded-lg border-primary/30 hover:bg-primary/10 text-primary gap-1.5 shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                Unduh Template Excel (.xlsx)
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => downloadMenuTemplate('csv')}
                className="h-8 text-xs font-medium rounded-lg text-slate-600 dark:text-slate-400 hover:text-foreground gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                Format .CSV
              </Button>
            </div>
          </div>

          {/* Upload Dropzone */}
          <div 
            className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all ${
              selectedFile 
                ? 'border-primary bg-primary/5 dark:bg-primary/10' 
                : 'border-slate-200 dark:border-slate-800 hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-900/50'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              className="hidden" 
              accept=".xlsx,.xls,.csv" 
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            {selectedFile ? (
              <div className="flex flex-col items-center text-center space-y-1">
                <div className="w-12 h-12 rounded-xl bg-primary/15 text-primary flex items-center justify-center mb-1">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate max-w-[340px]">
                  {selectedFile.name}
                </span>
                <span className="text-xs text-muted-foreground font-medium">
                  Ukuran: {(selectedFile.size / 1024).toFixed(1)} KB • {totalParsedRows > 0 ? `${totalParsedRows} baris menu terdeteksi` : 'File terpilih'}
                </span>
                <span className="text-[11px] text-primary underline mt-1 cursor-pointer">
                  Klik untuk mengganti file
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center space-y-1">
                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center mb-1">
                  <Upload className="w-6 h-6" />
                </div>
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Pilih atau Tarik File Excel / CSV ke Sini
                </span>
                <span className="text-xs text-muted-foreground">
                  Mendukung format file <b>.xlsx</b>, <b>.xls</b>, atau <b>.csv</b>
                </span>
              </div>
            )}
          </div>

          {/* Pratinjau Data (Preview) */}
          {previewRows.length > 0 && (
            <div className="space-y-2 rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 bg-slate-50/50 dark:bg-slate-900/40">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                  Pratinjau Data ({totalParsedRows} Menu Ditemukan)
                </span>
                <span className="text-[10px] text-muted-foreground">Menampilkan contoh 4 baris pertama</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-muted-foreground">
                      <th className="pb-1.5 font-medium">Nama Menu</th>
                      <th className="pb-1.5 font-medium">Kategori</th>
                      <th className="pb-1.5 font-medium text-right">Harga Jual</th>
                      <th className="pb-1.5 font-medium text-right">Stok</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {previewRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/30">
                        <td className="py-1.5 font-medium text-slate-900 dark:text-slate-100 truncate max-w-[160px]">
                          {row.name}
                        </td>
                        <td className="py-1.5 text-slate-600 dark:text-slate-400">
                          {row.category}
                        </td>
                        <td className="py-1.5 font-mono text-right text-emerald-600 dark:text-emerald-400 font-medium">
                          {formatCurrency(row.price || 0)}
                        </td>
                        <td className="py-1.5 font-mono text-right text-slate-700 dark:text-slate-300">
                          {row.stock ?? 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="flex items-start gap-2.5 text-xs text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 p-3 rounded-xl border border-red-200 dark:border-red-900/50">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Success Message */}
          {successMsg && (
            <div className="flex items-start gap-2.5 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-200 dark:border-emerald-900/50">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span className="font-medium">{successMsg}</span>
            </div>
          )}
        </div>

        <DialogFooter className="p-4 px-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 flex items-center justify-between sm:justify-between">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setOpen(false)} 
            disabled={isPending}
            className="rounded-xl text-slate-600 hover:text-slate-900"
          >
            Batal
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={!selectedFile || isPending}
            className="rounded-xl px-5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-xs"
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Mengimpor Menu...
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Upload className="w-4 h-4" /> Mulai Import ({totalParsedRows || 0} Menu)
              </span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
