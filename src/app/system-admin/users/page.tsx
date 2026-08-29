import { getSystemUsers, getSystemTenants } from '@/lib/actions/system-admin';
import { getCurrentUser } from '@/lib/actions/auth';
import { UsersClient } from './users-client';
import { connection } from 'next/server';

export default async function UsersPage() {
  await connection();
  const [usersList, tenants, currentUser] = await Promise.all([
    getSystemUsers(),
    getSystemTenants(),
    getCurrentUser(),
  ]);

  const tenantOptions = tenants.map((t) => ({
    id: t.id,
    name: t.name,
  }));


      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                <tr>
                  <th className="px-6 py-4 font-semibold">User</th>
                  <th className="px-6 py-4 font-semibold">Role</th>
                  <th className="px-6 py-4 font-semibold">Tenant ID</th>
                  <th className="px-6 py-4 font-semibold">Registered Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {usersList.map((user) => (
                  <tr key={user.id} className="bg-card hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground">{user.name}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${
                        user.role === 'SYSTEM_ADMIN' 
                          ? 'bg-purple-100 text-purple-700' 
                          : user.role === 'SUPERADMIN'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-slate-100 text-slate-700'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground font-mono">
                      {user.tenantId ? user.tenantId.split('-')[0] + '...' : '-'}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {format(new Date(user.createdAt), 'dd MMM yyyy, HH:mm', { locale: id })}
                    </td>
                  </tr>
                ))}
                {usersList.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>

  );
}
