'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { inviteUserAction, changeRoleAction, removeMemberAction } from '@/lib/actions/team';
import { setMembershipPinAction } from '@/lib/actions/pin';
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
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Key, Shield, Trash2, Eye, User } from "lucide-react";

export function TeamClient({ initialMembers, initialPending }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State for Modals
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [viewPinModalOpen, setViewPinModalOpen] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  
  const [selectedMember, setSelectedMember] = useState<any>(null);
  
  // Form states
  const [isSubmittingPin, setIsSubmittingPin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [isSubmittingRole, setIsSubmittingRole] = useState(false);
  const [newRole, setNewRole] = useState<'MANAGER' | 'CASHIER' | 'STAFF'>('STAFF');
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);
  
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
  
  async function onPinSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedMember || !newPin) return;
    
    setIsSubmittingPin(true);
    try {
      const result = await setMembershipPinAction(selectedMember.id, newPin);
      if (result.success) {
        toast.success('PIN updated successfully');
        setPinModalOpen(false);
        setNewPin('');
        
        // Optimistically update the UI
        selectedMember.pinHash = newPin;
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update PIN');
    }
    setIsSubmittingPin(false);
  }

  async function onRoleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedMember || !newRole) return;

    setIsSubmittingRole(true);
    const result = await changeRoleAction(selectedMember.id, newRole);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Role updated successfully');
      setRoleModalOpen(false);
    }
    setIsSubmittingRole(false);
  }

  async function onDeleteSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedMember) return;

    setIsSubmittingDelete(true);
    const result = await removeMemberAction(selectedMember.id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Member removed successfully');
      setDeleteModalOpen(false);
    }
    setIsSubmittingDelete(false);
  }
  
  function openPinModal(member: any) {
    setSelectedMember(member);
    setNewPin('');
    setPinModalOpen(true);
  }

  function openViewPinModal(member: any) {
    setSelectedMember(member);
    setViewPinModalOpen(true);
  }

  function openRoleModal(member: any) {
    setSelectedMember(member);
    setNewRole(member.role === 'OWNER' ? 'MANAGER' : member.role);
    setRoleModalOpen(true);
  }

  function openDeleteModal(member: any) {
    setSelectedMember(member);
    setDeleteModalOpen(true);
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Team Members</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage your team members and their roles.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white">Invite User</Button>
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
                <RadioGroup name="role" defaultValue="STAFF" className="flex flex-col space-y-3 mt-2">
                  <div className="flex items-center space-x-3 border p-3 rounded-md">
                    <RadioGroupItem value="MANAGER" id="r-manager" />
                    <div className="flex flex-col">
                      <Label htmlFor="r-manager" className="font-semibold">Manager</Label>
                      <span className="text-xs text-muted-foreground">Can manage staff, menus, and view reports.</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 border p-3 rounded-md">
                    <RadioGroupItem value="CASHIER" id="r-cashier" />
                    <div className="flex flex-col">
                      <Label htmlFor="r-cashier" className="font-semibold">Cashier (POS Only)</Label>
                      <span className="text-xs text-muted-foreground">Only has access to the POS device.</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 border p-3 rounded-md">
                    <RadioGroupItem value="STAFF" id="r-staff" />
                    <div className="flex flex-col">
                      <Label htmlFor="r-staff" className="font-semibold">Staff Dapur / Waiter</Label>
                      <span className="text-xs text-muted-foreground">Limited access to kitchen view or waitstaff tools.</span>
                    </div>
                  </div>
                </RadioGroup>
              </div>
              
              <Button type="submit" className="w-full bg-[#2563EB] hover:bg-[#1D4ED8]" disabled={isSubmitting}>
                {isSubmitting ? 'Sending...' : 'Send Invite'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50/50">
            <TableRow>
              <TableHead className="w-[300px]">Member</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>POS PIN</TableHead>
              <TableHead className="text-right w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialMembers.map((member: any) => (
              <TableRow key={member.id} className="hover:bg-gray-50/50">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center border text-gray-500 font-medium">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900">{member.name}</span>
                      <span className="text-xs text-gray-500">{member.email}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                    {member.role}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1.5 text-sm text-gray-600">
                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                    Active
                  </span>
                </TableCell>
                <TableCell>
                  {member.pinHash ? (
                    <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <Key className="w-4 h-4 text-gray-400" />
                      Set
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400 italic">Not set</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[160px]">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      
                      {member.pinHash && (
                        <DropdownMenuItem onClick={() => openViewPinModal(member)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View PIN
                        </DropdownMenuItem>
                      )}
                      
                      <DropdownMenuItem onClick={() => openPinModal(member)}>
                        <Key className="mr-2 h-4 w-4" />
                        Edit PIN
                      </DropdownMenuItem>
                      
                      {member.role !== 'OWNER' && (
                        <>
                          <DropdownMenuItem onClick={() => openRoleModal(member)}>
                            <Shield className="mr-2 h-4 w-4" />
                            Change Role
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem onClick={() => openDeleteModal(member)} className="text-red-600 focus:text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove Member
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            
            {initialPending.map((invite: any) => (
              <TableRow key={invite.id} className="hover:bg-gray-50/50">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-orange-50 flex items-center justify-center border border-orange-100 text-orange-500 font-medium">
                      {invite.email.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900 italic">Invited User</span>
                      <span className="text-xs text-gray-500">{invite.email}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                    {invite.role}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1.5 text-sm text-amber-600">
                    <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
                    Pending
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-400 italic">-</span>
                </TableCell>
                <TableCell className="text-right">
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* View PIN Modal */}
      <Dialog open={viewPinModalOpen} onOpenChange={setViewPinModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>View POS PIN</DialogTitle>
            <DialogDescription>
              The current POS PIN for {selectedMember?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 flex justify-center">
            <div className="text-4xl font-mono tracking-widest font-bold text-gray-900 bg-gray-100 px-6 py-4 rounded-xl border">
              {selectedMember?.pinHash || 'Not Set'}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setViewPinModalOpen(false)} className="w-full">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit PIN Modal */}
      <Dialog open={pinModalOpen} onOpenChange={setPinModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Set / Edit PIN</DialogTitle>
            <DialogDescription>
              Set a 6 digit PIN for {selectedMember?.name} to access the POS.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onPinSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="pin">POS PIN</Label>
              <Input 
                id="pin" 
                name="pin" 
                type="text" 
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                required 
                placeholder="Enter 6 digit PIN"
                className="text-center text-2xl tracking-widest font-mono"
              />
            </div>
            
            <Button type="submit" className="w-full bg-[#2563EB] hover:bg-[#1D4ED8]" disabled={isSubmittingPin}>
              {isSubmittingPin ? 'Saving...' : 'Save PIN'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Change Role Modal */}
      <Dialog open={roleModalOpen} onOpenChange={setRoleModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Change Role</DialogTitle>
            <DialogDescription>
              Update the role for {selectedMember?.name}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onRoleSubmit} className="space-y-4 pt-4">
            <RadioGroup value={newRole} onValueChange={(v: any) => setNewRole(v)} className="flex flex-col space-y-3">
              <div className="flex items-center space-x-3 border p-3 rounded-md">
                <RadioGroupItem value="MANAGER" id="cr-manager" />
                <Label htmlFor="cr-manager" className="font-semibold cursor-pointer">Manager</Label>
              </div>
              <div className="flex items-center space-x-3 border p-3 rounded-md">
                <RadioGroupItem value="CASHIER" id="cr-cashier" />
                <Label htmlFor="cr-cashier" className="font-semibold cursor-pointer">Cashier</Label>
              </div>
              <div className="flex items-center space-x-3 border p-3 rounded-md">
                <RadioGroupItem value="STAFF" id="cr-staff" />
                <Label htmlFor="cr-staff" className="font-semibold cursor-pointer">Staff / Waiter</Label>
              </div>
            </RadioGroup>
            
            <Button type="submit" className="w-full bg-[#2563EB] hover:bg-[#1D4ED8]" disabled={isSubmittingRole}>
              {isSubmittingRole ? 'Saving...' : 'Save Role'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Remove Member Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-red-600">Remove Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove <strong>{selectedMember?.name}</strong> from this workspace? They will lose all access immediately.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onDeleteSubmit} className="pt-4 flex flex-col gap-2">
            <Button type="submit" variant="destructive" className="w-full" disabled={isSubmittingDelete}>
              {isSubmittingDelete ? 'Removing...' : 'Yes, Remove Member'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setDeleteModalOpen(false)} disabled={isSubmittingDelete}>
              Cancel
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
