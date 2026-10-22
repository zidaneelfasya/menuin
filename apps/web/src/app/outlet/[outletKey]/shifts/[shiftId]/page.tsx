import { Metadata } from 'next';
import Link from 'next/link';
import { getShiftDetails } from '@/lib/actions/shifts';
import { ShiftDetailView } from '@/features/shifts/components/shift-detail-view';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

export default async function ShiftDetailPage({ params }: ShiftDetailPageProps) {
  const { outletKey, shiftId } = await params;
  const res = await getShiftDetails(shiftId);

  if (!res.success || !res.data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6 bg-white rounded-2xl border border-[#EAEFF8] shadow-xs space-y-4">
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
          <Button variant="outline" size="sm" className="gap-2 rounded-xl text-xs font-semibold">
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Shift Kasir
          </Button>
        </Link>
      </div>
    );
  }

  return <ShiftDetailView outletKey={outletKey} data={res.data} />;
}
