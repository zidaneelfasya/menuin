import { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAuthenticatedAccount } from '@/lib/actions/auth-context';
import { db } from '@/lib/db';
import { memberships, tenants } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import {
  IconShieldCheck,
  IconLayoutDashboard,
  IconBuildingStore,
  IconUsers,
  IconArrowLeft,
  IconLogout,
  IconCreditCard,
} from '@tabler/icons-react';

export const metadata: Metadata = {
  title: 'MENUIN System Admin Console',
  description: 'Panel administrasi kepatuhan, verifikasi bisnis, dan manajemen sistem MENUIN.',
};

export default async function SystemAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let account = null;
  try {
    account = await getAuthenticatedAccount();
  } catch {
    redirect('/auth/login');
  }

  if (!account) {
    redirect('/auth/login');
  }

  // Check authorization via account's global systemRole
  const isSystemRoleAuthorized = ['SYSTEM_ADMIN', 'SUPERADMIN', 'VERIFICATION_ADMIN'].includes(
    account.systemRole as string
  );

  // Check account memberships for optional outlet link or owner fallback
  const accountMemberships = await db
    .select({
      id: memberships.id,
      role: memberships.role,
      tenantId: memberships.tenantId,
      outletKey: tenants.outletKey,
    })
    .from(memberships)
    .leftJoin(tenants, eq(memberships.tenantId, tenants.id))
    .where(eq(memberships.accountId, account.id));

  const isAuthorized = isSystemRoleAuthorized;

  const primaryOutletKey = accountMemberships.find((m) => m.outletKey)?.outletKey || null;

  const user = {
    name: account.name,
    email: account.email,
    outletKey: primaryOutletKey,
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 mx-auto flex items-center justify-center font-bold text-lg">
            !
          </div>
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Akses Ditolak
          </h2>
          <p className="text-xs text-neutral-500 leading-relaxed">
            Halaman System Admin hanya dapat diakses oleh peran Superadmin atau Tim Verifikasi Kepatuhan MENUIN.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center text-xs font-medium text-[#0e59f9] hover:underline"
            >
              <IconArrowLeft className="w-3.5 h-3.5 mr-1" />
              Kembali ke Aplikasi Utama
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50/70 dark:bg-neutral-950 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 flex flex-col justify-between shrink-0">
        <div>
          {/* Logo / Header */}
          <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-[#0e59f9] text-white flex items-center justify-center font-bold text-sm tracking-wider">
                M
              </span>
              <div>
                <span className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 block">
                  MENUIN Admin
                </span>
                <span className="text-[10px] text-neutral-400 uppercase tracking-wider block font-medium">
                  Compliance Console
                </span>
              </div>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="p-4 space-y-1">
            <Link
              href="/system-admin"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/60 transition-colors"
            >
              <IconLayoutDashboard className="w-4 h-4 text-neutral-500" />
              <span>Ikhtisar Sistem</span>
            </Link>

            <Link
              href="/system-admin/verification"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium text-neutral-900 dark:text-neutral-100 bg-neutral-100 dark:bg-neutral-800 transition-colors"
            >
              <IconShieldCheck className="w-4 h-4 text-[#0e59f9]" />
              <div className="flex items-center justify-between flex-1">
                <span>Antrean Verifikasi</span>
                <span className="text-[10px] bg-[#0e59f9] text-white px-1.5 py-0.2 rounded-full font-semibold">
                  Queue
                </span>
              </div>
            </Link>

            <Link
              href="/system-admin/payments"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/60 transition-colors"
            >
              <IconCreditCard className="w-4 h-4 text-neutral-500" />
              <span>Akun Pembayaran</span>
            </Link>

            <Link
              href="/system-admin/tenants"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/60 transition-colors"
            >
              <IconBuildingStore className="w-4 h-4 text-neutral-500" />
              <span>Manajemen Tenant</span>
            </Link>

            <Link
              href="/system-admin/users"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/60 transition-colors"
            >
              <IconUsers className="w-4 h-4 text-neutral-500" />
              <span>Pengguna Sistem</span>
            </Link>
          </nav>
        </div>

        {/* Footer User Info & Return */}
        <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-xs font-semibold text-neutral-700 dark:text-neutral-200">
              {user.name?.slice(0, 2).toUpperCase() || 'AD'}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                {user.name}
              </p>
              <p className="text-[10px] text-neutral-400 truncate">
                {user.email}
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
            <Link
              href={user.outletKey ? `/outlet/${user.outletKey}/dashboard` : '/select-tenant'}
              className="flex items-center gap-2 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors py-1"
            >
              <IconArrowLeft className="w-3.5 h-3.5" />
              <span>{user.outletKey ? 'Ke Dashboard Outlet' : 'Ke Pilihan Outlet'}</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto min-w-0">
        {children}
      </main>
    </div>
  );
}
