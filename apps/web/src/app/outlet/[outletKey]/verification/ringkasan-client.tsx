'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/verification/shared/page-header';
import { StatusHeroCard } from '@/components/verification/hub/status-hero-card';
import { ProgressCard } from '@/components/verification/hub/progress-card';
import { StatusPill } from '@/components/verification/shared/status-pill';
import { evaluateHubOverallStatus } from '@/lib/verification/ui-status';
import { activateOutletPaymentAction } from '@/lib/actions/merchant-verification';
import { toast } from 'sonner';
import { Info } from 'lucide-react';

interface RingkasanClientProps {
  outletKey: string;
  data: any;
}

export function RingkasanClient({ outletKey, data }: RingkasanClientProps) {
  const router = useRouter();
  const [isActivating, setIsActivating] = React.useState(false);

  const {
    tenant,
    businessProfile,
    activeSettlementAccount,
    readiness,
    submissions,
    latestSubmission,
    sectionReviewsMap,
    isOwner = true,
    userRole,
  } = data;

  const summary = evaluateHubOverallStatus({
    tenant,
    businessProfile,
    activeSettlementAccount,
    readiness,
    sectionReviewsMap,
    outletKey,
  });

  const handleActivatePayment = async () => {
    setIsActivating(true);
    try {
      const res = await activateOutletPaymentAction(outletKey);
      if (res.success) {
        toast.success(res.message || 'QRIS dinamis berhasil diaktifkan!');
        router.refresh();
      } else {
        toast.error(res.error || 'Gagal mengaktifkan pembayaran.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan sistem saat aktivasi.');
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Editorial Header */}
      <PageHeader
        eyebrow={`Verifikasi Bisnis • ${tenant.name}`}
        title="Ringkasan Verifikasi"
        description="Kelola data legalitas bisnis, perwakilan, rekening penampungan dana, dan kepatuhan lokasi gerai untuk verifikasi operasional outlet."
        badge={<StatusPill status={summary.status} customLabel={summary.pillLabel} />}
      />

      {/* Non-Owner Manager Notice Banner */}
      {!isOwner && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-50/70 border border-blue-100 text-slate-700">
          <Info className="w-4 h-4 text-[#0e59f9] flex-shrink-0" />
          <p className="text-xs leading-relaxed text-slate-600">
            Peran Anda saat ini adalah <span className="font-semibold text-slate-800">{userRole || 'Pengelola'}</span> (Mode Lihat). Pendaftaran formulir, perubahan data profil usaha, dan penggantian rekening penampungan hanya dapat dilakukan oleh Pemilik (Owner) outlet.
          </p>
        </div>
      )}

      {/* Hero 12-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Hero Status Card (Solid Blue) */}
        <StatusHeroCard
          summary={summary}
          onActivate={handleActivatePayment}
          isActivating={isActivating}
          isOwner={isOwner}
          className="lg:col-span-4"
        />

        {/* Right: Progress Timeline Card with 4 Pillars */}
        <ProgressCard
          outletKey={outletKey}
          businessProfile={businessProfile}
          activeSettlementAccount={activeSettlementAccount}
          tenant={tenant}
          sectionReviewsMap={sectionReviewsMap}
          className="lg:col-span-8"
        />
      </div>
    </div>
  );
}
