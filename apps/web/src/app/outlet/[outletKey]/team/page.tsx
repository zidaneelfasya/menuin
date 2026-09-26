import { getTeamMembersAction } from '@/lib/actions/team';
import { getCurrentUser } from '@/lib/actions/auth';
import { TeamClient } from './team-client';
import { redirect } from 'next/navigation';
import { requireFeature } from '@/lib/actions/auth-context';

export default async function TeamPage() {
  await requireFeature('TEAM');
  const user = await getCurrentUser();
  if (!user || user.role !== 'OWNER') {
    // Only OWNER can manage team
    redirect('/tenants');
  }

  const result = await getTeamMembersAction();
  
  if (result.error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-destructive">{result.error}</p>
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
