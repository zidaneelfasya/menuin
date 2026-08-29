"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { toggleProductVisibility } from "@/lib/actions/catalog";
import { toast } from "sonner";

type Product = {
  id: string;
  name: string;
  categoryName: string | null;
  isAvailableOnline: boolean | null;
  isFeatured: boolean | null;
};

export function VisibilityClient({ products }: { products: Product[] }) {
  const [localProducts, setLocalProducts] = useState(products);

  const handleToggle = async (productId: string, field: 'isAvailableOnline' | 'isFeatured', currentValue: boolean) => {
    const newValue = !currentValue;
    
    // Optimistic UI update
    setLocalProducts(prev => prev.map(p => 
      p.id === productId ? { ...p, [field]: newValue } : p
    ));

    const result = await toggleProductVisibility(productId, field, newValue);
    
    if (result.error) {
      toast.error(result.error);
      // Revert if failed
      setLocalProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, [field]: currentValue } : p
      ));
    } else {
      toast.success(`Produk berhasil diperbarui`);
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama Produk</TableHead>
            <TableHead>Kategori</TableHead>
            <TableHead className="text-center">Tersedia Online</TableHead>
            <TableHead className="text-center">Produk Unggulan (Featured)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {localProducts.map((product) => (
            <TableRow key={product.id}>
              <TableCell className="font-medium">{product.name}</TableCell>
              <TableCell>{product.categoryName || '-'}</TableCell>
              <TableCell className="text-center">
                <Switch 
                  checked={product.isAvailableOnline ?? false}
                  onCheckedChange={() => handleToggle(product.id, 'isAvailableOnline', product.isAvailableOnline ?? false)}
                />
              </TableCell>
              <TableCell className="text-center">
                <Switch 
                  checked={product.isFeatured ?? false}
                  onCheckedChange={() => handleToggle(product.id, 'isFeatured', product.isFeatured ?? false)}
                />
              </TableCell>
            </TableRow>
          ))}
          {localProducts.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                Belum ada produk. Silakan tambah produk melalui menu Produk.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
