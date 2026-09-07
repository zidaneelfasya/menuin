import { NextResponse } from 'next/server';
import { UserService } from '@/lib/services/user.service';
import { db } from '@/lib/db';
import { memberships, tenants, accounts } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import * as jwt from 'jsonwebtoken';

// Note: In a real app, we should use a proper secret from env
const JWT_SECRET = process.env.JWT_SECRET || 'menuin-pos-secret-key-change-in-prod';

export async function POST(request: Request) {
  try {
    const { username, pin, tenantId } = await request.json();

    if (!username || !pin || !tenantId) {
      return NextResponse.json({ error: 'Tenant ID, Username, and PIN are required' }, { status: 400 });
    }

    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
    
    // Check rate limit
    const isAllowed = await UserService.checkRateLimit(ipAddress);
    if (!isAllowed) {
      return NextResponse.json({ 
        error: 'Too many failed login attempts. Please try again later.' 
      }, { status: 429 });
    }

    // Get membership by username and tenantId
    const [membershipRecord] = await db
      .select({
        member: memberships,
        tenant: tenants,
        account: accounts
      })
      .from(memberships)
      .innerJoin(tenants, eq(memberships.tenantId, tenants.id))
      .innerJoin(accounts, eq(memberships.accountId, accounts.id))
      .where(
        and(
          eq(accounts.email, username),
          eq(memberships.tenantId, tenantId)
        )
      )
      .limit(1);

    if (!membershipRecord || !membershipRecord.member.pinHash) {
      await UserService.incrementRateLimit(ipAddress);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Verify PIN
    const isPinValid = await UserService.verifyPin(membershipRecord.member.id, pin);

    if (!isPinValid) {
      await UserService.incrementRateLimit(ipAddress);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Reset rate limit on success
    await UserService.resetRateLimit(ipAddress);

    // Generate JWT token for POS API
    const token = jwt.sign(
      { 
        sub: membershipRecord.member.id, // Token subject is now Membership ID
        username: membershipRecord.account.email.split('@')[0],
        role: membershipRecord.member.role,
        tenantId: membershipRecord.member.tenantId 
      }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );

    // Update last login (Wait, we removed lastLoginAt from memberships. Let's just update updatedAt)
    await db.update(memberships)
      .set({ updatedAt: new Date() })
      .where(eq(memberships.id, membershipRecord.member.id));

    return NextResponse.json({
      token,
      user: {
        id: membershipRecord.member.id,
        name: membershipRecord.member.displayName,
        username: membershipRecord.account.email.split('@')[0],
        role: membershipRecord.member.role,
        tenantId: membershipRecord.member.tenantId,
        tenantName: membershipRecord.tenant.name,
      }
    });
  } catch (error) {
    console.error('POS Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
