import { CreateTenantForm } from './create-tenant-form';
import { getAuthenticatedAccount } from '@/lib/actions/auth-context';

export default async function CreateTenantPage() {
  await getAuthenticatedAccount(); // Ensure the user is logged in
  
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40 items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Create a New Workspace</h1>
          <p className="text-muted-foreground">Give your new restaurant a name to get started.</p>
        </div>
        <CreateTenantForm />
      </div>
    </div>
  );
}
