'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createTenantAction } from '@/lib/actions/tenant';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft, AlertCircle } from 'lucide-react';

import Link from 'next/link';

export function CreateTenantForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(event.currentTarget);
    
    try {
      const result = await createTenantAction(formData);
      
      if (result?.error) {
        setError(result.error);
        setLoading(false);
      } else {
        router.push('/select-tenant');
      }
    } catch (err: any) {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  }

  return (
    <Card className="border-0 shadow-xl">
      <form onSubmit={onSubmit}>
        <CardContent className="pt-6 space-y-4">
          {error && (
            <div className="bg-destructive/15 text-destructive flex items-center p-3 rounded-md text-sm">
              <AlertCircle className="h-4 w-4 mr-2" />
              <p>{error}</p>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="restaurantName">Restaurant Name</Label>
            <Input
              id="restaurantName"
              name="restaurantName"
              placeholder="e.g., Kopi Kenangan"
              required
              disabled={loading}
              className="h-12"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 pb-6">
          <Button type="submit" className="w-full h-12 text-lg" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Restaurant'
            )}
          </Button>
          <Button variant="ghost" className="w-full" asChild disabled={loading}>
            <Link href="/select-tenant">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Cancel and go back
            </Link>
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
