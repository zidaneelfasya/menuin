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
  ThumbsUp,
  Boxes,
  Upload,
  RefreshCw,
  Check,
  Sparkles,
  Barcode as BarcodeIcon,
  Tag,
  Banknote,
  TrendingUp,
  AlertCircle,
  Info,
  Layers,
  X,
  Power,
  PowerOff,
  CheckCircle2,
  LayoutList,
  LayoutGrid,
  Search as SearchIcon,
  PackageSearch,
  Filter
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

const DataTable = dynamic(
  () => import('@/components/ui/data-table').then((mod) => mod.DataTable),
  { ssr: false, loading: () => <div className="h-64 w-full bg-muted animate-pulse rounded-xl"></div> }
);
import { ImportProductDialog } from './import-product-dialog';
import { QuickStockDialog } from './quick-stock-dialog';
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
import { useForm, Controller, useWatch, type UseFormReturn } from 'react-hook-form';
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

function CleanCurrencyInput({
  id,
  value,
  onChange,
  placeholder = '0',
  className,
}: {
  id: string;
  value: number | undefined | null;
  onChange: (val: number) => void;
  placeholder?: string;
  className?: string;
}) {
  const [localStr, setLocalStr] = React.useState<string>(() => 
    value !== undefined && value !== null && value > 0 ? value.toLocaleString('id-ID') : ''
  );

  React.useEffect(() => {
    const formatted = value !== undefined && value !== null && value > 0 ? value.toLocaleString('id-ID') : '';
    setLocalStr(formatted);
  }, [value]);

  return (
    <div className="relative">
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 select-none pointer-events-none">
        Rp
      </span>
      <Input
        id={id}
        type="text"
        inputMode="numeric"
        placeholder={placeholder}
        value={localStr}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, '');
          const num = digits ? parseInt(digits, 10) : 0;
          setLocalStr(num > 0 ? num.toLocaleString('id-ID') : '');
          onChange(num);
        }}
        className={cn(
          "pl-10 h-10 text-sm font-medium rounded-full border-none shadow-sm-md bg-white focus-visible:ring-2 focus-visible:ring-primary/20",
          className
        )}
      />
    </div>
  );
}

function CleanNumberInput({
  id,
  value,
  onChange,
  placeholder = '0',
  className,
}: {
  id: string;
  value: number | undefined | null;
  onChange: (val: number) => void;
  placeholder?: string;
  className?: string;
}) {
  const [localStr, setLocalStr] = React.useState<string>(() => 
    value !== undefined && value !== null ? String(value) : ''
  );

  React.useEffect(() => {
    setLocalStr(value !== undefined && value !== null ? String(value) : '');
  }, [value]);

  return (
    <Input
      id={id}
      type="text"
      inputMode="numeric"
      placeholder={placeholder}
      value={localStr}
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, '');
        const num = digits ? parseInt(digits, 10) : 0;
        setLocalStr(digits);
        onChange(num);
      }}
      className={cn(
        "h-10 text-sm font-medium rounded-full border-none shadow-sm-md bg-white px-4 focus-visible:ring-2 focus-visible:ring-primary/20",
        className
      )}
    />
  );
}

