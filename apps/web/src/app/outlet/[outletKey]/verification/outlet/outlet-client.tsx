'use client';

import * as React from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/verification/shared/page-header';
import { SectionCard } from '@/components/verification/shared/section-card';
import { ReadOnlyField } from '@/components/verification/shared/read-only-field';
import { StatusPill } from '@/components/verification/shared/status-pill';
import { Edit3, ExternalLink, MapPin, Store, Image as ImageIcon, Loader2 } from 'lucide-react';
import { getVerificationDocumentSignedUrlAction } from '@/lib/actions/verification-storage';
import { toast } from 'sonner';

interface OutletClientProps {
  outletKey: string;
  data: any;
}

export function OutletClient({ outletKey, data }: OutletClientProps) {
  const { tenant, isOwner = true } = data;
  const [openingKey, setOpeningKey] = React.useState<string | null>(null);

  const handleOpenPhoto = async (storageKey: string) => {
    setOpeningKey(storageKey);
    try {
      const res = await getVerificationDocumentSignedUrlAction(storageKey);
      if (res.success && res.signedUrl) {
        window.open(res.signedUrl, '_blank', 'noopener,noreferrer');
      } else {
        toast.error(res.error || 'Gagal membuka foto.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setOpeningKey(null);
    }
  };

  const latestSub = data.latestSubmission || data.submissions?.[0];
  const allDocs: any[] = latestSub?.documents || latestSub?.submissionSnapshot?.documents || [];
  const storefrontDoc = allDocs.find((d: any) => d.documentType === 'FOTO_TAMPAK_DEPAN');
  const indoorDoc = allDocs.find((d: any) => d.documentType === 'FOTO_KASIR');

  const finalStorefrontKey = tenant.storefrontPhotoUrl || storefrontDoc?.storageKey || null;
  const finalIndoorKey = tenant.indoorPhotoUrl || indoorDoc?.storageKey || null;

  const [storefrontSignedUrl, setStorefrontSignedUrl] = React.useState<string | null>(null);
  const [indoorSignedUrl, setIndoorSignedUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (finalStorefrontKey) {
      getVerificationDocumentSignedUrlAction(finalStorefrontKey).then((res) => {
        if (res.success && res.signedUrl) setStorefrontSignedUrl(res.signedUrl);
      });
    }
    if (finalIndoorKey) {
      getVerificationDocumentSignedUrlAction(finalIndoorKey).then((res) => {
        if (res.success && res.signedUrl) setIndoorSignedUrl(res.signedUrl);
      });
    }
  }, [finalStorefrontKey, finalIndoorKey]);

  // Determine section review status
  const outletSection = data.sectionReviewsMap?.['OUTLET'];
  const sectionStatus: 'verified' | 'action_required' | 'under_review' | 'incomplete' = outletSection
    ? outletSection.status === 'APPROVED'
      ? 'verified'
      : outletSection.status === 'CHANGES_REQUESTED'
      ? 'action_required'
      : 'under_review'
    : tenant.outletComplianceStatus === 'verified'
    ? 'verified'
    : tenant.outletComplianceStatus === 'action_required'
    ? 'action_required'
    : 'under_review';

  const coordinatesDisplay =
    tenant.latitude && tenant.longitude
      ? `${Number(tenant.latitude).toFixed(6)}, ${Number(tenant.longitude).toFixed(6)}`
      : 'Belum terdeteksi';

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`Verifikasi Bisnis \u2022 ${tenant.name}`}
        title="Lokasi & Fisik Gerai"
        description="Verifikasi keberadaan fisik cabang outlet untuk kepatuhan regulasi penerbitan QRIS Bank Indonesia."
        badge={<StatusPill status={sectionStatus} />}
      >
        {isOwner && (
          <Link
            href={`/outlet/${outletKey}/verification/onboarding?step=4`}
            className="h-9 px-4 rounded-full bg-white border-none text-xs font-semibold text-slate-700 hover:bg-slate-100 shadow-sm-md inline-flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 text-slate-500" />
            <span>Ubah Data Gerai</span>
          </Link>
        )}
      </PageHeader>

      <SectionCard
        eyebrow="Alamat Fisik & Titik Peta"
        title="Lokasi Operasional Gerai"
        description="Alamat fisik tempat transaksi kasir dan pelayanan pelanggan berlangsung."
        verificationStatus={sectionStatus}
        statusNote={outletSection?.note}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ReadOnlyField
            label="Nama Cabang Outlet"
            value={tenant.name}
          />
          <ReadOnlyField
            label="Kota / Kabupaten"
            value={tenant.city}
            placeholder="Belum terisi"
          />
          <div className="sm:col-span-2">
            <ReadOnlyField
              label="Alamat Lengkap Gerai"
              value={tenant.address}
              placeholder="Belum terisi"
            />
          </div>
          <ReadOnlyField
            label="Kode Pos"
            value={tenant.postalCode}
            placeholder="Belum terisi"
          />
          <ReadOnlyField
            label="Koordinat Geografis (GPS)"
            value={coordinatesDisplay}
          />
          {tenant.mapsUrl && (
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-slate-600 tracking-tight block mb-1.5">
                Tautan Google Maps
              </label>
              <div className="rounded-xl border-none shadow-sm-md bg-slate-50 p-3 flex items-center justify-between gap-3">
                <span className="text-xs text-slate-700 truncate">{tenant.mapsUrl}</span>
                <a
                  href={tenant.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#0e59f9] hover:underline flex-shrink-0"
                >
                  <span>Buka Peta</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}
        </div>
      </SectionCard>

      <SectionCard
        eyebrow="Bukti Keberadaan Fisik"
        title="Dokumentasi Foto Gerai"
        description="Foto tampak depan gerai dan area meja kasir tempat pembayaran dilakukan."
        verificationStatus={sectionStatus}
        statusNote={outletSection?.note}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Tampak Depan */}
          <div className="rounded-2xl border-none shadow-sm-md bg-slate-50/70 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800">
                Foto Tampak Depan Gerai
              </span>
              {finalStorefrontKey && (
                <button
                  type="button"
                  onClick={() => handleOpenPhoto(finalStorefrontKey)}
                  disabled={openingKey === finalStorefrontKey}
                  className="text-xs font-semibold text-[#0e59f9] hover:underline inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  {openingKey === finalStorefrontKey ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <span>Lihat Asli</span>
                      <ExternalLink className="w-3 h-3" />
                    </>
                  )}
                </button>
              )}
            </div>

            {storefrontSignedUrl ? (
              <div className="aspect-video rounded-lg overflow-hidden border border-slate-200 bg-white relative group">
                <img
                  src={storefrontSignedUrl}
                  alt="Foto Tampak Depan Gerai"
                  className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                />
              </div>
            ) : finalStorefrontKey ? (
              <div className="aspect-video rounded-lg overflow-hidden border border-slate-200 bg-white flex items-center justify-center">
                <div className="text-center p-3">
                  <Store className="w-8 h-8 text-[#0e59f9] mx-auto mb-1 opacity-80" />
                  <p className="text-xs text-slate-600 font-medium">Foto Fasad Depan Terlampir</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Klik &quot;Lihat Asli&quot; untuk membuka resolusi penuh</p>
                </div>
              </div>
            ) : (
              <div className="aspect-video rounded-lg border border-dashed border-slate-200 bg-white/70 flex flex-col items-center justify-center text-center p-4">
                <ImageIcon className="w-6 h-6 text-slate-300 mb-1" />
                <p className="text-xs text-slate-400">Foto belum diunggah</p>
              </div>
            )}
          </div>

          {/* Area Meja Kasir */}
          <div className="rounded-2xl border-none shadow-sm-md bg-slate-50/70 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800">
                Foto Area Meja Kasir / POS
              </span>
              {finalIndoorKey && (
                <button
                  type="button"
                  onClick={() => handleOpenPhoto(finalIndoorKey)}
                  disabled={openingKey === finalIndoorKey}
                  className="text-xs font-semibold text-[#0e59f9] hover:underline inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  {openingKey === finalIndoorKey ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <span>Lihat Asli</span>
                      <ExternalLink className="w-3 h-3" />
                    </>
                  )}
                </button>
              )}
            </div>

            {indoorSignedUrl ? (
              <div className="aspect-video rounded-lg overflow-hidden border border-slate-200 bg-white relative group">
                <img
                  src={indoorSignedUrl}
                  alt="Foto Area Meja Kasir / POS"
                  className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                />
              </div>
            ) : finalIndoorKey ? (
              <div className="aspect-video rounded-lg overflow-hidden border border-slate-200 bg-white flex items-center justify-center">
                <div className="text-center p-3">
                  <Store className="w-8 h-8 text-[#0e59f9] mx-auto mb-1 opacity-80" />
                  <p className="text-xs text-slate-600 font-medium">Foto Area Kasir Terlampir</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Klik &quot;Lihat Asli&quot; untuk membuka resolusi penuh</p>
                </div>
              </div>
            ) : (
              <div className="aspect-video rounded-lg border border-dashed border-slate-200 bg-white/70 flex flex-col items-center justify-center text-center p-4">
                <ImageIcon className="w-6 h-6 text-slate-300 mb-1" />
                <p className="text-xs text-slate-400">Foto belum diunggah</p>
              </div>
            )}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

