import { Metadata } from 'next';
import { Suspense } from 'react';
import { ShiftDashboard } from '@/features/shifts/components/shift-dashboard';
import { getActiveShift, getShiftHistory } from '@/lib/actions/shifts';
import { getCurrentUser } from '@/lib/actions/auth';
import ShiftsLoading from './loading';

export const metadata: Metadata = {
  title: 'Shift Kasir - Menuin',
};

async function ShiftsDataWrapper() {
  const [activeShiftResult, historyResult, user] = await Promise.all([
    getActiveShift(),
    getShiftHistory(),
    getCurrentUser()
  ]);

  const activeShift = activeShiftResult.success ? activeShiftResult.data : null;
  const history = historyResult.success && historyResult.data ? historyResult.data : [];

  return (
    <ShiftDashboard 
      activeShift={activeShift} 
      shiftHistory={history} 
      userRole={user?.role || 'CASHIER'} 
      outletKey={user?.outletKey || ''} 
    />
  );
}

export default function ShiftsPage() {
  return (
    <Suspense fallback={<ShiftsLoading />}>
      <ShiftsDataWrapper />
    </Suspense>
  );
}
