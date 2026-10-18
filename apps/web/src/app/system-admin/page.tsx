import { Metadata } from 'next';
import Link from 'next/link';
import { getSystemAdminStats } from '@/lib/actions/system-admin';
import { getVerificationQueue } from '@/lib/actions/admin-verification';
import {
  IconBuildingStore,
  IconUsers,
  IconCreditCard,
  IconShieldCheck,
  IconArrowRight,
} from '@tabler/icons-react';

export const metadata: Metadata = {
  title: 'Dashboard Admin - Menuin',
};

export default async function SystemAdminDashboardPage() {
  const [stats, verificationData] = await Promise.all([
    getSystemAdminStats().catch(() => null),
    getVerificationQueue().catch(() => ({ queue: [], counts: { all: 0, submitted: 0, under_review: 0, action_required: 0, verified: 0, rejected: 0 } })),
  ]);

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
          Ikhtisar Sistem & Kepatuhan
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Pantau metrik platform, antrean verifikasi bisnis, dan kesiapan merchant MENUIN.
        </p>
      </div>

      {/* Verification Queue Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Antrean Baru</span>
            <IconShieldCheck className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-3xl font-semibold text-neutral-900 dark:text-neutral-100">
            {verificationData.counts.submitted}
          </p>
          <p className="text-xs text-neutral-400 mt-1">Menunggu pemeriksaan tim</p>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Sedang Ditinjau</span>
            <IconShieldCheck className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-3xl font-semibold text-neutral-900 dark:text-neutral-100">
            {verificationData.counts.under_review}
          </p>
          <p className="text-xs text-neutral-400 mt-1">Sedang diproses reviewer</p>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Perlu Perbaikan</span>
            <IconShieldCheck className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-3xl font-semibold text-neutral-900 dark:text-neutral-100">
            {verificationData.counts.action_required}
          </p>
          <p className="text-xs text-neutral-400 mt-1">Menunggu aksi dari merchant</p>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Terverifikasi</span>
            <IconShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-3xl font-semibold text-neutral-900 dark:text-neutral-100">
            {verificationData.counts.verified}
          </p>
          <p className="text-xs text-neutral-400 mt-1">Profil bisnis & outlet aktif</p>
        </div>
      </div>

      {/* Direct CTA to Verification Queue */}
      <div className="bg-[#0e59f9] text-white rounded-xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Kelola Antrean Verifikasi</h2>
          <p className="text-xs text-blue-100 mt-1 max-w-xl">
            Tinjau berkas identitas KTP, NPWP, NIB badan usaha, serta foto fisik storefront dan kasir outlet untuk aktivasi QRIS gateway DOKU.
          </p>
        </div>
        <Link
          href="/system-admin/verification"
          className="inline-flex items-center px-4 py-2 bg-white text-[#0e59f9] text-xs font-semibold rounded-lg hover:bg-neutral-100 transition-colors shrink-0"
        >
          Buka Antrean Verifikasi
          <IconArrowRight className="w-3.5 h-3.5 ml-1.5" />
        </Link>
      </div>

      {/* Platform Stats */}
      {stats && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-4">
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
            Statistik Merchant Platform
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-700/60">
              <span className="text-neutral-400 block mb-1">Total Outlet / Tenant</span>
              <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                {stats.totalDashboards}
              </span>
            </div>
            <div className="p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-700/60">
              <span className="text-neutral-400 block mb-1">Total Akun Pengguna</span>
              <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                {stats.totalUsers}
              </span>
            </div>
            <div className="p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-700/60">
              <span className="text-neutral-400 block mb-1">Total Transaksi POS</span>
              <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                {stats.totalTransactions}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
