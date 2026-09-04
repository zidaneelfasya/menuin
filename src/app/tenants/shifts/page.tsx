import { Metadata } from 'next';
import { ShiftDashboard } from '@/features/shifts/components/shift-dashboard';
import { getActiveShift, getShiftHistory } from '@/lib/actions/shifts';

export const metadata: Metadata = {
  title: 'Manajemen Shift - Menuin',
};

export default async function ShiftsPage() {
  const [activeShiftResult, historyResult] = await Promise.all([
    getActiveShift(),
    getShiftHistory()
  ]);

  const activeShift = activeShiftResult.success ? activeShiftResult.data : null;
  const history = historyResult.success && historyResult.data ? historyResult.data : [];

  return <ShiftDashboard activeShift={activeShift} shiftHistory={history} />;
}
