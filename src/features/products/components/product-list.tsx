'use client';

import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Plus, Pencil, Trash2, Package, Image as ImageIcon, Printer } from 'lucide-react';
import dynamic from 'next/dynamic';

const DataTable = dynamic(
  () => import('@/components/ui/data-table').then((mod) => mod.DataTable),
  { ssr: false, loading: () => <div className="h-64 w-full bg-muted animate-pulse rounded-xl"></div> }
);
import { ImportProductDialog } from './import-product-dialog';
import Barcode from 'react-barcode';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils/format';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createProduct, updateProduct, deleteProduct } from '@/lib/actions/products';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { Checkbox } from '@/components/ui/checkbox';

type Product = {
  id: string;
  sku: string;
  name: string;
  price: string;
  stock: number;
  minStock: number;
  categoryName: string | null;
  categoryId: string | null;
  imageUrl: string | null;
  barcode: string | null;
  status: string;
  modifierGroupIds?: string[];
};

type Category = {
  id: string;
  name: string;
};

const productSchema = z.object({
  name: z.string().min(1, 'Nama item wajib diisi'),
  sku: z.string().min(1, 'SKU wajib diisi'),
  categoryId: z.string().uuid('Pilih kategori').nullable(),
  price: z.coerce.number().min(0, 'Harga tidak boleh negatif'),
  costPrice: z.coerce.number().min(0, 'Harga modal tidak boleh negatif'),
  stock: z.coerce.number().min(0, 'Stok awal tidak boleh negatif'),
  minStock: z.coerce.number().min(0, 'Batas minimum stok tidak boleh negatif'),
  imageUrl: z.string().optional().nullable(),
  barcode: z.string().optional().nullable(),
  modifierGroupIds: z.array(z.string()).optional(),
});