function PriceProfitSection({
  form,
}: {
  form: UseFormReturn<z.infer<typeof productSchema>>;
}) {
  const [price, costPrice, potongan] = useWatch({
    control: form.control,
    name: ['price', 'costPrice', 'potongan'],
  });

  const numPrice = Number(price || 0);
  const numCostPrice = Number(costPrice || 0);
  const numPotongan = Number(potongan || 0);
  const finalPriceAfterDiscount = Math.max(0, numPrice - numPotongan);
  const profit = finalPriceAfterDiscount - numCostPrice;
  const marginPct = finalPriceAfterDiscount > 0 ? Math.round(((profit / finalPriceAfterDiscount) * 100)) : 0;

  return (
    <div className="space-y-3">
      <div>
        <h4 className="text-sm font-semibold text-slate-900">Harga & Potongan</h4>
        <p className="text-xs text-muted-foreground mt-0.5">Tentukan harga normal dan diskon promo jika ada.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="price" className="text-xs font-medium text-slate-700">
            Harga Normal <span className="text-rose-500">*</span>
          </Label>
          <Controller
            control={form.control}
            name="price"
            render={({ field }) => (
              <CleanCurrencyInput
                id="price"
                value={field.value}
                onChange={field.onChange}
                placeholder="0"
              />
            )}
          />
          {form.formState.errors.price && (
            <p className="text-xs text-rose-500 mt-1">{form.formState.errors.price.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="potongan" className="text-xs font-medium text-slate-700">
              Potongan
            </Label>
            {numPotongan > 0 && (
              <button
                type="button"
                onClick={() => form.setValue('potongan', 0, { shouldDirty: true, shouldValidate: true })}
                className="text-[10px] text-muted-foreground hover:text-rose-500 cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
          <Controller
            control={form.control}
            name="potongan"
            render={({ field }) => (
              <CleanCurrencyInput
                id="potongan"
                value={field.value}
                onChange={field.onChange}
                placeholder="0"
              />
            )}
          />
          {form.formState.errors.potongan && (
            <p className="text-xs text-rose-500 mt-1">{form.formState.errors.potongan.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="costPrice" className="text-xs font-medium text-slate-700">
            Harga Modal (HPP)
          </Label>
          <Controller
            control={form.control}
            name="costPrice"
            render={({ field }) => (
              <CleanCurrencyInput
                id="costPrice"
                value={field.value}
                onChange={field.onChange}
                placeholder="0"
              />
            )}
          />
          {form.formState.errors.costPrice && (
            <p className="text-xs text-rose-500 mt-1">{form.formState.errors.costPrice.message}</p>
          )}
        </div>
      </div>

      {numPrice > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs py-2.5 px-3.5 rounded-2xl bg-slate-50 shadow-sm-md">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-muted-foreground">Harga Jual Kasir:</span>
            <span className="font-semibold text-slate-900">
              {formatCurrency(finalPriceAfterDiscount)}
            </span>
            {numPotongan > 0 && (
              <>
                <span className="text-slate-400 line-through text-[11px] ml-1">
                  {formatCurrency(numPrice)}
                </span>
                <span className="text-emerald-600 font-medium text-[11px]">
                  (Diskon {formatCurrency(numPotongan)})
                </span>
              </>
            )}
          </div>

          {numCostPrice > 0 && (
            <div className="text-[11px] text-muted-foreground">
              Margin: <span className="font-medium text-slate-800">{marginPct}%</span> ({profit >= 0 ? `+${formatCurrency(profit)}` : `-${formatCurrency(Math.abs(profit))}`})
            </div>
          )}
        </div>
      )}

      {numPotongan > numPrice && (
        <p className="text-xs text-rose-500 font-medium">
          Nilai potongan tidak boleh lebih besar dari harga normal ({formatCurrency(numPrice)}).
        </p>
      )}
    </div>
  );
}

interface ProductFormProps {
  form: UseFormReturn<z.infer<typeof productSchema>>;
  onSubmit: (values: z.infer<typeof productSchema>) => Promise<void>;
  isLoading: boolean;
  selectedProduct: ProductDto | null;
  categories: Category[];
  modifierGroups: any[];
  imageFile: File | null;
  setImageFile: (file: File | null) => void;
  onCancel: () => void;
}

function ProductForm({
  form,
  onSubmit,
  isLoading,
  selectedProduct,
  categories,
  modifierGroups,
  imageFile,
  setImageFile,
  onCancel,
}: ProductFormProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const watchedImageUrl = useWatch({ control: form.control, name: 'imageUrl' });
  const watchedTrackStock = useWatch({ control: form.control, name: 'trackStock' });
  const currentImage = imageFile 
    ? URL.createObjectURL(imageFile) 
    : watchedImageUrl;

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

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0 bg-white">
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
        
        {/* Section 1: Foto Menu (Compact, Sleek Row) */}
        <div className="flex items-center gap-4 p-3.5 rounded-2xl shadow-sm-md bg-slate-50">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="relative w-16 h-16 rounded-xl overflow-hidden bg-white flex items-center justify-center shrink-0 cursor-pointer group shadow-sm-md"
          >
            {currentImage ? (
              <img src={currentImage} alt="Foto Menu" className="w-full h-full object-cover" />
            ) : (
              <Upload className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
            )}
          </div>
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-900">Foto Menu</span>
              {currentImage && (
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    form.setValue('imageUrl', null, { shouldDirty: true });
                  }}
                  className="text-[11px] font-medium text-rose-500 hover:text-rose-600 transition-colors cursor-pointer"
                >
                  Hapus
                </button>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground truncate">
              Format JPG, PNG, atau WEBP (maks. 2MB)
            </p>
            <div className="pt-0.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="h-8 text-xs font-medium px-3 rounded-full border-none shadow-sm-md bg-white hover:bg-slate-100"
              >
                <Upload className="w-3 h-3 mr-1.5" />
                {currentImage ? 'Ganti Foto' : 'Unggah Foto'}
              </Button>
            </div>
          </div>
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

        {/* Section 2: Informasi Menu */}
        <div className="space-y-3.5">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-medium text-slate-700">
              Nama Menu <span className="text-rose-500">*</span>
            </Label>
            <Input 
              id="name" 
              {...form.register('name')} 
              placeholder="Contoh: Kopi Susu Gula Aren, Croissant Almond" 
              className="h-10 text-sm rounded-full border-none shadow-sm-md bg-white px-4 focus-visible:ring-2 focus-visible:ring-primary/20"
            />
            {form.formState.errors.name && (
              <p className="text-xs text-rose-500 mt-1">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="category" className="text-xs font-medium text-slate-700">
                Kategori
              </Label>
              <Controller
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <Select
                    value={field.value || 'none'}
                    onValueChange={(val) => field.onChange(val === 'none' ? null : val)}
                  >
                    <SelectTrigger id="category" className="w-full h-10 text-sm rounded-full border-none shadow-sm-md bg-white px-4 focus:outline-none focus:ring-2 focus:ring-primary/20">
                      <SelectValue placeholder="Pilih Kategori" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-2xl bg-white p-1">
                      <SelectItem value="none" className="text-muted-foreground rounded-xl cursor-pointer hover:bg-slate-100">Tanpa Kategori</SelectItem>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id} className="rounded-xl cursor-pointer hover:bg-slate-100">{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="sku" className="text-xs font-medium text-slate-700">
                  SKU (Kode Menu) <span className="text-rose-500">*</span>
                </Label>
                <button
                  type="button"
                  onClick={handleAutoGenerateSku}
                  className="text-[11px] font-medium text-primary hover:underline cursor-pointer"
                >
                  Auto SKU
                </button>
              </div>
              <Input 
                id="sku" 
                {...form.register('sku')} 
                placeholder="KOP-001" 
                className="font-mono text-sm uppercase h-10 rounded-full border-none shadow-sm-md bg-white px-4 focus-visible:ring-2 focus-visible:ring-primary/20"
              />
              {form.formState.errors.sku && (
                <p className="text-xs text-rose-500 mt-1">{form.formState.errors.sku.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="barcode" className="text-xs font-medium text-slate-700">
                Barcode (Opsional)
              </Label>
              <button
                type="button"
                onClick={handleAutoGenerateBarcode}
                className="text-[11px] font-medium text-primary hover:underline cursor-pointer"
              >
                Auto Barcode
              </button>
            </div>
            <Input 
              id="barcode" 
              {...form.register('barcode')} 
              placeholder="Contoh: 8991234567890 (kosongkan jika tanpa barcode)" 
              className="font-mono text-sm h-10 rounded-full border-none shadow-sm-md bg-white px-4 focus-visible:ring-2 focus-visible:ring-primary/20"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs font-medium text-slate-700">
              Deskripsi Menu (Opsional)
            </Label>
            <Textarea 
              id="description" 
              {...form.register('description')} 
              placeholder="Deskripsi singkat menu atau catatan penyajian..." 
              className="min-h-[72px] resize-none text-sm rounded-2xl border-none shadow-sm-md bg-white p-3.5 focus-visible:ring-2 focus-visible:ring-primary/20"
            />
          </div>
        </div>

        <div className="border-t border-slate-100" />

        {/* Section 3: Harga & Potongan */}
        <PriceProfitSection form={form} />

        <div className="border-t border-slate-100" />

        {/* Section 4: Ketersediaan & Stok */}
        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-semibold text-slate-900">Ketersediaan & Stok</h4>
            <p className="text-xs text-muted-foreground mt-0.5">Kontrol ketersediaan menu di kasir dan pelacakan sisa stok.</p>
          </div>

          <div className="divide-y divide-slate-100 rounded-2xl shadow-sm-md bg-slate-50">
            <div className="flex items-center justify-between p-3.5">
              <div className="space-y-0.5 pr-4">
                <Label htmlFor="isActiveSwitch" className="text-xs font-medium cursor-pointer text-slate-800">
                  Menu Aktif & Tersedia
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Tampil aktif di kasir POS dan katalog digital.
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
                  />
                )}
              />
            </div>

            <div className="flex items-center justify-between p-3.5">
              <div className="space-y-0.5 pr-4">
                <Label htmlFor="trackStockSwitch" className="text-xs font-medium cursor-pointer text-slate-800">
                  Lacak Sisa Stok
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Stok otomatis berkurang saat transaksi berhasil diselesaikan.
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
          </div>

          {watchedTrackStock !== false && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
              <div className="space-y-1.5">
                <Label htmlFor="stock" className="text-xs font-medium text-slate-700">
                  Sisa Stok
                </Label>
                <Controller
                  control={form.control}
                  name="stock"
                  render={({ field }) => (
                    <CleanNumberInput
                      id="stock"
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="0"
                    />
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="minStock" className="text-xs font-medium text-slate-700">
                  Batas Minimum Stok
                </Label>
                <Controller
                  control={form.control}
                  name="minStock"
                  render={({ field }) => (
                    <CleanNumberInput
                      id="minStock"
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="0"
                    />
                  )}
                />
              </div>
            </div>
          )}
        </div>

        {/* Section 5: Kustomisasi & Modifier (if applicable) */}
        {modifierGroups.length > 0 && (
          <>
            <div className="border-t border-slate-100" />
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Grup Modifier & Varian</h4>
                <p className="text-xs text-muted-foreground mt-0.5">Pilih varian atau opsi tambahan yang dapat dipilih saat memesan menu ini.</p>
              </div>

              <Controller
                control={form.control}
                name="modifierGroupIds"
                render={({ field }) => (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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
                          className={`p-3.5 rounded-2xl shadow-sm-md transition-colors cursor-pointer flex items-start gap-3 select-none bg-white ${
                            isChecked 
                              ? 'ring-2 ring-primary/60 bg-blue-50/20 text-slate-900' 
                              : 'hover:bg-slate-50'
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
                          <div className="space-y-0.5 min-w-0">
                            <p className="text-xs font-medium truncate">{mg.name}</p>
                            <p className="text-[11px] text-muted-foreground truncate">
                              {mg.modifiers?.map((m: any) => m.name).join(', ') || 'Belum ada opsi'}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              />
            </div>
          </>
        )}
      </div>

      {/* Action Footer */}
      <div className="p-4 px-6 border-t border-slate-100 bg-white flex items-center justify-between gap-3">
        <div className="text-xs text-muted-foreground">
          {form.formState.isDirty && (
            <span className="text-amber-600 font-medium">
              Ada perubahan belum disimpan
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            className="rounded-full shadow-md bg-white hover:bg-slate-100 text-slate-700 border-none px-5 h-10 text-xs font-medium"
          >
            Batal
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading}
            className="rounded-full shadow-md bg-primary hover:bg-primary/90 text-white border-none px-5 h-10 text-xs font-semibold"
          >
            {isLoading ? (
              <span className="flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Menyimpan...
              </span>
            ) : (
              selectedProduct ? 'Perbarui Item' : 'Simpan Item'
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}

export function ProductList({ 
  initialData, 
  categories, 
  modifierGroups = [],
  userRole = 'OWNER'
}: { 
  initialData: ProductDto[]; 
  categories: Category[]; 
  modifierGroups?: any[];
  userRole?: string;
}) {
  const router = useRouter();
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

  // Quick Stock Adjustment Dialog State
  const [stockDialogProduct, setStockDialogProduct] = React.useState<ProductDto | null>(null);
  const [isStockDialogOpen, setIsStockDialogOpen] = React.useState(false);

  const canManageStock = userRole === 'OWNER' || userRole === 'MANAGER';

  const handleOpenStockDialog = (product: ProductDto) => {
    setStockDialogProduct(product);
    setIsStockDialogOpen(true);
  };

  const handleStockSuccess = (productId: string, newStock: number) => {
    setProductsList((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, stock: newStock } : p))
    );
  };

  // Layout View Mode: 'list' | 'grid'
  const [viewMode, setViewMode] = React.useState<'list' | 'grid'>('list');
  // Category Filter: 'ALL' | categoryId
  const [categoryFilter, setCategoryFilter] = React.useState<string>('ALL');
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = React.useState(false);
  // Unified Search Query (for both list and card views)
  const [searchQuery, setSearchQuery] = React.useState<string>('');

  // Status Filter: 'ALL' | 'ACTIVE' | 'LOW_STOCK' | 'INACTIVE'
  const [statusFilter, setStatusFilter] = React.useState<'ALL' | 'ACTIVE' | 'LOW_STOCK' | 'INACTIVE'>('ALL');

  const totalCount = productsList.length;
  const activeCount = React.useMemo(() => productsList.filter((p) => p.isActive !== false).length, [productsList]);
  const inactiveCount = React.useMemo(() => productsList.filter((p) => p.isActive === false).length, [productsList]);
  const lowStockCount = React.useMemo(() => {
    return productsList.filter((p) => p.trackStock !== false && (p.stock ?? 0) <= (p.minStock ?? 5)).length;
  }, [productsList]);

  const displayedProducts = React.useMemo(() => {
    let list = productsList;

    if (statusFilter === 'ACTIVE') {
      list = list.filter((p) => p.isActive !== false);
    } else if (statusFilter === 'LOW_STOCK') {
      list = list.filter((p) => p.trackStock !== false && (p.stock ?? 0) <= (p.minStock ?? 5));
    } else if (statusFilter === 'INACTIVE') {
      list = list.filter((p) => p.isActive === false);
    }

    if (categoryFilter !== 'ALL') {
      list = list.filter((p) => p.categoryId === categoryFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((p) => 
        p.name.toLowerCase().includes(q) || 
        (p.sku && p.sku.toLowerCase().includes(q))
      );
    }

    return list;
  }, [productsList, statusFilter, categoryFilter, searchQuery]);

  const cardGridProducts = displayedProducts;

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
          ? `${selectedCount} item berhasil dijadikan Rekomendasi Outlet.`
          : `${selectedCount} item dinonaktifkan dari Rekomendasi Outlet.`
      );
    } else {
      toast.error(result.error || 'Gagal mengubah status Rekomendasi');
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
      toast.error(result.error || 'Gagal mengubah status Rekomendasi');
      setProductsList((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, isFeatured: currentValue } : p))
      );
    } else {
      toast.success(newValue ? `${product.name} dijadikan Rekomendasi Outlet.` : `${product.name} dihapus dari Rekomendasi Outlet.`);
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
    defaultValues: { name: '', sku: '', categoryId: null, price: 0, costPrice: 0, potongan: 0, stock: 0, minStock: 5, trackStock: true, isActive: true, imageUrl: '', description: '', barcode: '', modifierGroupIds: [] },
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
      
      const payload = { ...values, imageUrl: finalImageUrl };
      const result = await createProduct(payload);
      
      if (result.success) {
        toast.success('Item berhasil ditambahkan');
        setIsAddOpen(false);
        form.reset();
        setImageFile(null);
        router.refresh();
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

      const payload = { ...values, imageUrl: finalImageUrl };
      const result = await updateProduct(selectedProduct.id, payload);
      
      if (result.success) {
        const catName = categories.find((c) => c.id === values.categoryId)?.name || null;
        const numPotongan = values.potongan ?? 0;
        
        // Optimistic / immediate UI update on local state so changes reflect instantly
        setProductsList((prev) =>
          prev.map((p) =>
            p.id === selectedProduct.id
              ? {
                  ...p,
                  name: values.name,
                  sku: values.sku,
                  categoryId: values.categoryId ?? null,
                  categoryName: catName,
                  price: values.price.toString(),
                  costPrice: values.costPrice.toString(),
                  potongan: numPotongan.toString(),
                  stock: values.stock,
                  minStock: values.minStock,
                  trackStock: values.trackStock ?? true,
                  isActive: values.isActive ?? true,
                  imageUrl: finalImageUrl || p.imageUrl,
                  description: values.description || null,
                  barcode: values.barcode || null,
                  modifierGroupIds: values.modifierGroupIds || [],
                }
              : p
          )
        );

        if (detailProduct?.id === selectedProduct.id) {
          setDetailProduct((prev) =>
            prev
              ? {
                  ...prev,
                  name: values.name,
                  sku: values.sku,
                  categoryId: values.categoryId ?? null,
                  categoryName: catName,
                  price: values.price.toString(),
                  costPrice: values.costPrice.toString(),
                  potongan: numPotongan.toString(),
                  stock: values.stock,
                  minStock: values.minStock,
                  trackStock: values.trackStock ?? true,
                  isActive: values.isActive ?? true,
                  imageUrl: finalImageUrl || prev.imageUrl,
                  description: values.description || null,
                  barcode: values.barcode || null,
                  modifierGroupIds: values.modifierGroupIds || [],
                }
              : null
          );
        }

        toast.success('Item berhasil diperbarui');
        setIsEditOpen(false);
        setImageFile(null);
        router.refresh();
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
    const deleteId = selectedProduct.id;
    const result = await deleteProduct(deleteId);
    setIsLoading(false);
    
    if (result.success) {
      setProductsList((prev) => prev.filter((p) => p.id !== deleteId));
      if (detailProduct?.id === deleteId) {
        setIsDetailOpen(false);
        setDetailProduct(null);
      }
      toast.success('Item berhasil dihapus');
      setIsDeleteOpen(false);
      router.refresh();
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
      categoryId: product.categoryId || null,
      price: parseFloat(product.price) || 0,
      costPrice: product.costPrice ? parseFloat(product.costPrice) : 0, 
      potongan: product.potongan ? parseFloat(product.potongan) : 0,
      stock: product.stock ?? 0,
      minStock: product.minStock ?? 5,
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
                <div className="hidden w-10 h-10 bg-primary/10 rounded-lg mr-3 items-center justify-center text-primary font-semibold">
                  {product.name.charAt(0)}
                </div>
              </>
            ) : (
              <div className="w-10 h-10 bg-primary/10 rounded-lg mr-3 flex items-center justify-center text-primary font-semibold">
                {product.name.charAt(0)}
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-slate-900">{product.name}</span>
                {product.isFeatured && (
                  <ThumbsUp className="w-3.5 h-3.5 fill-blue-500 text-blue-600 shrink-0" />
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
      header: 'Rekomendasi',
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
                "p-1.5 rounded-full transition-colors flex items-center justify-center cursor-pointer",
                isFeatured 
                  ? "text-blue-600 bg-blue-50 hover:bg-blue-100" 
                  : "text-slate-300 hover:text-blue-600 hover:bg-slate-100"
              )}
              title={isFeatured ? 'Rekomendasi Menu (Klik untuk batalkan)' : 'Jadikan Rekomendasi Menu'}
            >
              <ThumbsUp className={cn("h-4 w-4", isFeatured ? "fill-blue-500 text-blue-600" : "text-slate-300")} />
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
        const product = row.original;
        const amount = parseFloat(row.getValue('price'));
        const potongan = product.potongan ? parseFloat(product.potongan) : 0;
        if (potongan > 0) {
          const finalPrice = Math.max(0, amount - potongan);
          return (
            <div>
              <div className="font-semibold text-rose-600">{formatCurrency(finalPrice)}</div>
              <div className="text-xs text-muted-foreground line-through">{formatCurrency(amount)}</div>
            </div>
          );
        }
        return <div className="font-medium">{formatCurrency(amount)}</div>;
      },
    },
    {
      accessorKey: 'stock',
      header: 'Sisa Stok',
      cell: ({ row }) => {
        const product = row.original;
        const isTracked = product.trackStock !== false;
        
        if (!isTracked) {
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
              Tanpa Batas
            </span>
          );
        }

        const stock = parseInt(row.getValue('stock')) || 0;
        const minStock = product.minStock || 0;
        const isLow = stock <= minStock && stock > 0;
        const isZero = stock <= 0;

        return (
          <div 
            className="flex items-center gap-2 group/stock"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className={cn(
                  "text-xs font-semibold tabular-nums",
                  isZero 
                    ? "text-rose-600" 
                    : isLow 
                    ? "text-amber-600" 
                    : "text-slate-900"
                )}>
                  {stock} porsi
                </span>
                {isZero ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-rose-100/70 text-rose-700">
                    Habis
                  </span>
                ) : isLow ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-amber-100/80 text-amber-700">
                    Menipis
                  </span>
                ) : null}
              </div>
              {minStock > 0 && (
                <span className="text-[10px] text-muted-foreground">
                  Batas min: {minStock}
                </span>
              )}
            </div>

            {canManageStock && (
              <button
                type="button"
                onClick={() => handleOpenStockDialog(product)}
                className={cn(
                  "p-1 px-2 rounded-full text-xs font-medium transition-all flex items-center gap-1 border-none shadow-xs cursor-pointer",
                  (isLow || isZero)
                    ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" 
                    : "opacity-0 group-hover/stock:opacity-100 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200"
                )}
                title="Penyesuaian stok"
              >
                <Plus className="w-3 h-3" />
                <span className="text-[10px]">{(isLow || isZero) ? 'Restock' : 'Atur'}</span>
              </button>
            )}
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
                "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-colors",
                !isActive
                  ? "bg-slate-100 text-slate-600"
                  : isOutOfStock
                  ? "bg-amber-100/80 text-amber-700"
                  : "bg-emerald-100/80 text-emerald-700"
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
                className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full cursor-pointer" 
                onClick={(e) => e.stopPropagation()}
              >
                <span className="sr-only">Buka menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 p-1.5 rounded-2xl shadow-2xl border-none bg-white">
              <DropdownMenuItem 
                className="text-xs font-medium py-2 px-3 rounded-xl cursor-pointer hover:bg-slate-100"
                onClick={(e) => { e.stopPropagation(); handleRowClick(product); }}
              >
                Detail item
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-xs font-medium py-2 px-3 rounded-xl cursor-pointer hover:bg-slate-100"
                onClick={(e) => { e.stopPropagation(); handleEditClick(product); }}
              >
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-xs font-medium py-2 px-3 rounded-xl cursor-pointer hover:bg-slate-100"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleActiveStatus(product, isActive);
                }}
              >
                {isActive ? (
                  <span className="flex items-center gap-2 text-amber-700">
                    <PowerOff className="w-3.5 h-3.5" />
                    <span>Matikan (Tidak Tersedia)</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-2 text-emerald-700">
                    <Power className="w-3.5 h-3.5" />
                    <span>Aktifkan (Tersedia)</span>
                  </span>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-xs font-medium py-2 px-3 rounded-xl cursor-pointer hover:bg-slate-100"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleBestSeller(product, !!product.isFeatured);
                }}
              >
                <ThumbsUp className={cn("w-3.5 h-3.5 mr-2", product.isFeatured ? "fill-blue-500 text-blue-600" : "text-slate-400")} />
                {product.isFeatured ? 'Hapus rekomendasi' : 'Jadikan rekomendasi'}
              </DropdownMenuItem>
              {isTracked && canManageStock && (
                <DropdownMenuItem 
                  className="text-xs font-medium py-2 px-3 rounded-xl cursor-pointer hover:bg-slate-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenStockDialog(product);
                  }}
                >
                  <Boxes className="w-3.5 h-3.5 mr-2 text-slate-500" />
                  Sesuaikan stok
                </DropdownMenuItem>
              )}
              {canManageStock && (
                <DropdownMenuItem 
                  className="text-xs font-medium py-2 px-3 rounded-xl cursor-pointer hover:bg-slate-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleTrackStock(product, isTracked);
                  }}
                >
                  {isTracked ? 'Nonaktifkan lacak stok' : 'Aktifkan lacak stok'}
                </DropdownMenuItem>
              )}
              {(product.barcode || product.sku) && (
                <DropdownMenuItem 
                  className="text-xs font-medium py-2 px-3 rounded-xl cursor-pointer hover:bg-slate-100"
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
                className="text-xs font-medium py-2 px-3 rounded-xl cursor-pointer hover:bg-slate-100"
                onClick={(e) => { e.stopPropagation(); handlePrintBarcodeClick(product); }}
              >
                Cetak barcode
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1 bg-slate-100" />
              <DropdownMenuItem 
                className="text-xs font-medium py-2 px-3 rounded-xl cursor-pointer text-red-600 hover:bg-red-50"
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


  return (
    <div className="space-y-6">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Daftar Menu</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Kelola katalog menu, harga jual, ketersediaan, dan sisa stok produk outlet.</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportMenuDropdown products={productsList} selectedProducts={selectedProducts} />
          <ImportProductDialog />
        </div>
      </div>

      {/* 2. ZONE 1: TABS & TOOLBAR ROW (Single Universal Row) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-slate-200 gap-4">
        {/* Left: Underline Status Filter Tabs */}
        <div className="flex items-center gap-6 overflow-x-auto no-scrollbar pt-1">
          {[
            { key: 'ALL', label: 'Semua Menu', count: totalCount },
            { key: 'ACTIVE', label: 'Tersedia', count: activeCount },
            ...(lowStockCount > 0 ? [{ key: 'LOW_STOCK', label: 'Stok Menipis', count: lowStockCount }] : []),
            { key: 'INACTIVE', label: 'Tidak Tersedia', count: inactiveCount },
          ].map((tab) => {
            const isActive = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key as any)}
                className={cn(
                  "relative pb-3 text-xs sm:text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap",
                  isActive
                    ? "text-blue-600 font-semibold"
                    : "text-slate-500 hover:text-blue-600"
                )}
              >
                <span>{tab.label}</span>
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full font-medium transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-400 bg-slate-100"
                )}>
                  {tab.count}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="activeProductTabUnderline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Right: Search, Category Filter Popover, View Switcher, and Primary Action */}
        <div className="flex items-center gap-2.5 pb-2.5 lg:pb-3 flex-wrap">
          {/* Search Input */}
          <div className="relative w-full sm:w-60">
            <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Cari nama atau SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-8 h-10 text-xs rounded-full bg-white border-none shadow-sm-md focus-visible:ring-2 focus-visible:ring-primary/20"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter Popover (Funnel icon with active dot) */}
          <Popover open={isFilterPopoverOpen} onOpenChange={setIsFilterPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  "h-10 w-10 rounded-full border-none shadow-sm-md bg-white hover:bg-slate-100 relative cursor-pointer",
                  categoryFilter !== 'ALL' && "bg-blue-50 text-blue-600 ring-2 ring-blue-500/20"
                )}
                title="Filter Kategori"
              >
                <Filter className="w-4 h-4 text-slate-600" />
                {categoryFilter !== 'ALL' && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 p-3 rounded-2xl shadow-2xl border-none space-y-2 bg-white">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-semibold text-slate-900">Kategori Menu</span>
                {categoryFilter !== 'ALL' && (
                  <button
                    type="button"
                    onClick={() => setCategoryFilter('ALL')}
                    className="text-[11px] text-blue-600 hover:underline font-medium cursor-pointer"
                  >
                    Reset Filter
                  </button>
                )}
              </div>
              <div className="space-y-1 max-h-56 overflow-y-auto no-scrollbar">
                <button
                  type="button"
                  onClick={() => {
                    setCategoryFilter('ALL');
                    setIsFilterPopoverOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-full text-xs font-medium transition-colors text-left cursor-pointer",
                    categoryFilter === 'ALL'
                      ? "bg-blue-50 text-blue-700 font-semibold shadow-xs"
                      : "text-slate-700 hover:bg-slate-100"
                  )}
                >
                  <span>Semua Kategori</span>
                  {categoryFilter === 'ALL' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setCategoryFilter(cat.id);
                      setIsFilterPopoverOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-full text-xs font-medium transition-colors text-left cursor-pointer",
                      categoryFilter === cat.id
                        ? "bg-blue-50 text-blue-700 font-semibold shadow-xs"
                        : "text-slate-700 hover:bg-slate-100"
                    )}
                  >
                    <span className="truncate">{cat.name}</span>
                    {categoryFilter === cat.id && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Switcher Tampilan (List vs Card) */}
          <div className="flex items-center bg-slate-100 p-1 rounded-full shadow-sm-md h-10">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={cn(
                "h-8 px-3 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer",
                viewMode === 'list'
                  ? "bg-white text-slate-900 shadow-md font-semibold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
              )}
              title="Tampilan Tabel"
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tabel</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={cn(
                "h-8 px-3 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer",
                viewMode === 'grid'
                  ? "bg-white text-slate-900 shadow-md font-semibold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
              )}
              title="Tampilan Kartu"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kartu</span>
            </button>
          </div>

          {/* Tombol Primary: Tambah Item */}
          <Button
            onClick={() => {
              form.reset({ name: '', sku: '', categoryId: null, price: 0, costPrice: 0, stock: 0, minStock: 5, trackStock: true, imageUrl: '', description: '', barcode: '', modifierGroupIds: [] });
              setImageFile(null);
              setSelectedProduct(null);
              setIsAddOpen(true);
            }}
            className="h-10 px-5 text-xs font-semibold rounded-full bg-[#0e59f9] hover:bg-blue-600 text-white shadow-md cursor-pointer flex items-center gap-1.5 border-none"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Item</span>
          </Button>
        </div>
      </div>

      {/* 3. Contextual Batch Action Bar (Muncul hanya saat item dicentang) */}
      {selectedCount > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 px-5 rounded-2xl bg-blue-50/80 shadow-md animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#0e59f9] text-white shadow-xs">
              {selectedCount} item terpilih
            </span>
            <span className="text-xs text-slate-700 hidden sm:inline">
              Aksi massal pada menu yang dipilih:
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isBulkLoading}
              onClick={() => handleBulkToggleActiveStatus(true)}
              className="h-8 px-3 rounded-full text-xs font-medium border-none shadow-sm-md bg-white text-emerald-700 hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer"
            >
              <Power className="w-3.5 h-3.5 text-emerald-600" />
              <span>Aktifkan</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isBulkLoading}
              onClick={() => handleBulkToggleActiveStatus(false)}
              className="h-8 px-3 rounded-full text-xs font-medium border-none shadow-sm-md bg-white text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer"
            >
              <PowerOff className="w-3.5 h-3.5 text-slate-500" />
              <span>Matikan</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isBulkLoading}
              onClick={handleBulkToggleBestSeller}
              className="h-8 px-3 rounded-full text-xs font-medium border-none shadow-sm-md bg-white text-blue-700 hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer"
            >
              <ThumbsUp className={cn("w-3.5 h-3.5 text-blue-600", allAreFeatured ? "opacity-60" : "fill-blue-500")} />
              <span>{allAreFeatured ? 'Batal Rekomendasi' : 'Rekomendasi'}</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isBulkLoading}
              onClick={() => setIsBulkDeleteOpen(true)}
              className="h-8 px-3 rounded-full text-xs font-medium border-none shadow-sm-md bg-white text-rose-600 hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Hapus</span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setRowSelection({})}
              className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground rounded-full hover:bg-slate-200/50 cursor-pointer"
            >
              Batal
            </Button>
          </div>
        </div>
      )}

      {/* 4. Table vs Card View Container */}
      {viewMode === 'list' ? (
        <DataTable 
          columns={columns} 
          data={displayedProducts} 
          onRowClick={handleRowClick}
          infiniteScroll={false}
          initialPageSize={10}
          batchSize={10}
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
        />
      ) : (
        <div className="space-y-4">
          {/* Cards Grid */}
          {cardGridProducts.length === 0 ? (
            <div className="text-center py-16 px-4 rounded-3xl bg-slate-50 shadow-sm-md">
              <PackageSearch className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-60" />
              <h3 className="font-semibold text-slate-900 text-base">Tidak ada menu ditemukan</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Coba ubah kata kunci pencarian atau ganti filter kategori dan status ketersediaan di atas.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4">
              {cardGridProducts.map((product) => {
                const isActive = product.isActive !== false;
                const isTracked = product.trackStock !== false;
                const stock = parseInt(String(product.stock)) || 0;
                const minStock = product.minStock || 0;
                const isOutOfStock = isTracked && stock <= 0;
                const isLow = isTracked && stock <= minStock && stock > 0;
                const isSelected = !!rowSelection[product.id];

                return (
                  <div
                    key={product.id}
                    onClick={() => handleRowClick(product)}
                    className={cn(
                      "rounded-2xl overflow-hidden bg-white transition-all group cursor-pointer flex flex-col relative",
                      isSelected
                        ? "shadow-md ring-2 ring-primary"
                        : "shadow-sm-md hover:shadow-md"
                    )}
                  >
                    {/* Image Container (Aspect 4:3) */}
                    <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden flex items-center justify-center">
                      {/* Checkbox for bulk select (top-left) */}
                      <div 
                        className="absolute top-2 left-2 z-30"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => {
                            setRowSelection((prev) => ({
                              ...prev,
                              [product.id]: !!checked,
                            }));
                          }}
                          className="bg-white/90 backdrop-blur-sm data-[state=checked]:bg-primary"
                        />
                      </div>

                      {/* Top-Right Badges & Actions */}
                      <div 
                        className="absolute top-2 right-2 z-30 flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => handleToggleBestSeller(product, !!product.isFeatured)}
                          className={cn(
                            "p-1.5 rounded-full backdrop-blur-sm transition-all shadow-xs cursor-pointer",
                            product.isFeatured
                              ? "bg-blue-600 text-white"
                              : "bg-white/90 text-slate-400 hover:text-blue-600 hover:bg-white"
                          )}
                          title={product.isFeatured ? 'Rekomendasi Menu (Klik untuk batalkan)' : 'Jadikan Rekomendasi Menu'}
                        >
                          <ThumbsUp className={cn("w-3.5 h-3.5", product.isFeatured && "fill-white")} />
                        </button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-full bg-white/90 backdrop-blur-sm text-slate-600 hover:bg-white shadow-xs p-0 cursor-pointer"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52 p-1.5 rounded-2xl shadow-2xl border-none bg-white">
                            <DropdownMenuItem onClick={() => handleRowClick(product)} className="rounded-xl cursor-pointer hover:bg-slate-100">
                              Detail item
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditClick(product)} className="rounded-xl cursor-pointer hover:bg-slate-100">
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleActiveStatus(product, isActive)} className="rounded-xl cursor-pointer hover:bg-slate-100">
                              {isActive ? 'Matikan (Tidak Tersedia)' : 'Aktifkan (Tersedia)'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleBestSeller(product, !!product.isFeatured)} className="rounded-xl cursor-pointer hover:bg-slate-100">
                              <ThumbsUp className={cn("w-3.5 h-3.5 mr-2", product.isFeatured ? "fill-blue-500 text-blue-600" : "text-slate-400")} />
                              {product.isFeatured ? 'Hapus rekomendasi' : 'Jadikan rekomendasi'}
                            </DropdownMenuItem>
                            {isTracked && canManageStock && (
                              <DropdownMenuItem onClick={() => handleOpenStockDialog(product)} className="rounded-xl cursor-pointer hover:bg-slate-100">
                                <Boxes className="w-3.5 h-3.5 mr-2 text-slate-500" />
                                Sesuaikan stok
                              </DropdownMenuItem>
                            )}
                            {canManageStock && (
                              <DropdownMenuItem onClick={() => handleToggleTrackStock(product, isTracked)} className="rounded-xl cursor-pointer hover:bg-slate-100">
                                {isTracked ? 'Nonaktifkan lacak stok' : 'Aktifkan lacak stok'}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator className="my-1 bg-slate-100" />
                            <DropdownMenuItem onClick={() => handleDeleteClick(product)} className="text-destructive rounded-xl cursor-pointer hover:bg-red-50">
                              Hapus item
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Inactive or Out of stock overlay (matches POS exactly!) */}
                      {!isActive ? (
                        <div className="absolute inset-0 bg-slate-950/70 z-20 flex flex-col items-center justify-center p-2 text-center backdrop-blur-[1px]">
                          <span className="text-white text-[11px] font-semibold tracking-wider uppercase bg-slate-800/95 px-2.5 py-0.5 rounded-full shadow-xs">
                            TIDAK TERSEDIA (86)
                          </span>
                        </div>
                      ) : isOutOfStock ? (
                        <div className="absolute inset-0 bg-slate-950/60 z-20 flex flex-col items-center justify-center p-2 text-center backdrop-blur-[1px]">
                          <span className="text-white text-[11px] font-semibold tracking-wider uppercase bg-rose-600/95 px-2.5 py-0.5 rounded-full shadow-xs">
                            STOK HABIS
                          </span>
                        </div>
                      ) : null}

                      {/* Product Image */}
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          loading="lazy"
                          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-primary/5 text-4xl font-semibold text-primary/20">
                          {product.name.charAt(0)}
                        </div>
                      )}
                    </div>

                    {/* Card Content */}
                    <div className="p-3.5 flex flex-col flex-1">
                      <div className="flex items-center justify-between gap-1 text-[11px] text-muted-foreground mb-1">
                        <span className="truncate">{product.categoryName || 'Tanpa Kategori'}</span>
                        <span className="font-mono text-[10px] shrink-0">{product.sku}</span>
                      </div>

                      <h3 className="font-semibold text-sm line-clamp-2 leading-tight mb-1 text-slate-900 group-hover:text-primary transition-colors">
                        {product.name}
                      </h3>

                      {product.potongan && parseFloat(product.potongan) > 0 ? (
                        <div className="flex items-baseline gap-1.5 mb-2.5">
                          <span className="text-rose-600 font-semibold text-sm">
                            {formatCurrency(Math.max(0, parseFloat(product.price) - parseFloat(product.potongan)))}
                          </span>
                          <span className="text-xs text-muted-foreground line-through">
                            {formatCurrency(parseFloat(product.price))}
                          </span>
                        </div>
                      ) : (
                        <div className="text-primary font-semibold text-sm mb-2.5">
                          {formatCurrency(parseFloat(product.price))}
                        </div>
                      )}

                      {/* Bottom Footer: Stock info + Fast Restock + 86 Switch */}
                      <div className="mt-auto pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1 min-w-0">
                          {!isTracked ? (
                            <span className="text-[11px] text-muted-foreground font-medium">
                              Tanpa Batas
                            </span>
                          ) : (
                            <div className="flex items-center gap-1">
                              <span className={cn(
                                "text-xs font-semibold tabular-nums",
                                isOutOfStock ? "text-rose-600" : isLow ? "text-amber-600" : "text-slate-700"
                              )}>
                                {stock} porsi
                              </span>
                              {isOutOfStock ? (
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-700 font-medium">
                                  Habis
                                </span>
                              ) : isLow ? (
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium">
                                  Menipis
                                </span>
                              ) : null}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                          {isTracked && canManageStock && (
                            <button
                              type="button"
                              onClick={() => handleOpenStockDialog(product)}
                              className={cn(
                                "h-6 px-2 rounded-full text-[10px] font-medium transition-all flex items-center gap-1 shadow-xs cursor-pointer border-none",
                                (isLow || isOutOfStock)
                                  ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                  : "text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200"
                              )}
                              title="Sesuaikan stok"
                            >
                              <Plus className="w-2.5 h-2.5" />
                              <span>{(isLow || isOutOfStock) ? 'Restock' : 'Atur'}</span>
                            </button>
                          )}

                          <Switch
                            checked={isActive}
                            onCheckedChange={() => handleToggleActiveStatus(product, isActive)}
                            className="data-[state=checked]:bg-emerald-600 cursor-pointer scale-75"
                            title={isActive ? 'Nonaktifkan menu (86)' : 'Aktifkan menu'}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Detail Item Modal (Pure Modern shadcn/ui) */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-lg p-0 overflow-hidden rounded-3xl border-none bg-white shadow-2xl">
          {detailProduct && (
            <>
              <div className="p-6 pb-5 border-b border-slate-100 bg-slate-50/70 flex items-start gap-4 pr-12">
                {detailProduct.imageUrl ? (
                  <img 
                    src={detailProduct.imageUrl} 
                    alt={detailProduct.name}
                    className="w-16 h-16 rounded-2xl object-cover shadow-sm-md flex-shrink-0" 
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary font-semibold text-xl flex items-center justify-center flex-shrink-0 shadow-sm-md">
                    {detailProduct.name.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-semibold text-slate-900 truncate">
                      {detailProduct.name}
                    </h2>
                    {detailProduct.isFeatured && (
                      <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700">
                        <ThumbsUp className="w-3 h-3 fill-blue-500 text-blue-600" /> Rekomendasi
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    SKU: <span className="font-mono font-medium text-slate-700">{detailProduct.sku}</span>
                    {detailProduct.categoryName && ` • ${detailProduct.categoryName}`}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                      detailProduct.status === 'active' 
                        ? 'bg-emerald-100/80 text-emerald-700' 
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {detailProduct.status === 'active' ? 'Tersedia' : 'Habis'}
                    </span>
                    {detailProduct.barcode && (
                      <span className="font-mono text-xs text-muted-foreground bg-slate-100 px-2.5 py-0.5 rounded-full">
                        {detailProduct.barcode}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                {/* Section Status Ketersediaan */}
                <div className="p-4 rounded-2xl shadow-sm-md bg-white flex items-center justify-between">
                  <div className="space-y-0.5 pr-4">
                    <span className="text-xs font-semibold text-slate-800 block">Status Ketersediaan Item</span>
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
                <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl shadow-sm-md bg-slate-50">
                  <div>
                    <span className="text-[11px] font-medium text-muted-foreground block">Harga Jual</span>
                    {detailProduct.potongan && parseFloat(detailProduct.potongan) > 0 ? (
                      <div>
                        <span className="text-sm font-semibold text-rose-600 block">
                          {formatCurrency(Math.max(0, parseFloat(detailProduct.price) - parseFloat(detailProduct.potongan)))}
                        </span>
                        <span className="text-[10px] text-muted-foreground line-through block">
                          {formatCurrency(parseFloat(detailProduct.price))}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm font-semibold text-slate-900">
                        {formatCurrency(parseFloat(detailProduct.price))}
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-[11px] font-medium text-muted-foreground block">Harga Modal</span>
                    <span className="text-sm font-medium text-slate-700">
                      {formatCurrency(parseFloat(detailProduct.costPrice || '0'))}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] font-medium text-muted-foreground block">Estimasi Untung</span>
                    {(() => {
                      const sp = parseFloat(detailProduct.price);
                      const pot = detailProduct.potongan ? parseFloat(detailProduct.potongan) : 0;
                      const finalSp = Math.max(0, sp - pot);
                      const cp = parseFloat(detailProduct.costPrice || '0');
                      const profit = finalSp - cp;
                      const margin = finalSp > 0 ? Math.round((profit / finalSp) * 100) : 0;
                      return (
                        <span className="text-sm font-semibold text-emerald-600 block truncate">
                          +{formatCurrency(profit)} ({margin}%)
                        </span>
                      );
                    })()}
                  </div>
                </div>

                {/* Section Inventaris & Stok */}
                <div className="p-4 rounded-2xl shadow-sm-md bg-white space-y-2.5">
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100">
                    <span className="font-semibold text-slate-800">Status Stok</span>
                    <span className="font-medium text-slate-500">
                      {detailProduct.trackStock !== false ? 'Pelacakan Aktif' : 'Stok Tak Terbatas'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                    <div>
                      <span className="text-muted-foreground block">Sisa Stok Saat Ini</span>
                      <span className="text-base font-semibold text-slate-900">
                        {detailProduct.trackStock !== false ? `${detailProduct.stock} unit` : '∞ (Unlimited)'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Batas Minimum Stok</span>
                      <span className="text-base font-medium text-slate-700">
                        {detailProduct.trackStock !== false ? `${detailProduct.minStock} unit` : '-'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Deskripsi */}
                {detailProduct.description && (
                  <div className="p-4 rounded-2xl shadow-sm-md bg-white space-y-1.5">
                    <span className="text-xs font-semibold text-slate-800 block">Deskripsi Item</span>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {detailProduct.description}
                    </p>
                  </div>
                )}

                {/* Modifiers info */}
                {modifierGroups.length > 0 && detailProduct.modifierGroupIds && detailProduct.modifierGroupIds.length > 0 && (
                  <div className="p-4 rounded-2xl shadow-sm-md bg-white space-y-2">
                    <span className="text-xs font-semibold text-slate-800 block">
                      Grup Modifier / Kustomisasi ({detailProduct.modifierGroupIds.length})
                    </span>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {detailProduct.modifierGroupIds.map((mgId) => {
                        const mg = modifierGroups.find(g => g.id === mgId);
                        return mg ? (
                          <span key={mgId} className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 shadow-xs">
                            {mg.name} {mg.modifiers ? `(${mg.modifiers.length} opsi)` : ''}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}

                {/* Barcode Preview jika ada */}
                {(detailProduct.barcode || detailProduct.sku) && (
                  <div className="p-4 rounded-2xl shadow-sm-md bg-white flex flex-col items-center justify-center space-y-2">
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

              <div className="p-4 px-6 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setIsDetailOpen(false);
                    handleDeleteClick(detailProduct);
                  }}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full px-4"
                >
                  <Trash2 className="w-4 h-4 mr-1.5" /> Hapus
                </Button>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsDetailOpen(false)}
                    className="rounded-full shadow-md bg-white hover:bg-slate-100 text-slate-700 border-none px-5 h-10 text-xs font-medium"
                  >
                    Tutup
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => {
                      setIsDetailOpen(false);
                      handleEditClick(detailProduct);
                    }}
                    className="rounded-full shadow-md bg-primary hover:bg-primary/90 text-white border-none px-5 h-10 text-xs font-semibold"
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
          className="sm:max-w-xl md:max-w-2xl w-full p-0 flex flex-col h-full bg-white border-l border-slate-100 focus:outline-none shadow-2xl"
        >
          <SheetHeader className="px-6 py-4 border-b border-slate-100 bg-white flex-shrink-0">
            <SheetTitle className="text-base font-semibold text-slate-900">
              {selectedProduct ? 'Edit Menu' : 'Tambah Menu Baru'}
            </SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground truncate">
              {selectedProduct 
                ? selectedProduct.name 
                : 'Lengkapi informasi menu untuk kasir dan katalog digital.'}
            </SheetDescription>
          </SheetHeader>

          <ProductForm
            form={form}
            onSubmit={selectedProduct ? onSubmitEdit : onSubmitAdd}
            isLoading={isLoading}
            selectedProduct={selectedProduct}
            categories={categories}
            modifierGroups={modifierGroups}
            imageFile={imageFile}
            setImageFile={setImageFile}
            onCancel={() => {
              setIsAddOpen(false);
              setIsEditOpen(false);
              setImageFile(null);
            }}
          />
        </SheetContent>
      </Sheet>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md p-6 rounded-3xl border-none bg-white shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-slate-900">Hapus Item</DialogTitle>
            <DialogDescription className="text-sm text-slate-600 pt-1">
              Apakah Anda yakin ingin menghapus <b>{selectedProduct?.name}</b>? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-full shadow-md bg-white hover:bg-slate-100 text-slate-700 border-none px-5 h-10 text-xs font-medium" onClick={() => setIsDeleteOpen(false)}>Batal</Button>
            <Button variant="destructive" className="rounded-full shadow-md bg-red-600 hover:bg-red-700 text-white border-none px-5 h-10 text-xs font-semibold" onClick={onConfirmDelete} disabled={isLoading}>
              {isLoading ? 'Menghapus...' : 'Ya, Hapus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Dialog */}
      <Dialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
        <DialogContent className="max-w-md p-6 rounded-3xl border-none bg-white shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-rose-600 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-rose-600" />
              Hapus {selectedCount} Item Terpilih?
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-600 pt-2">
              Item yang dipilih akan dihapus secara permanen dari katalog outlet Anda. Pastikan item tersebut tidak sedang digunakan pada transaksi aktif.
            </DialogDescription>
          </DialogHeader>

          <div className="my-3 p-3 bg-slate-50 rounded-2xl shadow-sm-md max-h-40 overflow-y-auto space-y-1.5">
            {selectedProducts.slice(0, 5).map((item) => (
              <div key={item.id} className="text-xs text-slate-700 flex items-center gap-2 truncate">
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
              className="rounded-full shadow-md bg-white hover:bg-slate-100 text-slate-700 border-none px-5 h-10 text-xs font-medium"
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleBulkDeleteConfirm}
              disabled={isBulkLoading}
              className="rounded-full shadow-md bg-red-600 hover:bg-red-700 text-white border-none px-5 h-10 text-xs font-semibold"
            >
              {isBulkLoading ? 'Menghapus...' : `Ya, Hapus ${selectedCount} Item`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Barcode Print Dialog */}
      <Dialog open={isPrintBarcodeOpen} onOpenChange={setIsPrintBarcodeOpen}>
        <DialogContent className="max-w-md p-6 rounded-3xl border-none bg-white shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-slate-900">Cetak Barcode</DialogTitle>
            <DialogDescription className="text-sm text-slate-600 pt-1">
              Barcode untuk produk <b>{selectedProduct?.name}</b>
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-6 space-y-4 bg-slate-50 rounded-2xl shadow-sm-md" id="barcode-print-area">
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
            <Button type="button" variant="outline" className="rounded-full shadow-md bg-white hover:bg-slate-100 text-slate-700 border-none px-5 h-10 text-xs font-medium" onClick={() => setIsPrintBarcodeOpen(false)}>Tutup</Button>
            <Button type="button" className="rounded-full shadow-md bg-primary hover:bg-primary/90 text-white border-none px-5 h-10 text-xs font-semibold" onClick={() => {
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

      {/* In-Context Quick Stock Adjust Dialog */}
      <QuickStockDialog
        product={stockDialogProduct}
        isOpen={isStockDialogOpen}
        onOpenChange={setIsStockDialogOpen}
        onSuccess={handleStockSuccess}
      />
    </div>
  );
}
