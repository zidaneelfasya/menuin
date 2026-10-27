'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileSpreadsheet, FileText, ChevronDown, CheckCircle2 } from 'lucide-react';
import { ProductDto } from '@menuin/types';
import { exportProductsToExcel, exportProductsToCsv, downloadMenuTemplate } from '@/features/products/utils/menu-excel';
import { toast } from 'sonner';

interface ExportMenuDropdownProps {
  products: ProductDto[];
  selectedProducts?: ProductDto[];
  outletName?: string;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export function ExportMenuDropdown({
  products,
  selectedProducts = [],
  outletName,
  variant = 'outline',
  size = 'default',
  className,
}: ExportMenuDropdownProps) {
  const hasSelection = selectedProducts.length > 0;

  const handleExportAll = (format: 'xlsx' | 'csv') => {
    if (products.length === 0) {
      toast.error('Tidak ada data menu untuk diekspor');
      return;
    }

    try {
      if (format === 'xlsx') {
        exportProductsToExcel(products, outletName);
        toast.success(`Berhasil mengekspor ${products.length} menu ke Excel`);
      } else {
        exportProductsToCsv(products, outletName);
        toast.success(`Berhasil mengekspor ${products.length} menu ke CSV`);
      }
    } catch (e: any) {
      toast.error('Gagal mengekspor data: ' + (e?.message || 'Terjadi kesalahan'));
    }
  };

  const handleExportSelected = (format: 'xlsx' | 'csv') => {
    if (selectedProducts.length === 0) {
      toast.error('Pilih minimal satu menu untuk diekspor');
      return;
    }

    try {
      if (format === 'xlsx') {
        exportProductsToExcel(selectedProducts, `${outletName || 'Outlet'}_Terpilih`);
        toast.success(`Berhasil mengekspor ${selectedProducts.length} menu terpilih ke Excel`);
      } else {
        exportProductsToCsv(selectedProducts, `${outletName || 'Outlet'}_Terpilih`);
        toast.success(`Berhasil mengekspor ${selectedProducts.length} menu terpilih ke CSV`);
      }
    } catch (e: any) {
      toast.error('Gagal mengekspor data: ' + (e?.message || 'Terjadi kesalahan'));
    }
  };

  const handleDownloadTemplate = (format: 'xlsx' | 'csv') => {
    try {
      downloadMenuTemplate(format);
      toast.success(`Template ${format.toUpperCase()} berhasil diunduh`);
    } catch (e: any) {
      toast.error('Gagal mengunduh template: ' + (e?.message || 'Terjadi kesalahan'));
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className || "rounded-full gap-2 font-medium shadow-md bg-white hover:bg-slate-100 text-slate-700 border-none h-10 px-4"}>
          <Download className="w-4 h-4 text-slate-600" />
          <span>Export Menu</span>
          <ChevronDown className="w-3.5 h-3.5 opacity-60 ml-0.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60 p-1.5 rounded-2xl border-none shadow-2xl bg-white">
        {hasSelection && (
          <>
            <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground px-2 py-1 uppercase tracking-wider">
              Menu Terpilih ({selectedProducts.length})
            </DropdownMenuLabel>
            <DropdownMenuItem 
              onClick={() => handleExportSelected('xlsx')}
              className="rounded-xl cursor-pointer flex items-center gap-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export Terpilih ke Excel (.xlsx)</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleExportSelected('csv')}
              className="rounded-xl cursor-pointer flex items-center gap-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Export Terpilih ke CSV (.csv)</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-1 bg-slate-100" />
          </>
        )}

        <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground px-2 py-1 uppercase tracking-wider">
          Semua Menu ({products.length})
        </DropdownMenuLabel>
        <DropdownMenuItem 
          onClick={() => handleExportAll('xlsx')}
          className="rounded-xl cursor-pointer flex items-center gap-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>Export Semua ke Excel (.xlsx)</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleExportAll('csv')}
          className="rounded-xl cursor-pointer flex items-center gap-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
        >
          <FileText className="w-4 h-4 text-blue-600" />
          <span>Export Semua ke CSV (.csv)</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-1 bg-slate-100" />

        <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground px-2 py-1 uppercase tracking-wider">
          Template Import
        </DropdownMenuLabel>
        <DropdownMenuItem 
          onClick={() => handleDownloadTemplate('xlsx')}
          className="rounded-xl cursor-pointer flex items-center gap-2 text-xs font-medium text-slate-600 hover:bg-slate-100"
        >
          <Download className="w-4 h-4 text-slate-500" />
          <span>Unduh Template Excel (.xlsx)</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleDownloadTemplate('csv')}
          className="rounded-xl cursor-pointer flex items-center gap-2 text-xs font-medium text-slate-600 hover:bg-slate-100"
        >
          <Download className="w-4 h-4 text-slate-500" />
          <span>Unduh Template CSV (.csv)</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
