'use client';

import * as React from 'react';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableHeader,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@/components/ui/table';
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
  RotateCw,
  PackageSearch,
  ChevronDown,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { createAvatar } from '@dicebear/core';
import { openPeeps } from '@dicebear/collection';

export type TeamRole = 
  | 'OWNER' 
  | 'MANAGER' 
  | 'CASHIER' 
  | 'STAFF' 
  | 'SYSTEM_ADMIN' 
  | 'VERIFICATION_ADMIN' 
  | 'SUPERADMIN';

interface TeamMember {
  id: string;
  name: string | null;
  email: string;
  role: TeamRole;
  pinHash?: string | null;
  createdAt?: string | Date;
}

interface PendingInvite {
  id: string;
  email: string;
  role: TeamRole;
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
        className="h-9 w-9 rounded-full object-cover border border-blue-200/60 bg-blue-50/50 shrink-0 select-none shadow-xs"
        loading="lazy"
      />
    );
  }

  return (
    <div className="h-9 w-9 rounded-full bg-blue-50 border border-blue-200 text-[#0e59f9] font-medium text-xs flex items-center justify-center shrink-0 shadow-xs select-none">
      {initial}
    </div>
  );
}

// Role badge pill with clean borderless pastel theme (Zero Dot Policy)
function RoleBadge({ role }: { role: string }) {
  if (role === 'SYSTEM_ADMIN' || role === 'SUPERADMIN' || role === 'VERIFICATION_ADMIN') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-purple-50 text-purple-700 border-none">
        System Admin
      </span>
    );
  }
  if (role === 'OWNER') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-[#0e59f9] border-none font-semibold">
        Owner
      </span>
    );
  }
  if (role === 'MANAGER') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-indigo-50 text-indigo-700 border-none">
        Manager
      </span>
    );
  }
  if (role === 'CASHIER') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-teal-50 text-teal-700 border-none">
        Kasir POS
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border-none">
      Staff
    </span>
  );
}

