import { getTeamMembersAction } from '@/lib/actions/team';
import { getCurrentUser } from '@/lib/actions/auth';
import { TeamClient } from './team-client';
import { redirect } from 'next/navigation';
import { requireFeature } from '@/lib/actions/auth-context';
import { Suspense } from 'react';
import TeamLoading from './loading';

async function TeamDataWrapper() {
  await requireFeature('TEAM');
  const user = await getCurrentUser();
  if (!user || user.role !== 'OWNER') {
    // Only OWNER can manage team
    redirect('/select-tenant');
  }

  const result = await getTeamMembersAction();
  
  if (result.error) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <p className="text-destructive font-medium">{result.error}</p>
      </div>
    );
  }

  return (
    <TeamClient 
      initialMembers={result.members || []} 
      initialPending={result.pendingInvites || []} 
    />
  );
}

export default function TeamPage() {
  return (
    <Suspense fallback={<TeamLoading />}>
      <TeamDataWrapper />
    </Suspense>
  );
}
