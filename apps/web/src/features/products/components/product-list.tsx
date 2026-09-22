'use client';

import * as React from 'react';
import { ColumnDef, RowSelectionState } from '@tanstack/react-table';
import { 
  MoreHorizontal, 
  Plus, 
  Pencil, 
  Trash2, 
  Package, 
  Image as ImageIcon, 
  Printer, 
  Star, 
  StarOff,
  Boxes,
  Upload,
  RefreshCw,
  Check,
  Sparkles,
  Barcode as BarcodeIcon,
  Tag,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Info,
  Layers,
  X,
  Power,
  PowerOff,
  CheckCircle2
} from 'lucide-react';
import dynamic from 'next/dynamic';

const DataTable = dynamic(
  () => import('@/components/ui/data-table').then((mod) => mod.DataTable),
  { ssr: false, loading: () => <div className="h-64 w-full bg-muted animate-pulse rounded-xl"></div> }
);
import { ImportProductDialog } from './import-product-dialog';
import { ExportMenuDropdown } from './export-menu-dropdown';
import Barcode from 'react-barcode';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils/format';
import { cn } from '@/lib/utils';
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  createProduct, 
  updateProduct, 
  deleteProduct, 
  toggleProductBestSeller, 
  toggleTrackStock,
  bulkToggleProductBestSeller,
  bulkDeleteProducts,
  toggleProductActiveStatus,
  bulkToggleProductActiveStatus
} from '@/lib/actions/products';
import { uploadImageToSupabase } from '@/lib/actions/storage';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { Checkbox } from '@/components/ui/checkbox';

import { ProductDto } from '@menuin/types';
import { productSchema } from '@menuin/validation';

type Category = {
  id: string;
  name: string;
};

