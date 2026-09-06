import { getTeamMembersAction } from '@/lib/actions/team';
import { getCurrentUser } from '@/lib/actions/auth';
import { TeamClient } from './team-client';
import { redirect } from 'next/navigation';

export default async function TeamPage() {
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
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Team Management</h2>
      </div>
      <TeamClient 
        initialMembers={result.members || []} 
        initialPending={result.pendingInvites || []} 
      />
    </div>
  );
}
