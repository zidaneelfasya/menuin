import { redirect } from 'next/navigation';

interface Props {
  params: Promise<{ outletKey: string }>;
}

export default async function OutletRootPage({ params }: Props) {
  const { outletKey } = await params;
  redirect(`/outlet/${outletKey}/dashboard`);
}
