'use client';

import * as React from 'react';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  inviteUserAction, 
  changeRoleAction, 
  removeMemberAction,
  cancelInvitationAction,
  resendInvitationAction
} from '@/lib/actions/team';
import { setMembershipPinAction } from '@/lib/actions/pin';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  MoreVertical, 
  Key, 
  Shield, 
  Trash2, 
  Eye, 
  Plus, 
  Copy, 
  Check,
  Clock,
  Search,
  Users,
  Loader2,
  XCircle,
  AlertTriangle,
  RotateCw
} from "lucide-react";
import { cn } from '@/lib/utils';
import { createAvatar } from '@dicebear/core';
import { openPeeps } from '@dicebear/collection';

interface TeamMember {
  id: string;
  name: string | null;
  email: string;
  role: 'OWNER' | 'MANAGER' | 'CASHIER' | 'STAFF';
  pinHash?: string | null;
  createdAt?: string | Date;
}

interface PendingInvite {
  id: string;
  email: string;
  role: 'OWNER' | 'MANAGER' | 'CASHIER' | 'STAFF';
  createdAt?: string | Date;
  status?: string;
}

interface TeamClientProps {
  initialMembers: TeamMember[];
  initialPending: PendingInvite[];
}

// Doodle Art Avatar using @dicebear/collection (openPeeps by Pablo Stanley)
// Configured with soft monochromatic blue backgrounds (matching the blue-only theme)
function DoodleAvatar({ name, email }: { name?: string | null; email: string }) {
  const seed = (email || name || 'team-member').trim().toLowerCase();
  
  const avatarDataUri = useMemo(() => {
    try {
      const avatar = createAvatar(openPeeps, {
        seed,
        backgroundColor: ['dbeafe', 'eff6ff', 'e0f2fe'],
        scale: 92,
      });
      return avatar.toDataUri();
    } catch {
      return null;
    }
  }, [seed]);

  const initial = (name ? name.charAt(0) : email ? email.charAt(0) : 'U').toUpperCase();

  if (avatarDataUri) {
    return (
      <img
        src={avatarDataUri}
        alt={name || email}
        className="h-9 w-9 rounded-full object-cover border border-blue-200/90 dark:border-blue-900/60 bg-blue-50/50 dark:bg-slate-800 shrink-0 select-none shadow-xs"
        loading="lazy"
      />
    );
  }

  return (
    <div className="h-9 w-9 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/80 text-blue-600 dark:text-blue-300 font-medium text-xs flex items-center justify-center shrink-0 shadow-xs select-none">
      {initial}
    </div>
  );
}

// Role badge pill with cohesive blue theme
function RoleBadge({ role }: { role: string }) {
  if (role === 'OWNER') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-100/80 text-blue-800 border border-blue-300/80 dark:bg-blue-950/70 dark:text-blue-200 dark:border-blue-700">
        <span className="h-2 w-2 rounded-full border-2 border-blue-600 bg-blue-200 dark:bg-blue-400 shrink-0" />
        <span>Owner</span>
      </span>
    );
  }
  if (role === 'MANAGER') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/80">
        <span className="h-2 w-2 rounded-full border-2 border-blue-500 bg-blue-200 dark:bg-blue-400 shrink-0" />
        <span>Manager</span>
      </span>
    );
  }
  if (role === 'CASHIER') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/80">
        <span className="h-2 w-2 rounded-full border-2 border-blue-500 bg-blue-200 dark:bg-blue-400 shrink-0" />
        <span>Kasir POS</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800">
      <span className="h-2 w-2 rounded-full border-2 border-slate-400 bg-slate-200 dark:bg-slate-600 shrink-0" />
      <span>Staff</span>
    </span>
  );
}

// Status badge pill with clean blue & subtle neutral theme
function StatusBadge({ status }: { status: 'ACTIVE' | 'PENDING' }) {
  if (status === 'ACTIVE') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800/80 text-blue-700 dark:text-blue-300 shadow-xs">
        <span className="flex items-center justify-center w-3.5 h-3.5 rounded-full bg-blue-600 text-white shrink-0">
          <Check className="w-2 h-2 stroke-[3]" />
        </span>
        <span>Active</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 shadow-xs">
      <span className="flex items-center justify-center w-3.5 h-3.5 rounded-full bg-slate-400 dark:bg-slate-600 text-white shrink-0">
        <Clock className="w-2 h-2 stroke-[3]" />
      </span>
      <span>Pending</span>
    </span>
  );
}

