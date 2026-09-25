'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  MoreHorizontal, 
  Search, 
  Package, 
  Calendar, 
  Tags,
  FolderOpen,
  Clock,
  Utensils,
  PackageOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  createCategory, 
  updateCategory, 
  deleteCategory, 
  getCategoryProducts, 
  type CategoryProductItem 
} from '@/lib/actions/categories';
import { toast } from 'sonner';
import { CategoryDto } from '@menuin/types';
import { categorySchema } from '@menuin/validation';
import { getCategoryIcon } from '../lib/category-icons';
import { CategoryIconPicker } from './category-icon-picker';

export function CategoryList({ initialData }: { initialData: CategoryDto[] }) {
  const [categories, setCategories] = React.useState<CategoryDto[]>(initialData);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const [isDetailOpen, setIsDetailOpen] = React.useState(false);
  const [selectedCategory, setSelectedCategory] = React.useState<CategoryDto | null>(null);
  const [categoryProducts, setCategoryProducts] = React.useState<CategoryProductItem[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const router = useRouter();

  React.useEffect(() => {
    setCategories(initialData);
  }, [initialData]);

  // Load products when detail modal opens
  React.useEffect(() => {
    if (isDetailOpen && selectedCategory) {
      setIsLoadingProducts(true);
      getCategoryProducts(selectedCategory.id)
        .then((res) => {
          if (res.success && res.data) {
            setCategoryProducts(res.data);
          } else {
            setCategoryProducts([]);
          }
        })
        .catch(() => setCategoryProducts([]))
        .finally(() => setIsLoadingProducts(false));
    } else {
      setCategoryProducts([]);
    }
  }, [isDetailOpen, selectedCategory]);

  const form = useForm<z.infer<typeof categorySchema>>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '', icon: 'Utensils' },
  });

  const selectedFormIcon = form.watch('icon');
  const watchedName = form.watch('name');

  const filteredCategories = React.useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.toLowerCase();
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.slug && c.slug.toLowerCase().includes(q))
    );
  }, [categories, searchQuery]);

  const onSubmitAdd = async (values: z.infer<typeof categorySchema>) => {
    setIsLoading(true);
    const result = await createCategory(values);
    setIsLoading(false);

    if (result.success) {
      toast.success('Kategori berhasil ditambahkan');
      setIsAddOpen(false);
      form.reset({ name: '', icon: 'Utensils' });
      router.refresh();
    } else {
      toast.error(result.error);
    }
  };

  const onSubmitEdit = async (values: z.infer<typeof categorySchema>) => {
    if (!selectedCategory) return;
    setIsLoading(true);
    const result = await updateCategory(selectedCategory.id, values);
    setIsLoading(false);

    if (result.success) {
      toast.success('Kategori berhasil diperbarui');
      setIsEditOpen(false);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  };

  const onConfirmDelete = async () => {
    if (!selectedCategory) return;
    setIsLoading(true);
    const result = await deleteCategory(selectedCategory.id);
    setIsLoading(false);

    if (result.success) {
      toast.success('Kategori berhasil dihapus');
      setIsDeleteOpen(false);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  };

  const handleCardClick = (category: CategoryDto) => {
    setSelectedCategory(category);
    setIsDetailOpen(true);
  };

  const handleEditClick = (category: CategoryDto) => {
    setSelectedCategory(category);
    form.reset({ name: category.name, icon: category.icon || 'Utensils' });
    setIsEditOpen(true);
  };

  const handleDeleteClick = (category: CategoryDto) => {
    setSelectedCategory(category);
    setIsDeleteOpen(true);
  };

  const handleDetailToEdit = () => {
    if (!selectedCategory) return;
    const cat = selectedCategory;
    setIsDetailOpen(false);
    handleEditClick(cat);
  };

  const handleDetailToDelete = () => {
    if (!selectedCategory) return;
    const cat = selectedCategory;
    setIsDetailOpen(false);
    handleDeleteClick(cat);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Kategori Produk</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Kelola kelompok menu untuk mempermudah kasir dan pelanggan saat memesan.
          </p>
        </div>
        <Button
          onClick={() => {
            form.reset({ name: '', icon: 'Utensils' });
            setIsAddOpen(true);
          }}
          className="rounded-xl px-4 h-9.5 text-xs font-semibold flex items-center bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer shrink-0"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Tambah Kategori
        </Button>
      </div>

      {/* Search & Meta Counts Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="relative flex-1 max-w-full sm:max-w-xs md:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70" />
          <Input
            placeholder="Cari kategori atau slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-lg shadow-xs"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>
            Total: <strong className="text-foreground">{categories.length}</strong> Kategori
          </span>
          {searchQuery && (
            <span className="text-blue-600 dark:text-blue-400">
              ({filteredCategories.length} hasil)
            </span>
          )}
        </div>
      </div>

      {/* Category Card Grid */}
      {filteredCategories.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
            <FolderOpen className="w-6 h-6 text-slate-400" />
          </div>
          <h3 className="font-semibold text-sm text-foreground">
            {searchQuery ? 'Kategori Tidak Ditemukan' : 'Belum Ada Kategori'}
          </h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            {searchQuery
              ? `Tidak ada kategori yang cocok dengan "${searchQuery}". Coba kata kunci lain.`
              : 'Buat kategori pertama Anda untuk mengelompokkan produk makanan dan minuman.'}
          </p>
          {!searchQuery && (
            <Button
              onClick={() => {
                form.reset({ name: '', icon: 'Utensils' });
                setIsAddOpen(true);
              }}
              variant="outline"
              size="sm"
              className="mt-4 text-xs font-semibold cursor-pointer rounded-lg"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Tambah Kategori Sekarang
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredCategories.map((category) => {
            const IconComponent = getCategoryIcon(category.icon);

            return (
              <div
                key={category.id}
                onClick={() => handleCardClick(category)}
                className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-sm transition-all duration-150 flex flex-col justify-between cursor-pointer"
              >
                {/* Card Top: Icon & 3-Dot Actions */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/50 group-hover:scale-105 transition-transform shrink-0">
                      <IconComponent className="w-5 h-5" />
                    </div>

                    <div onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-slate-400 hover:text-foreground cursor-pointer rounded-lg"
                          >
                            <span className="sr-only">Buka menu aksi</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36 rounded-xl p-1 shadow-lg border-slate-200 dark:border-slate-800">
                          <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground px-2 py-1">
                            Aksi Kategori
                          </DropdownMenuLabel>
                          <DropdownMenuItem
                            className="text-xs font-medium cursor-pointer rounded-lg text-slate-700 dark:text-slate-200"
                            onClick={() => handleEditClick(category)}
                          >
                            <Pencil className="mr-2 h-3.5 w-3.5 text-blue-600" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="my-1" />
                          <DropdownMenuItem
                            className="text-xs font-medium cursor-pointer rounded-lg text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-950/40"
                            onClick={() => handleDeleteClick(category)}
                          >
                            <Trash2 className="mr-2 h-3.5 w-3.5" /> Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Category Name & Slug */}
                  <div className="mt-3">
                    <h3 className="font-semibold text-sm text-foreground tracking-tight line-clamp-1 group-hover:text-blue-600 transition-colors">
                      {category.name}
                    </h3>
                    <div className="mt-1">
                      <span className="inline-block text-[11px] font-mono text-muted-foreground bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200/60 dark:border-slate-700/60">
                        /{category.slug || category.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Bottom: Product Count & Created At Date */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs mt-3.5">
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                    <Package className="w-3 h-3 text-slate-500" />
                    <strong className="text-foreground">{category.productCount ?? 0}</strong> Menu
                  </span>

                  <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-normal">
                    <Calendar className="w-3 h-3 opacity-50" />
                    {category.createdAt
                      ? new Date(category.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '-'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Tambah Kategori */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Tambah Kategori Baru</DialogTitle>
            <DialogDescription className="text-xs">
              Buat kategori produk baru lengkap dengan ikon representatif.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmitAdd)} className="space-y-4 pt-1">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs font-semibold">
                Nama Kategori <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                {...form.register('name')}
                placeholder="Contoh: Kopi, Makanan Berat, Dessert"
                className="h-9 text-xs rounded-lg"
              />
              {form.formState.errors.name && (
                <p className="text-[11px] text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            {/* Icon Picker Component */}
            <CategoryIconPicker
              selectedIcon={selectedFormIcon}
              onSelectIcon={(iconName) => form.setValue('icon', iconName)}
            />

            {/* Live Preview Card Mini */}
            <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-muted-foreground block mb-1.5 font-medium">
                Pratinjau Tampilan Card:
              </span>
              <div className="bg-white dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/40 shrink-0">
                  {React.createElement(getCategoryIcon(selectedFormIcon), { className: 'w-4 h-4' })}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-xs text-foreground truncate">
                    {watchedName || 'Nama Kategori'}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono truncate">
                    /{watchedName ? watchedName.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'slug-kategori'}
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddOpen(false)}
                className="text-xs cursor-pointer rounded-lg"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isLoading}
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer rounded-lg shadow-xs"
              >
                {isLoading ? 'Menyimpan...' : 'Simpan Kategori'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Edit Kategori */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Edit Kategori</DialogTitle>
            <DialogDescription className="text-xs">
              Perbarui nama atau ikon kategori produk.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmitEdit)} className="space-y-4 pt-1">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-xs font-semibold">
                Nama Kategori <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-name"
                {...form.register('name')}
                className="h-9 text-xs rounded-lg"
              />
              {form.formState.errors.name && (
                <p className="text-[11px] text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            {/* Icon Picker Component */}
            <CategoryIconPicker
              selectedIcon={selectedFormIcon}
              onSelectIcon={(iconName) => form.setValue('icon', iconName)}
            />

            {/* Live Preview Card Mini */}
            <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-muted-foreground block mb-1.5 font-medium">
                Pratinjau Tampilan Card:
              </span>
              <div className="bg-white dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/40 shrink-0">
                  {React.createElement(getCategoryIcon(selectedFormIcon), { className: 'w-4 h-4' })}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-xs text-foreground truncate">
                    {watchedName || 'Nama Kategori'}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono truncate">
                    /{watchedName ? watchedName.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'slug-kategori'}
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditOpen(false)}
                className="text-xs cursor-pointer rounded-lg"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isLoading}
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer rounded-lg shadow-xs"
              >
                {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Hapus Kategori */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              Hapus Kategori
            </DialogTitle>
            <DialogDescription className="text-xs pt-1">
              Apakah Anda yakin ingin menghapus kategori <strong>{selectedCategory?.name}</strong>?
              {selectedCategory?.productCount && selectedCategory.productCount > 0 ? (
                <span className="block mt-2 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-lg border border-amber-200 dark:border-amber-800">
                  Peringatan: Kategori ini memiliki <strong>{selectedCategory.productCount} menu</strong>. Pastikan untuk memindahkan produk ke kategori lain terlebih dahulu.
                </span>
              ) : (
                <span className="block mt-1 text-slate-500">Tindakan ini tidak dapat dibatalkan.</span>
              )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteOpen(false)}
              className="text-xs cursor-pointer rounded-lg"
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={onConfirmDelete}
              disabled={isLoading}
              className="text-xs font-semibold cursor-pointer rounded-lg"
            >
              {isLoading ? 'Menghapus...' : 'Ya, Hapus Kategori'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Detail Modal */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-md md:max-w-lg bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 p-0 overflow-hidden rounded-2xl max-h-[90vh] flex flex-col shadow-xl">
          <DialogHeader className="px-6 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <DialogTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              Detail Kategori
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              Rincian kategori dan daftar menu yang terhubung dengan kategori ini.
            </DialogDescription>
          </DialogHeader>

          {selectedCategory && (
            <div className="px-6 py-4 overflow-y-auto flex-1 space-y-4">
              {/* Hero Overview */}
              <div className="flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 p-3.5 rounded-xl">
                <div className="flex items-center gap-3 min-w-0">
                  {(() => {
                    const DetailIcon = getCategoryIcon(selectedCategory.icon);
                    return (
                      <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/50 shadow-xs shrink-0">
                        <DetailIcon className="w-6 h-6" />
                      </div>
                    );
                  })()}
                  <div className="min-w-0">
                    <h2 className="font-semibold text-base text-foreground tracking-tight truncate">
                      {selectedCategory.name}
                    </h2>
                    <div className="mt-0.5">
                      <span className="inline-block text-[11px] font-mono text-muted-foreground bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200/80 dark:border-slate-700/80">
                        /{selectedCategory.slug || selectedCategory.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/70 border border-blue-200/60 dark:border-blue-800/60 px-2.5 py-1 rounded-full">
                    <Package className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    {selectedCategory.productCount ?? 0} Menu
                  </span>
                </div>
              </div>

              {/* Metadata Info Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    Dibuat Pada
                  </span>
                  <p className="text-xs font-semibold text-foreground mt-1">
                    {selectedCategory.createdAt
                      ? new Date(selectedCategory.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })
                      : '-'}
                  </p>
                </div>

                <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    Ikon Terpilih
                  </span>
                  <p className="text-xs font-semibold text-foreground mt-1 flex items-center gap-1.5">
                    <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300">
                      {selectedCategory.icon || 'Utensils (Default)'}
                    </span>
                  </p>
                </div>
              </div>

              {/* Products in this category */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-blue-600" />
                    Daftar Menu ({isLoadingProducts ? '...' : categoryProducts.length})
                  </h4>
                  <span className="text-[11px] text-muted-foreground">
                    {selectedCategory.productCount ?? 0} menu terhubung
                  </span>
                </div>

                {isLoadingProducts ? (
                  <div className="space-y-2 pt-1">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-13 bg-slate-100/70 dark:bg-slate-800/50 rounded-xl animate-pulse"
                      />
                    ))}
                  </div>
                ) : categoryProducts.length === 0 ? (
                  <div className="p-5 text-center bg-slate-50/60 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    <PackageOpen className="w-7 h-7 mx-auto text-slate-400 mb-1.5" />
                    <p className="text-xs font-semibold text-foreground">Belum ada menu di kategori ini</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Menu yang ditambahkan dengan kategori ini akan tampil di sini dan kasir.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    {categoryProducts.map((p) => {
                      const isOutOfStock = p.trackStock && p.stock <= 0;
                      return (
                        <div
                          key={p.id}
                          className="flex items-center justify-between p-2 rounded-xl border border-slate-200/70 dark:border-slate-800/80 bg-white dark:bg-slate-900 hover:border-slate-300 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {p.imageUrl ? (
                              <img
                                src={p.imageUrl}
                                alt={p.name}
                                className="w-9 h-9 rounded-lg object-cover border border-slate-200/80 dark:border-slate-700 shrink-0"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-200/60 dark:border-slate-700 shrink-0">
                                <Utensils className="w-4 h-4" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="text-xs font-semibold text-foreground truncate">
                                  {p.name}
                                </p>
                                {p.isFeatured && (
                                  <span className="text-[9px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200/70 px-1 py-0.2 rounded shrink-0">
                                    Best Seller
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] font-mono text-muted-foreground">
                                  SKU: {p.sku}
                                </span>
                                <span className="text-slate-300 dark:text-slate-700">•</span>
                                <span
                                  className={`text-[10px] font-medium ${
                                    !p.isActive
                                      ? 'text-rose-600 dark:text-rose-400'
                                      : isOutOfStock
                                      ? 'text-amber-600 dark:text-amber-400'
                                      : 'text-emerald-600 dark:text-emerald-400'
                                  }`}
                                >
                                  {!p.isActive
                                    ? 'Nonaktif'
                                    : isOutOfStock
                                    ? 'Stok Habis'
                                    : p.trackStock
                                    ? `Stok: ${p.stock}`
                                    : 'Tersedia'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0 pl-2">
                            <span className="text-xs font-semibold text-foreground">
                              Rp {Number(p.price).toLocaleString('id-ID')}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-row items-center justify-between sm:justify-between w-full shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleDetailToDelete}
              className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer rounded-lg h-9 px-3"
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Hapus
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsDetailOpen(false)}
                className="text-xs cursor-pointer rounded-lg h-9 px-3"
              >
                Tutup
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleDetailToEdit}
                className="text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white cursor-pointer rounded-lg h-9 px-4 flex items-center"
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit Kategori
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
