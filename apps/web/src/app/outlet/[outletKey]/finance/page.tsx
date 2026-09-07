import { redirect } from 'next/navigation';

export default async function Page({ params }: { params: Promise<{ outletKey: string }> }) {
  const { outletKey } = await params;
  redirect(`/outlet/${outletKey}/reports`);
}

