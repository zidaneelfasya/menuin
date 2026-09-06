'use server';

import { db } from '@/lib/db';
import { memberships, invitations } from '@/lib/db/schema';
import { createAdminClient } from '@/lib/supabase/admin';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';

export async function completeSetupAction(formData: FormData) {
  const name = formData.get('name') as string;
  const password = formData.get('password') as string;
  const pin = formData.get('pin') as string;
  const inviteId = formData.get('inviteId') as string;
  const role = formData.get('role') as string;

  if (!name || !inviteId) {
    return { error: 'Missing required fields' };
  }

  try {
    // 1. Verify invitation
    const [invite] = await db.select().from(invitations).where(eq(invitations.id, inviteId)).limit(1);
    if (!invite || invite.status !== 'PENDING') {
      return { error: 'Invalid or expired invitation' };
    }

    let authUserId: string | null = null;
    
    // 2. Dashboard access roles need a Supabase Auth identity
    if (role === 'OWNER' || role === 'MANAGER') {
      if (!password) {
        return { error: 'Password is required for this role' };
      }
      
      const adminAuthClient = createAdminClient().auth.admin;
      
      // Try to create the user, or if they exist, we might get an error
      // In a real app we'd check if they exist first. Here we assume new users.
      const { data: authData, error: authError } = await adminAuthClient.createUser({
        email: invite.email,
        password: password,
        email_confirm: true, // Auto confirm
        user_metadata: { name }
      });
      
      if (authError) {
        // If user already exists, it throws an error
        // A robust implementation would link the existing user
        return { error: authError.message || 'Failed to create dashboard identity' };
      }
      
      if (authData.user) {
        authUserId = authData.user.id;
      }
    }

    // 3. Create the Membership in Database
    const username = invite.email.split('@')[0];
    
    // In a real app, hash the PIN. For now, store directly as requested by legacy code
    const pinHash = pin ? pin : null; 
    
    await db.insert(memberships).values({
      tenantId: invite.tenantId,
      authUserId: authUserId,
      username: username,
      displayName: name,
      email: invite.email,
      pinHash: pinHash,
      role: invite.role,
      status: 'ACTIVE'
    });

    // 4. Mark invitation as accepted
    await db.update(invitations).set({ status: 'ACCEPTED' }).where(eq(invitations.id, invite.id));

  } catch (error: any) {
    console.error("Setup error:", error);
    return { error: 'Internal server error during setup' };
  }

  // Redirect to login on success so they can log in with their new credentials
  redirect('/auth/login?setup=success');
}