export function ProductList({ initialData, categories, modifierGroups = [] }: { initialData: ProductDto[], categories: Category[], modifierGroups?: any[] }) {
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const [isPrintBarcodeOpen, setIsPrintBarcodeOpen] = React.useState(false);
  const [selectedProduct, setSelectedProduct] = React.useState<ProductDto | null>(null);
  const [detailProduct, setDetailProduct] = React.useState<ProductDto | null>(null);
  const [isDetailOpen, setIsDetailOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [productsList, setProductsList] = React.useState<ProductDto[]>(initialData);

  // Status Filter: 'ALL' | 'ACTIVE' | 'INACTIVE'
  const [statusFilter, setStatusFilter] = React.useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  const totalCount = productsList.length;
  const activeCount = React.useMemo(() => productsList.filter((p) => p.isActive !== false).length, [productsList]);
  const inactiveCount = React.useMemo(() => productsList.filter((p) => p.isActive === false).length, [productsList]);

  const displayedProducts = React.useMemo(() => {
    if (statusFilter === 'ACTIVE') {
      return productsList.filter((p) => p.isActive !== false);
    }
    if (statusFilter === 'INACTIVE') {
      return productsList.filter((p) => p.isActive === false);
    }
    return productsList;
  }, [productsList, statusFilter]);

  // Row selection & Bulk Action states
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = React.useState(false);
  const [isBulkLoading, setIsBulkLoading] = React.useState(false);

  const selectedProducts = React.useMemo(() => {
    return productsList.filter((p) => !!rowSelection[p.id]);
  }, [productsList, rowSelection]);

  const selectedCount = selectedProducts.length;

  const allAreFeatured = React.useMemo(() => {
    return selectedCount > 0 && selectedProducts.every((p) => !!p.isFeatured);
  }, [selectedProducts, selectedCount]);

  const handleBulkToggleBestSeller = async () => {
    if (selectedCount === 0 || isBulkLoading) return;
    const targetValue = !allAreFeatured;
    const selectedIds = selectedProducts.map((p) => p.id);

    setIsBulkLoading(true);

    // Optimistic UI update
    setProductsList((prev) =>
      prev.map((p) => (selectedIds.includes(p.id) ? { ...p, isFeatured: targetValue } : p))
    );

    const result = await bulkToggleProductBestSeller(selectedIds, targetValue);
    setIsBulkLoading(false);

    if (result.success) {
      toast.success(
        targetValue
          ? `${selectedCount} item berhasil dijadikan Best Seller.`
          : `${selectedCount} item dinonaktifkan dari Best Seller.`
      );
    } else {
      toast.error(result.error || 'Gagal mengubah status Best Seller');
      setProductsList(initialData);
    }
  };

  const handleBulkDeleteConfirm = async () => {
    if (selectedCount === 0 || isBulkLoading) return;
    const selectedIds = selectedProducts.map((p) => p.id);

    setIsBulkLoading(true);
    // Optimistic UI update
    setProductsList((prev) => prev.filter((p) => !selectedIds.includes(p.id)));

    const result = await bulkDeleteProducts(selectedIds);
    setIsBulkLoading(false);
    setIsBulkDeleteOpen(false);

    if (result.success) {
      toast.success(`${selectedCount} item berhasil dihapus.`);
      setRowSelection({});
    } else {
      toast.error(result.error || 'Gagal menghapus beberapa item.');
      setProductsList(initialData);
    }
  };

  const handleToggleActiveStatus = async (product: ProductDto, currentValue: boolean) => {
    const newValue = !currentValue;
    // Optimistic UI update
    setProductsList((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, isActive: newValue } : p))
    );

    const result = await toggleProductActiveStatus(product.id, newValue);
    if (!result.success) {
      toast.error(result.error || 'Gagal mengubah status ketersediaan');
      setProductsList((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, isActive: currentValue } : p))
      );
    } else {
      toast.success(
        newValue 
          ? `${product.name} sekarang Aktif & Tersedia.` 
          : `${product.name} dinonaktifkan (Tidak Tersedia).`
      );
    }
  };

  const handleBulkToggleActiveStatus = async (targetActive: boolean) => {
    if (selectedCount === 0 || isBulkLoading) return;
    const selectedIds = selectedProducts.map((p) => p.id);

    setIsBulkLoading(true);
    // Optimistic UI update
    setProductsList((prev) =>
      prev.map((p) => (selectedIds.includes(p.id) ? { ...p, isActive: targetActive } : p))
    );

    const result = await bulkToggleProductActiveStatus(selectedIds, targetActive);
    setIsBulkLoading(false);

    if (result.success) {
      toast.success(
        targetActive
          ? `${selectedCount} item berhasil diaktifkan (Tersedia).`
          : `${selectedCount} item berhasil dimatikan (Tidak Tersedia).`
      );
    } else {
      toast.error(result.error || 'Gagal mengubah status item terpilih');
      setProductsList(initialData);
    }
  };

  const handleRowClick = (product: any) => {
    setDetailProduct(product as ProductDto);
    setIsDetailOpen(true);
  };

  React.useEffect(() => {
    setProductsList(initialData);
  }, [initialData]);

  const handleToggleBestSeller = async (product: ProductDto, currentValue: boolean) => {
    const newValue = !currentValue;
    // Optimistic UI update
    setProductsList((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, isFeatured: newValue } : p))
    );

    const result = await toggleProductBestSeller(product.id, newValue);
    if (!result.success) {
      toast.error(result.error || 'Gagal mengubah status Best Seller');
      setProductsList((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, isFeatured: currentValue } : p))
      );
    } else {
      toast.success(newValue ? `${product.name} dijadikan Best Seller.` : `${product.name} dihapus dari Best Seller.`);
    }
  };

  const handleToggleTrackStock = async (product: ProductDto, currentValue: boolean) => {
    const newValue = !currentValue;
    // Optimistic UI update
    setProductsList((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, trackStock: newValue } : p))
    );

    const result = await toggleTrackStock(product.id, newValue);
    if (!result.success) {
      toast.error(result.error || 'Gagal mengubah status pelacakan stok');
      setProductsList((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, trackStock: currentValue } : p))
      );
    } else {
      toast.success(
        newValue 
          ? `Lacak stok aktif untuk ${product.name} (stok akan berkurang saat kasir checkout)` 
          : `Lacak stok dinonaktifkan untuk ${product.name} (stok tanpa batas & tidak berkurang)`
      );
    }
  };

  const supabase = createClient();

  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: { name: '', sku: '', categoryId: null, price: 0, costPrice: 0, stock: 0, minStock: 5, trackStock: true, isActive: true, imageUrl: '', description: '', barcode: '', modifierGroupIds: [] },
  });

  const uploadImage = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await uploadImageToSupabase(formData, 'product_image');
    if (!res.success || !res.url) {
      throw new Error(res.error || 'Gagal mengunggah gambar ke Supabase Storage');
    }

    return res.url;
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

  const handleEditClick = (product: ProductDto) => {
    setSelectedProduct(product);
    setImageFile(null);
    form.reset({
      name: product.name,
      sku: product.sku,
      categoryId: product.categoryId,
      price: parseFloat(product.price),
      costPrice: product.costPrice ? parseFloat(product.costPrice) : 0, 
      stock: product.stock,
      minStock: product.minStock,
      trackStock: product.trackStock !== false,
      isActive: product.isActive !== false,
      barcode: product.barcode || '',
      imageUrl: product.imageUrl || '',
      description: product.description || '',
      modifierGroupIds: product.modifierGroupIds || [],
    });
    setIsEditOpen(true);
  };

  const handleDeleteClick = (product: ProductDto) => {
    setSelectedProduct(product);
    setIsDeleteOpen(true);
  };

  const handlePrintBarcodeClick = (product: ProductDto) => {
    if (!product.barcode && !product.sku) {
      toast.error('Item ini tidak memiliki barcode atau SKU');
      return;
    }
    setSelectedProduct(product);
    setIsPrintBarcodeOpen(true);
  };

  const columns: ColumnDef<ProductDto>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Pilih semua baris"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Pilih baris"
          onClick={(e) => e.stopPropagation()}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
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
                  className="w-10 h-10 rounded-lg object-cover mr-3 border"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    e.currentTarget.nextElementSibling?.classList.add('flex');
                  }}
                />
                <div className="hidden w-10 h-10 bg-primary/10 rounded-lg mr-3 items-center justify-center text-primary font-bold">
                  {product.name.charAt(0)}
                </div>
              </>
            ) : (
              <div className="w-10 h-10 bg-primary/10 rounded-lg mr-3 flex items-center justify-center text-primary font-bold">
                {product.name.charAt(0)}
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-slate-900 dark:text-slate-100">{product.name}</span>
                {product.isFeatured && (
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500 shrink-0" />
                )}
              </div>
              <span className="text-xs text-muted-foreground font-mono">{product.sku}</span>
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: 'isFeatured',
      header: 'Best Seller',
      cell: ({ row }) => {
        const product = row.original;
        const isFeatured = !!product.isFeatured;
        return (
          <div className="flex items-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggleBestSeller(product, isFeatured);
              }}
              className={cn(
                "p-1.5 rounded-lg transition-colors flex items-center justify-center",
                isFeatured 
                  ? "text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30" 
                  : "text-slate-300 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
              title={isFeatured ? 'Unggulan (Klik untuk batalkan)' : 'Jadikan Best Seller'}
            >
              <Star className={cn("h-4 w-4", isFeatured && "fill-amber-400 text-amber-500")} />
            </button>
          </div>
        );
      }
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
        const product = row.original;
        const isTracked = product.trackStock !== false;
        
        if (!isTracked) {
          return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/50">
              Tanpa Batas
            </span>
          );
        }

        const stock = parseInt(row.getValue('stock'));
        const minStock = product.minStock;
        return (
          <div className={stock <= minStock ? 'text-destructive font-semibold' : 'font-medium'}>
            {stock}
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Ketersediaan',
      cell: ({ row }) => {
        const product = row.original;
        const isActive = product.isActive !== false;
        const isOutOfStock = product.trackStock !== false && product.stock <= 0;

        return (
          <div 
            className="flex items-center gap-2.5"
            onClick={(e) => e.stopPropagation()}
          >
            <Switch
              checked={isActive}
              onCheckedChange={() => handleToggleActiveStatus(product, isActive)}
              className="data-[state=checked]:bg-emerald-600 cursor-pointer scale-90"
              aria-label={`Ubah status ketersediaan ${product.name}`}
            />
            <span 
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border transition-colors",
                !isActive
                  ? "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                  : isOutOfStock
                  ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50"
              )}
            >
              {!isActive ? 'Tidak Tersedia' : isOutOfStock ? 'Stok Habis' : 'Tersedia'}
            </span>
          </div>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const product = row.original;
        const isTracked = product.trackStock !== false;
        const isActive = product.isActive !== false;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg" 
                onClick={(e) => e.stopPropagation()}
              >
                <span className="sr-only">Buka menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 p-1 rounded-xl shadow-lg border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <DropdownMenuItem 
                className="text-xs font-medium py-2 px-3 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                onClick={(e) => { e.stopPropagation(); handleRowClick(product); }}
              >
                Detail item
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-xs font-medium py-2 px-3 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                onClick={(e) => { e.stopPropagation(); handleEditClick(product); }}
              >
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-xs font-medium py-2 px-3 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleActiveStatus(product, isActive);
                }}
              >
                {isActive ? (
                  <span className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                    <PowerOff className="w-3.5 h-3.5" />
                    <span>Matikan (Tidak Tersedia)</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                    <Power className="w-3.5 h-3.5" />
                    <span>Aktifkan (Tersedia)</span>
                  </span>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-xs font-medium py-2 px-3 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleBestSeller(product, !!product.isFeatured);
                }}
              >
                {product.isFeatured ? 'Hapus unggulan' : 'Jadikan unggulan'}
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-xs font-medium py-2 px-3 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleTrackStock(product, isTracked);
                }}
              >
                {isTracked ? 'Nonaktifkan stok' : 'Aktifkan stok'}
              </DropdownMenuItem>
              {(product.barcode || product.sku) && (
                <DropdownMenuItem 
                  className="text-xs font-medium py-2 px-3 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(product.barcode || product.sku);
                    toast.success('Barcode/SKU disalin ke clipboard');
                  }}
                >
                  Salin barcode
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                className="text-xs font-medium py-2 px-3 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                onClick={(e) => { e.stopPropagation(); handlePrintBarcodeClick(product); }}
              >
                Cetak barcode
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1 bg-slate-100 dark:bg-slate-800" />
              <DropdownMenuItem 
                className="text-xs font-medium py-2 px-3 rounded-lg cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/40"
                onClick={(e) => { e.stopPropagation(); handleDeleteClick(product); }}
              >
                Hapus
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];


  const ProductForm = ({ onSubmit }: { onSubmit: (values: z.infer<typeof productSchema>) => Promise<void> }) => {
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = React.useState(false);

    const watchPrice = form.watch('price') || 0;
    const watchCostPrice = form.watch('costPrice') || 0;
    const numPrice = Number(watchPrice);
    const numCostPrice = Number(watchCostPrice);
    const profit = numPrice - numCostPrice;
    const marginPct = numPrice > 0 ? Math.round(((profit / numPrice) * 100)) : 0;

    const handleAutoGenerateSku = () => {
      const catId = form.getValues('categoryId');
      const cat = categories.find((c) => c.id === catId);
      const prefix = cat ? cat.name.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase() : 'PRD';
      const randomNum = Math.floor(100 + Math.random() * 900);
      form.setValue('sku', `${prefix}-${randomNum}`, { shouldDirty: true, shouldValidate: true });
    };

    const handleAutoGenerateBarcode = () => {
      const prefix = '899';
      const randomPart = Math.floor(100000000 + Math.random() * 900000000).toString();
      const code = prefix + randomPart;
      let sum = 0;
      for (let i = 0; i < 12; i++) {
        sum += parseInt(code[i]) * (i % 2 === 0 ? 1 : 3);
      }
      const checkDigit = (10 - (sum % 10)) % 10;
      form.setValue('barcode', code + checkDigit.toString(), { shouldDirty: true, shouldValidate: true });
    };

    const currentImage = imageFile 
      ? URL.createObjectURL(imageFile) 
      : form.watch('imageUrl');

    return (
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0 bg-white dark:bg-slate-950">
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 dark:bg-slate-900">
          
          {/* Card 1: Foto Produk */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-primary" /> Foto Produk
              </Label>
              <span className="text-xs text-muted-foreground">Maks. 2MB (JPG, PNG, WEBP)</span>
            </div>

            {currentImage ? (
              <div className="relative rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-100 dark:bg-slate-900 group">
                <div className="aspect-[16/9] w-full max-h-52 overflow-hidden flex items-center justify-center bg-slate-100 dark:bg-slate-900">
                  <img 
                    src={currentImage} 
                    alt="Pratinjau Foto Produk" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
                  <Button 
                    type="button" 
                    size="sm" 
                    variant="secondary"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-lg shadow-sm"
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Ganti Foto
                  </Button>
                  <Button 
                    type="button" 
                    size="sm" 
                    variant="destructive"
                    onClick={() => {
                      setImageFile(null);
                      form.setValue('imageUrl', null, { shouldDirty: true });
                    }}
                    className="rounded-lg shadow-sm"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Hapus
                  </Button>
                </div>
              </div>
            ) : (
              <div 
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    const file = e.dataTransfer.files[0];
                    if (file.type.startsWith('image/')) {
                      setImageFile(file);
                      form.setValue('imageUrl', null, { shouldDirty: true });
                    } else {
                      toast.error('Berkas harus berupa gambar (JPG, PNG, WEBP)');
                    }
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors flex flex-col items-center justify-center gap-2 ${
                  isDragging 
                    ? 'border-primary bg-primary/5' 
                    : 'border-slate-200 dark:border-slate-800 hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-900'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-1">
                  <Upload className="w-5 h-5" />
                </div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Tarik & lepas foto di sini, atau <span className="text-primary underline underline-offset-2">pilih berkas</span>
                </p>
                <p className="text-xs text-muted-foreground">Disarankan foto rasio 1:1 atau 4:3 untuk katalog terbaik</p>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              accept="image/*" 
              className="hidden" 
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setImageFile(e.target.files[0]);
                  form.setValue('imageUrl', null, { shouldDirty: true });
                }
              }} 
            />
          </div>

          {/* Card 2: Informasi Utama */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800/80">
              <Tag className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Informasi Utama</h3>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Nama Item <span className="text-rose-500">*</span>
              </Label>
              <Input 
                id="name" 
                {...form.register('name')} 
                placeholder="Contoh: Kopi Susu Gula Aren, Croissant..." 
                className="rounded-lg h-10"
              />
              {form.formState.errors.name && (
                <p className="text-xs text-rose-500 font-medium">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Kategori <span className="text-rose-500">*</span>
              </Label>
              <Controller
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value || undefined}>
                    <SelectTrigger className="rounded-lg h-10">
                      <SelectValue placeholder="Pilih Kategori Menu" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.categoryId && (
                <p className="text-xs text-rose-500 font-medium">{form.formState.errors.categoryId.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="sku" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    SKU <span className="text-rose-500">*</span>
                  </Label>
                  <button 
                    type="button" 
                    onClick={handleAutoGenerateSku}
                    className="text-[11px] text-primary hover:underline font-medium inline-flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" /> Buat SKU
                  </button>
                </div>
                <Input 
                  id="sku" 
                  {...form.register('sku')} 
                  placeholder="Misal: KPS-001" 
                  className="rounded-lg font-mono text-sm h-10 uppercase"
                />
                {form.formState.errors.sku && (
                  <p className="text-xs text-rose-500 font-medium">{form.formState.errors.sku.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="barcode" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Barcode (Opsional)
                  </Label>
                  <button 
                    type="button" 
                    onClick={handleAutoGenerateBarcode}
                    className="text-[11px] text-primary hover:underline font-medium inline-flex items-center gap-1"
                  >
                    <BarcodeIcon className="w-3 h-3" /> Auto Barcode
                  </button>
                </div>
                <Input 
                  id="barcode" 
                  {...form.register('barcode')} 
                  placeholder="Kosongkan untuk auto-generate" 
                  className="rounded-lg font-mono text-sm h-10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Deskripsi Item (Opsional)
              </Label>
              <Textarea 
                id="description" 
                {...form.register('description')} 
                placeholder="Deskripsikan keunikan rasa, bahan utama, atau panduan penyajian bagi pelanggan..." 
                className="rounded-lg min-h-[76px] resize-none text-sm"
              />
            </div>
          </div>

          {/* Card 3: Harga & Keuntungan */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800/80">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Harga & Profitabilitas</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="price" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Harga Jual <span className="text-rose-500">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                  <Input 
                    id="price" 
                    type="number" 
                    {...form.register('price')} 
                    className="pl-9 rounded-lg h-10 font-semibold"
                  />
                </div>
                {form.formState.errors.price && (
                  <p className="text-xs text-rose-500 font-medium">{form.formState.errors.price.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="costPrice" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Harga Modal (COGS / HPP)
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                  <Input 
                    id="costPrice" 
                    type="number" 
                    {...form.register('costPrice')} 
                    className="pl-9 rounded-lg h-10 font-semibold"
                  />
                </div>
                {form.formState.errors.costPrice && (
                  <p className="text-xs text-rose-500 font-medium">{form.formState.errors.costPrice.message}</p>
                )}
              </div>
            </div>

            {/* Live Profit Margin Box */}
            {numPrice > 0 && (
              <div className={`p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                profit > 0 
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-200' 
                  : profit < 0
                  ? 'bg-rose-50/70 border-rose-200 text-rose-900 dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-200'
                  : 'bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300'
              }`}>
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-lg ${
                    profit > 0 ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700' : 'bg-slate-200 dark:bg-slate-800 text-slate-600'
                  }`}>
                    {profit > 0 ? <TrendingUp className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      {profit >= 0 ? 'Estimasi Untung Kotor' : 'Peringatan Margin Negatif'}
                    </p>
                    <p className="text-sm font-bold">
                      {profit >= 0 ? `+${formatCurrency(profit)}` : `-${formatCurrency(Math.abs(profit))}`}
                      <span className="text-xs font-normal text-muted-foreground ml-1">/ porsi</span>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                    profit > 0 
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                      : profit < 0
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200'
                      : 'bg-slate-200 text-slate-800'
                  }`}>
                    {marginPct}% Margin
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Card: Status Ketersediaan */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800/80">
              <Power className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Status Ketersediaan Item</h3>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60">
              <div className="space-y-0.5 pr-4">
                <Label htmlFor="isActiveSwitch" className="text-sm font-semibold cursor-pointer">
                  Item Aktif & Tersedia untuk Dipesan
                </Label>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {form.watch('isActive') !== false 
                    ? 'Item tampil aktif dan dapat dipesan oleh kasir POS maupun katalog online pelanggan.' 
                    : 'Item dinonaktifkan (Tidak Tersedia). Item tidak dapat ditambahkan ke keranjang kasir maupun dipesan online.'}
                </p>
              </div>
              <Controller
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <Switch
                    id="isActiveSwitch"
                    checked={field.value !== false}
                    onCheckedChange={field.onChange}
                    className="data-[state=checked]:bg-emerald-600"
                  />
                )}
              />
            </div>
          </div>

          {/* Card 4: Manajemen Stok & Inventaris */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800/80">
              <Boxes className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Manajemen Stok</h3>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60">
              <div className="space-y-0.5 pr-4">
                <Label htmlFor="trackStockSwitch" className="text-sm font-semibold cursor-pointer">
                  Lacak Stok Otomatis
                </Label>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {form.watch('trackStock') !== false 
                    ? 'Stok akan berkurang otomatis di sistem saat kasir menyelesaikan penjualan.' 
                    : 'Stok tak terbatas (unlimited). Item selalu tersedia di katalog kasir.'}
                </p>
              </div>
              <Controller
                control={form.control}
                name="trackStock"
                render={({ field }) => (
                  <Switch
                    id="trackStockSwitch"
                    checked={field.value !== false}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>

            {form.watch('trackStock') !== false ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="space-y-1.5">
                  <Label htmlFor="stock" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Stok Saat Ini (Unit)
                  </Label>
                  <Input 
                    id="stock" 
                    type="number" 
                    {...form.register('stock')} 
                    className="rounded-lg h-10 font-semibold"
                  />
                  {form.formState.errors.stock && (
                    <p className="text-xs text-rose-500 font-medium">{form.formState.errors.stock.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="minStock" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Batas Minimum Stok (Alert)
                  </Label>
                  <Input 
                    id="minStock" 
                    type="number" 
                    {...form.register('minStock')} 
                    className="rounded-lg h-10 font-semibold"
                  />
                  <p className="text-[11px] text-muted-foreground">Peringatan stok menipis saat sisa unit mencapai angka ini.</p>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-blue-50/60 border border-blue-100 text-blue-800 dark:bg-blue-950/30 dark:border-blue-900 dark:text-blue-300 text-xs flex items-center gap-2">
                <Info className="w-4 h-4 flex-shrink-0" />
                <span>Pelacakan stok dinonaktifkan. Anda tidak perlu mengelola jumlah stok secara manual untuk item ini.</span>
              </div>
            )}
          </div>

          {/* Card 5: Kustomisasi & Modifier */}
          {modifierGroups.length > 0 && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-600" />
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Grup Modifier & Varian</h3>
                </div>
                <span className="text-xs text-muted-foreground">Opsional</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Pilih grup varian / kustomisasi yang berlaku untuk item menu ini saat pelanggan memesan:
              </p>

              <Controller
                control={form.control}
                name="modifierGroupIds"
                render={({ field }) => (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {modifierGroups.map((mg: any) => {
                      const isChecked = field.value?.includes(mg.id);
                      return (
                        <div 
                          key={mg.id}
                          onClick={() => {
                            if (isChecked) {
                              field.onChange((field.value || []).filter((id: string) => id !== mg.id));
                            } else {
                              field.onChange([...(field.value || []), mg.id]);
                            }
                          }}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                            isChecked 
                              ? 'border-primary/60 bg-primary/5 text-slate-900 dark:text-slate-100 shadow-xs' 
                              : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 hover:bg-slate-100/70 dark:bg-slate-900/30'
                          }`}
                        >
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
                            className="mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <Label htmlFor={`mg-${mg.id}`} className="font-semibold text-xs cursor-pointer block truncate">
                              {mg.name}
                            </Label>
                            {mg.modifiers && (
                              <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                                {mg.modifiers.length} opsi varian
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              />
            </div>
          )}

        </div>

        {/* Sticky Action Footer */}
        <div className="p-4 px-6 border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-950 flex-shrink-0 flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {form.formState.isDirty || imageFile ? (
              <span className="text-amber-600 font-medium inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span> Ada perubahan belum disimpan
              </span>
            ) : (
              <span>Semua data tersimpan</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => { setIsAddOpen(false); setIsEditOpen(false); }}
              className="rounded-xl h-10 px-4"
            >
              Batal
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || (Boolean(selectedProduct) && !form.formState.isDirty && !imageFile)}
              className="rounded-xl h-10 px-5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-xs"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" /> Menyimpan...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4" /> {selectedProduct ? 'Perbarui Item' : 'Simpan Item'}
                </span>
              )}
            </Button>
          </div>
        </div>
      </form>
    );
  };

  const batchToolbar = (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Tombol Aktifkan Terpilih */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={selectedCount === 0 || isBulkLoading}
        onClick={() => handleBulkToggleActiveStatus(true)}
        className={cn(
          "h-9 px-3 rounded-xl text-xs font-medium transition-all shadow-xs flex items-center gap-1.5",
          selectedCount === 0 
            ? "opacity-50 cursor-not-allowed border-slate-200 dark:border-slate-800 text-muted-foreground" 
            : "border-emerald-300 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100"
        )}
      >
        <Power className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
        <span>Aktifkan {selectedCount > 0 ? `(${selectedCount})` : ''}</span>
      </Button>

      {/* Tombol Matikan Terpilih */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={selectedCount === 0 || isBulkLoading}
        onClick={() => handleBulkToggleActiveStatus(false)}
        className={cn(
          "h-9 px-3 rounded-xl text-xs font-medium transition-all shadow-xs flex items-center gap-1.5",
          selectedCount === 0 
            ? "opacity-50 cursor-not-allowed border-slate-200 dark:border-slate-800 text-muted-foreground" 
            : "border-slate-300 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
        )}
      >
        <PowerOff className="w-3.5 h-3.5 text-slate-500" />
        <span>Matikan {selectedCount > 0 ? `(${selectedCount})` : ''}</span>
      </Button>

      {/* Tombol Best Seller */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={selectedCount === 0 || isBulkLoading}
        onClick={handleBulkToggleBestSeller}
        className={cn(
          "h-9 px-3 rounded-xl text-xs font-medium transition-all shadow-xs flex items-center gap-1.5",
          selectedCount === 0 
            ? "opacity-50 cursor-not-allowed border-slate-200 dark:border-slate-800 text-muted-foreground" 
            : allAreFeatured
              ? "border-amber-300 dark:border-amber-800/80 bg-amber-50/60 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 hover:bg-amber-100/70"
              : "border-amber-400 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-200 hover:bg-amber-100"
        )}
      >
        {allAreFeatured ? (
          <>
            <StarOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Nonaktifkan Best Seller {selectedCount > 0 ? `(${selectedCount})` : ''}</span>
          </>
        ) : (
          <>
            <Star className={cn("w-3.5 h-3.5 text-amber-500", selectedCount > 0 && "fill-amber-400")} />
            <span>Jadikan Best Seller {selectedCount > 0 ? `(${selectedCount})` : ''}</span>
          </>
        )}
      </Button>

      {/* Tombol Hapus */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={selectedCount === 0 || isBulkLoading}
        onClick={() => setIsBulkDeleteOpen(true)}
        className={cn(
          "h-9 px-3 rounded-xl text-xs font-medium transition-all shadow-xs flex items-center gap-1.5",
          selectedCount === 0 
            ? "opacity-50 cursor-not-allowed border-slate-200 dark:border-slate-800 text-muted-foreground" 
            : "border-red-200 dark:border-red-900/60 bg-red-50/70 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 hover:text-red-700"
        )}
      >
        <Trash2 className={cn("w-3.5 h-3.5", selectedCount > 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground")} />
        <span>Hapus {selectedCount > 0 ? `(${selectedCount})` : ''}</span>
      </Button>

      {/* Export Terpilih */}
      {selectedCount > 0 && (
        <ExportMenuDropdown
          products={productsList}
          selectedProducts={selectedProducts}
          variant="outline"
          size="sm"
          className="h-9 px-3 rounded-xl text-xs font-medium border-slate-200 dark:border-slate-800"
        />
      )}

      {/* Selection counter & Batal */}
      {selectedCount > 0 && (
        <div className="flex items-center gap-1.5 pl-1">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {selectedCount} terpilih
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setRowSelection({})}
            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground rounded-lg"
          >
            Batal
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Data Item</h1>
          <p className="text-sm text-muted-foreground">Kelola semua item, harga, stok, gambar, dan barcode.</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportMenuDropdown products={productsList} selectedProducts={selectedProducts} />
          <ImportProductDialog />
          <Button 
            onClick={() => { 
              form.reset({ name: '', sku: '', categoryId: null, price: 0, costPrice: 0, stock: 0, minStock: 5, trackStock: true, imageUrl: '', description: '', barcode: '', modifierGroupIds: [] }); 
              setImageFile(null);
              setSelectedProduct(null);
              setIsAddOpen(true); 
            }}
            className="rounded-xl px-4 flex items-center bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Tambah Item
          </Button>
        </div>
      </div>

      {/* Filter Tabs Ketersediaan */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setStatusFilter('ALL')}
          className={cn(
            "px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5",
            statusFilter === 'ALL'
              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800"
          )}
        >
          <span>Semua Item</span>
          <span className={cn(
            "text-[10px] px-1.5 py-0.2 rounded-full",
            statusFilter === 'ALL' ? "bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900" : "bg-slate-200/60 dark:bg-slate-800"
          )}>
            {totalCount}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter('ACTIVE')}
          className={cn(
            "px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5",
            statusFilter === 'ACTIVE'
              ? "bg-emerald-600 text-white font-semibold shadow-xs"
              : "text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
          )}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Tersedia</span>
          <span className={cn(
            "text-[10px] px-1.5 py-0.2 rounded-full",
            statusFilter === 'ACTIVE' ? "bg-white/25 text-white" : "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300"
          )}>
            {activeCount}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter('INACTIVE')}
          className={cn(
            "px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5",
            statusFilter === 'INACTIVE'
              ? "bg-slate-700 text-white dark:bg-slate-300 dark:text-slate-900 font-semibold shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          )}
        >
          <PowerOff className="w-3.5 h-3.5" />
          <span>Tidak Tersedia</span>
          <span className={cn(
            "text-[10px] px-1.5 py-0.2 rounded-full",
            statusFilter === 'INACTIVE' ? "bg-white/25 text-white dark:bg-slate-900/25 dark:text-slate-900" : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
          )}>
            {inactiveCount}
          </span>
        </button>
      </div>

      <DataTable 
        columns={columns} 
        data={displayedProducts} 
        searchKey="name" 
        searchPlaceholder="Cari nama item..." 
        onRowClick={handleRowClick}
        infiniteScroll={true}
        initialPageSize={10}
        batchSize={10}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        toolbar={batchToolbar}
      />

      {/* Detail Item Modal (Pure Modern shadcn/ui) */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl">
          {detailProduct && (
            <>
              <div className="p-6 pb-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 flex items-start gap-4 pr-12">
                {detailProduct.imageUrl ? (
                  <img 
                    src={detailProduct.imageUrl} 
                    alt={detailProduct.name}
                    className="w-16 h-16 rounded-xl object-cover border border-slate-200 dark:border-slate-800 shadow-xs flex-shrink-0" 
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-primary/10 text-primary font-bold text-xl flex items-center justify-center flex-shrink-0">
                    {detailProduct.name.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 truncate">
                      {detailProduct.name}
                    </h2>
                    {detailProduct.isFeatured && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-500" /> Best Seller
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    SKU: <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{detailProduct.sku}</span>
                    {detailProduct.categoryName && ` • ${detailProduct.categoryName}`}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      detailProduct.status === 'active' 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50' 
                        : 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {detailProduct.status === 'active' ? 'Tersedia' : 'Habis'}
                    </span>
                    {detailProduct.barcode && (
                      <span className="font-mono text-xs text-muted-foreground bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                        {detailProduct.barcode}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                {/* Section Status Ketersediaan */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
                  <div className="space-y-0.5 pr-4">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Status Ketersediaan Item</span>
                    <p className="text-xs text-muted-foreground">
                      {detailProduct.isActive !== false ? 'Item aktif dan dapat dipesan di kasir & menu digital.' : 'Item sedang dinonaktifkan (Tidak Tersedia).'}
                    </p>
                  </div>
                  <Switch
                    checked={detailProduct.isActive !== false}
                    onCheckedChange={async () => {
                      const currentVal = detailProduct.isActive !== false;
                      const nextVal = !currentVal;
                      setDetailProduct({ ...detailProduct, isActive: nextVal });
                      handleToggleActiveStatus(detailProduct, currentVal);
                    }}
                    className="data-[state=checked]:bg-emerald-600 cursor-pointer"
                  />
                </div>

                {/* Section Finansial / Margin */}
                <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                  <div>
                    <span className="text-[11px] font-medium text-muted-foreground block">Harga Jual</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {formatCurrency(parseFloat(detailProduct.price))}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] font-medium text-muted-foreground block">Harga Modal</span>
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                      {formatCurrency(parseFloat(detailProduct.costPrice || '0'))}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] font-medium text-muted-foreground block">Estimasi Untung</span>
                    {(() => {
                      const sp = parseFloat(detailProduct.price);
                      const cp = parseFloat(detailProduct.costPrice || '0');
                      const profit = sp - cp;
                      const margin = sp > 0 ? Math.round((profit / sp) * 100) : 0;
                      return (
                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 block truncate">
                          +{formatCurrency(profit)} ({margin}%)
                        </span>
                      );
                    })()}
                  </div>
                </div>

                {/* Section Inventaris & Stok */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5">
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Status Stok</span>
                    <span className="font-medium text-slate-500">
                      {detailProduct.trackStock !== false ? 'Pelacakan Aktif' : 'Stok Tak Terbatas'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                    <div>
                      <span className="text-muted-foreground block">Sisa Stok Saat Ini</span>
                      <span className="text-base font-bold text-slate-900 dark:text-slate-100">
                        {detailProduct.trackStock !== false ? `${detailProduct.stock} unit` : '∞ (Unlimited)'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Batas Minimum Stok</span>
                      <span className="text-base font-medium text-slate-700 dark:text-slate-300">
                        {detailProduct.trackStock !== false ? `${detailProduct.minStock} unit` : '-'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Deskripsi */}
                {detailProduct.description && (
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1.5">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Deskripsi Item</span>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {detailProduct.description}
                    </p>
                  </div>
                )}

                {/* Modifiers info */}
                {modifierGroups.length > 0 && detailProduct.modifierGroupIds && detailProduct.modifierGroupIds.length > 0 && (
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                      Grup Modifier / Kustomisasi ({detailProduct.modifierGroupIds.length})
                    </span>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {detailProduct.modifierGroupIds.map((mgId) => {
                        const mg = modifierGroups.find(g => g.id === mgId);
                        return mg ? (
                          <span key={mgId} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {mg.name} {mg.modifiers ? `(${mg.modifiers.length} opsi)` : ''}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}

                {/* Barcode Preview jika ada */}
                {(detailProduct.barcode || detailProduct.sku) && (
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col items-center justify-center space-y-2">
                    <Barcode 
                      value={detailProduct.barcode || detailProduct.sku} 
                      width={1.8} 
                      height={48} 
                      displayValue={true}
                      background="#ffffff"
                      lineColor="#000000"
                    />
                  </div>
                )}
              </div>

              <div className="p-4 px-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 flex items-center justify-between">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setIsDetailOpen(false);
                    handleDeleteClick(detailProduct);
                  }}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl"
                >
                  <Trash2 className="w-4 h-4 mr-1.5" /> Hapus
                </Button>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsDetailOpen(false)}
                    className="rounded-xl px-4"
                  >
                    Tutup
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => {
                      setIsDetailOpen(false);
                      handleEditClick(detailProduct);
                    }}
                    className="rounded-xl px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-xs"
                  >
                    <Pencil className="w-3.5 h-3.5 mr-1.5" /> Edit Item
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Slide-Over Sheet Drawer for Tambah & Edit Item */}
      <Sheet open={isAddOpen || isEditOpen} onOpenChange={(open) => {
        if (!open) {
          setIsAddOpen(false);
          setIsEditOpen(false);
          setSelectedProduct(null);
        }
      }}>
        <SheetContent 
          side="right" 
          className="sm:max-w-xl md:max-w-2xl w-full p-0 flex flex-col h-full bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 focus:outline-none shadow-2xl"
        >
          <SheetHeader className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex-shrink-0">
            <div className="flex items-center justify-between pr-6">
              <div>
                <SheetTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
                  {selectedProduct ? (
                    <>
                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <Pencil className="w-4 h-4" />
                      </div>
                      <span>Edit Item: {selectedProduct.name}</span>
                    </>
                  ) : (
                    <>
                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <Package className="w-4 h-4" />
                      </div>
                      <span>Tambah Item Baru</span>
                    </>
                  )}
                </SheetTitle>
                <SheetDescription className="text-xs text-muted-foreground mt-1">
                  {selectedProduct 
                    ? 'Perbarui rincian produk, harga jual, margin, inventaris, dan opsi kustomisasi.' 
                    : 'Lengkapi informasi produk baru untuk ditampilkan di sistem kasir dan menu digital.'}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <ProductForm onSubmit={selectedProduct ? onSubmitEdit : onSubmitAdd} />
        </SheetContent>
      </Sheet>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Hapus Item</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus <b>{selectedProduct?.name}</b>? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Batal</Button>
            <Button variant="destructive" onClick={onConfirmDelete} disabled={isLoading}>
              {isLoading ? 'Menghapus...' : 'Ya, Hapus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Dialog */}
      <Dialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
        <DialogContent className="max-w-md p-6 rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-red-600 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-600" />
              Hapus {selectedCount} Item Terpilih?
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-600 dark:text-slate-400 pt-2">
              Item yang dipilih akan dihapus secara permanen dari katalog outlet Anda. Pastikan item tersebut tidak sedang digunakan pada transaksi aktif.
            </DialogDescription>
          </DialogHeader>

          <div className="my-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 max-h-40 overflow-y-auto space-y-1.5">
            {selectedProducts.slice(0, 5).map((item) => (
              <div key={item.id} className="text-xs text-slate-700 dark:text-slate-300 flex items-center gap-2 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                <span className="font-medium truncate">{item.name}</span>
                <span className="text-muted-foreground ml-auto shrink-0">{formatCurrency(parseFloat(item.price))}</span>
              </div>
            ))}
            {selectedCount > 5 && (
              <div className="text-xs text-muted-foreground text-center pt-1 font-medium">
                + {selectedCount - 5} item lainnya
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsBulkDeleteOpen(false)}
              disabled={isBulkLoading}
              className="rounded-xl border-slate-200 dark:border-slate-800"
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleBulkDeleteConfirm}
              disabled={isBulkLoading}
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium"
            >
              {isBulkLoading ? 'Menghapus...' : `Ya, Hapus ${selectedCount} Item`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Barcode Print Dialog */}
      <Dialog open={isPrintBarcodeOpen} onOpenChange={setIsPrintBarcodeOpen}>
        <DialogContent className="max-w-md">
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
          <DialogFooter className="flex gap-2 sm:justify-end mt-4">
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
