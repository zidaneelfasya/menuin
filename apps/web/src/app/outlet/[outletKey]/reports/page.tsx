import { UnderDevelopment } from '@/components/ui/under-development';
import { Metadata } from 'next';
import { requireFeature } from '@/lib/actions/auth-context';

export const metadata: Metadata = { title: 'Laporan - Bolu Anisa POS' };

export default async function Page() {
  await requireFeature('REPORTS');
  return <UnderDevelopment title="Laporan" />;
}
