import { Metadata } from 'next';
import Link from 'next/link';
import { getShiftDetails } from '@/lib/actions/shifts';
import { ShiftDetailView } from '@/features/shifts/components/shift-detail-view';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { Suspense } from 'react';
import ShiftDetailLoading from './loading';

interface ShiftDetailPageProps {
  params: Promise<{
    outletKey: string;
    shiftId: string;
  }>;
}

export async function generateMetadata({
  params,
}: ShiftDetailPageProps): Promise<Metadata> {
  const { shiftId } = await params;
  return {
    title: `Detail Shift #${shiftId.slice(0, 8).toUpperCase()} - Menuin`,
  };
}

async function ShiftDetailContent({
  outletKey,
  shiftId,
}: {
  outletKey: string;
  shiftId: string;
}) {
  const res = await getShiftDetails(shiftId);

  if (!res.success || !res.data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6 bg-white rounded-2xl border-none shadow-sm-md space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-slate-900">Shift Tidak Ditemukan</h2>
          <p className="text-xs text-slate-500 max-w-sm">
            Data sesi shift ini mungkin telah dihapus atau Anda tidak memiliki akses ke data tersebut.
          </p>
        </div>
        <Link href={`/outlet/${outletKey}/shifts`}>
          <Button variant="outline" size="sm" className="gap-2 rounded-full text-xs font-semibold border-none shadow-sm-md bg-white hover:bg-slate-100 text-slate-700 cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Shift Kasir
          </Button>
        </Link>
      </div>
    );
  }

  return <ShiftDetailView outletKey={outletKey} data={res.data} />;
}

export default async function ShiftDetailPage({ params }: ShiftDetailPageProps) {
  const { outletKey, shiftId } = await params;

  return (
    <Suspense fallback={<ShiftDetailLoading />}>
      <ShiftDetailContent outletKey={outletKey} shiftId={shiftId} />
    </Suspense>
  );
}
