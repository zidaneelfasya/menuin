import { db } from '@/lib/db';
import { auditLogs } from '@/lib/db/schema';
import { requireTenantAccess } from '@/lib/actions/auth-context';

type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'EXPORT' | 'PAYMENT';

export class AuditService {
  /**
   * Logs an action to the audit_logs table automatically capturing the current context
   */
  static async log(action: AuditAction, entityType?: string, entityId?: string, details?: any) {
    try {
      const context = await requireTenantAccess();
      
      await db.insert(auditLogs).values({
        tenantId: context.tenant.id,
        accountId: context.account.id,
        actorMembershipId: context.membership.id,
        action,
        entityType,
        entityId,
        details: details ? JSON.stringify(details) : null,
      });
      
      return { success: true };
    } catch (error) {
      // We don't want audit log failures to crash the main transaction
      console.error('Failed to write audit log:', error);
      return { success: false };
    }
  }
}
