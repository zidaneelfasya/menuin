import { db } from '@/lib/db';
import { invitations } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { SetupClient } from './setup-client';
import { redirect } from 'next/navigation';
import crypto from 'crypto';

interface SetupPageProps {
  searchParams: { token?: string };
}

export default async function SetupPage({ searchParams }: SetupPageProps) {
  const token = searchParams.token;
  
  if (!token) {
    // If no token, fallback to old behavior: go to login
    redirect('/auth/login');
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  // Find the pending invitation by tokenHash
  const pendingInvites = await db
    .select()
    .from(invitations)
    .where(
      and(
        eq(invitations.tokenHash, tokenHash),
        eq(invitations.status, 'PENDING')
      )
    )
    .limit(1);

  if (pendingInvites.length === 0) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-muted/50 p-4">
        <div className="w-full max-w-md rounded-lg border bg-card p-8 shadow-sm text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-destructive">Invalid Invitation</h1>
          <p className="text-sm text-muted-foreground mt-2">
            This invitation link is invalid or has already been accepted/expired.
          </p>
        </div>
      </div>
    );
  }

  const invite = pendingInvites[0];

  return (
    <div className="flex h-screen w-full items-center justify-center bg-muted/50 p-4">
      <div className="w-full max-w-md rounded-lg border bg-card p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Complete Account Setup</h1>
          <p className="text-sm text-muted-foreground mt-2">
            You have been invited as {invite.role}. Please set up your credentials.
          </p>
        </div>
        <SetupClient email={invite.email} role={invite.role} inviteId={invite.id} />
      </div>
    </div>
  );
}
