'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { completeSetupAction } from '@/lib/actions/setup';
import { toast } from 'sonner';

export function SetupClient({ email, role, inviteId }: { email: string, role: string, inviteId: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const requirePassword = role === 'OWNER' || role === 'MANAGER';
  const requirePin = role === 'STAFF' || role === 'CASHIER' || role === 'MANAGER';

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

    if (requirePin && pin.length !== 8) {
      toast.error('PIN must be exactly 8 digits');
      setIsSubmitting(false);
      return;
    }
    
    const result = await completeSetupAction(formData);
    
    if (result.error) {
      toast.error(result.error);
      setIsSubmitting(false);
    } else {
      toast.success('Setup completed successfully');
      // The action should redirect
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Email</Label>
        <Input disabled value={email} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input id="name" name="name" required placeholder="John Doe" />
      </div>

      {requirePassword && (
        <div className="space-y-2">
          <Label htmlFor="password">Password (For Web Dashboard Login)</Label>
          <Input id="password" name="password" type="password" required minLength={8} />
        </div>
      )}

      {requirePin && (
        <>
          <div className="space-y-2">
            <Label htmlFor="pin">8-Digit PIN (For POS App Login)</Label>
            <Input id="pin" name="pin" type="password" required inputMode="numeric" pattern="[0-9]*" maxLength={8} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPin">Confirm 8-Digit PIN</Label>
            <Input id="confirmPin" name="confirmPin" type="password" required inputMode="numeric" pattern="[0-9]*" maxLength={8} />
          </div>
        </>
      )}

      <Button type="submit" className="w-full mt-6" disabled={isSubmitting}>
        {isSubmitting ? 'Completing Setup...' : 'Complete Setup'}
      </Button>
    </form>
  );
}
