'use server';

import { db } from '@/lib/db';
import { invitations, memberships, accounts } from '@/lib/db/schema';
import { AuthService } from '@/lib/services/auth.service';
import { EmailService } from '@/lib/services/email.service';
import { eq, and } from 'drizzle-orm';
import { requireTenantAccess, requireFeature } from '@/lib/actions/auth-context';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';

export async function inviteUserAction(email: string, role: 'MANAGER' | 'CASHIER' | 'STAFF') {
  const context = await requireFeature('TEAM');
  if (context.membership.role !== 'OWNER' && context.membership.role !== 'MANAGER') {
    return { error: 'Unauthorized. Only OWNER or MANAGER can invite users.' };
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
      tenantId: context.tenant.id,
      email,
      role,
      tokenHash,
      status: 'PENDING',
      invitedBy: context.membership.id,
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
  const context = await requireTenantAccess();
  
  if (context.membership.role !== 'OWNER' && context.membership.role !== 'MANAGER') {
    return { error: 'Unauthorized' };
  }
  
  try {
    const members = await db
      .select({
        id: memberships.id,
        name: memberships.displayName,
        email: accounts.email,
        role: memberships.role,
        pinHash: memberships.pinHash,
        createdAt: memberships.createdAt,
      })
      .from(memberships)
      .innerJoin(accounts, eq(memberships.accountId, accounts.id))
      .where(eq(memberships.tenantId, context.tenant.id));
      
    const pendingInvites = await db
      .select()
      .from(invitations)
      .where(
        and(
          eq(invitations.tenantId, context.tenant.id),
          eq(invitations.status, 'PENDING')
        )
      );
      
    return { members, pendingInvites };
  } catch (error) {
    console.error("Failed to fetch team members:", error);
    return { error: 'Failed to fetch team members' };
  }
}

export async function acceptInvitationAction(token: string) {
  const { getAuthenticatedAccount } = await import('./auth-context');
  const account = await getAuthenticatedAccount(); // Throws AuthError if not logged in

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const [invitation] = await db
    .select()
    .from(invitations)
    .where(eq(invitations.tokenHash, tokenHash))
    .limit(1);

  if (!invitation) return { error: 'Invalid invitation token.' };
  if (invitation.status !== 'PENDING') return { error: `Invitation is already ${invitation.status.toLowerCase()}.` };
  if (new Date() > new Date(invitation.expiresAt)) return { error: 'Invitation has expired.' };

  try {
    return await db.transaction(async (tx) => {
      // 1. Mark invitation as accepted
      await tx.update(invitations)
        .set({ status: 'ACCEPTED', acceptedAt: new Date() })
        .where(eq(invitations.id, invitation.id));

      // 2. Create membership
      await tx.insert(memberships).values({
        tenantId: invitation.tenantId,
        accountId: account.id,
        displayName: account.name,
        role: invitation.role,
        status: 'ACTIVE',
      });

      return { success: true, tenantId: invitation.tenantId };
    });
  } catch (error: any) {
    console.error('Failed to accept invitation:', error);
    return { error: error.message || 'Database error during acceptance.' };
  }
}

export async function changeRoleAction(membershipId: string, newRole: 'MANAGER' | 'CASHIER' | 'STAFF') {
  const context = await requireTenantAccess();
  
  if (context.membership.role !== 'OWNER') {
    return { error: 'Unauthorized. Only OWNER can change roles.' };
  }
  
  // Prevent changing own role or another OWNER's role easily
  const [targetMembership] = await db.select().from(memberships).where(eq(memberships.id, membershipId)).limit(1);
  if (!targetMembership) return { error: 'Membership not found' };
  
  if (targetMembership.role === 'OWNER') {
    return { error: 'Cannot change an OWNER role.' };
  }
  
  try {
    await db.update(memberships).set({ role: newRole }).where(eq(memberships.id, membershipId));
    revalidatePath('/tenants/team');
    return { success: true };
  } catch (error: any) {
    return { error: error.message || 'Failed to change role' };
  }
}

export async function removeMemberAction(membershipId: string) {
  const context = await requireTenantAccess();
  
  if (context.membership.role !== 'OWNER') {
    return { error: 'Unauthorized. Only OWNER can remove members.' };
  }
  
  const [targetMembership] = await db.select().from(memberships).where(eq(memberships.id, membershipId)).limit(1);
  if (!targetMembership) return { error: 'Membership not found' };
  
  if (targetMembership.role === 'OWNER') {
    return { error: 'Cannot remove an OWNER.' };
  }
  
  try {
    // Delete membership. (In a real app you might soft delete or reassign data)
    await db.delete(memberships).where(eq(memberships.id, membershipId));
    revalidatePath('/tenants/team');
    return { success: true };
  } catch (error: any) {
    return { error: error.message || 'Failed to remove member' };
  }
}
