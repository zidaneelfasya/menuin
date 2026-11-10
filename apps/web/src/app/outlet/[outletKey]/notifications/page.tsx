import { Metadata } from 'next';
import { Suspense } from 'react';
import { getNotifications } from '@/lib/actions/notifications';
import { getCurrentUser } from '@/lib/actions/auth';
import { NotificationsClient } from './notifications-client';
import NotificationsLoading from './loading';

export const metadata: Metadata = {
  title: 'Pusat Notifikasi - Menuin',
  description: 'Kelola verifikasi, tagihan, promosi, dan aktivitas tim toko Anda.',
};

type Props = {
  params: Promise<{ outletKey: string }>;
};

async function NotificationsContent({ outletKey }: { outletKey: string }) {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  const initialResult = await getNotifications({ limit: 100 });
  const notifications = initialResult.success ? initialResult.data : [];
  const initialUnreadCount = initialResult.unreadCount ?? 0;

  return (
    <NotificationsClient 
      initialNotifications={notifications}
      initialUnreadCount={initialUnreadCount}
      tenantId={user.tenantId || ''}
      outletKey={outletKey || user.outletKey || ''}
    />
  );
}

export default async function NotificationsPage({ params }: Props) {
  const { outletKey } = await params;

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 md:px-8">
      <Suspense fallback={<NotificationsLoading />}>
        <NotificationsContent outletKey={outletKey} />
      </Suspense>
    </div>
  );
}
