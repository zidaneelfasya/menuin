'use server';

import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export type UserRole = 'CASHIER' | 'ADMIN' | 'SUPERADMIN';

export type UserProfile = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
};

export async function getCurrentUser(): Promise<UserProfile | null> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user || !user.email) {
    return null;
  }

  let userProfile = await db.select().from(users).where(eq(users.email, user.email)).limit(1);

  if (userProfile.length === 0) {
    // Auto-create missing profile for valid Supabase user
    try {
      const newUser = await db.insert(users).values({
        name: user.email.split('@')[0] || 'Unknown User',
        email: user.email,
        role: 'CASHIER', // Default role
      }).returning();
      
      if (newUser.length > 0) {
        userProfile = newUser;
      } else {
        return null;
      }
    } catch (e) {
      console.error('Failed to auto-create user profile:', e);
      return null;
    }
  }

  return {
    id: userProfile[0].id,
    email: userProfile[0].email,
    name: userProfile[0].name,
    role: userProfile[0].role as UserRole,
  };
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