function formatDateAdded(d?: string | Date | null) {
  if (!d) return '-';
  try {
    const date = new Date(d);
    if (isNaN(date.getTime())) return '-';
    // Format YYYY-MM-DD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return '-';
  }
}

export function TeamClient({ initialMembers, initialPending }: TeamClientProps) {
  const [members, setMembers] = useState<TeamMember[]>(initialMembers || []);
  const [pending, setPending] = useState<PendingInvite[]>(initialPending || []);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'ACTIVE' | 'PENDING' | 'CASHIER'>('ALL');
  
  // Modals state
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [viewPinModalOpen, setViewPinModalOpen] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [cancelInviteModalOpen, setCancelInviteModalOpen] = useState(false);
  
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [selectedInvite, setSelectedInvite] = useState<PendingInvite | null>(null);
  const [copiedPin, setCopiedPin] = useState(false);
  
  // Form submission states
  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false);
  const [isSubmittingPin, setIsSubmittingPin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [isSubmittingRole, setIsSubmittingRole] = useState(false);
  const [newRole, setNewRole] = useState<'MANAGER' | 'CASHIER' | 'STAFF'>('STAFF');
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);
  const [isSubmittingCancelInvite, setIsSubmittingCancelInvite] = useState(false);
  const [isResendingInvite, setIsResendingInvite] = useState<string | null>(null);
  
  // Sync if props update
  React.useEffect(() => {
    setMembers(initialMembers || []);
  }, [initialMembers]);

  React.useEffect(() => {
    setPending(initialPending || []);
  }, [initialPending]);

  // Filtered members & pending
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q || (m.name && m.name.toLowerCase().includes(q)) || m.email.toLowerCase().includes(q) || m.role.toLowerCase().includes(q);
      if (!matchQuery) return false;

      if (activeTab === 'ACTIVE') return true;
      if (activeTab === 'PENDING') return false;
      if (activeTab === 'CASHIER') return m.role === 'CASHIER';
      return true;
    });
  }, [members, searchQuery, activeTab]);

  const filteredPending = useMemo(() => {
    return pending.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q || p.email.toLowerCase().includes(q) || p.role.toLowerCase().includes(q);
      if (!matchQuery) return false;

      if (activeTab === 'ACTIVE') return false;
      if (activeTab === 'PENDING') return true;
      if (activeTab === 'CASHIER') return p.role === 'CASHIER';
      return true;
    });
  }, [pending, searchQuery, activeTab]);

  const totalMembersCount = members.length;
  const cashierCount = members.filter((m) => m.role === 'CASHIER').length;
  const pendingCount = pending.length;

  async function onInviteSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmittingInvite(true);
    
    const formData = new FormData(e.currentTarget);
    const email = (formData.get('email') as string).trim().toLowerCase();
    const role = formData.get('role') as 'MANAGER' | 'CASHIER' | 'STAFF';
    
    try {
      const result = await inviteUserAction(email, role);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Undangan berhasil dikirim ke ${email}`);
        setIsInviteOpen(false);
        setPending((prev) => [
          ...prev,
          {
            id: `temp-${Date.now()}`,
            email,
            role,
            createdAt: new Date(),
            status: 'PENDING'
          },
        ]);
      }
    } catch {
      toast.error('Gagal mengirim undangan');
    } finally {
      setIsSubmittingInvite(false);
    }
  }
  
  async function onPinSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedMember || !newPin || newPin.length !== 6) {
      toast.error('PIN harus berupa 6 digit angka');
      return;
    }
    
    setIsSubmittingPin(true);
    try {
      const result = await setMembershipPinAction(selectedMember.id, newPin);
      if (result.success) {
        toast.success('POS PIN berhasil diperbarui');
        setPinModalOpen(false);
        setMembers((prev) =>
          prev.map((m) =>
            m.id === selectedMember.id ? { ...m, pinHash: newPin } : m
          )
        );
        setNewPin('');
      } else {
        toast.error((result as any).error || 'Gagal menyimpan PIN');
      }
    } catch (error: any) {
      toast.error(error.message || 'Gagal memperbarui PIN');
    } finally {
      setIsSubmittingPin(false);
    }
  }

  async function onRoleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedMember || !newRole) return;

    setIsSubmittingRole(true);
    try {
      const result = await changeRoleAction(selectedMember.id, newRole);
      if ('error' in result && result.error) {
        toast.error(result.error);
      } else {
        toast.success('Role anggota berhasil diperbarui');
        setRoleModalOpen(false);
        setMembers((prev) =>
          prev.map((m) =>
            m.id === selectedMember.id ? { ...m, role: newRole } : m
          )
        );
      }
    } catch {
      toast.error('Gagal memperbarui role');
    } finally {
      setIsSubmittingRole(false);
    }
  }

  async function onDeleteSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedMember) return;

    setIsSubmittingDelete(true);
    try {
      const result = await removeMemberAction(selectedMember.id);
      if ('error' in result && result.error) {
        toast.error(result.error);
      } else {
        toast.success('Anggota tim berhasil dihapus');
        setDeleteModalOpen(false);
        setMembers((prev) => prev.filter((m) => m.id !== selectedMember.id));
      }
    } catch {
      toast.error('Gagal menghapus anggota tim');
    } finally {
      setIsSubmittingDelete(false);
    }
  }

  async function onCancelInviteSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedInvite) return;

    setIsSubmittingCancelInvite(true);
    try {
      const result = await cancelInvitationAction(selectedInvite.id);
      if ('error' in result && result.error) {
        toast.error(result.error);
      } else {
        toast.success('Undangan berhasil dibatalkan');
        setCancelInviteModalOpen(false);
        setPending((prev) => prev.filter((p) => p.id !== selectedInvite.id));
      }
    } catch {
      toast.error('Gagal membatalkan undangan');
    } finally {
      setIsSubmittingCancelInvite(false);
    }
  }

  async function handleResendInvite(invite: PendingInvite) {
    setIsResendingInvite(invite.id);
    try {
      const result = await resendInvitationAction(invite.id);
      if ('error' in result && result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Tautan undangan dikirim ulang ke ${invite.email}`);
        if (result.inviteLink) {
          navigator.clipboard.writeText(result.inviteLink);
          toast.info('Tautan undangan juga telah disalin ke clipboard');
        }
      }
    } catch {
      toast.error('Gagal mengirim ulang undangan');
    } finally {
      setIsResendingInvite(null);
    }
  }
  
  function openPinModal(member: TeamMember) {
    setSelectedMember(member);
    setNewPin('');
    setPinModalOpen(true);
  }

  function openViewPinModal(member: TeamMember) {
    setSelectedMember(member);
    setCopiedPin(false);
    setViewPinModalOpen(true);
  }

  function openRoleModal(member: TeamMember) {
    setSelectedMember(member);
    setNewRole(member.role === 'OWNER' ? 'MANAGER' : member.role);
    setRoleModalOpen(true);
  }

  function openDeleteModal(member: TeamMember) {
    setSelectedMember(member);
    setDeleteModalOpen(true);
  }

  function openCancelInviteModal(invite: PendingInvite) {
    setSelectedInvite(invite);
    setCancelInviteModalOpen(true);
  }

  const handleCopyPin = (pin: string) => {
    navigator.clipboard.writeText(pin);
    setCopiedPin(true);
    toast.success('PIN disalin ke clipboard');
    setTimeout(() => setCopiedPin(false), 2000);
  };

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    toast.success('Email disalin ke clipboard');
  };
  
  const hasRows = filteredMembers.length > 0 || filteredPending.length > 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Team Management
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Kelola anggota tim outlet, peran hak akses, dan PIN kasir untuk operasional POS.
          </p>
        </div>

        {/* Primary Action Button */}
        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
          <DialogTrigger asChild>
            <Button 
              className="inline-flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] active:translate-y-0 text-white h-9 px-4 rounded-xl text-xs font-medium transition-all duration-150 ease-out hover:-translate-y-px shadow-xs shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Invite User</span>
            </Button>
          </DialogTrigger>

          {/* Dynamic Flexible Invite Modal */}
          <DialogContent className="w-[calc(100vw-2rem)] max-w-lg p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl">
            <DialogHeader className="space-y-1 text-left">
              <DialogTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Undang Anggota Tim
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground break-words">
                Kirim email undangan untuk menambahkan staf atau kasir ke outlet ini.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={onInviteSubmit} className="space-y-4 pt-2">
              <div className="space-y-1.5 text-left">
                <Label htmlFor="email" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Alamat Email <span className="text-blue-600">*</span>
                </Label>
                <Input 
                  id="email" 
                  name="email" 
                  type="email" 
                  required 
                  placeholder="nama@email.com"
                  className="h-9 text-xs rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus-visible:ring-1 focus-visible:ring-[#2563EB]"
                />
              </div>
              
              <div className="space-y-2 text-left">
                <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Peran / Hak Akses <span className="text-blue-600">*</span>
                </Label>
                <RadioGroup name="role" defaultValue="CASHIER" className="flex flex-col space-y-2">
                  <label htmlFor="r-cashier" className="flex items-start space-x-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 cursor-pointer transition-colors">
                    <RadioGroupItem value="CASHIER" id="r-cashier" className="mt-0.5 text-[#2563EB]" />
                    <div className="flex flex-col text-xs min-w-0">
                      <span className="font-medium text-slate-900 dark:text-slate-200">Kasir (POS Only)</span>
                      <span className="text-[11px] text-muted-foreground mt-0.5 break-words">
                        Dapat login ke perangkat POS untuk menerima pesanan dan pembayaran.
                      </span>
                    </div>
                  </label>

                  <label htmlFor="r-manager" className="flex items-start space-x-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 cursor-pointer transition-colors">
                    <RadioGroupItem value="MANAGER" id="r-manager" className="mt-0.5 text-[#2563EB]" />
                    <div className="flex flex-col text-xs min-w-0">
                      <span className="font-medium text-slate-900 dark:text-slate-200">Manager</span>
                      <span className="text-[11px] text-muted-foreground mt-0.5 break-words">
                        Akses dashboard, kelola tim, menu katalog, dan lihat laporan omzet.
                      </span>
                    </div>
                  </label>

                  <label htmlFor="r-staff" className="flex items-start space-x-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 cursor-pointer transition-colors">
                    <RadioGroupItem value="STAFF" id="r-staff" className="mt-0.5 text-[#2563EB]" />
                    <div className="flex flex-col text-xs min-w-0">
                      <span className="font-medium text-slate-900 dark:text-slate-200">Staff Dapur / Waiter</span>
                      <span className="text-[11px] text-muted-foreground mt-0.5 break-words">
                        Akses display layar dapur (Kitchen Display) dan status tiket pesanan.
                      </span>
                    </div>
                  </label>
                </RadioGroup>
              </div>
              
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsInviteOpen(false)}
                  disabled={isSubmittingInvite}
                  className="h-9 px-3.5 text-xs rounded-xl border-slate-200 dark:border-slate-700"
                >
                  Batal
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmittingInvite}
                  className="h-9 px-4 text-xs font-medium rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition-colors"
                >
                  {isSubmittingInvite ? (
                    <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Mengirim...</>
                  ) : (
                    'Kirim Undangan'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Clean Metric Stats Strip (Unified Blue Palette, Not Extra Bold) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-card flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Total Anggota</p>
            <p className="text-xl font-semibold font-inter text-slate-900 dark:text-slate-100 mt-0.5">
              {totalMembersCount}
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-card flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Kasir POS Terdaftar</p>
            <p className="text-xl font-semibold font-inter text-slate-900 dark:text-slate-100 mt-0.5">
              {cashierCount}
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Key className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-card flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Undangan Menunggu</p>
            <p className="text-xl font-semibold font-inter text-slate-900 dark:text-slate-100 mt-0.5">
              {pendingCount}
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Search Bar & Unified Blue Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input 
            placeholder="Cari nama, email, atau role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs rounded-xl bg-card border-slate-200 dark:border-slate-800 focus-visible:ring-1 focus-visible:ring-[#2563EB]"
          />
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setActiveTab('ALL')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 cursor-pointer",
              activeTab === 'ALL'
                ? "bg-[#2563EB] text-white shadow-xs"
                : "text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30"
            )}
          >
            Semua ({totalMembersCount + pendingCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ACTIVE')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 cursor-pointer",
              activeTab === 'ACTIVE'
                ? "bg-[#2563EB] text-white shadow-xs"
                : "text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30"
            )}
          >
            Aktif ({totalMembersCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('PENDING')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 cursor-pointer",
              activeTab === 'PENDING'
                ? "bg-[#2563EB] text-white shadow-xs"
                : "text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30"
            )}
          >
            Pending ({pendingCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('CASHIER')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 cursor-pointer",
              activeTab === 'CASHIER'
                ? "bg-[#2563EB] text-white shadow-xs"
                : "text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30"
            )}
          >
            Kasir POS ({cashierCount})
          </button>
        </div>
      </div>

      {/* Main Table with Doodle Avatars, Unified Blue Badges, and Clean Hierarchy */}
      {hasRows ? (
        <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-card overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[760px]">
              {/* Header */}
              <thead>
                <tr className="border-b bg-muted/40 h-10 text-xs font-medium text-muted-foreground select-none">
                  <th className="px-5 w-[260px]">User</th>
                  <th className="px-4">Email Address</th>
                  <th className="px-4">Role</th>
                  <th className="px-4">POS PIN</th>
                  <th className="px-4">Date Added</th>
                  <th className="px-4">Status</th>
                  <th className="px-4 text-right w-[60px]"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {/* Active Members */}
                {filteredMembers.map((member) => (
                  <tr 
                    key={member.id} 
                    className="h-16 hover:bg-muted/30 transition-colors group"
                  >
                    {/* User (Doodle Avatar + Name) */}
                    <td className="px-5">
                      <div className="flex items-center gap-3">
                        <DoodleAvatar name={member.name} email={member.email} />
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                            {member.name || member.email.split('@')[0]}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Email Address with Copy Button */}
                    <td className="px-4">
                      <div className="flex items-center gap-1.5 group/email">
                        <span className="text-sm text-slate-600 dark:text-slate-400 font-inter font-normal truncate max-w-[220px]">
                          {member.email}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyEmail(member.email)}
                          className="opacity-0 group-hover/email:opacity-100 p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-muted-foreground hover:text-foreground transition-opacity cursor-pointer"
                          title="Salin email"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    {/* Role Pill Badge */}
                    <td className="px-4">
                      <RoleBadge role={member.role} />
                    </td>

                    {/* POS PIN (Interactive Button / Badge) */}
                    <td className="px-4">
                      {member.pinHash ? (
                        <button
                          type="button"
                          onClick={() => openPinModal(member)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-normal text-blue-700 dark:text-blue-300 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 hover:bg-blue-100/70 transition-colors cursor-pointer group/pin"
                          title="Klik untuk ubah POS PIN"
                        >
                          <Key className="w-3.5 h-3.5 text-blue-500" />
                          <span>PIN Aktif</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openPinModal(member)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-normal text-muted-foreground border border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-400 hover:text-blue-600 transition-colors cursor-pointer"
                          title="Klik untuk atur POS PIN"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Atur PIN</span>
                        </button>
                      )}
                    </td>

                    {/* Date Added */}
                    <td className="px-4">
                      <span className="text-sm font-inter font-normal text-slate-600 dark:text-slate-400">
                        {formatDateAdded(member.createdAt)}
                      </span>
                    </td>

                    {/* Status Pill Badge */}
                    <td className="px-4">
                      <StatusBadge status="ACTIVE" />
                    </td>

                    {/* Action Menu (⋮) */}
                    <td className="px-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 p-0 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          >
                            <span className="sr-only">Aksi</span>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[180px] p-1 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs">
                          {member.pinHash && (
                            <DropdownMenuItem 
                              onClick={() => openViewPinModal(member)}
                              className="py-1.5 px-2.5 rounded-lg cursor-pointer font-medium"
                            >
                              <Eye className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                              Lihat POS PIN
                            </DropdownMenuItem>
                          )}
                          
                          <DropdownMenuItem 
                            onClick={() => openPinModal(member)}
                            className="py-1.5 px-2.5 rounded-lg cursor-pointer font-medium"
                          >
                            <Key className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                            {member.pinHash ? 'Ubah POS PIN' : 'Atur POS PIN'}
                          </DropdownMenuItem>
                          
                          {member.role !== 'OWNER' && (
                            <>
                              <DropdownMenuItem 
                                onClick={() => openRoleModal(member)}
                                className="py-1.5 px-2.5 rounded-lg cursor-pointer font-medium"
                              >
                                <Shield className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                                Ubah Role
                              </DropdownMenuItem>
                              
                              <DropdownMenuSeparator className="my-1 border-slate-100 dark:border-slate-800" />
                              
                              <DropdownMenuItem 
                                onClick={() => openDeleteModal(member)} 
                                className="py-1.5 px-2.5 rounded-lg cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/40 font-medium"
                              >
                                <Trash2 className="mr-2 h-3.5 w-3.5 text-red-600" />
                                Hapus Anggota
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}

                {/* Pending Invites */}
                {filteredPending.map((invite) => (
                  <tr 
                    key={invite.id} 
                    className="h-16 hover:bg-muted/30 transition-colors bg-blue-50/20 dark:bg-blue-950/10 group"
                  >
                    {/* User (Doodle Avatar + Email Prefix) */}
                    <td className="px-5">
                      <div className="flex items-center gap-3">
                        <DoodleAvatar email={invite.email} />
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                            {invite.email.split('@')[0]}
                          </span>
                          <span className="text-[11px] text-muted-foreground font-normal">
                            Menunggu konfirmasi
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-4">
                      <div className="flex items-center gap-1.5 group/email">
                        <span className="text-sm text-slate-600 dark:text-slate-400 font-inter font-normal truncate max-w-[220px]">
                          {invite.email}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyEmail(invite.email)}
                          className="opacity-0 group-hover/email:opacity-100 p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-muted-foreground hover:text-foreground transition-opacity cursor-pointer"
                          title="Salin email"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-4">
                      <RoleBadge role={invite.role} />
                    </td>

                    {/* POS PIN */}
                    <td className="px-4">
                      <span className="text-xs text-muted-foreground italic">-</span>
                    </td>

                    {/* Date Added */}
                    <td className="px-4">
                      <span className="text-sm font-inter font-normal text-slate-600 dark:text-slate-400">
                        {formatDateAdded(invite.createdAt)}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4">
                      <StatusBadge status="PENDING" />
                    </td>

                    {/* Action Menu (⋮) */}
                    <td className="px-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 p-0 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          >
                            <span className="sr-only">Aksi</span>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[180px] p-1 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs">
                          <DropdownMenuItem 
                            onClick={() => handleResendInvite(invite)}
                            disabled={isResendingInvite === invite.id}
                            className="py-1.5 px-2.5 rounded-lg cursor-pointer font-medium"
                          >
                            {isResendingInvite === invite.id ? (
                              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <RotateCw className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                            )}
                            Kirim Ulang Email
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem 
                            onClick={() => handleCopyEmail(invite.email)}
                            className="py-1.5 px-2.5 rounded-lg cursor-pointer font-medium"
                          >
                            <Copy className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                            Salin Email
                          </DropdownMenuItem>

                          <DropdownMenuSeparator className="my-1 border-slate-100 dark:border-slate-800" />
                          
                          <DropdownMenuItem 
                            onClick={() => openCancelInviteModal(invite)}
                            className="py-1.5 px-2.5 rounded-lg cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/40 font-medium"
                          >
                            <XCircle className="mr-2 h-3.5 w-3.5 text-red-600" />
                            Batalkan Undangan
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-card p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center mx-auto text-blue-600 dark:text-blue-400">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {searchQuery ? 'Tidak ada anggota ditemukan' : 'Belum ada anggota tim'}
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {searchQuery 
              ? `Tidak ada hasil yang cocok dengan kata kunci "${searchQuery}". Coba kata kunci lain atau reset filter.`
              : 'Undang anggota tim pertama Anda untuk mulai mengatur hak akses dan kasir outlet.'}
          </p>
          <div className="pt-2">
            {searchQuery ? (
              <Button
                variant="outline"
                onClick={() => { setSearchQuery(''); setActiveTab('ALL'); }}
                className="h-9 px-3.5 rounded-xl text-xs border-slate-200 dark:border-slate-800"
              >
                Reset Pencarian
              </Button>
            ) : (
              <Button
                onClick={() => setIsInviteOpen(true)}
                className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white h-9 px-4 rounded-xl text-xs font-medium shadow-xs"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                <span>Undang Anggota</span>
              </Button>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODALS SECTION (Auto-adjusting width, non-clipping text) */}
      {/* ============================================================ */}

      {/* View PIN Modal */}
      <Dialog open={viewPinModalOpen} onOpenChange={setViewPinModalOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
          <DialogHeader className="space-y-1.5 text-left">
            <DialogTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">
              POS PIN Kasir
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground break-words">
              PIN aktif untuk <span className="font-medium text-slate-900 dark:text-slate-100 break-all">{selectedMember?.name || selectedMember?.email}</span> saat login ke terminal kasir POS.
            </DialogDescription>
          </DialogHeader>

          <div className="py-5 flex flex-col items-center gap-3 w-full max-w-full overflow-hidden">
            {selectedMember?.pinHash ? (
              // Check if PIN is a raw short number (e.g. 4-8 digits)
              /^\d{1,8}$/.test(selectedMember.pinHash) ? (
                <div className="w-full max-w-full overflow-hidden flex flex-col items-center gap-2">
                  <div className="w-full bg-slate-50 dark:bg-slate-800/60 px-6 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                    <span className="text-3xl font-mono tracking-[0.25em] font-semibold text-slate-900 dark:text-slate-100 select-all">
                      {selectedMember.pinHash}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyPin(selectedMember.pinHash || '')}
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-blue-600 mt-1 transition-colors cursor-pointer"
                  >
                    {copiedPin ? <Check className="w-3.5 h-3.5 text-blue-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPin ? 'PIN disalin ke clipboard' : 'Salin PIN'}</span>
                  </button>
                </div>
              ) : (
                // Long string / bcrypt hash (length > 8 or contains non-digits)
                <div className="w-full max-w-full overflow-hidden flex flex-col items-center gap-2.5">
                  <div className="w-full bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col items-center text-center gap-2">
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                      <Check className="w-3 h-3" /> PIN Tersimpan & Terenkripsi
                    </span>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      PIN kasir tersimpan dalam format hash kriptografi aman. Anda dapat menyalin nilai hash atau langsung mengatur ulang PIN 6 digit baru.
                    </p>
                    <div className="w-full max-w-full bg-white dark:bg-slate-900/80 rounded-xl p-2.5 border border-slate-200/80 dark:border-slate-700/80 overflow-hidden">
                      <p className="text-xs font-mono text-slate-600 dark:text-slate-300 break-all select-all leading-relaxed max-h-24 overflow-y-auto">
                        {selectedMember.pinHash}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyPin(selectedMember.pinHash || '')}
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-blue-600 transition-colors cursor-pointer"
                  >
                    {copiedPin ? <Check className="w-3.5 h-3.5 text-blue-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPin ? 'Hash PIN disalin' : 'Salin Nilai PIN'}</span>
                  </button>
                </div>
              )
            ) : (
              <div className="w-full bg-slate-50 dark:bg-slate-800/60 px-6 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                <span className="text-2xl font-mono tracking-[0.25em] text-muted-foreground">
                  ------
                </span>
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setViewPinModalOpen(false)} 
              className="w-full sm:flex-1 h-9 text-xs rounded-xl border-slate-200 dark:border-slate-700 cursor-pointer"
            >
              Tutup
            </Button>
            {selectedMember && (
              <Button
                type="button"
                onClick={() => {
                  setViewPinModalOpen(false);
                  openPinModal(selectedMember);
                }}
                className="w-full sm:flex-1 h-9 text-xs rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white cursor-pointer"
              >
                <Key className="w-3.5 h-3.5 mr-1.5" />
                Ubah / Atur PIN
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Set / Edit PIN Modal */}
      <Dialog open={pinModalOpen} onOpenChange={setPinModalOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl">
          <DialogHeader className="space-y-1.5 text-left">
            <DialogTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {selectedMember?.pinHash ? 'Ubah POS PIN Kasir' : 'Atur POS PIN Kasir'}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground break-words">
              Masukkan 6 digit angka untuk <span className="font-medium text-slate-900 dark:text-slate-100 break-all">{selectedMember?.name || selectedMember?.email}</span> agar dapat login ke tablet POS.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onPinSubmit} className="space-y-4 pt-3">
            <div className="space-y-1.5 text-left">
              <Label htmlFor="pin" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                6 Digit PIN Angka <span className="text-blue-600">*</span>
              </Label>
              <Input 
                id="pin" 
                name="pin" 
                type="password" 
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                required 
                placeholder="••••••"
                className="text-center text-2xl tracking-[0.35em] font-inter h-12 rounded-xl border-slate-200 dark:border-slate-700 focus-visible:ring-1 focus-visible:ring-[#2563EB]"
                autoFocus
              />
              <p className="text-[11px] text-muted-foreground text-center">
                Hanya angka (0-9) dengan panjang tepat 6 karakter.
              </p>
            </div>
            
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setPinModalOpen(false)}
                disabled={isSubmittingPin}
                className="h-9 px-3.5 text-xs rounded-xl border-slate-200 dark:border-slate-700"
              >
                Batal
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmittingPin || newPin.length !== 6}
                className="h-9 px-4 text-xs font-medium rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition-colors"
              >
                {isSubmittingPin ? (
                  <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Menyimpan...</>
                ) : (
                  'Simpan PIN'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Change Role Modal */}
      <Dialog open={roleModalOpen} onOpenChange={setRoleModalOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-lg p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl">
          <DialogHeader className="space-y-1.5 text-left">
            <DialogTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Ubah Role Anggota
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground break-words">
              Perbarui izin hak akses untuk <span className="font-medium text-slate-900 dark:text-slate-100 break-all">{selectedMember?.name || selectedMember?.email}</span>.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onRoleSubmit} className="space-y-4 pt-2">
            <RadioGroup value={newRole} onValueChange={(v: any) => setNewRole(v)} className="flex flex-col space-y-2">
              <label htmlFor="cr-cashier" className="flex items-start space-x-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 cursor-pointer transition-colors">
                <RadioGroupItem value="CASHIER" id="cr-cashier" className="mt-0.5 text-[#2563EB]" />
                <div className="flex flex-col text-xs min-w-0">
                  <span className="font-medium text-slate-900 dark:text-slate-200">Kasir (POS Only)</span>
                  <span className="text-[11px] text-muted-foreground break-words">Operasional kasir POS dan cetak struk</span>
                </div>
              </label>

              <label htmlFor="cr-manager" className="flex items-start space-x-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 cursor-pointer transition-colors">
                <RadioGroupItem value="MANAGER" id="cr-manager" className="mt-0.5 text-[#2563EB]" />
                <div className="flex flex-col text-xs min-w-0">
                  <span className="font-medium text-slate-900 dark:text-slate-200">Manager</span>
                  <span className="text-[11px] text-muted-foreground break-words">Akses dashboard, menu katalog, dan laporan omzet</span>
                </div>
              </label>

              <label htmlFor="cr-staff" className="flex items-start space-x-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 cursor-pointer transition-colors">
                <RadioGroupItem value="STAFF" id="cr-staff" className="mt-0.5 text-[#2563EB]" />
                <div className="flex flex-col text-xs min-w-0">
                  <span className="font-medium text-slate-900 dark:text-slate-200">Staff Dapur / Waiter</span>
                  <span className="text-[11px] text-muted-foreground break-words">Akses layar display dapur</span>
                </div>
              </label>
            </RadioGroup>
            
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setRoleModalOpen(false)}
                disabled={isSubmittingRole}
                className="h-9 px-3.5 text-xs rounded-xl border-slate-200 dark:border-slate-700"
              >
                Batal
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmittingRole}
                className="h-9 px-4 text-xs font-medium rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition-colors"
              >
                {isSubmittingRole ? (
                  <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Menyimpan...</>
                ) : (
                  'Simpan Perubahan'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Remove Member Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-lg p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl">
          <DialogHeader className="space-y-1.5 text-left">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <DialogTitle className="text-base font-semibold">
                Hapus Anggota Tim
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground break-words pt-1">
              Apakah Anda yakin ingin menghapus <span className="font-medium text-slate-900 dark:text-slate-100 break-all">{selectedMember?.name || selectedMember?.email}</span>? Akses mereka ke outlet ini akan dicabut seketika.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onDeleteSubmit} className="pt-4 flex items-center justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setDeleteModalOpen(false)} 
              disabled={isSubmittingDelete}
              className="h-9 px-3.5 text-xs rounded-xl border-slate-200 dark:border-slate-700"
            >
              Batal
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmittingDelete}
              className="h-9 px-4 text-xs font-medium rounded-xl bg-red-600 hover:bg-red-700 text-white transition-colors"
            >
              {isSubmittingDelete ? (
                <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Menghapus...</>
              ) : (
                'Hapus Anggota'
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Cancel Invitation Modal */}
      <Dialog open={cancelInviteModalOpen} onOpenChange={setCancelInviteModalOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-lg p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl">
          <DialogHeader className="space-y-1.5 text-left">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <DialogTitle className="text-base font-semibold">
                Batalkan Undangan
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground break-words pt-1">
              Apakah Anda yakin ingin membatalkan undangan untuk <span className="font-medium text-slate-900 dark:text-slate-100 break-all">{selectedInvite?.email}</span>? Tautan yang telah dikirimkan tidak akan berlaku lagi.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onCancelInviteSubmit} className="pt-4 flex items-center justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setCancelInviteModalOpen(false)} 
              disabled={isSubmittingCancelInvite}
              className="h-9 px-3.5 text-xs rounded-xl border-slate-200 dark:border-slate-700"
            >
              Batal
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmittingCancelInvite}
              className="h-9 px-4 text-xs font-medium rounded-xl bg-red-600 hover:bg-red-700 text-white transition-colors"
            >
              {isSubmittingCancelInvite ? (
                <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Membatalkan...</>
              ) : (
                'Batalkan Undangan'
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
