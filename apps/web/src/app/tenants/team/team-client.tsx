'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { inviteUserAction } from '@/lib/actions/team';
import { toast } from 'sonner';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export function TeamClient({ initialMembers, initialPending }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const role = formData.get('role') as 'MANAGER' | 'CASHIER' | 'STAFF';
    
    const result = await inviteUserAction(email, role);
    
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Invitation sent successfully');
      setIsOpen(false);
    }
    
    setIsSubmitting(false);
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>Invite User</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite new member</DialogTitle>
              <DialogDescription>
                Send an invitation email to add someone to your tenant.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={onSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input id="email" name="email" type="email" required placeholder="name@example.com" />
              </div>
              
              <div className="space-y-2">
                <Label>Role</Label>
                <RadioGroup name="role" defaultValue="STAFF" className="flex flex-col space-y-1">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="MANAGER" id="r-manager" />
                    <Label htmlFor="r-manager">Manager</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="CASHIER" id="r-cashier" />
                    <Label htmlFor="r-cashier">Cashier (POS Only)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="STAFF" id="r-staff" />
                    <Label htmlFor="r-staff">Staff Dapur / Waiter</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Sending...' : 'Send Invite'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialMembers.map((member: any) => (
              <TableRow key={member.id}>
                <TableCell className="font-medium">{member.name}</TableCell>
                <TableCell>{member.email}</TableCell>
                <TableCell>{member.role}</TableCell>
                <TableCell>Active</TableCell>
              </TableRow>
            ))}
            {initialPending.map((invite: any) => (
              <TableRow key={invite.id}>
                <TableCell className="text-muted-foreground italic">Pending</TableCell>
                <TableCell>{invite.email}</TableCell>
                <TableCell>{invite.role}</TableCell>
                <TableCell className="text-amber-500">Pending</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
