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
  Activity,
  Plus,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Store,
  UserPlus,
  Loader2,
  CheckCircle2,
  Clock,
  Sparkles,
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
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-blue-600/10 via-indigo-600/5 to-purple-600/10 p-6 rounded-2xl border border-blue-500/15">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-600 text-white shadow-sm">
              Overview
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Platform System Admin
            </h1>
          </div>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Pantau dan kelola seluruh ekosistem multi-tenant, pengguna, dan aktivitas bisnis Menuin.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            onClick={() => setIsTenantModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm gap-1.5"
          >
            <Store className="h-4 w-4" />
            <span>Tambah Tenant</span>
          </Button>

          <Button
            onClick={() => setIsUserModalOpen(true)}
            variant="outline"
            className="bg-background hover:bg-muted gap-1.5 border-border/80"
          >
            <UserPlus className="h-4 w-4 text-blue-600" />
            <span>Tambah Pengguna</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total Tenants */}
        <Card className="relative overflow-hidden border border-border/60 hover:border-blue-500/40 hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-bl-full pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Total Tenant</CardTitle>
            <div className="h-10 w-10 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
              <Server className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-black tracking-tight">{stats.totalDashboards}</div>
            <div className="flex items-center gap-2 text-xs">
              <span className="inline-flex items-center px-2 py-0.5 rounded-md font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                {stats.paidDashboards} Paid
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400">
                {stats.freeDashboards} Free Trial
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Total Users */}
        <Card className="relative overflow-hidden border border-border/60 hover:border-emerald-500/40 hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-bl-full pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Total Pengguna</CardTitle>
            <div className="h-10 w-10 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-black tracking-tight">{stats.totalUsers}</div>
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              <span>{stats.superAdminCount} Owner</span>
              <span>•</span>
              <span>{stats.cashierCount} Kasir</span>
              <span>•</span>
              <span>{stats.systemAdminCount} Admin</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Platform Gross Revenue */}
        <Card className="relative overflow-hidden border border-border/60 hover:border-indigo-500/40 hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-bl-full pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Total Transaksi POS</CardTitle>
            <div className="h-10 w-10 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center">
              <CreditCard className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1.5">
            <div className="text-2xl sm:text-3xl font-black tracking-tight truncate">
              {stats.totalTransactions} Trx
            </div>
            <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 truncate">
              Vol: {formatCurrency(stats.totalRevenue)}
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Platform Health */}
        <Card className="relative overflow-hidden border border-border/60 hover:border-purple-500/40 hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-bl-full pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Status Platform</CardTitle>
            <div className="h-10 w-10 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center">
              <Activity className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1.5">
            <div className="text-2xl sm:text-3xl font-black text-emerald-500 flex items-center gap-2">
              <span>Operational</span>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Semua servis berjalan optimal
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Shortcuts */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <Link href="/system-admin/tenants" className="group">
          <div className="p-5 rounded-xl border border-border/70 bg-card hover:bg-muted/40 hover:border-blue-500/40 transition-all flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Store className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground group-hover:text-blue-600 transition-colors">
                  Kelola Seluruh Tenant ({stats.totalDashboards})
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Lihat daftar lengkap toko, ubah status langganan, edit nama, atau hapus tenant.
                </p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
          </div>
        </Link>

        <Link href="/system-admin/users" className="group">
          <div className="p-5 rounded-xl border border-border/70 bg-card hover:bg-muted/40 hover:border-emerald-500/40 transition-all flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground group-hover:text-emerald-600 transition-colors">
                  Kelola Pengguna Platform ({stats.totalUsers})
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Atur hak akses akun (Super Admin, Kasir, System Admin) dan tenant binding.
                </p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
          </div>
        </Link>
      </div>

      {/* 2-Column Section: Recent Tenants & Recent Users */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Recent Tenants Card */}
        <Card className="border-border/60 shadow-sm flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-lg font-bold">Tenant Terbaru</CardTitle>
              <CardDescription>Pendaftaran restoran/bisnis paling akhir</CardDescription>
            </div>
            <Link href="/system-admin/tenants">
              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 text-xs gap-1">
                Semua Tenant <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="flex-1">
            {stats.recentDashboards.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">Belum ada tenant terdaftar.</div>
            ) : (
              <div className="divide-y divide-border/50">
                {stats.recentDashboards.map((tenant) => (
                  <div key={tenant.id} className="py-3.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{tenant.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
                          <Clock className="h-3 w-3" />
                          {format(new Date(tenant.createdAt), 'dd MMM yyyy, HH:mm', { locale: id })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleToggleStatus(tenant.id, tenant.isPaid)}
                        disabled={togglingId === tenant.id}
                        className={`px-2.5 py-1 text-xs rounded-full font-semibold transition-all border ${
                          tenant.isPaid
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20'
                        }`}
                        title="Klik untuk ubah status"
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
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Users Card */}
        <Card className="border-border/60 shadow-sm flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-lg font-bold">Pengguna Terbaru</CardTitle>
              <CardDescription>Akun staf & admin yang baru terdaftar</CardDescription>
            </div>
            <Link href="/system-admin/users">
              <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700 text-xs gap-1">
                Semua Pengguna <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="flex-1">
            {stats.recentUsers.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">Belum ada pengguna terdaftar.</div>
            ) : (
              <div className="divide-y divide-border/50">
                {stats.recentUsers.map((user) => (
                  <div key={user.id} className="py-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-zinc-800 flex items-center justify-center font-bold text-xs uppercase flex-shrink-0 text-foreground">
                        {user.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span
                        className={`inline-block px-2 py-0.5 text-[11px] rounded-full font-semibold ${
                          user.role === 'SYSTEM_ADMIN'
                            ? 'bg-purple-500/10 text-purple-600 border border-purple-500/20'
                            : user.role === 'SUPERADMIN'
                            ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                            : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20'
                        }`}
                      >
                        {user.role}
                      </span>
                      {user.dashboardName && (
                        <p className="text-[10px] text-muted-foreground truncate max-w-[120px] mt-0.5">
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
              <DialogTitle>Tambah Tenant / Toko Baru</DialogTitle>
              <DialogDescription>
                Buat workspace tenant baru untuk restoran atau unit bisnis.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="tenant-name">Nama Toko / Restoran</Label>
                <Input
                  id="tenant-name"
                  placeholder="Contoh: Kopi Kenangan Mall"
                  value={tenantName}
                  onChange={(e) => setTenantName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tenant-status">Status Berlangganan</Label>
                <Select
                  value={tenantPaid ? 'paid' : 'free'}
                  onValueChange={(val) => setTenantPaid(val === 'paid')}
                >
                  <SelectTrigger id="tenant-status">
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Paid (Aktif Tanpa Batas)</SelectItem>
                    <SelectItem value="free">Free Trial (Uji Coba)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setIsTenantModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan Tenant
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Tambah Pengguna */}
      <Dialog open={isUserModalOpen} onOpenChange={setIsUserModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleCreateUser}>
            <DialogHeader>
              <DialogTitle>Tambah Pengguna Baru</DialogTitle>
              <DialogDescription>
                Daftarkan akun staf kasir, super admin toko, atau system admin platform.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="user-name">Nama Lengkap</Label>
                  <Input
                    id="user-name"
                    placeholder="Contoh: Andi Pratama"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user-email">Email Login</Label>
                  <Input
                    id="user-email"
                    type="email"
                    placeholder="andi@menuin.id"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="user-password">Password (Opsional)</Label>
                <Input
                  id="user-password"
                  type="password"
                  placeholder="Default: password123 (Min 6 karakter)"
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="user-role">Role / Peran</Label>
                  <Select
                    value={userRole}
                    onValueChange={(val: any) => setUserRole(val)}
                  >
                    <SelectTrigger id="user-role">
                      <SelectValue placeholder="Pilih role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SUPERADMIN">SUPERADMIN (Owner Toko)</SelectItem>
                      <SelectItem value="CASHIER">CASHIER (Staf Kasir)</SelectItem>
                      <SelectItem value="SYSTEM_ADMIN">SYSTEM_ADMIN (Platform)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {userRole !== 'SYSTEM_ADMIN' && (
                  <div className="space-y-2">
                    <Label htmlFor="user-tenant">Tautkan ke Tenant</Label>
                    <Select
                      value={userTenantId}
                      onValueChange={setUserTenantId}
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
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setIsUserModalOpen(false)}>
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
    </div>
  );
}
