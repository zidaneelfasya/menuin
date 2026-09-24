import { createAdminClient } from '@/lib/supabase/admin';

export class AuthService {
  /**
   * Generates a local invite link.
   * Returns the action_link URL to be sent via email.
   */
  static async generateInviteLink(email: string, token: string) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return `${appUrl}/auth/setup?token=${token}`;
  }
}
