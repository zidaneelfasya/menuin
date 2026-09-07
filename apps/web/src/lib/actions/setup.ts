'use server';

import { db } from '@/lib/db';
import { memberships, invitations, accounts } from '@/lib/db/schema';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { eq } from 'drizzle-orm';

export async function completeSetupAction(formData: FormData) {
  const name = formData.get('name') as string;
  const password = formData.get('password') as string;
  const pin = formData.get('pin') as string;
  const inviteId = formData.get('inviteId') as string;
  const role = formData.get('role') as string;

  if (!inviteId) {
    return { error: 'Missing required fields' };
  }

  try {
    // 1. Verify invitation
    const [invite] = await db.select().from(invitations).where(eq(invitations.id, inviteId)).limit(1);
    if (!invite || invite.status !== 'PENDING') {
      return { error: 'Invalid or expired invitation' };
    }

    // 2. Check if the user already has a Menuin Account
    const existingAccounts = await db
      .select()
      .from(accounts)
      .where(eq(accounts.email, invite.email))
      .limit(1);

    const existingAccount = existingAccounts.length > 0 ? existingAccounts[0] : null;

    let accountIdToUse;
    let displayNameToUse = name;

    const supabase = await createClient();

    if (existingAccount) {
      accountIdToUse = existingAccount.id;
      displayNameToUse = existingAccount.name; // Use existing name if name is not provided
      
      // Check if user is already logged in with this email
      const { data: { user } } = await supabase.auth.getUser();
      const isLoggedIn = user && user.email === invite.email;
      
      if (!isLoggedIn) {
        if (!password) {
          return { error: 'Please provide your password to confirm your identity.' };
        }
        
        // Log the user in to prove identity
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: invite.email,
          password: password,
        });
        
        if (signInError) {
          return { error: 'Invalid password. Please try again.' };
        }
      }

    } else {
      // 3. For new users, create a Supabase Auth identity for their global Account
      if (!name) {
        return { error: 'Name is required for new accounts' };
      }

      const adminAuthClient = createAdminClient().auth.admin;
      
      // For STAFF/CASHIER, they might not have provided a password in setup,
      // so we can generate a random one if it's missing.
      const userPassword = password || crypto.randomUUID();
      
      const { data: authData, error: authError } = await adminAuthClient.createUser({
        email: invite.email,
        password: userPassword,
        email_confirm: true, // Auto confirm
        user_metadata: { name }
      });
      
      if (authError) {
        return { error: authError.message || 'Failed to create global identity' };
      }
      
      const authUserId = authData.user.id;

      // Log them in immediately so their session starts
      await supabase.auth.signInWithPassword({
        email: invite.email,
        password: userPassword,
      });

      // 4. Create Account in Database
      accountIdToUse = crypto.randomUUID();
      
      await db.insert(accounts).values({
        id: accountIdToUse,
        authUserId: authUserId,
        email: invite.email,
        name: name,
      });
    }

    const pinHash = pin ? pin : null; 
    
    // 5. Create Membership
    await db.insert(memberships).values({
      tenantId: invite.tenantId,
      accountId: accountIdToUse,
      displayName: displayNameToUse,
      pinHash: pinHash,
      role: invite.role,
      status: 'ACTIVE'
    });

    // 6. Mark invitation as accepted
    await db.update(invitations).set({ status: 'ACCEPTED' }).where(eq(invitations.id, invite.id));

    return { success: true };
  } catch (error: any) {
    console.error("Setup error:", error);
    return { error: 'Internal server error during setup' };
  }
}
