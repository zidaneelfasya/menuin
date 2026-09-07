'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { completeSetupAction } from '@/lib/actions/setup';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function SetupClient({ email, role, inviteId, accountExists = false, isLoggedIn = false }: { email: string, role: string, inviteId: string, accountExists?: boolean, isLoggedIn?: boolean }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // If account doesn't exist, they MUST provide a password to create their account.
  // If account exists but user is not logged in, they MUST provide a password to authenticate.
  const requirePassword = (!accountExists) || (accountExists && !isLoggedIn);
  
  const requirePin = role === 'STAFF' || role === 'CASHIER' || role === 'MANAGER';
  const requireName = !accountExists;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    formData.append('inviteId', inviteId);
    formData.append('role', role);
    
    // basic validation
    const pin = formData.get('pin') as string;
    const confirmPin = formData.get('confirmPin') as string;
    
    if (requirePin && pin !== confirmPin) {
      toast.error('PINs do not match');
      setIsSubmitting(false);
      return;
    }

    if (requirePin && pin.length !== 6) {
      toast.error('PIN must be exactly 6 digits');
      setIsSubmitting(false);
      return;
    }
    
    const result = await completeSetupAction(formData);
    
    if (result.error) {
      toast.error(result.error);
      setIsSubmitting(false);
    } else {
      toast.success('Setup completed successfully');
      router.push('/tenants');
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Email</Label>
        <Input disabled value={email} />
      </div>

      {requireName && (
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input id="name" name="name" required placeholder="John Doe" />
        </div>
      )}

      {requirePassword && (
        <div className="space-y-2">
          <Label htmlFor="password">
            {accountExists ? "Password (Please login to confirm identity)" : "Password (For Web Dashboard Login)"}
          </Label>
          <Input id="password" name="password" type="password" required minLength={8} />
        </div>
      )}

      {requirePin && (
        <>
          <div className="space-y-2">
            <Label htmlFor="pin">6-Digit PIN (For POS App Login)</Label>
            <Input id="pin" name="pin" type="password" required inputMode="numeric" pattern="\d{6}" maxLength={6} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPin">Confirm 6-Digit PIN</Label>
            <Input id="confirmPin" name="confirmPin" type="password" required inputMode="numeric" pattern="\d{6}" maxLength={6} />
          </div>
        </>
      )}

      <Button type="submit" className="w-full mt-6" disabled={isSubmitting}>
        {isSubmitting ? 'Completing Setup...' : 'Complete Setup'}
      </Button>
    </form>
  );
}
