import { getSystemTenants } from '@/lib/actions/system-admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Server } from 'lucide-react';

export default async function TenantsPage() {
  const tenants = await getSystemTenants();

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center">
          <Server className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tenants</h1>
          <p className="text-muted-foreground">Manage all registered restaurants and businesses.</p>
        </div>
      </div>

      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                <tr>
                  <th className="px-6 py-4 font-semibold">Tenant Name</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Registered Date</th>
                  <th className="px-6 py-4 font-semibold text-right">ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {tenants.map((tenant) => (
                  <tr key={tenant.id} className="bg-card hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">
                      {tenant.name}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${tenant.isPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                        {tenant.isPaid ? 'Paid' : 'Free Trial'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {format(new Date(tenant.createdAt), 'dd MMM yyyy, HH:mm', { locale: id })}
                    </td>
                    <td className="px-6 py-4 text-right text-xs text-muted-foreground font-mono">
                      {tenant.id.split('-')[0]}...
                    </td>
                  </tr>
                ))}
                {tenants.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                      No tenants found.
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
