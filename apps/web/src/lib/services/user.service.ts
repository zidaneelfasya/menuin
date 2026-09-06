import { db } from '@/lib/db';
import { memberships, invitations, rateLimits } from '@/lib/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export class UserService {
  static async verifyPin(membershipId: string, pin: string): Promise<boolean> {
    const [membership] = await db.select().from(memberships).where(eq(memberships.id, membershipId));
    if (!membership || !membership.pinHash) return false;
    
    // Check if the pinHash is actually hashed (some legacy seed data might be plain text)
    if (!membership.pinHash.startsWith('$2a$') && !membership.pinHash.startsWith('$2b$')) {
      return pin === membership.pinHash;
    }
    
    return bcrypt.compare(pin, membership.pinHash);
  }

  static async updatePin(membershipId: string, pin: string) {
    const salt = await bcrypt.genSalt(10);
    const pinHash = await bcrypt.hash(pin, salt);
    
    await db.update(memberships)
      .set({ pinHash, updatedAt: new Date() })
      .where(eq(memberships.id, membershipId));
  }
  
  static async checkRateLimit(ipAddress: string, action: string = 'LOGIN_PIN'): Promise<boolean> {
    // Simple implementation: check if lockUntil is in the future
    const [record] = await db.select().from(rateLimits)
      .where(
        and(
          eq(rateLimits.ipAddress, ipAddress),
          eq(rateLimits.action, action)
        )
      );

    if (!record) return true;
    
    if (record.lockUntil && record.lockUntil > new Date()) {
      return false; // Rate limited
    }
    
    return true;
  }
  
  static async incrementRateLimit(ipAddress: string, action: string = 'LOGIN_PIN') {
    const [record] = await db.select().from(rateLimits)
      .where(
        and(
          eq(rateLimits.ipAddress, ipAddress),
          eq(rateLimits.action, action)
        )
      );
      
    if (!record) {
      await db.insert(rateLimits).values({
        ipAddress,
        action,
        attempts: 1
      });
      return;
    }
    
    // If lock is expired, reset
    if (record.lockUntil && record.lockUntil < new Date()) {
      await db.update(rateLimits)
        .set({ attempts: 1, lockUntil: null, updatedAt: new Date() })
        .where(eq(rateLimits.id, record.id));
      return;
    }
    
    const newAttempts = record.attempts + 1;
    let lockUntil: Date | null = null;
    
    // Lock out for 15 minutes after 5 failed attempts
    if (newAttempts >= 5) {
      lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
    }
    
    await db.update(rateLimits)
      .set({ attempts: newAttempts, lockUntil, updatedAt: new Date() })
      .where(eq(rateLimits.id, record.id));
  }
  
  static async resetRateLimit(ipAddress: string, action: string = 'LOGIN_PIN') {
    await db.delete(rateLimits)
      .where(
        and(
          eq(rateLimits.ipAddress, ipAddress),
          eq(rateLimits.action, action)
        )
      );
  }
}
