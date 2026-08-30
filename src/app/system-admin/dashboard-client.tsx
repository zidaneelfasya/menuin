'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Server,
  Users,
  CreditCard,
  Plus,
  ArrowRight,
  Store,
  UserPlus,
  Loader2,
  Clock,
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'sonner';
import { createSystemTenant, createSystemUser, toggleTenantStatus } from '@/lib/actions/system-admin';

interface DashboardStats {
  totalDashboards: number;
  paidDashboards: number;
  freeDashboards: number;
  totalUsers: number;
  systemAdminCount: number;
  superAdminCount: number;
  cashierCount: number;
  totalTransactions: number;
  totalRevenue: number;
  recentDashboards: any[];
  recentUsers: any[];
}

interface TenantOption {
  id: string;
  name: string;
}

export function DashboardClient({
  stats,
  tenants,
}: {
  stats: DashboardStats;
  tenants: TenantOption[];
}) {
  // Modal states
  const [isTenantModalOpen, setIsTenantModalOpen] = React.useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [togglingId, setTogglingId] = React.useState<string | null>(null);

  // Form states
  const [tenantName, setTenantName] = React.useState('');
  const [tenantPaid, setTenantPaid] = React.useState(false);

  const [userName, setUserName] = React.useState('');
  const [userEmail, setUserEmail] = React.useState('');
  const [userPassword, setUserPassword] = React.useState('');
  const [userRole, setUserRole] = React.useState<'CASHIER' | 'SUPERADMIN' | 'SYSTEM_ADMIN'>('SUPERADMIN');
  const [userTenantId, setUserTenantId] = React.useState<string>('none');

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantName.trim()) {
      toast.error('Nama toko wajib diisi');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createSystemTenant({ name: tenantName, isPaid: tenantPaid });
      if (res.success) {
        toast.success(res.message);
        setIsTenantModalOpen(false);
        setTenantName('');
        setTenantPaid(false);
      } else {
        toast.error(res.error);
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal membuat tenant');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !userEmail.trim()) {
      toast.error('Nama dan email wajib diisi');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createSystemUser({
        name: userName,
        email: userEmail,
        password: userPassword,
        role: userRole,
        dashboardId: userRole === 'SYSTEM_ADMIN' || userTenantId === 'none' ? null : userTenantId,
      });

      if (res.success) {
        toast.success(res.message);
        setIsUserModalOpen(false);
        setUserName('');
        setUserEmail('');
        setUserPassword('');
        setUserRole('SUPERADMIN');
        setUserTenantId('none');
      } else {
        toast.error(res.error);
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal membuat pengguna');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (id: string, currentPaid: boolean) => {
    setTogglingId(id);
    try {
      const res = await toggleTenantStatus(id, !currentPaid);
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.error);
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengubah status');
    } finally {
      setTogglingId(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            System Admin
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manajemen tenant, pengguna, dan aktivitas platform Menuin.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => setIsTenantModalOpen(true)}
            size="sm"
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Tenant</span>
          </Button>

          <Button
            onClick={() => setIsUserModalOpen(true)}
            variant="outline"
            size="sm"
            className="gap-1.5"
          >
            <UserPlus className="h-4 w-4" />
            <span>Tambah User</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        {/* Card 1: Total Tenants */}
        <Card className="shadow-none border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Tenant</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-1.5">
            <div className="text-2xl font-bold">{stats.totalDashboards}</div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                {stats.paidDashboards} Paid
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="text-amber-600 dark:text-amber-400 font-medium">
                {stats.freeDashboards} Free Trial
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Total Users */}
        <Card className="shadow-none border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Pengguna</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-1.5">
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>{stats.superAdminCount} Owner</span>
              <span>•</span>
              <span>{stats.cashierCount} Kasir</span>
              <span>•</span>
              <span>{stats.systemAdminCount} Admin</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: POS Transactions & Volume */}
        <Card className="shadow-none border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Transaksi POS</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-1.5">
            <div className="text-2xl font-bold">{stats.totalTransactions} Transaksi</div>
            <p className="text-xs text-muted-foreground font-medium">
              Volume: {formatCurrency(stats.totalRevenue)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <Link href="/system-admin/tenants" className="group block">
          <div className="p-4 rounded-lg border bg-card hover:bg-muted/40 transition-colors flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-muted text-foreground">
                <Store className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                  Kelola Tenant ({stats.totalDashboards})
                </p>
                <p className="text-xs text-muted-foreground">
                  Lihat daftar seluruh unit bisnis, ubah status langganan, atau edit toko.
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </Link>

        <Link href="/system-admin/users" className="group block">
          <div className="p-4 rounded-lg border bg-card hover:bg-muted/40 transition-colors flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-muted text-foreground">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                  Kelola Pengguna ({stats.totalUsers})
                </p>
                <p className="text-xs text-muted-foreground">
                  Atur hak akses akun Superadmin, Kasir, dan Platform Admin.
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </Link>
      </div>

      {/* 2-Column Section: Recent Tenants & Recent Users */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Recent Tenants */}
        <Card className="shadow-none border flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-semibold">Tenant Terbaru</CardTitle>
              <CardDescription className="text-xs">Toko yang baru didaftarkan</CardDescription>
            </div>
            <Link href="/system-admin/tenants">
              <Button variant="ghost" size="sm" className="text-xs gap-1 h-8">
                Lihat Semua <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="flex-1 pt-0">
            {stats.recentDashboards.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">Belum ada tenant.</div>
            ) : (
              <div className="divide-y">
                {stats.recentDashboards.map((tenant) => (
                  <div key={tenant.id} className="py-3 flex items-center justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{tenant.name}</p>
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono mt-0.5">
                        <Clock className="h-3 w-3" />
                        {format(new Date(tenant.createdAt), 'dd MMM yyyy, HH:mm', { locale: id })}
                      </span>
                    </div>
                    <button
                      onClick={() => handleToggleStatus(tenant.id, tenant.isPaid)}
                      disabled={togglingId === tenant.id}
                      className={`px-2 py-0.5 text-xs rounded font-medium transition-colors border ${
                        tenant.isPaid
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                      }`}
                      title="Klik untuk ubah status langganan"
                    >
                      {togglingId === tenant.id ? (
                        <Loader2 className="h-3 w-3 animate-spin inline" />
                      ) : tenant.isPaid ? (
                        'Paid'
                      ) : (
                        'Free Trial'
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Users */}
        <Card className="shadow-none border flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-semibold">Pengguna Terbaru</CardTitle>
              <CardDescription className="text-xs">Akun yang baru dibuat</CardDescription>
            </div>
            <Link href="/system-admin/users">
              <Button variant="ghost" size="sm" className="text-xs gap-1 h-8">
                Lihat Semua <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="flex-1 pt-0">
            {stats.recentUsers.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">Belum ada pengguna.</div>
            ) : (
              <div className="divide-y">
                {stats.recentUsers.map((user) => (
                  <div key={user.id} className="py-3 flex items-center justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span
                        className={`inline-block px-2 py-0.5 text-[11px] rounded font-medium ${
                          user.role === 'SYSTEM_ADMIN'
                            ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                            : user.role === 'SUPERADMIN'
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                            : 'bg-muted text-muted-foreground border'
                        }`}
                      >
                        {user.role}
                      </span>
                      {user.dashboardName && (
                        <p className="text-[11px] text-muted-foreground truncate max-w-[120px] mt-0.5">
                          {user.dashboardName}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal: Tambah Tenant */}
      <Dialog open={isTenantModalOpen} onOpenChange={setIsTenantModalOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleCreateTenant}>
            <DialogHeader>
              <DialogTitle>Tambah Tenant Baru</DialogTitle>
              <DialogDescription>
                Buat workspace tenant baru untuk toko atau unit bisnis.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="tenant-name">Nama Toko / Bisnis</Label>
                <Input
                  id="tenant-name"
                  placeholder="Contoh: Kopi Senja Abadi"
                  value={tenantName}
                  onChange={(e) => setTenantName(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tenant-status">Status Paket</Label>
                <Select
                  value={tenantPaid ? 'paid' : 'free'}
                  onValueChange={(val) => setTenantPaid(val === 'paid')}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="tenant-status">
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Paid (Langganan Aktif)</SelectItem>
                    <SelectItem value="free">Free Trial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsTenantModalOpen(false)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  'Buat Tenant'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Tambah User */}
      <Dialog open={isUserModalOpen} onOpenChange={setIsUserModalOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleCreateUser}>
            <DialogHeader>
              <DialogTitle>Tambah Pengguna Baru</DialogTitle>
              <DialogDescription>
                Daftarkan akun staf, owner, atau sesama platform administrator.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="user-name">Nama Lengkap</Label>
                <Input
                  id="user-name"
                  placeholder="Contoh: Budi Santoso"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="user-email">Email Login</Label>
                <Input
                  id="user-email"
                  type="email"
                  placeholder="budi@example.com"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="user-password">Password Awal</Label>
                <Input
                  id="user-password"
                  type="text"
                  placeholder="Default: password123"
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                  disabled={isSubmitting}
                />
                <p className="text-[11px] text-muted-foreground">Kosongkan untuk menggunakan password default (password123).</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="user-role">Role Pengguna</Label>
                <Select
                  value={userRole}
                  onValueChange={(val: any) => setUserRole(val)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="user-role">
                    <SelectValue placeholder="Pilih role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SUPERADMIN">SUPERADMIN (Owner Tenant)</SelectItem>
                    <SelectItem value="CASHIER">CASHIER (Kasir)</SelectItem>
                    <SelectItem value="SYSTEM_ADMIN">SYSTEM_ADMIN (Platform Admin)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {userRole !== 'SYSTEM_ADMIN' && (
                <div className="space-y-2">
                  <Label htmlFor="user-tenant">Pilih Toko / Tenant</Label>
                  <Select
                    value={userTenantId}
                    onValueChange={setUserTenantId}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="user-tenant">
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
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsUserModalOpen(false)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  'Buat Pengguna'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
