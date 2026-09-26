import { redirect } from 'next/navigation';

export default async function SettingsDevicesRedirect({ params }: { params: Promise<{ outletKey: string }> }) {
  const { outletKey } = await params;
  redirect(`/outlet/${outletKey}/devices`);
}
