'use client';

import { useEffect } from 'react';
import { Lock, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function TenantsError({
  error,
  reset,
}: {
  error: Error & { digest?: string; name?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Tenant Route Error:', error);
  }, [error]);

  const isFeatureLocked = error.name === 'FeatureLockedError' || error.message.includes('PaymentRequired');
  const isForbidden = error.name === 'ForbiddenError' || error.message.includes('Forbidden');

  if (isFeatureLocked) {
    return (
      <div className="flex h-[80vh] w-full flex-col items-center justify-center p-4 text-center">
        <div className="mb-6 rounded-full bg-blue-100 p-4">
          <Lock className="h-12 w-12 text-blue-600" />
        </div>
        <h2 className="mb-2 text-2xl font-bold">Fitur Terkunci</h2>
        <p className="mb-8 max-w-md text-muted-foreground">
          {error.message || 'Anda memerlukan paket langganan aktif untuk mengakses fitur ini.'}
        </p>
        <div className="flex gap-4">
          <Link
            href="/select-tenant"
            className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
          >
            Kembali ke Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (isForbidden) {
    return (
      <div className="flex h-[80vh] w-full flex-col items-center justify-center p-4 text-center">
        <div className="mb-6 rounded-full bg-red-100 p-4">
          <AlertCircle className="h-12 w-12 text-red-600" />
        </div>
        <h2 className="mb-2 text-2xl font-bold">Akses Ditolak</h2>
        <p className="mb-8 max-w-md text-muted-foreground">
          Anda tidak memiliki izin (role) yang cukup untuk mengakses halaman ini.
        </p>
        <div className="flex gap-4">
          <Link
            href="/select-tenant"
            className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
          >
            Kembali ke Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[80vh] w-full flex-col items-center justify-center p-4 text-center">
      <div className="mb-6 rounded-full bg-red-100 p-4">
        <AlertCircle className="h-12 w-12 text-red-600" />
      </div>
      <h2 className="mb-2 text-2xl font-bold">Terjadi Kesalahan</h2>
      <p className="mb-8 max-w-md text-muted-foreground">
        Maaf, sistem mengalami kesalahan tidak terduga saat memuat data halaman ini.
      </p>
      <div className="flex gap-4">
        <button
          onClick={reset}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Coba Lagi
        </button>
        <Link
          href="/select-tenant"
          className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
        >
          Kembali ke Dashboard
        </Link>
      </div>
    </div>
  );
}
