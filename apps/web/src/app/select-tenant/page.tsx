import { getAvailableTenants } from '@/lib/actions/auth';
import { setTenantContextAction } from '@/lib/actions/tenant';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Store, LogOut, Plus } from 'lucide-react';
import Link from 'next/link';
import { signOutAction } from '@/lib/actions/auth';

export default async function SelectTenantPage() {
  const tenants = await getAvailableTenants();

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40 items-center justify-center p-4">
      <div className="w-full max-w-3xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Select a Workspace</h1>
          <p className="text-muted-foreground text-lg">Choose a restaurant to manage or create a new one.</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tenants.map((tenant) => (
            <form action={setTenantContextAction.bind(null, tenant.outletKey)} key={tenant.tenantId}>
              <button className="w-full text-left" type="submit">
                <Card className="h-full hover:border-primary/50 hover:shadow-md transition-all cursor-pointer bg-card flex flex-col group">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Store className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                      {tenant.name}
                    </CardTitle>
                    <CardDescription className="uppercase tracking-wider font-semibold text-xs text-muted-foreground pt-1">
                      Role: {tenant.role}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="mt-auto pt-4">
                    <p className="text-sm text-muted-foreground flex items-center justify-between">
                      <span>Enter workspace</span>
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0">&rarr;</span>
                    </p>
                  </CardContent>
                </Card>
              </button>
            </form>
          ))}

          <Link href="/create-tenant" className="block h-full">
            <Card className="h-full border-dashed border-2 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer flex flex-col items-center justify-center py-10 group">
              <div className="rounded-full bg-primary/10 p-4 mb-4 group-hover:bg-primary/20 transition-colors">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">New Restaurant</h3>
              <p className="text-sm text-muted-foreground">Create a new workspace</p>
            </Card>
          </Link>
        </div>

        <div className="flex justify-center pt-8">
          <form action={signOutAction}>
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
