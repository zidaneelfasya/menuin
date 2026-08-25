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
  Users,
  Plus,
  Search,
  Pencil,
  Trash2,
  Shield,
  UserCheck,
  ShieldAlert,
  Loader2,
  Store,
  AlertTriangle,
  KeyRound,
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  createSystemUser,
  updateSystemUser,
  deleteSystemUser,
} from '@/lib/actions/system-admin';

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: 'CASHIER' | 'SUPERADMIN' | 'SYSTEM_ADMIN';
  createdAt: Date;
  updatedAt: Date;
  dashboardId: string | null;
  dashboardName: string | null;
}

interface TenantOption {
  id: string;
  name: string;
}

export function UsersClient({
  initialUsers,
  tenants,
  currentUserId,
}: {
  initialUsers: UserItem[];
  tenants: TenantOption[];
  currentUserId?: string;
}) {
  const [usersList, setUsersList] = React.useState<UserItem[]>(initialUsers);
  const [search, setSearch] = React.useState('');
  const [roleFilter, setRoleFilter] = React.useState<string>('all');
  const [tenantFilter, setTenantFilter] = React.useState<string>('all');

  React.useEffect(() => {
    setUsersList(initialUsers);
  }, [initialUsers]);

  // Modal States
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<UserItem | null>(null);

  // Form States
  const [formName, setFormName] = React.useState('');
  const [formEmail, setFormEmail] = React.useState('');
  const [formPassword, setFormPassword] = React.useState('');
  const [formRole, setFormRole] = React.useState<'CASHIER' | 'SUPERADMIN' | 'SYSTEM_ADMIN'>('SUPERADMIN');
  const [formTenantId, setFormTenantId] = React.useState<string>('none');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Filtered List
  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesTenant =
      tenantFilter === 'all' ||
      (tenantFilter === 'none' && !u.dashboardId) ||
      u.dashboardId === tenantFilter;
    return matchesSearch && matchesRole && matchesTenant;
  });

  const totalUsers = usersList.length;
  const superAdminCount = usersList.filter((u) => u.role === 'SUPERADMIN').length;
  const cashierCount = usersList.filter((u) => u.role === 'CASHIER').length;
  const systemAdminCount = usersList.filter((u) => u.role === 'SYSTEM_ADMIN').length;

  const resetForm = () => {
    setFormName('');
    setFormEmail('');
    setFormPassword('');
    setFormRole('SUPERADMIN');
    setFormTenantId('none');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) {
      toast.error('Nama dan email wajib diisi');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createSystemUser({
        name: formName,
        email: formEmail,
        password: formPassword,
        role: formRole,
        dashboardId: formRole === 'SYSTEM_ADMIN' || formTenantId === 'none' ? null : formTenantId,
      });

      if (res.success) {
        toast.success(res.message);
        setIsCreateOpen(false);
        resetForm();
      } else {
        toast.error(res.error);
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal membuat pengguna');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEdit = (user: UserItem) => {
    setSelectedUser(user);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormPassword('');
    setFormRole(user.role);
    setFormTenantId(user.dashboardId || 'none');
    setIsEditOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (!formName.trim() || !formEmail.trim()) {
      toast.error('Nama dan email wajib diisi');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await updateSystemUser(selectedUser.id, {
        name: formName,
        email: formEmail,
        role: formRole,
        dashboardId: formRole === 'SYSTEM_ADMIN' || formTenantId === 'none' ? null : formTenantId,
        password: formPassword.trim() ? formPassword.trim() : undefined,
      });

      if (res.success) {
        toast.success(res.message);
        setIsEditOpen(false);
        setSelectedUser(null);
        resetForm();
      } else {
        toast.error(res.error);
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal memperbarui pengguna');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDelete = (user: UserItem) => {
    setSelectedUser(user);
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    setIsSubmitting(true);
    try {
      const res = await deleteSystemUser(selectedUser.id);
      if (res.success) {
        toast.success(res.message);
        setIsDeleteOpen(false);
        setSelectedUser(null);
      } else {
        toast.error(res.error);
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus pengguna');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Manajemen Pengguna</h1>
            <p className="text-muted-foreground text-xs sm:text-sm">
              Kelola akun kasir, super admin/owner toko, dan admin platform.
            </p>
          </div>
        </div>

        <Button
          onClick={() => {
            resetForm();
            setIsCreateOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm self-start sm:self-auto gap-1.5"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Pengguna</span>
        </Button>
      </div>

      {/* Summary Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="px-4 py-2.5 rounded-xl bg-card border border-border/70 shadow-sm text-center">
          <span className="text-[11px] font-medium text-muted-foreground block">Total Pengguna</span>
          <span className="text-xl font-bold text-foreground">{totalUsers}</span>
        </div>
        <div className="px-4 py-2.5 rounded-xl bg-blue-500/5 border border-blue-500/20 shadow-sm text-center">
          <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400 block">Owner / SuperAdmin</span>
          <span className="text-xl font-bold text-blue-600 dark:text-blue-400">{superAdminCount}</span>
        </div>
        <div className="px-4 py-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 shadow-sm text-center">
          <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 block">Kasir Toko</span>
          <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{cashierCount}</span>
        </div>
        <div className="px-4 py-2.5 rounded-xl bg-purple-500/5 border border-purple-500/20 shadow-sm text-center">
          <span className="text-[11px] font-medium text-purple-600 dark:text-purple-400 block">System Admin</span>
          <span className="text-xl font-bold text-purple-600 dark:text-purple-400">{systemAdminCount}</span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama atau email pengguna..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-card border-border/70"
          />
        </div>

        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="bg-card border-border/70">
            <SelectValue placeholder="Semua Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Role</SelectItem>
            <SelectItem value="SUPERADMIN">SUPERADMIN (Owner)</SelectItem>
            <SelectItem value="CASHIER">CASHIER (Kasir)</SelectItem>
            <SelectItem value="SYSTEM_ADMIN">SYSTEM_ADMIN</SelectItem>
          </SelectContent>
        </Select>

        <Select value={tenantFilter} onValueChange={setTenantFilter}>
          <SelectTrigger className="bg-card border-border/70">
            <SelectValue placeholder="Semua Tenant" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Tenant / Toko</SelectItem>
            <SelectItem value="none">Tanpa Tenant (System)</SelectItem>
            {tenants.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      <Card className="border-border/70 shadow-sm overflow-hidden bg-card">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-muted/40 text-muted-foreground border-b border-border/70">
                <tr>
                  <th className="px-6 py-4 font-semibold">Pengguna</th>
                  <th className="px-6 py-4 font-semibold">Role / Hak Akses</th>
                  <th className="px-6 py-4 font-semibold">Toko / Tenant</th>
                  <th className="px-6 py-4 font-semibold">Terdaftar Pada</th>
                  <th className="px-6 py-4 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      Tidak ada pengguna yang cocok.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                      {/* Name & Email & Avatar */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-zinc-800 flex items-center justify-center font-bold text-sm uppercase flex-shrink-0 text-foreground">
                            {user.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                              {user.name}
                              {user.id === currentUserId && (
                                <span className="text-[10px] bg-blue-500/10 text-blue-600 px-1.5 py-0.5 rounded font-normal">
                                  Anda
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full font-semibold border ${
                            user.role === 'SYSTEM_ADMIN'
                              ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                              : user.role === 'SUPERADMIN'
                              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          }`}
                        >
                          {user.role === 'SYSTEM_ADMIN' ? (
                            <ShieldAlert className="h-3.5 w-3.5" />
                          ) : user.role === 'SUPERADMIN' ? (
                            <Shield className="h-3.5 w-3.5" />
                          ) : (
                            <UserCheck className="h-3.5 w-3.5" />
                          )}
                          {user.role}
                        </span>
                      </td>

                      {/* Tenant Assignment */}
                      <td className="px-6 py-4">
                        {user.role === 'SYSTEM_ADMIN' ? (
                          <span className="text-xs text-muted-foreground italic">Platform Global</span>
                        ) : user.dashboardName ? (
                          <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                            <Store className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                            <span className="truncate max-w-[180px]">{user.dashboardName}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                            Belum Terhubung
                          </span>
                        )}
                      </td>

                      {/* Registered Date */}
                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        {format(new Date(user.createdAt), 'dd MMM yyyy, HH:mm', { locale: id })}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(user)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-blue-600 hover:bg-blue-500/10"
                            title="Edit Pengguna"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={user.id === currentUserId}
                            onClick={() => openDelete(user)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:opacity-30"
                            title={user.id === currentUserId ? 'Tidak dapat menghapus diri sendiri' : 'Hapus Pengguna'}
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

      {/* Modal: Tambah User */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>Tambah Pengguna Baru</DialogTitle>
              <DialogDescription>
                Daftarkan akun kasir, super admin toko, atau admin sistem.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="create-user-name">Nama Lengkap</Label>
                  <Input
                    id="create-user-name"
                    placeholder="Contoh: Budi Santoso"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-user-email">Email Login</Label>
                  <Input
                    id="create-user-email"
                    type="email"
                    placeholder="budi@menuin.id"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-user-password">Password (Opsional)</Label>
                <Input
                  id="create-user-password"
                  type="password"
                  placeholder="Default: password123 (Min 6 karakter)"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="create-user-role">Role / Peran</Label>
                  <Select
                    value={formRole}
                    onValueChange={(val: any) => setFormRole(val)}
                  >
                    <SelectTrigger id="create-user-role">
                      <SelectValue placeholder="Pilih role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SUPERADMIN">SUPERADMIN (Owner Toko)</SelectItem>
                      <SelectItem value="CASHIER">CASHIER (Staf Kasir)</SelectItem>
                      <SelectItem value="SYSTEM_ADMIN">SYSTEM_ADMIN (Platform)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formRole !== 'SYSTEM_ADMIN' && (
                  <div className="space-y-2">
                    <Label htmlFor="create-user-tenant">Tautkan ke Tenant</Label>
                    <Select
                      value={formTenantId}
                      onValueChange={setFormTenantId}
                    >
                      <SelectTrigger id="create-user-tenant">
                        <SelectValue placeholder="Pilih toko" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-- Tanpa Tenant --</SelectItem>
                        {tenants.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Buat Pengguna
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Edit User */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleUpdate}>
            <DialogHeader>
              <DialogTitle>Edit Data Pengguna</DialogTitle>
              <DialogDescription>
                Perbarui informasi akun, peran, atau tenant yang terikat.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-user-name">Nama Lengkap</Label>
                  <Input
                    id="edit-user-name"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-user-email">Email Login</Label>
                  <Input
                    id="edit-user-email"
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-user-password" className="flex items-center gap-1.5">
                  <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
                  Ganti Password Baru (Opsional)
                </Label>
                <Input
                  id="edit-user-password"
                  type="password"
                  placeholder="Biarkan kosong jika tidak ingin mengubah password"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-user-role">Role / Peran</Label>
                  <Select
                    value={formRole}
                    onValueChange={(val: any) => setFormRole(val)}
                  >
                    <SelectTrigger id="edit-user-role">
                      <SelectValue placeholder="Pilih role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SUPERADMIN">SUPERADMIN (Owner Toko)</SelectItem>
                      <SelectItem value="CASHIER">CASHIER (Staf Kasir)</SelectItem>
                      <SelectItem value="SYSTEM_ADMIN">SYSTEM_ADMIN (Platform)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formRole !== 'SYSTEM_ADMIN' && (
                  <div className="space-y-2">
                    <Label htmlFor="edit-user-tenant">Tautkan ke Tenant</Label>
                    <Select
                      value={formTenantId}
                      onValueChange={setFormTenantId}
                    >
                      <SelectTrigger id="edit-user-tenant">
                        <SelectValue placeholder="Pilih toko" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-- Tanpa Tenant --</SelectItem>
                        {tenants.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
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

      {/* Dialog: Delete User */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Hapus Pengguna?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus akun <strong>{selectedUser?.name}</strong> ({selectedUser?.email})? Tindakan ini tidak dapat dibatalkan.
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
              Ya, Hapus Pengguna
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
