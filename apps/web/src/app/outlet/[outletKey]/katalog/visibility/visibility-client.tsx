'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { toggleProductVisibility } from "@/lib/actions/catalog";
import { toast } from "sonner";

export function VisibilityClient({ products }: { products: any[] }) {
  const [localProducts, setLocalProducts] = useState(products);

  const handleToggle = async (productId: string, field: 'isAvailableOnline' | 'isFeatured', currentValue: boolean) => {
    const newValue = !currentValue;
    
    // Optimistic update
    setLocalProducts(prev => prev.map(p => {
      if (p.id === productId) {
        return { ...p, [field]: newValue };
      }
      return p;
    }));

    const result = await toggleProductVisibility(productId, field, newValue);

    if (result.error) {
      toast.error(result.error);
      // Revert on error
      setLocalProducts(products);
    } else {
      toast.success(`Produk berhasil diperbarui`);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('catalog-updated'));
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50/60 border-none p-3.5 rounded-2xl text-xs text-blue-900 flex items-center gap-2">
        <span>Produk yang diaktifkan sebagai <b>Produk Unggulan (Best Seller)</b> akan otomatis diposisikan di deretan teratas pada Kasir POS dan Katalog Online.</span>
      </div>

      <div className="rounded-2xl border-none bg-white overflow-hidden shadow-sm-md">
        <Table>
          <TableHeader className="bg-slate-50/70">
            <TableRow className="border-b border-slate-200/80">
              <TableHead className="text-xs font-semibold text-slate-500">Nama Produk</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500">Kategori</TableHead>
              <TableHead className="text-center text-xs font-semibold text-slate-500">Tersedia Online</TableHead>
              <TableHead className="text-center text-xs font-semibold text-slate-500">Best Seller (Unggulan)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-100">
            {localProducts.map((product) => (
              <TableRow key={product.id} className="hover:bg-slate-50/50">
                <TableCell className="font-medium text-xs text-slate-900">
                  <div className="flex items-center gap-2">
                    <span>{product.name}</span>
                    {product.isFeatured && (
                      <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border-none">
                        Best Seller
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-xs text-slate-600">{product.categoryName || '-'}</TableCell>
                <TableCell className="text-center">
                  <Switch 
                    checked={product.isAvailableOnline ?? false}
                    onCheckedChange={() => handleToggle(product.id, 'isAvailableOnline', product.isAvailableOnline ?? false)}
                    className="data-[state=checked]:bg-[#0e59f9]"
                  />
                </TableCell>
                <TableCell className="text-center">
                  <Switch 
                    checked={product.isFeatured ?? false}
                    onCheckedChange={() => handleToggle(product.id, 'isFeatured', product.isFeatured ?? false)}
                    className="data-[state=checked]:bg-[#0e59f9]"
                  />
                </TableCell>
              </TableRow>
            ))}
            {localProducts.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-xs text-slate-400">
                  Belum ada produk. Silakan tambah produk melalui menu Produk.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