export function ProductList({ initialData, categories, modifierGroups = [] }: { initialData: Product[], categories: Category[], modifierGroups?: any[] }) {
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const [isPrintBarcodeOpen, setIsPrintBarcodeOpen] = React.useState(false);
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [imageFile, setImageFile] = React.useState<File | null>(null);

  const supabase = createClient();

  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: { name: '', sku: '', categoryId: null, price: 0, costPrice: 0, stock: 0, minStock: 5, imageUrl: '', barcode: '', modifierGroupIds: [] },
  });

  const uploadImage = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('product_image')
      .upload(fileName, file);

    if (error) {
      console.error('Upload error:', error);
      throw new Error('Gagal mengunggah gambar');
    }

    const { data: publicUrlData } = supabase.storage
      .from('product_image')
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  };

  const onSubmitAdd = async (values: z.infer<typeof productSchema>) => {
    setIsLoading(true);
    let finalImageUrl = values.imageUrl;

    try {
      if (imageFile) {
        finalImageUrl = await uploadImage(imageFile);
      }
      
      const result = await createProduct({ ...values, imageUrl: finalImageUrl });
      
      if (result.success) {
        toast.success('Item berhasil ditambahkan');
        setIsAddOpen(false);
        form.reset();
        setImageFile(null);
      } else {
        toast.error(result.error);
      }
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitEdit = async (values: z.infer<typeof productSchema>) => {
    if (!selectedProduct) return;
    setIsLoading(true);
    let finalImageUrl = values.imageUrl;

    try {
      if (imageFile) {
        finalImageUrl = await uploadImage(imageFile);
      }

      const result = await updateProduct(selectedProduct.id, { ...values, imageUrl: finalImageUrl });
      
      if (result.success) {
        toast.success('Item berhasil diperbarui');
        setIsEditOpen(false);
        setImageFile(null);
      } else {
        toast.error(result.error);
      }
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  };

  const onConfirmDelete = async () => {
    if (!selectedProduct) return;
    setIsLoading(true);
    const result = await deleteProduct(selectedProduct.id);
    setIsLoading(false);
    
    if (result.success) {
      toast.success('Item berhasil dihapus');
      setIsDeleteOpen(false);
    } else {
      toast.error(result.error);
    }
  };

  const handleEditClick = (product: Product) => {
    setSelectedProduct(product);
    setImageFile(null);
    form.reset({
      name: product.name,
      sku: product.sku,
      categoryId: product.categoryId,
      price: parseFloat(product.price),
      costPrice: parseFloat(product.price), 
      stock: product.stock,
      minStock: product.minStock,
      barcode: product.barcode || '',
      imageUrl: product.imageUrl || '',
      modifierGroupIds: product.modifierGroupIds || [],
    });
    setIsEditOpen(true);
  };

  const handleDeleteClick = (product: Product) => {
    setSelectedProduct(product);
    setIsDeleteOpen(true);
  };

  const handlePrintBarcodeClick = (product: Product) => {
    if (!product.barcode && !product.sku) {
      toast.error('Item ini tidak memiliki barcode atau SKU');
      return;
    }
    setSelectedProduct(product);
    setIsPrintBarcodeOpen(true);
  };

  const columns: ColumnDef<Product>[] = [
    {
      accessorKey: 'name',
      header: 'Item',
      cell: ({ row }) => {
        const product = row.original;
        return (
          <div className="flex items-center">
            {product.imageUrl ? (
              <>
                <img 
                  src={product.imageUrl} 
                  alt={product.name} 
                  className="w-10 h-10 rounded-md object-cover mr-3 border"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    e.currentTarget.nextElementSibling?.classList.add('flex');
                  }}
                />
                <div className="hidden w-10 h-10 bg-primary/10 rounded-md mr-3 items-center justify-center text-primary font-bold">
                  {product.name.charAt(0)}
                </div>
              </>
            ) : (
              <div className="w-10 h-10 bg-primary/10 rounded-md mr-3 flex items-center justify-center text-primary font-bold">
                {product.name.charAt(0)}
              </div>
            )}
            <div>
              <span className="font-medium block">{product.name}</span>
              <span className="text-xs text-muted-foreground font-mono">{product.sku}</span>
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: 'barcode',
      header: 'Barcode',
      cell: ({ row }) => <span className="font-mono text-xs">{row.getValue('barcode') || '-'}</span>
    },
    {
      accessorKey: 'categoryName',
      header: 'Kategori',
      cell: ({ row }) => row.getValue('categoryName') || '-'
    },
    {
      accessorKey: 'price',
      header: 'Harga Jual',
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue('price'));
        return <div className="font-medium">{formatCurrency(amount)}</div>;
      },
    },
    {
      accessorKey: 'stock',
      header: 'Stok',
      cell: ({ row }) => {
        const stock = parseInt(row.getValue('stock'));
        const minStock = row.original.minStock;
        return (
          <div className={stock <= minStock ? 'text-destructive font-semibold' : ''}>
            {stock}
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        return (
          <div className={`px-2 py-1 rounded-full text-xs font-medium w-fit ${
            status === 'active' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
          }`}>
            {status === 'active' ? 'Tersedia' : 'Habis'}
          </div>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const product = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Aksi</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(product.barcode || product.sku)}>
                Copy Barcode
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onClick={() => handlePrintBarcodeClick(product)}>
                <Printer className="mr-2 h-4 w-4" /> Cetak Barcode
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-primary cursor-pointer" onClick={() => handleEditClick(product)}>
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive cursor-pointer" onClick={(e) => { e.stopPropagation(); handleDeleteClick(product); }}>
                <Trash2 className="mr-2 h-4 w-4" /> Hapus
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const ProductForm = ({ onSubmit }: any) => (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-2">
        <div className="space-y-2">
          <Label>Gambar Item</Label>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-md border bg-muted flex items-center justify-center overflow-hidden">
              {imageFile ? (
                <img src={URL.createObjectURL(imageFile)} alt="Preview" className="h-full w-full object-cover" />
              ) : form.watch('imageUrl') ? (
                <img src={form.watch('imageUrl')!} alt="Current" className="h-full w-full object-cover" />
              ) : (
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <Input 
              type="file" 
              accept="image/*" 
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setImageFile(e.target.files[0]);
                }
              }} 
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="sku">SKU</Label>
            <Input id="sku" {...form.register('sku')} placeholder="Misal: PRD-001" />
            {form.formState.errors.sku && <p className="text-xs text-destructive">{form.formState.errors.sku.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Nama Item</Label>
            <Input id="name" {...form.register('name')} placeholder="Misal: Kopi Susu" />
            {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Kategori</Label>
            <Controller
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value || undefined}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.categoryId && <p className="text-xs text-destructive">{form.formState.errors.categoryId.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="barcode">Barcode (Opsional)</Label>
            <Input id="barcode" {...form.register('barcode')} placeholder="Kosongkan u/ Auto-generate" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="price">Harga Jual (Rp)</Label>
            <Input id="price" type="number" {...form.register('price')} />
            {form.formState.errors.price && <p className="text-xs text-destructive">{form.formState.errors.price.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="costPrice">Harga Modal (Rp)</Label>
            <Input id="costPrice" type="number" {...form.register('costPrice')} />
            {form.formState.errors.costPrice && <p className="text-xs text-destructive">{form.formState.errors.costPrice.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="stock">Stok Awal</Label>
            <Input id="stock" type="number" {...form.register('stock')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="minStock">Batas Stok Minimum</Label>
            <Input id="minStock" type="number" {...form.register('minStock')} />
          </div>
        </div>

        {modifierGroups.length > 0 && (
          <div className="space-y-3 pt-2">
            <Label>Grup Kustomisasi / Modifier (Opsional)</Label>
            <div className="grid grid-cols-2 gap-2 border p-3 rounded-md bg-muted/20">
              <Controller
                control={form.control}
                name="modifierGroupIds"
                render={({ field }) => (
                  <>
                    {modifierGroups.map((mg: any) => {
                      const isChecked = field.value?.includes(mg.id);
                      return (
                        <div key={mg.id} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`mg-${mg.id}`}
                            checked={isChecked}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                field.onChange([...(field.value || []), mg.id]);
                              } else {
                                field.onChange((field.value || []).filter((id: string) => id !== mg.id));
                              }
                            }}
                          />
                          <Label htmlFor={`mg-${mg.id}`} className="font-normal cursor-pointer">
                            {mg.name}
                          </Label>
                        </div>
                      );
                    })}
                  </>
                )}
              />
            </div>
          </div>
        )}
      </div>
      <DialogFooter className="mt-4">
        <Button type="button" variant="outline" onClick={() => { setIsAddOpen(false); setIsEditOpen(false); }}>Batal</Button>
        <Button type="submit" disabled={isLoading || !form.formState.isDirty}>{isLoading ? 'Menyimpan...' : 'Simpan'}</Button>
      </DialogFooter>
    </form>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Data Item</h1>
          <p className="text-sm text-muted-foreground">Kelola semua item, harga, stok, gambar, dan barcode.</p>
        </div>
        <div className="flex gap-2">
          <ImportProductDialog />
          <Button 
            onClick={() => { 
              form.reset({ name: '', sku: '', categoryId: null, price: 0, costPrice: 0, stock: 0, minStock: 5, imageUrl: '', barcode: '', modifierGroupIds: [] }); 
              setImageFile(null);
              setIsAddOpen(true); 
            }}
            className="rounded-xl px-4 flex items-center bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Tambah Item
          </Button>
        </div>
      </div>

      <DataTable 
        columns={columns} 
        data={initialData} 
        searchKey="name" 
        searchPlaceholder="Cari nama item..." 
        onRowClick={(row) => handleEditClick(row)}
      />

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Item Baru</DialogTitle>
            <DialogDescription>Masukkan detail item baru ke dalam sistem kasir.</DialogDescription>
          </DialogHeader>
          <ProductForm onSubmit={onSubmitAdd} />
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detail / Edit Item</DialogTitle>
            <DialogDescription>Perbarui informasi item ini.</DialogDescription>
          </DialogHeader>
          <ProductForm onSubmit={onSubmitEdit} />
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Item</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus item <b>{selectedProduct?.name}</b>? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDeleteOpen(false)}>Batal</Button>
            <Button type="button" variant="destructive" onClick={onConfirmDelete} disabled={isLoading}>
              {isLoading ? 'Menghapus...' : 'Ya, Hapus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPrintBarcodeOpen} onOpenChange={setIsPrintBarcodeOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Cetak Barcode</DialogTitle>
            <DialogDescription>
              Barcode untuk produk <b>{selectedProduct?.name}</b>
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-6 space-y-4 bg-white rounded-lg border" id="barcode-print-area">
            {selectedProduct && (selectedProduct.barcode || selectedProduct.sku) && (
              <Barcode 
                value={selectedProduct.barcode || selectedProduct.sku} 
                width={2} 
                height={80} 
                displayValue={true}
                background="#ffffff"
                lineColor="#000000"
              />
            )}
          </div>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setIsPrintBarcodeOpen(false)}>Tutup</Button>
            <Button type="button" onClick={() => {
              const printContent = document.getElementById('barcode-print-area');
              const windowPrint = window.open('', '', 'width=800,height=600');
              if (windowPrint && printContent) {
                windowPrint.document.write(`
                  <html>
                    <head>
                      <title>Print Barcode - ${selectedProduct?.name}</title>
                      <style>
                        body {
                          display: flex;
                          justify-content: center;
                          align-items: center;
                          height: 100vh;
                          margin: 0;
                          background: white;
                        }
                        @media print {
                          @page { size: auto; margin: 0mm; }
                          body { margin: 1cm; }
                        }
                      </style>
                    </head>
                    <body>
                      ${printContent.innerHTML}
                    </body>
                  </html>
                `);
                windowPrint.document.close();
                windowPrint.focus();
                setTimeout(() => {
                  windowPrint.print();
                  windowPrint.close();
                }, 250);
              }
            }}>
              <Printer className="mr-2 h-4 w-4" /> Cetak
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
