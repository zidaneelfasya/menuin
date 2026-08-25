'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Server,
  Plus,
  Search,
  Pencil,
  Trash2,
  Copy,
  Check,
  Loader2,
  Users,
  Package,
  Calendar,
  AlertTriangle,
  Store,
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  createSystemTenant,
  updateSystemTenant,
  deleteSystemTenant,
  toggleTenantStatus,
} from '@/lib/actions/system-admin';

interface TenantItem {
  id: string;
  name: string;
  isPaid: boolean;
  createdAt: Date;
  updatedAt: Date;
  userCount: number;
  productCount: number;
}

export function TenantsClient({ initialTenants }: { initialTenants: TenantItem[] }) {
  const [tenants, setTenants] = React.useState<TenantItem[]>(initialTenants);
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'paid' | 'free'>('all');

  // Keep state in sync when server props change
  React.useEffect(() => {
    setTenants(initialTenants);
  }, [initialTenants]);

  // Modal States
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const [selectedTenant, setSelectedTenant] = React.useState<TenantItem | null>(null);

  // Form States
  const [formName, setFormName] = React.useState('');
  const [formPaid, setFormPaid] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  // Filtered list
  const filteredTenants = tenants.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'paid' && t.isPaid) ||
      (statusFilter === 'free' && !t.isPaid);
    return matchesSearch && matchesStatus;
  });

  const totalCount = tenants.length;
  const paidCount = tenants.filter((t) => t.isPaid).length;
  const freeCount = totalCount - paidCount;

  // Actions
  const handleCopyId = (idStr: string) => {
    navigator.clipboard.writeText(idStr);
    setCopiedId(idStr);
    toast.success('Tenant ID berhasil disalin');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error('Nama toko wajib diisi');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createSystemTenant({ name: formName, isPaid: formPaid });
      if (res.success) {
        toast.success(res.message);
        setIsCreateOpen(false);
        setFormName('');
        setFormPaid(false);
      } else {
        toast.error(res.error);
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal membuat tenant');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEdit = (tenant: TenantItem) => {
    setSelectedTenant(tenant);
    setFormName(tenant.name);
    setFormPaid(tenant.isPaid);
    setIsEditOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenant) return;
    if (!formName.trim()) {
      toast.error('Nama toko wajib diisi');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await updateSystemTenant(selectedTenant.id, {
        name: formName,
        isPaid: formPaid,
      });
      if (res.success) {
        toast.success(res.message);
        setIsEditOpen(false);
        setSelectedTenant(null);
      } else {
        toast.error(res.error);
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal memperbarui tenant');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDelete = (tenant: TenantItem) => {
    setSelectedTenant(tenant);
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedTenant) return;
    setIsSubmitting(true);
    try {
      const res = await deleteSystemTenant(selectedTenant.id);
      if (res.success) {
        toast.success(res.message);
        setIsDeleteOpen(false);
        setSelectedTenant(null);
      } else {
        toast.error(res.error);
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus tenant');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (tenant: TenantItem) => {
    try {
      const res = await toggleTenantStatus(tenant.id, !tenant.isPaid);
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.error);
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengubah status');
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Store className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Manajemen Tenant</h1>
            <p className="text-muted-foreground text-xs sm:text-sm">
              Kelola toko, status langganan, dan data platform Menuin.
            </p>
          </div>
        </div>

        <Button
          onClick={() => {
            setFormName('');
            setFormPaid(false);
            setIsCreateOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm self-start sm:self-auto gap-1.5"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Tenant</span>
        </Button>
      </div>

      {/* Summary Pills */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-lg">
        <div className="px-4 py-2.5 rounded-xl bg-card border border-border/70 shadow-sm text-center">
          <span className="text-[11px] font-medium text-muted-foreground block">Semua Tenant</span>
          <span className="text-xl font-bold text-foreground">{totalCount}</span>
        </div>
        <div className="px-4 py-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 shadow-sm text-center">
          <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 block">Paid</span>
          <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{paidCount}</span>
        </div>
        <div className="px-4 py-2.5 rounded-xl bg-amber-500/5 border border-amber-500/20 shadow-sm text-center">
          <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 block">Free Trial</span>
          <span className="text-xl font-bold text-amber-600 dark:text-amber-400">{freeCount}</span>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama toko atau ID tenant..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-card border-border/70"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(val: any) => setStatusFilter(val)}
        >
          <SelectTrigger className="w-full sm:w-[180px] bg-card border-border/70">
            <SelectValue placeholder="Status Langganan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="paid">Paid (Aktif)</SelectItem>
            <SelectItem value="free">Free Trial</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Data Table */}
      <Card className="border-border/70 shadow-sm overflow-hidden bg-card">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-muted/40 text-muted-foreground border-b border-border/70">
                <tr>
                  <th className="px-6 py-4 font-semibold">Nama Toko & ID</th>
                  <th className="px-6 py-4 font-semibold">Status Berlangganan</th>
                  <th className="px-6 py-4 font-semibold text-center">Pengguna</th>
                  <th className="px-6 py-4 font-semibold text-center">Produk</th>
                  <th className="px-6 py-4 font-semibold">Terdaftar Pada</th>
                  <th className="px-6 py-4 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredTenants.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                      <Store className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      Tidak ada data tenant yang cocok.
                    </td>
                  </tr>
                ) : (
                  filteredTenants.map((tenant) => (
                    <tr key={tenant.id} className="hover:bg-muted/30 transition-colors">
                      {/* Name & ID */}
                      <td className="px-6 py-4">
                        <div className="font-semibold text-foreground text-sm">{tenant.name}</div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[11px] font-mono text-muted-foreground">
                            {tenant.id.slice(0, 8)}...{tenant.id.slice(-4)}
                          </span>
                          <button
                            onClick={() => handleCopyId(tenant.id)}
                            className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
                            title="Salin Tenant ID"
                          >
                            {copiedId === tenant.id ? (
                              <Check className="h-3 w-3 text-emerald-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggle(tenant)}
                          className={`px-3 py-1 text-xs rounded-full font-semibold transition-all border ${
                            tenant.isPaid
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20'
                          }`}
                          title="Klik untuk mengubah status"
                        >
                          {tenant.isPaid ? 'Paid' : 'Free Trial'}
                        </button>
                      </td>

                      {/* Users Count */}
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-muted text-muted-foreground">
                          <Users className="h-3 w-3" />
                          {tenant.userCount}
                        </span>
                      </td>

                      {/* Products Count */}
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-muted text-muted-foreground">
                          <Package className="h-3 w-3" />
                          {tenant.productCount}
                        </span>
                      </td>

                      {/* Created At */}
                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        {format(new Date(tenant.createdAt), 'dd MMM yyyy, HH:mm', { locale: id })}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(tenant)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-blue-600 hover:bg-blue-500/10"
                            title="Edit Tenant"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDelete(tenant)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            title="Hapus Tenant"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal: Tambah Tenant */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>Tambah Tenant Baru</DialogTitle>
              <DialogDescription>
                Buat entitas toko baru di platform Menuin.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="create-name">Nama Toko / Restoran</Label>
                <Input
                  id="create-name"
                  placeholder="Contoh: Kopi Nusantara"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-status">Status Berlangganan</Label>
                <Select
                  value={formPaid ? 'paid' : 'free'}
                  onValueChange={(val) => setFormPaid(val === 'paid')}
                >
                  <SelectTrigger id="create-status">
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Paid (Akses Penuh)</SelectItem>
                    <SelectItem value="free">Free Trial (Uji Coba)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Edit Tenant */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleUpdate}>
            <DialogHeader>
              <DialogTitle>Edit Data Tenant</DialogTitle>
              <DialogDescription>
                Ubah nama atau status berlangganan untuk tenant ini.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nama Toko / Restoran</Label>
                <Input
                  id="edit-name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status Berlangganan</Label>
                <Select
                  value={formPaid ? 'paid' : 'free'}
                  onValueChange={(val) => setFormPaid(val === 'paid')}
                >
                  <SelectTrigger id="edit-status">
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Paid (Akses Penuh)</SelectItem>
                    <SelectItem value="free">Free Trial (Uji Coba)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan Perubahan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Delete Tenant */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Hapus Tenant & Semua Data?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Anda akan menghapus toko <strong>{selectedTenant?.name}</strong> secara permanen.
              </p>
              <p className="text-xs text-muted-foreground bg-destructive/10 p-3 rounded-lg border border-destructive/20 text-destructive">
                <strong>Perhatian:</strong> Tindakan ini akan menghapus seluruh produk, transaksi, kategori, dan akun kasir yang terikat dengan tenant ini.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ya, Hapus Tenant
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
