'use client';

import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Plus, Pencil, Trash2, Tags } from 'lucide-react';
import dynamic from 'next/dynamic';

const DataTable = dynamic(
  () => import('@/components/ui/data-table').then((mod) => mod.DataTable),
  { ssr: false, loading: () => <div className="h-64 w-full bg-muted animate-pulse rounded-xl"></div> }
);
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
import { createCategory, updateCategory, deleteCategory } from '@/lib/actions/categories';
import { toast } from 'sonner';

type Category = {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
};

const categorySchema = z.object({
  name: z.string().min(1, 'Nama kategori wajib diisi'),
});

export function CategoryList({ initialData }: { initialData: Category[] }) {
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const [selectedCategory, setSelectedCategory] = React.useState<Category | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<z.infer<typeof categorySchema>>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '' },
  });

  const onSubmitAdd = async (values: z.infer<typeof categorySchema>) => {
    setIsLoading(true);
    const result = await createCategory(values);
    setIsLoading(false);
    
    if (result.success) {
      toast.success('Kategori berhasil ditambahkan');
      setIsAddOpen(false);
      form.reset();
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
    } else {
      toast.error(result.error);
    }
  };

  const handleEditClick = (category: Category) => {
    setSelectedCategory(category);
    form.reset({ name: category.name });
    setIsEditOpen(true);
  };

  const handleDeleteClick = (category: Category) => {
    setSelectedCategory(category);
    setIsDeleteOpen(true);
  };

  const columns: ColumnDef<Category>[] = [
    {
      accessorKey: 'name',
      header: 'Nama Kategori',
      cell: ({ row }) => (
        <div className="flex items-center">
          <div className="bg-primary/10 p-2 rounded-lg mr-3">
            <Tags className="h-4 w-4 text-primary" />
          </div>
          <span className="font-medium">{row.getValue('name')}</span>
        </div>
      )
    },
    {
      accessorKey: 'slug',
      header: 'Slug',
    },
    {
      accessorKey: 'createdAt',
      header: 'Dibuat Pada',
      cell: ({ row }) => {
        const date = row.getValue('createdAt') as Date;
        return <span>{new Date(date).toLocaleDateString('id-ID')}</span>;
      }
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const category = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Buka menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Aksi</DropdownMenuLabel>
              <DropdownMenuItem className="text-primary cursor-pointer" onClick={() => handleEditClick(category)}>
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive cursor-pointer" onClick={() => handleDeleteClick(category)}>
                <Trash2 className="mr-2 h-4 w-4" /> Hapus
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kategori Produk</h1>
          <p className="text-sm text-muted-foreground">Kelola kategori untuk mengelompokkan produk Anda.</p>
        </div>
        <Button 
          onClick={() => { form.reset({ name: '' }); setIsAddOpen(true); }}
          className="rounded-xl px-4 flex items-center bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
        >
          <Plus className="mr-2 h-4 w-4" />
          Tambah Kategori
        </Button>
      </div>

      <DataTable columns={columns} data={initialData} searchKey="name" searchPlaceholder="Cari kategori..." />

      {/* Modal Tambah */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Kategori</DialogTitle>
            <DialogDescription>Tambahkan kategori produk baru ke dalam sistem.</DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmitAdd)}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Kategori</Label>
                <Input id="name" {...form.register('name')} placeholder="Misal: Minuman" />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Batal</Button>
              <Button type="submit" disabled={isLoading}>{isLoading ? 'Menyimpan...' : 'Simpan'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Edit */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Kategori</DialogTitle>
            <DialogDescription>Perbarui nama kategori.</DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmitEdit)}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nama Kategori</Label>
                <Input id="edit-name" {...form.register('name')} />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Batal</Button>
              <Button type="submit" disabled={isLoading}>{isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Hapus */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Kategori</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus kategori <b>{selectedCategory?.name}</b>? Tindakan ini tidak dapat dibatalkan.
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
    </div>
  );
}
