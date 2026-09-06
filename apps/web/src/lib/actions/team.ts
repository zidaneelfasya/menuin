'use server';

import { db } from '@/lib/db';
import { invitations, memberships } from '@/lib/db/schema';
import { AuthService } from '@/lib/services/auth.service';
import { EmailService } from '@/lib/services/email.service';
import { eq, and } from 'drizzle-orm';
import { getCurrentMembership } from '@/lib/actions/auth';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';

export async function inviteUserAction(email: string, role: 'MANAGER' | 'CASHIER' | 'STAFF') {
  const membership = await getCurrentMembership();
  if (!membership || !membership.tenantId || membership.role !== 'OWNER') {
    return { error: 'Unauthorized. Only OWNER can invite users.' };
  }

  try {
    // Generate a secure random token for the invitation
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    // Create an invitation record in DB
    // Set expires at 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await db.insert(invitations).values({
      tenantId: membership.tenantId,
      email,
      role,
      tokenHash,
      status: 'PENDING',
      invitedBy: membership.id,
      expiresAt
    });

    // Generate invite link (pointing to our custom invite acceptance page)
    const inviteLink = await AuthService.generateInviteLink(email, rawToken);

    // Send the customized email via Resend
    // TODO: Pass the actual tenant name if we fetch it, for now using placeholder
    await EmailService.sendInvitationEmail(email, inviteLink, role, 'Menuin App');

    revalidatePath('/team');
    return { success: true };
  } catch (error: any) {
    console.error("Failed to invite user:", error);
    return { error: error.message || 'Failed to send invitation' };
  }
}

export async function getTeamMembersAction() {
  const membership = await getCurrentMembership();
  if (!membership || !membership.tenantId) {
    return { error: 'Unauthorized' };
  }
  
  try {
    const members = await db
      .select({
        id: memberships.id,
        name: memberships.displayName,
        email: memberships.email,
        role: memberships.role,
        createdAt: memberships.createdAt,
      })
      .from(memberships)
      .where(eq(memberships.tenantId, membership.tenantId));
      
    const pendingInvites = await db
      .select()
      .from(invitations)
      .where(
        and(
          eq(invitations.tenantId, membership.tenantId),
          eq(invitations.status, 'PENDING')
        )
      );
      
    return { members, pendingInvites };
  } catch (error) {
    console.error("Failed to fetch team members:", error);
    return { error: 'Failed to fetch team members' };
  }
}