// Status badge pill with clean borderless pastel theme (Zero Dot Policy)
function StatusBadge({ status }: { status: 'ACTIVE' | 'PENDING' }) {
  if (status === 'ACTIVE') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-600 border-none">
        Aktif
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border-none">
      Menunggu
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

  type UnifiedTeamRow = 
    | { kind: 'MEMBER'; id: string; data: TeamMember }
    | { kind: 'INVITE'; id: string; data: PendingInvite };

  const allFilteredRows = useMemo<UnifiedTeamRow[]>(() => {
    const mRows: UnifiedTeamRow[] = filteredMembers.map((m) => ({ kind: 'MEMBER', id: m.id, data: m }));
    const pRows: UnifiedTeamRow[] = filteredPending.map((p) => ({ kind: 'INVITE', id: p.id, data: p }));
    return [...mRows, ...pRows];
  }, [filteredMembers, filteredPending]);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const totalPages = Math.max(1, Math.ceil(allFilteredRows.length / itemsPerPage));

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab, itemsPerPage]);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return allFilteredRows.slice(start, start + itemsPerPage);
  }, [allFilteredRows, currentPage, itemsPerPage]);

  const getPaginationNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

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
    setNewRole(
      ['OWNER', 'SYSTEM_ADMIN', 'SUPERADMIN', 'VERIFICATION_ADMIN'].includes(member.role)
        ? 'MANAGER'
        : (member.role as 'MANAGER' | 'CASHIER' | 'STAFF')
    );
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
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            Tim & Karyawan
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola anggota tim outlet, peran hak akses, dan PIN kasir untuk operasional POS.
          </p>
        </div>
      </div>

      {/* Clean Metric Stats Strip (Hero Blue Card + White Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Hero Blue */}
        <div className="p-5 rounded-2xl border-none shadow-md bg-[#0e59f9] text-white hover:shadow-lg transition-all flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-blue-100">Total Anggota</p>
            <p className="text-2xl font-bold font-inter text-white mt-1">
              {totalMembersCount}
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: White */}
        <div className="p-5 rounded-2xl border-none shadow-sm-md hover:shadow-md bg-white transition-all flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Kasir POS Terdaftar</p>
            <p className="text-2xl font-bold font-inter text-slate-900 mt-1">
              {cashierCount}
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-50 text-[#0e59f9] flex items-center justify-center">
            <Key className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: White */}
        <div className="p-5 rounded-2xl border-none shadow-sm-md hover:shadow-md bg-white transition-all flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Undangan Menunggu</p>
            <p className="text-2xl font-bold font-inter text-slate-900 mt-1">
              {pendingCount}
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search Bar & Underline Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-2">
        {/* Tab Filters (Underline style with live counters) */}
        <div className="flex items-center gap-6 overflow-x-auto pb-1 sm:pb-0">
          {[
            { key: 'ALL', label: 'Semua Anggota', count: totalMembersCount + pendingCount },
            { key: 'ACTIVE', label: 'Aktif', count: totalMembersCount },
            { key: 'PENDING', label: 'Pending', count: pendingCount },
            { key: 'CASHIER', label: 'Kasir POS', count: cashierCount },
          ].map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key as 'ALL' | 'ACTIVE' | 'PENDING' | 'CASHIER')}
                className={cn(
                  "relative pb-2.5 text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap",
                  isActive
                    ? "text-[#0e59f9] font-semibold"
                    : "text-slate-500 hover:text-slate-900"
                )}
              >
                <span>{tab.label}</span>
                <span className={cn(
                  "text-[11px] px-2.5 py-0.5 rounded-full font-medium transition-colors border-none",
                  isActive
                    ? "bg-blue-50 text-[#0e59f9]"
                    : "text-slate-400 bg-slate-100"
                )}>
                  {tab.count}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="activeTeamTabUnderline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0e59f9] rounded-full"
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Right Actions: Search & Invite Dialog */}
        <div className="flex items-center gap-2.5">
          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input 
              placeholder="Cari anggota tim..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 h-9 text-xs rounded-full bg-white border-none shadow-sm-md text-slate-900 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-[#0e59f9]"
            />
          </div>

          <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
            <DialogTrigger asChild>
              <Button 
                className="inline-flex items-center gap-1.5 bg-[#0e59f9] hover:bg-[#0b4de0] text-white h-9 px-4 rounded-full text-xs font-semibold shadow-md transition-all shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Undang Anggota</span>
              </Button>
            </DialogTrigger>

            {/* Dynamic Flexible Invite Modal */}
            <DialogContent className="w-[calc(100vw-2rem)] max-w-lg p-6 sm:p-7 bg-white border-none rounded-3xl shadow-2xl">
              <DialogHeader className="space-y-1 text-left pb-2 border-b border-slate-100">
                <DialogTitle className="text-base font-semibold text-slate-900">
                  Undang Anggota Tim
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 break-words">
                  Kirim email undangan untuk menambahkan staf atau kasir ke outlet ini.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={onInviteSubmit} className="space-y-4 pt-2">
                <div className="space-y-1.5 text-left">
                  <Label htmlFor="email" className="text-xs font-medium text-slate-700">
                    Alamat Email <span className="text-[#0e59f9]">*</span>
                  </Label>
                  <Input 
                    id="email" 
                    name="email" 
                    type="email" 
                    required 
                    placeholder="nama@email.com"
                    className="h-10 text-xs rounded-xl border border-slate-200/80 bg-slate-50/50 focus:bg-white focus:border-[#0e59f9]"
                  />
                </div>
                
                <div className="space-y-2 text-left">
                  <Label className="text-xs font-medium text-slate-700">
                    Peran / Hak Akses <span className="text-[#0e59f9]">*</span>
                  </Label>
                  <RadioGroup name="role" defaultValue="CASHIER" className="flex flex-col space-y-2">
                    <label htmlFor="r-cashier" className="flex items-start space-x-3 p-3.5 rounded-2xl border border-slate-200/80 hover:bg-slate-50 cursor-pointer transition-colors">
                      <RadioGroupItem value="CASHIER" id="r-cashier" className="mt-0.5 text-[#0e59f9]" />
                      <div className="flex flex-col text-xs min-w-0">
                        <span className="font-semibold text-slate-900">Kasir (POS Only)</span>
                        <span className="text-[11px] text-slate-500 mt-0.5 break-words">
                          Dapat login ke perangkat POS untuk menerima pesanan dan pembayaran.
                        </span>
                      </div>
                    </label>

                    <label htmlFor="r-manager" className="flex items-start space-x-3 p-3.5 rounded-2xl border border-slate-200/80 hover:bg-slate-50 cursor-pointer transition-colors">
                      <RadioGroupItem value="MANAGER" id="r-manager" className="mt-0.5 text-[#0e59f9]" />
                      <div className="flex flex-col text-xs min-w-0">
                        <span className="font-semibold text-slate-900">Manager</span>
                        <span className="text-[11px] text-slate-500 mt-0.5 break-words">
                          Akses dashboard, kelola tim, menu katalog, dan lihat laporan omzet.
                        </span>
                      </div>
                    </label>

                    <label htmlFor="r-staff" className="flex items-start space-x-3 p-3.5 rounded-2xl border border-slate-200/80 hover:bg-slate-50 cursor-pointer transition-colors">
                      <RadioGroupItem value="STAFF" id="r-staff" className="mt-0.5 text-[#0e59f9]" />
                      <div className="flex flex-col text-xs min-w-0">
                        <span className="font-semibold text-slate-900">Staff Dapur / Waiter</span>
                        <span className="text-[11px] text-slate-500 mt-0.5 break-words">
                          Akses display layar dapur (Kitchen Display) dan status tiket pesanan.
                        </span>
                      </div>
                    </label>
                  </RadioGroup>
                </div>
                
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsInviteOpen(false)}
                    disabled={isSubmittingInvite}
                    className="h-9 px-4 text-xs font-semibold rounded-full border-none bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                  >
                    Batal
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmittingInvite}
                    className="h-9 px-5 text-xs font-semibold rounded-full bg-[#0e59f9] hover:bg-[#0b4de0] text-white shadow-md transition-colors cursor-pointer"
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
      </div>

      {/* Main Table */}
      {hasRows ? (
        <div className="space-y-4">
          <div className="rounded-2xl border-none bg-white overflow-hidden shadow-sm-md">
          <div className="relative w-full overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/70 text-slate-500 font-semibold border-b border-slate-100">
                  <th className="py-3.5 px-4 text-xs font-semibold whitespace-nowrap text-slate-500 tracking-tight w-[240px]">
                    User
                  </th>
                  <th className="py-3.5 px-4 text-xs font-semibold whitespace-nowrap text-slate-500 tracking-tight">
                    Email Address
                  </th>
                  <th className="py-3.5 px-4 text-xs font-semibold whitespace-nowrap text-slate-500 tracking-tight">
                    Role
                  </th>
                  <th className="py-3.5 px-4 text-xs font-semibold whitespace-nowrap text-slate-500 tracking-tight">
                    POS PIN
                  </th>
                  <th className="py-3.5 px-4 text-xs font-semibold whitespace-nowrap text-slate-500 tracking-tight">
                    Date Added
                  </th>
                  <th className="py-3.5 px-4 text-xs font-semibold whitespace-nowrap text-slate-500 tracking-tight">
                    Status
                  </th>
                  <th className="py-3.5 px-4 text-xs font-semibold whitespace-nowrap text-right text-slate-500 tracking-tight w-[60px]">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedRows.map((row) => {
                  if (row.kind === 'MEMBER') {
                    const member = row.data;
                    return (
                      <TableRow 
                        key={`member-${member.id}`} 
                        className="h-16 hover:bg-slate-100/60 transition-colors group border-b border-slate-100"
                      >
                        {/* User (Doodle Avatar + Name) */}
                        <TableCell className="px-5">
                          <div className="flex items-center gap-3">
                            <DoodleAvatar name={member.name} email={member.email} />
                            <div className="flex flex-col min-w-0">
                              <span className="text-sm font-semibold text-slate-900 truncate">
                                {member.name || member.email.split('@')[0]}
                              </span>
                            </div>
                          </div>
                        </TableCell>

                        {/* Email Address with Copy Button */}
                        <TableCell className="px-4">
                          <div className="flex items-center gap-1.5 group/email">
                            <span className="text-sm text-slate-600 font-inter font-normal truncate max-w-[220px]">
                              {member.email}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyEmail(member.email)}
                              className="opacity-0 group-hover/email:opacity-100 p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-opacity cursor-pointer"
                              title="Salin email"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </TableCell>

                        {/* Role Pill Badge */}
                        <TableCell className="px-4">
                          <RoleBadge role={member.role} />
                        </TableCell>

                        {/* POS PIN (Interactive Button / Badge) */}
                        <TableCell className="px-4">
                          {member.pinHash ? (
                            <button
                              type="button"
                              onClick={() => openPinModal(member)}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-[#0e59f9] bg-blue-50 hover:bg-blue-100/70 transition-colors cursor-pointer border-none"
                              title="Klik untuk ubah POS PIN"
                            >
                              <Key className="w-3.5 h-3.5 text-[#0e59f9]" />
                              <span>PIN Aktif</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openPinModal(member)}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-slate-500 bg-slate-100 hover:bg-slate-200 hover:text-slate-700 transition-colors cursor-pointer border-none"
                              title="Klik untuk atur POS PIN"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Atur PIN</span>
                            </button>
                          )}
                        </TableCell>

                        {/* Date Added */}
                        <TableCell className="px-4">
                          <span className="text-sm font-inter font-normal text-slate-600">
                            {formatDateAdded(member.createdAt)}
                          </span>
                        </TableCell>

                        {/* Status Pill Badge */}
                        <TableCell className="px-4">
                          <StatusBadge status="ACTIVE" />
                        </TableCell>

                        {/* Action Menu (⋮) */}
                        <TableCell className="px-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 p-0 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                              >
                                <span className="sr-only">Aksi</span>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[180px] p-1.5 rounded-2xl border-none shadow-2xl bg-white text-xs">
                              {member.pinHash && (
                                <DropdownMenuItem 
                                  onClick={() => openViewPinModal(member)}
                                  className="py-2 px-2.5 rounded-xl cursor-pointer font-medium hover:bg-slate-100 text-slate-700"
                                >
                                  <Eye className="mr-2 h-3.5 w-3.5 text-slate-500" />
                                  Lihat POS PIN
                                </DropdownMenuItem>
                              )}
                              
                              <DropdownMenuItem 
                                onClick={() => openPinModal(member)}
                                className="py-2 px-2.5 rounded-xl cursor-pointer font-medium hover:bg-slate-100 text-slate-700"
                              >
                                <Key className="mr-2 h-3.5 w-3.5 text-slate-500" />
                                {member.pinHash ? 'Ubah POS PIN' : 'Atur POS PIN'}
                              </DropdownMenuItem>
                              
                              {!['OWNER', 'SYSTEM_ADMIN', 'SUPERADMIN', 'VERIFICATION_ADMIN'].includes(member.role) && (
                                <>
                                  <DropdownMenuItem 
                                    onClick={() => openRoleModal(member)}
                                    className="py-2 px-2.5 rounded-xl cursor-pointer font-medium hover:bg-slate-100 text-slate-700"
                                  >
                                    <Shield className="mr-2 h-3.5 w-3.5 text-slate-500" />
                                    Ubah Role
                                  </DropdownMenuItem>
                                  
                                  <DropdownMenuSeparator className="my-1 border-slate-100" />
                                  
                                  <DropdownMenuItem 
                                    onClick={() => openDeleteModal(member)} 
                                    className="py-2 px-2.5 rounded-xl cursor-pointer text-rose-600 focus:text-rose-600 focus:bg-rose-50 font-medium"
                                  >
                                    <Trash2 className="mr-2 h-3.5 w-3.5 text-rose-600" />
                                    Hapus Anggota
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  }

                  const invite = row.data;
                  return (
                    <TableRow 
                      key={`invite-${invite.id}`} 
                      className="h-16 hover:bg-slate-100/60 transition-colors bg-blue-50/20 group border-b border-slate-100"
                    >
                      {/* User (Doodle Avatar + Email Prefix) */}
                      <TableCell className="px-5">
                        <div className="flex items-center gap-3">
                          <DoodleAvatar email={invite.email} />
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-semibold text-slate-900 truncate">
                              {invite.email.split('@')[0]}
                            </span>
                            <span className="text-[11px] text-slate-400 font-normal">
                              Menunggu konfirmasi
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Email */}
                      <TableCell className="px-4">
                        <div className="flex items-center gap-1.5 group/email">
                          <span className="text-sm text-slate-600 font-inter font-normal truncate max-w-[220px]">
                            {invite.email}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyEmail(invite.email)}
                            className="opacity-0 group-hover/email:opacity-100 p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-opacity cursor-pointer"
                            title="Salin email"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </TableCell>

                      {/* Role */}
                      <TableCell className="px-4">
                        <RoleBadge role={invite.role} />
                      </TableCell>

                      {/* POS PIN */}
                      <TableCell className="px-4">
                        <span className="text-xs text-slate-400 italic">-</span>
                      </TableCell>

                      {/* Date Added */}
                      <TableCell className="px-4">
                        <span className="text-sm font-inter font-normal text-slate-600">
                          {formatDateAdded(invite.createdAt)}
                        </span>
                      </TableCell>

                      {/* Status */}
                      <TableCell className="px-4">
                        <StatusBadge status="PENDING" />
                      </TableCell>

                      {/* Action Menu (⋮) */}
                      <TableCell className="px-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 p-0 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                            >
                              <span className="sr-only">Aksi</span>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-[180px] p-1.5 rounded-2xl border-none shadow-2xl bg-white text-xs">
                            <DropdownMenuItem 
                              onClick={() => handleResendInvite(invite)}
                              disabled={isResendingInvite === invite.id}
                              className="py-2 px-2.5 rounded-xl cursor-pointer font-medium hover:bg-slate-100 text-slate-700"
                            >
                              {isResendingInvite === invite.id ? (
                                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <RotateCw className="mr-2 h-3.5 w-3.5 text-slate-500" />
                              )}
                              Kirim Ulang Email
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem 
                              onClick={() => handleCopyEmail(invite.email)}
                              className="py-2 px-2.5 rounded-xl cursor-pointer font-medium hover:bg-slate-100 text-slate-700"
                            >
                              <Copy className="mr-2 h-3.5 w-3.5 text-slate-500" />
                              Salin Email
                            </DropdownMenuItem>

                            <DropdownMenuSeparator className="my-1 border-slate-100" />
                            
                            <DropdownMenuItem 
                              onClick={() => openCancelInviteModal(invite)}
                              className="py-2 px-2.5 rounded-xl cursor-pointer text-rose-600 focus:text-rose-600 focus:bg-rose-50 font-medium"
                            >
                              <XCircle className="mr-2 h-3.5 w-3.5 text-rose-600" />
                              Batalkan Undangan
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Zone 3: Footer Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
          {/* Left: Items Per Page Selector */}
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span>Items Per Page</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 rounded-full border-none bg-white shadow-sm-md text-xs font-medium gap-1.5 cursor-pointer hover:bg-slate-100 text-slate-700"
                  >
                    <span>{itemsPerPage}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-24 p-1.5 rounded-2xl border-none shadow-2xl bg-white">
                  {[10, 20, 50, 100].map((size) => (
                    <DropdownMenuItem
                      key={size}
                      onClick={() => {
                        setItemsPerPage(size);
                        setCurrentPage(1);
                      }}
                      className={cn("text-xs py-1.5 px-3 rounded-xl cursor-pointer hover:bg-slate-100", itemsPerPage === size && "font-semibold text-[#0e59f9] bg-blue-50")}
                    >
                      {size}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <span className="hidden sm:inline text-slate-300">&bull;</span>
            <span className="hidden sm:inline">
              Menampilkan {allFilteredRows.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, allFilteredRows.length)} dari {allFilteredRows.length} anggota
            </span>
          </div>

          {/* Right: Page Navigation */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="h-8 w-8 rounded-full border-none bg-white shadow-sm-md text-slate-600 hover:text-[#0e59f9] hover:bg-slate-100 disabled:opacity-30 cursor-pointer flex items-center justify-center transition-all aspect-square"
                aria-label="Halaman sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              {getPaginationNumbers().map((pageItem, index) => {
                if (pageItem === '...') {
                  return (
                    <span key={`ellipsis-${index}`} className="w-6 text-center text-xs text-slate-400 select-none">
                      ...
                    </span>
                  );
                }
                const pageNum = pageItem as number;
                const isCurrent = pageNum === currentPage;
                return (
                  <button
                    key={`page-${pageNum}`}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={cn(
                      "w-8 h-8 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center justify-center aspect-square",
                      isCurrent
                        ? "bg-[#0e59f9] text-white shadow-md hover:bg-[#0b4de0]"
                        : "hover:bg-slate-100 hover:text-slate-900 text-slate-600"
                    )}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <Button
                variant="outline"
                size="icon"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="h-8 w-8 rounded-full border-none bg-white shadow-sm-md text-slate-600 hover:text-[#0e59f9] hover:bg-slate-100 disabled:opacity-30 cursor-pointer flex items-center justify-center transition-all aspect-square"
                aria-label="Halaman berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    ) : (
        /* Empty State */
        <div className="rounded-2xl border-none bg-white p-12 text-center space-y-3 shadow-sm-md">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mx-auto text-[#0e59f9]">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900">
            {searchQuery ? 'Tidak ada anggota ditemukan' : 'Belum ada anggota tim'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery 
              ? `Tidak ada hasil yang cocok dengan kata kunci "${searchQuery}". Coba kata kunci lain atau reset filter.`
              : 'Undang anggota tim pertama Anda untuk mulai mengatur hak akses dan kasir outlet.'}
          </p>
          <div className="pt-2">
            {searchQuery ? (
              <Button
                variant="outline"
                onClick={() => { setSearchQuery(''); setActiveTab('ALL'); }}
                className="h-9 px-4 rounded-full text-xs font-semibold border-none bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                Reset Pencarian
              </Button>
            ) : (
              <Button
                onClick={() => setIsInviteOpen(true)}
                className="bg-[#0e59f9] hover:bg-[#0b4de0] text-white h-9 px-4 rounded-full text-xs font-semibold shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                <span>Undang Anggota</span>
              </Button>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODALS SECTION (Standard Menuin rounded-3xl pure light) */}
      {/* ============================================================ */}

      {/* View PIN Modal */}
      <Dialog open={viewPinModalOpen} onOpenChange={setViewPinModalOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md p-6 sm:p-7 bg-white border-none rounded-3xl shadow-2xl overflow-hidden">
          <DialogHeader className="space-y-1.5 text-left pb-2 border-b border-slate-100">
            <DialogTitle className="text-base font-semibold text-slate-900">
              POS PIN Kasir
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 break-words">
              PIN aktif untuk <span className="font-semibold text-slate-900 break-all">{selectedMember?.name || selectedMember?.email}</span> saat login ke terminal kasir POS.
            </DialogDescription>
          </DialogHeader>

          <div className="py-5 flex flex-col items-center gap-3 w-full max-w-full overflow-hidden">
            {selectedMember?.pinHash ? (
              /^\d{1,8}$/.test(selectedMember.pinHash) ? (
                <div className="w-full max-w-full overflow-hidden flex flex-col items-center gap-2">
                  <div className="w-full bg-slate-50 px-6 py-4 rounded-2xl border border-slate-100 flex items-center justify-center">
                    <span className="text-3xl font-mono tracking-[0.25em] font-semibold text-slate-900 select-all">
                      {selectedMember.pinHash}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyPin(selectedMember.pinHash || '')}
                    className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#0e59f9] mt-1 transition-colors cursor-pointer"
                  >
                    {copiedPin ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPin ? 'PIN disalin ke clipboard' : 'Salin PIN'}</span>
                  </button>
                </div>
              ) : (
                <div className="w-full max-w-full overflow-hidden flex flex-col items-center gap-2.5">
                  <div className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center text-center gap-2">
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-0.5 rounded-full inline-flex items-center gap-1 border-none">
                      <Check className="w-3 h-3" /> PIN Tersimpan & Terenkripsi
                    </span>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      PIN kasir tersimpan dalam format hash kriptografi aman. Anda dapat menyalin nilai hash atau langsung mengatur ulang PIN 6 digit baru.
                    </p>
                    <div className="w-full max-w-full bg-white rounded-xl p-2.5 border border-slate-100 overflow-hidden shadow-xs">
                      <p className="text-xs font-mono text-slate-600 break-all select-all leading-relaxed max-h-24 overflow-y-auto">
                        {selectedMember.pinHash}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyPin(selectedMember.pinHash || '')}
                    className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#0e59f9] transition-colors cursor-pointer"
                  >
                    {copiedPin ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPin ? 'Hash PIN disalin' : 'Salin Nilai PIN'}</span>
                  </button>
                </div>
              )
            ) : (
              <div className="w-full bg-slate-50 px-6 py-4 rounded-2xl border border-slate-100 flex items-center justify-center">
                <span className="text-2xl font-mono tracking-[0.25em] text-slate-400">
                  ------
                </span>
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-100">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setViewPinModalOpen(false)} 
              className="w-full sm:flex-1 h-9 text-xs font-semibold rounded-full border-none bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
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
                className="w-full sm:flex-1 h-9 text-xs font-semibold rounded-full bg-[#0e59f9] hover:bg-[#0b4de0] text-white shadow-md cursor-pointer"
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
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md p-6 sm:p-7 bg-white border-none rounded-3xl shadow-2xl">
          <DialogHeader className="space-y-1.5 text-left pb-2 border-b border-slate-100">
            <DialogTitle className="text-base font-semibold text-slate-900">
              {selectedMember?.pinHash ? 'Ubah POS PIN Kasir' : 'Atur POS PIN Kasir'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 break-words">
              Masukkan 6 digit angka untuk <span className="font-semibold text-slate-900 break-all">{selectedMember?.name || selectedMember?.email}</span> agar dapat login ke tablet POS.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onPinSubmit} className="space-y-4 pt-3">
            <div className="space-y-1.5 text-left">
              <Label htmlFor="pin" className="text-xs font-medium text-slate-700">
                6 Digit PIN Angka <span className="text-[#0e59f9]">*</span>
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
                className="text-center text-2xl tracking-[0.35em] font-inter h-12 rounded-2xl border border-slate-200/80 bg-slate-50/50 focus:bg-white focus:border-[#0e59f9]"
                autoFocus
              />
              <p className="text-[11px] text-slate-400 text-center">
                Hanya angka (0-9) dengan panjang tepat 6 karakter.
              </p>
            </div>
            
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setPinModalOpen(false)}
                disabled={isSubmittingPin}
                className="h-9 px-4 text-xs font-semibold rounded-full border-none bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                Batal
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmittingPin || newPin.length !== 6}
                className="h-9 px-5 text-xs font-semibold rounded-full bg-[#0e59f9] hover:bg-[#0b4de0] text-white shadow-md transition-colors cursor-pointer"
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
        <DialogContent className="w-[calc(100vw-2rem)] max-w-lg p-6 sm:p-7 bg-white border-none rounded-3xl shadow-2xl">
          <DialogHeader className="space-y-1.5 text-left pb-2 border-b border-slate-100">
            <DialogTitle className="text-base font-semibold text-slate-900">
              Ubah Role Anggota
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 break-words">
              Perbarui izin hak akses untuk <span className="font-semibold text-slate-900 break-all">{selectedMember?.name || selectedMember?.email}</span>.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onRoleSubmit} className="space-y-4 pt-2">
            <RadioGroup value={newRole} onValueChange={(v: any) => setNewRole(v)} className="flex flex-col space-y-2">
              <label htmlFor="cr-cashier" className="flex items-start space-x-3 p-3.5 rounded-2xl border border-slate-200/80 hover:bg-slate-50 cursor-pointer transition-colors">
                <RadioGroupItem value="CASHIER" id="cr-cashier" className="mt-0.5 text-[#0e59f9]" />
                <div className="flex flex-col text-xs min-w-0">
                  <span className="font-semibold text-slate-900">Kasir (POS Only)</span>
                  <span className="text-[11px] text-slate-500 break-words">Operasional kasir POS dan cetak struk</span>
                </div>
              </label>

              <label htmlFor="cr-manager" className="flex items-start space-x-3 p-3.5 rounded-2xl border border-slate-200/80 hover:bg-slate-50 cursor-pointer transition-colors">
                <RadioGroupItem value="MANAGER" id="cr-manager" className="mt-0.5 text-[#0e59f9]" />
                <div className="flex flex-col text-xs min-w-0">
                  <span className="font-semibold text-slate-900">Manager</span>
                  <span className="text-[11px] text-slate-500 break-words">Akses dashboard, menu katalog, dan laporan omzet</span>
                </div>
              </label>

              <label htmlFor="cr-staff" className="flex items-start space-x-3 p-3.5 rounded-2xl border border-slate-200/80 hover:bg-slate-50 cursor-pointer transition-colors">
                <RadioGroupItem value="STAFF" id="cr-staff" className="mt-0.5 text-[#0e59f9]" />
                <div className="flex flex-col text-xs min-w-0">
                  <span className="font-semibold text-slate-900">Staff Dapur / Waiter</span>
                  <span className="text-[11px] text-slate-500 break-words">Akses layar display dapur</span>
                </div>
              </label>
            </RadioGroup>
            
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setRoleModalOpen(false)}
                disabled={isSubmittingRole}
                className="h-9 px-4 text-xs font-semibold rounded-full border-none bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                Batal
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmittingRole}
                className="h-9 px-5 text-xs font-semibold rounded-full bg-[#0e59f9] hover:bg-[#0b4de0] text-white shadow-md transition-colors cursor-pointer"
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
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md p-6 sm:p-7 bg-white border-none rounded-3xl shadow-2xl">
          <DialogHeader className="space-y-1.5 text-left pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <DialogTitle className="text-base font-semibold">
                Hapus Anggota Tim
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-slate-500 break-words pt-1">
              Apakah Anda yakin ingin menghapus <span className="font-semibold text-slate-900 break-all">{selectedMember?.name || selectedMember?.email}</span>? Akses mereka ke outlet ini akan dicabut seketika.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onDeleteSubmit} className="pt-4 flex items-center justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setDeleteModalOpen(false)} 
              disabled={isSubmittingDelete}
              className="h-9 px-4 text-xs font-semibold rounded-full border-none bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
            >
              Batal
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmittingDelete}
              className="h-9 px-5 text-xs font-semibold rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-md transition-colors cursor-pointer"
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
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md p-6 sm:p-7 bg-white border-none rounded-3xl shadow-2xl">
          <DialogHeader className="space-y-1.5 text-left pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <DialogTitle className="text-base font-semibold">
                Batalkan Undangan
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-slate-500 break-words pt-1">
              Apakah Anda yakin ingin membatalkan undangan untuk <span className="font-semibold text-slate-900 break-all">{selectedInvite?.email}</span>? Tautan yang telah dikirimkan tidak akan berlaku lagi.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onCancelInviteSubmit} className="pt-4 flex items-center justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setCancelInviteModalOpen(false)} 
              disabled={isSubmittingCancelInvite}
              className="h-9 px-4 text-xs font-semibold rounded-full border-none bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
            >
              Batal
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmittingCancelInvite}
              className="h-9 px-5 text-xs font-semibold rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-md transition-colors cursor-pointer"
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
