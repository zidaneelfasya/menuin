'use client';

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import {
  IconPlus,
  IconArrowRight,
  IconLogout,
  IconShieldCheck,
  IconSearch,
  IconX,
  IconFilter,
  IconChevronDown,
  IconCheck,
  IconRotate,
  IconLayoutGrid,
  IconList,
  IconBuildingStore,
  IconUsers,
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { signOutAction } from '@/lib/actions/auth';
import { selectTenantAction } from '@/lib/actions/tenant';
import { usePageTransition } from '@/components/providers/page-transition-provider';
import { createAvatar } from '@dicebear/core';
import { openPeeps } from '@dicebear/collection';

export interface TeamMemberItem {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface TenantItem {
  membershipId: string;
  role: string;
  tenantId: string;
  name: string;
  slug: string | null;
  outletKey: string | null;
  storeLogoUrl: string | null;
  storeDescription: string | null;
  teamMembers?: TeamMemberItem[];
}

export interface AccountInfo {
  id: string;
  email: string;
  name?: string | null;
}

interface SelectTenantClientProps {
  account: AccountInfo | null;
  tenants: TenantItem[];
  isAdmin?: boolean;
}

// Single member avatar with openPeeps or initials
function MemberAvatarItem({ member }: { member: TeamMemberItem }) {
  const avatarUri = useMemo(() => {
    try {
      const seed = (member.email || member.name || 'user').trim().toLowerCase();
      const avatar = createAvatar(openPeeps, {
        seed,
        backgroundColor: ['dbeafe', 'eff6ff', 'e0f2fe', 'fef3c7', 'fce7f3', 'dcfce7'],
        scale: 90,
      });
      return avatar.toDataUri();
    } catch {
      return null;
    }
  }, [member.email, member.name]);

  const initial = (member.name ? member.name.charAt(0) : member.email ? member.email.charAt(0) : 'U').toUpperCase();

  if (avatarUri) {
    return (
      <img
        src={avatarUri}
        alt={member.name}
        title={`${member.name} (${member.role})`}
        className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 object-cover bg-slate-100 dark:bg-slate-800 shadow-xs shrink-0 select-none"
        loading="lazy"
      />
    );
  }

  return (
    <div
      title={`${member.name} (${member.role})`}
      className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-[10px] font-semibold flex items-center justify-center shrink-0 shadow-xs select-none"
    >
      {initial}
    </div>
  );
}

// Avatar stack using real team member data from the database
function OutletTeamAvatars({
  members = [],
  fallbackEmail,
}: {
  members?: TeamMemberItem[];
  fallbackEmail?: string;
}) {
  const activeMembers = useMemo(() => {
    if (members && members.length > 0) return members;
    return [{ id: 'self', name: 'Anda', email: fallbackEmail || 'user@menuin.id', role: 'OWNER' }];
  }, [members, fallbackEmail]);

  const displayMembers = activeMembers.slice(0, 3);
  const extraCount = activeMembers.length - displayMembers.length;

  return (
    <div className="flex items-center">
      <div className="flex items-center -space-x-1.5 py-0.5">
        {displayMembers.map((member) => (
          <MemberAvatarItem key={member.id} member={member} />
        ))}
      </div>
      <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium pl-2 select-none">
        {extraCount > 0 ? `+${extraCount} staf` : `${activeMembers.length} staf`}
      </span>
    </div>
  );
}

// Ambient Blurry Menuin 'M' Emblem Watermark for Cards
function MenuinMWatermark({ className }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute select-none overflow-hidden transition-all duration-500 ${className || ''}`}
      aria-hidden="true"
    >
      <svg
        viewBox="260 380 300 190"
        className="w-full h-full fill-current"
      >
        <path
          d="M0 0 C3.00222412 2.67977915 5.9093898 5.40983348 8.65234375 8.35546875 C10.15145643 9.90745404 10.15145643 9.90745404 13.06640625 10.65234375 C13.288125 10.09160156 13.50984375 9.53085937 13.73828125 8.953125 C19.91716038 -1.75087443 35.09804735 -8.60826205 46.31640625 -12.16015625 C54.83438067 -14.35367385 62.87347198 -15.7144374 71.69140625 -15.66015625 C73.12818726 -15.65278442 73.12818726 -15.65278442 74.59399414 -15.64526367 C97.37588825 -15.27403702 119.91910897 -8.01433679 136.51611328 8.01611328 C144.50261498 16.44533129 149.5251973 26.68935103 153.06640625 37.65234375 C153.39279083 38.59193436 153.71917542 39.53152496 154.05545044 40.49958801 C158.25354021 53.59170486 157.32520647 67.53800795 157.26171875 81.109375 C157.25798248 83.46733988 157.25513841 85.82530632 157.25314331 88.18327332 C157.24555523 94.34974554 157.2259488 100.51612158 157.20373535 106.68255615 C157.1831723 112.9908315 157.17411935 119.29912258 157.1640625 125.60742188 C157.14269785 137.95577794 157.10755566 150.30403775 157.06640625 162.65234375 C142.21640625 162.65234375 127.36640625 162.65234375 112.06640625 162.65234375 C112.02773438 151.72560547 112.02773438 151.72560547 111.98828125 140.578125 C111.96309336 135.94332495 111.93674537 131.30858889 111.90625 126.67382812 C111.85803281 119.32901833 111.81394376 111.98435681 111.79541016 104.6394043 C111.78018578 98.71291304 111.74563761 92.78681161 111.69809723 86.86049461 C111.68334296 84.60770253 111.67536868 82.35485478 111.6745224 80.10201454 C111.78821682 57.27617867 111.78821682 57.27617867 101.06640625 37.65234375 C89.9721561 28.44087693 78.05292218 26.75366909 64.06640625 27.65234375 C54.98523609 28.88285461 46.94873006 33.995105 41.109375 41 C31.73103682 54.66818631 33.87690467 71.36685935 33.75 87.26171875 C33.72939411 89.44175579 33.70839678 91.62178916 33.68702698 93.80181885 C33.63218133 99.5029806 33.58260873 105.20417612 33.53417969 110.90539551 C33.47479054 117.76556033 33.40877167 124.62566425 33.3438797 131.48577881 C33.24634306 141.87459618 33.1571642 152.263455 33.06640625 162.65234375 C17.88640625 162.65234375 2.70640625 162.65234375 -12.93359375 162.65234375 C-12.97097656 155.4284375 -13.00835937 148.20453125 -13.046875 140.76171875 C-13.07717351 136.16794551 -13.10833378 131.57421014 -13.14257812 126.98046875 C-13.19677507 119.69923883 -13.24789011 112.4180838 -13.2800293 105.13671875 C-13.30615944 99.26215392 -13.34663025 93.38784251 -13.39678001 87.51343536 C-13.41338321 85.27935198 -13.42493804 83.04522484 -13.43120766 80.81108856 C-13.29212151 58.41066128 -13.29212151 58.41066128 -22.93359375 38.65234375 C-32.66819717 29.30067504 -43.10899121 27.29885333 -56.24609375 27.5078125 C-66.79860565 27.92141731 -75.32873183 31.55427711 -82.74609375 39.27734375 C-87.89171644 45.56643815 -92.02264759 54.77029176 -92.09181213 62.96134949 C-92.10649536 64.28014351 -92.10649536 64.28014351 -92.12147522 65.62557983 C-92.12723068 66.58727081 -92.13298615 67.54896179 -92.13891602 68.53979492 C-92.14881561 69.55460434 -92.15871521 70.56941376 -92.16891479 71.61497498 C-92.20054584 74.97506361 -92.22529366 78.33516639 -92.25 81.6953125 C-92.27056813 84.02273428 -92.29156457 86.35015232 -92.31297302 88.67756653 C-92.36820817 94.80794238 -92.41761113 100.93835203 -92.46582031 107.06878662 C-92.52484927 114.42181857 -92.5910852 121.77478866 -92.6561203 129.12776947 C-92.75414798 140.30258984 -92.84299171 151.47744959 -92.93359375 162.65234375 C-108.11359375 162.65234375 -123.29359375 162.65234375 -138.93359375 162.65234375 C-139.05392018 138.12803511 -139.05392018 138.12803511 -139.08007812 127.58007812 C-139.09793047 120.41553992 -139.11892528 113.25111801 -139.15991211 106.08666992 C-139.19278833 100.30298027 -139.21050571 94.51941554 -139.21822548 88.73563957 C-139.2237187 86.54192072 -139.23444368 84.34820779 -139.25078392 82.15454292 C-139.37743587 64.42772947 -138.45854302 48.03864039 -130.93359375 31.65234375 C-130.44117188 30.57339844 -129.94875 29.49445313 -129.44140625 28.3828125 C-125.174207 19.77695374 -119.70074478 13.330971 -112.93359375 6.65234375 C-112.25296875 5.97300781 -111.57234375 5.29367187 -110.87109375 4.59375 C-83.15295722 -21.33425688 -29.61263306 -23.69799264 0 0 Z"
          transform="translate(400.93359375, 405.34765625)"
        />
      </svg>
    </div>
  );
}

export function SelectTenantClient({ account, tenants, isAdmin }: SelectTenantClientProps) {
  const { navigateWithTransition } = usePageTransition();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // User account avatar
  const userAvatarUri = useMemo(() => {
    try {
      const seed = (account?.email || account?.name || 'user').trim().toLowerCase();
      const avatar = createAvatar(openPeeps, {
        seed,
        backgroundColor: ['dbeafe', 'eff6ff', 'e0f2fe'],
        scale: 92,
      });
      return avatar.toDataUri();
    } catch {
      return null;
    }
  }, [account?.email, account?.name]);

  const getRoleBadge = (role: string) => {
    switch (role?.toUpperCase()) {
      case 'OWNER':
        return {
          label: 'Owner',
          className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
        };
      case 'MANAGER':
        return {
          label: 'Manager',
          className: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
        };
      case 'CASHIER':
        return {
          label: 'Kasir',
          className: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
        };
      default:
        return {
          label: role || 'Staf',
          className: 'bg-slate-500/10 text-slate-700 dark:text-slate-400',
        };
    }
  };

  const handleSelectOutlet = (outletKey: string) => {
    navigateWithTransition(`/outlet/${outletKey}/dashboard`);
    selectTenantAction(outletKey).catch((err) => {
      console.error('Failed to set tenant context cookie:', err);
    });
  };

  // Filter outlets by search query and role
  const filteredTenants = useMemo(() => {
    return tenants.filter((t) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        t.name.toLowerCase().includes(q) ||
        (t.slug && t.slug.toLowerCase().includes(q)) ||
        (t.outletKey && t.outletKey.toLowerCase().includes(q));

      const matchesRole =
        roleFilter === 'ALL' || t.role.toUpperCase() === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [tenants, searchQuery, roleFilter]);

  // Aggregate stats based on real data
  const totalStaffCount = useMemo(() => {
    return tenants.reduce((acc, t) => acc + (t.teamMembers?.length || 1), 0);
  }, [tenants]);

  const ownerCount = useMemo(() => {
    return tenants.filter((t) => t.role?.toUpperCase() === 'OWNER').length;
  }, [tenants]);

  const nonOwnerCount = useMemo(() => {
    return tenants.length - ownerCount;
  }, [tenants, ownerCount]);

  return (
    <div className="min-h-screen w-full bg-slate-50/60 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between relative overflow-hidden">
      {/* Subtle Ambient Background Gradient */}
      <div
        className="absolute inset-0 pointer-events-none -z-10"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% -10%, rgba(37, 99, 235, 0.08) 0%, rgba(99, 102, 241, 0.04) 35%, transparent 70%),
            radial-gradient(circle at 10% 90%, rgba(59, 130, 246, 0.03) 0%, transparent 50%),
            radial-gradient(circle at 90% 80%, rgba(147, 51, 234, 0.03) 0%, transparent 50%)
          `,
        }}
      />

      {/* Top Navbar */}
      <header className="w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo: Identical to Landing Page */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigateWithTransition('/')}
              className="flex items-center gap-2 group cursor-pointer focus:outline-none"
              aria-label="Menuin, ke beranda"
            >
              <Image
                src="/menuin.png"
                alt="Menuin"
                width={220}
                height={60}
                className="h-7 w-auto md:h-8 transition-transform group-hover:scale-[1.01] dark:hidden"
                priority
              />
              <Image
                src="/menuin-putih.png"
                alt="Menuin"
                width={220}
                height={60}
                className="h-7 w-auto md:h-8 transition-transform group-hover:scale-[1.01] hidden dark:block"
                priority
              />
            </button>
          </div>

          {/* Right Header Navigation & Profile */}
          <div className="flex items-center gap-2.5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 p-1 pl-2.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors cursor-pointer select-none shadow-2xs"
                >
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300 max-w-[150px] truncate hidden sm:inline">
                    {account?.name || account?.email}
                  </span>
                  {userAvatarUri ? (
                    <img
                      src={userAvatarUri}
                      alt={account?.name || 'User'}
                      className="w-7 h-7 rounded-lg object-cover bg-blue-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-2xs"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold text-xs flex items-center justify-center border border-blue-100 dark:border-blue-900/40">
                      {account?.name?.charAt(0).toUpperCase() || account?.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                  <IconChevronDown className="w-3.5 h-3.5 text-slate-400 mr-1" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60 p-1.5 rounded-xl shadow-lg border-slate-200 dark:border-slate-800 text-xs">
                <div className="px-2.5 py-2 border-b border-slate-100 dark:border-slate-800">
                  <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {account?.name || 'Pengguna Menuin'}
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                    {account?.email}
                  </p>
                </div>

                {isAdmin && (
                  <DropdownMenuItem
                    onClick={() => navigateWithTransition('/system-admin')}
                    className="flex items-center gap-2 cursor-pointer py-2 px-2.5 rounded-lg text-slate-700 dark:text-slate-300 mt-1"
                  >
                    <IconShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Konsol System Admin</span>
                  </DropdownMenuItem>
                )}

                <form action={signOutAction} className="w-full mt-1">
                  <button
                    type="submit"
                    className="w-full flex items-center gap-2 cursor-pointer py-2 px-2.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-left"
                  >
                    <IconLogout className="w-4 h-4" />
                    <span>Keluar dari Akun</span>
                  </button>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="space-y-6">
          {/* Page Title & Subtitle */}
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
              Daftar Outlet
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Pilih cabang restoran untuk masuk ke sistem dashboard operasional kasir dan kelola bisnis Anda.
            </p>
          </div>

          {/* Controls Toolbar with Filter Icon Dropdown */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
            {/* Search Input & Role Filter Dropdown */}
            <div className="flex items-center gap-2.5 flex-1 max-w-md">
              {/* Search Bar with Clear Button */}
              <div className="relative flex-1">
                <IconSearch className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari outlet atau cabang restoran..."
                  className="w-full pl-9 pr-8 h-9 text-xs bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-2xs"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
                    title="Hapus pencarian"
                  >
                    <IconX className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filter Dropdown with Filter Icon */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className={`h-9 px-3 rounded-xl border text-xs font-medium flex items-center gap-2 cursor-pointer shadow-2xs transition-colors shrink-0 select-none ${
                      roleFilter !== 'ALL'
                        ? 'border-blue-300 dark:border-blue-700/80 bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold'
                        : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80'
                    }`}
                  >
                    <IconFilter
                      className={`w-3.5 h-3.5 ${
                        roleFilter !== 'ALL'
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-slate-400 dark:text-slate-500'
                      }`}
                    />
                    <span>
                      {roleFilter === 'ALL'
                        ? 'Semua Peran'
                        : roleFilter === 'OWNER'
                        ? 'Owner'
                        : roleFilter === 'MANAGER'
                        ? 'Manager'
                        : 'Kasir'}
                    </span>
                    <IconChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-44 p-1.5 rounded-xl shadow-lg border-slate-200 dark:border-slate-800 text-xs">
                  <div className="px-2.5 py-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Filter Peran
                  </div>
                  <DropdownMenuItem
                    onClick={() => setRoleFilter('ALL')}
                    className="flex items-center justify-between cursor-pointer py-1.5 px-2.5 rounded-lg text-slate-700 dark:text-slate-300"
                  >
                    <span>Semua Peran</span>
                    {roleFilter === 'ALL' && <IconCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setRoleFilter('OWNER')}
                    className="flex items-center justify-between cursor-pointer py-1.5 px-2.5 rounded-lg text-slate-700 dark:text-slate-300"
                  >
                    <span>Owner</span>
                    {roleFilter === 'OWNER' && <IconCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setRoleFilter('MANAGER')}
                    className="flex items-center justify-between cursor-pointer py-1.5 px-2.5 rounded-lg text-slate-700 dark:text-slate-300"
                  >
                    <span>Manager</span>
                    {roleFilter === 'MANAGER' && <IconCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setRoleFilter('CASHIER')}
                    className="flex items-center justify-between cursor-pointer py-1.5 px-2.5 rounded-lg text-slate-700 dark:text-slate-300"
                  >
                    <span>Kasir</span>
                    {roleFilter === 'CASHIER' && <IconCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* View Mode Toggle & Primary CTA Button (Right) */}
            <div className="flex items-center gap-2 justify-end">
              <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  title="Tampilan Grid"
                  className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <IconLayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  title="Tampilan List"
                  className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <IconList className="w-3.5 h-3.5" />
                </button>
              </div>

              <Button
                type="button"
                onClick={() => navigateWithTransition('/create-tenant')}
                className="text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white gap-1.5 h-9 px-3.5 rounded-xl shadow-xs cursor-pointer transition-all"
              >
                <IconPlus className="w-3.5 h-3.5 stroke-[2.2]" />
                <span>Tambah Outlet</span>
              </Button>
            </div>
          </div>

          {/* 2-Column Split Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pt-2">
            {/* Left Area: Outlets (8 cols on desktop) */}
            <div className="lg:col-span-8 space-y-4">
              {filteredTenants.length === 0 ? (
                /* Rich Helpful Empty Search State */
                <div className="p-10 sm:p-14 text-center bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl space-y-4 shadow-xs">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-xs">
                    <IconSearch className="w-5 h-5 stroke-[1.8]" />
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100">
                      Outlet tidak ditemukan
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                      Tidak ada cabang restoran yang cocok dengan kata kunci{' '}
                      {searchQuery && (
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          &quot;{searchQuery}&quot;
                        </span>
                      )}
                      {roleFilter !== 'ALL' && (
                        <span>
                          {' '}pada filter peran{' '}
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {roleFilter === 'OWNER' ? 'Owner' : roleFilter === 'MANAGER' ? 'Manager' : 'Kasir'}
                          </span>
                        </span>
                      )}
                      . Silakan periksa kembali ejaan atau reset filter.
                    </p>
                  </div>

                  <div className="pt-2 flex items-center justify-center gap-2.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchQuery('');
                        setRoleFilter('ALL');
                      }}
                      className="text-xs font-medium h-8.5 px-3 rounded-xl border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer gap-1.5 shadow-2xs"
                    >
                      <IconRotate className="w-3.5 h-3.5 text-slate-500" />
                      <span>Reset Pencarian</span>
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => navigateWithTransition('/create-tenant')}
                      className="text-xs font-semibold h-8.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white cursor-pointer gap-1.5 shadow-2xs"
                    >
                      <IconPlus className="w-3.5 h-3.5 stroke-[2.2]" />
                      <span>Tambah Outlet Baru</span>
                    </Button>
                  </div>
                </div>
              ) : viewMode === 'grid' ? (
                /* Compact Elevated Cards Grid */
                <div className="grid gap-4 sm:grid-cols-2 items-stretch">
                  {filteredTenants.map((tenant) => {
                    const roleInfo = getRoleBadge(tenant.role);
                    const domainSlug = tenant.slug || tenant.outletKey;
                    const outletKey = tenant.outletKey || '';
                    const initial = (tenant.name ? tenant.name.trim().charAt(0) : 'O').toUpperCase();

                    return (
                      <div
                        key={tenant.tenantId}
                        onClick={() => outletKey && handleSelectOutlet(outletKey)}
                        className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:shadow-xl hover:shadow-slate-300/40 dark:hover:shadow-black/70 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group cursor-pointer relative overflow-hidden"
                      >
                        {/* Ambient Blurry Menuin 'M' Emblem Watermark with Soft Ambient Glow */}
                        <div className="pointer-events-none absolute -right-6 -bottom-6 w-36 h-36 rounded-full bg-blue-500/5 dark:bg-blue-400/5 blur-2xl group-hover:bg-blue-500/10 transition-all duration-500" />
                        <MenuinMWatermark className="-right-6 -bottom-6 w-40 h-32 opacity-10 dark:opacity-15 text-blue-600 dark:text-blue-400 blur-[3px] group-hover:blur-[1.5px] group-hover:opacity-20 dark:group-hover:opacity-25 group-hover:scale-105 group-hover:-translate-y-1" />

                        <div className="space-y-3.5 relative z-10">
                          {/* Header: Initial/Logo, Title, Domain, Role */}
                          <div className="flex items-start justify-between gap-2.5">
                            <div className="flex items-center gap-3 min-w-0">
                              {tenant.storeLogoUrl ? (
                                <div className="w-11 h-11 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 shrink-0 shadow-2xs">
                                  <img
                                    src={tenant.storeLogoUrl}
                                    alt={tenant.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/40 text-blue-600 dark:text-blue-400 font-semibold text-lg flex items-center justify-center shrink-0 shadow-2xs select-none">
                                  {initial}
                                </div>
                              )}

                              <div className="min-w-0 flex-1">
                                <h2 className="text-[15px] font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                  {tenant.name}
                                </h2>
                                <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5 font-mono">
                                  {domainSlug}.menuin.id
                                </p>
                              </div>
                            </div>

                            {/* Role Badge */}
                            <span
                              className={`text-xs font-medium px-2.5 py-0.5 rounded-full shrink-0 ${roleInfo.className}`}
                            >
                              {roleInfo.label}
                            </span>
                          </div>

                          {/* Real Description only if exists */}
                          {tenant.storeDescription && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                              {tenant.storeDescription}
                            </p>
                          )}
                        </div>

                        {/* Card Footer: Real Team Avatars + Action Button */}
                        <div className="pt-3.5 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between relative z-10">
                          <OutletTeamAvatars
                            members={tenant.teamMembers}
                            fallbackEmail={account?.email}
                          />

                          <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 group-hover:bg-blue-600 group-hover:text-white dark:group-hover:bg-blue-600 dark:group-hover:text-white transition-all shadow-2xs">
                            <span>Masuk Outlet</span>
                            <IconArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Compact List View Rows */
                <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800/80 shadow-xs overflow-hidden">
                  {filteredTenants.map((tenant) => {
                    const roleInfo = getRoleBadge(tenant.role);
                    const domainSlug = tenant.slug || tenant.outletKey;
                    const outletKey = tenant.outletKey || '';
                    const initial = (tenant.name ? tenant.name.trim().charAt(0) : 'O').toUpperCase();

                    return (
                      <div
                        key={tenant.tenantId}
                        onClick={() => outletKey && handleSelectOutlet(outletKey)}
                        className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer relative overflow-hidden"
                      >
                        {/* Ambient Blurry Menuin 'M' Emblem Watermark for List Row */}
                        <MenuinMWatermark className="-right-4 -bottom-4 w-32 h-24 opacity-[0.05] dark:opacity-[0.08] text-blue-600 dark:text-blue-400 blur-[3px] group-hover:blur-[1.5px] group-hover:opacity-15 dark:group-hover:opacity-20 group-hover:scale-105" />

                        <div className="flex items-center gap-3.5 min-w-0 flex-1 relative z-10">
                          {tenant.storeLogoUrl ? (
                            <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shrink-0">
                              <img
                                src={tenant.storeLogoUrl}
                                alt={tenant.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/40 text-blue-600 dark:text-blue-400 font-semibold text-base flex items-center justify-center shrink-0 select-none">
                              {initial}
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {tenant.name}
                              </h2>
                              <span
                                className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${roleInfo.className}`}
                              >
                                {roleInfo.label}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono truncate">
                              {domainSlug}.menuin.id
                            </p>
                          </div>
                        </div>

                        <div className="hidden sm:flex items-center gap-4 shrink-0 relative z-10">
                          <OutletTeamAvatars
                            members={tenant.teamMembers}
                            fallbackEmail={account?.email}
                          />
                        </div>

                        <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 group-hover:bg-blue-600 group-hover:text-white dark:group-hover:bg-blue-600 dark:group-hover:text-white transition-all shrink-0 relative z-10 shadow-2xs">
                          <span>Buka</span>
                          <IconArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Area: Authentic Summary Panel */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Ringkasan Akun
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    {account?.name ? `${account.name} • ` : ''}{account?.email || 'Pengguna Menuin'}
                  </p>
                </div>

                {/* Real Statistics without artificial caps */}
                <div className="space-y-2.5 pt-1 text-xs">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <IconBuildingStore className="w-4 h-4" />
                      </div>
                      <span className="text-slate-600 dark:text-slate-400 text-xs font-medium">Total Cabang</span>
                    </div>
                    <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                      {tenants.length} Outlet
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                        <IconUsers className="w-4 h-4" />
                      </div>
                      <span className="text-slate-600 dark:text-slate-400 text-xs font-medium">Total Anggota Tim</span>
                    </div>
                    <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                      {totalStaffCount} Anggota
                    </span>
                  </div>

                  {/* Real Role Breakdown */}
                  <div className="space-y-1.5 pt-2 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80">
                    <div className="flex justify-between">
                      <span>Sebagai Owner:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{ownerCount} Cabang</span>
                    </div>
                    {nonOwnerCount > 0 && (
                      <div className="flex justify-between">
                        <span>Sebagai Staf / Kasir:</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{nonOwnerCount} Cabang</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Action Button */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => navigateWithTransition('/create-tenant')}
                    className="w-full py-2.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-950/70 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <IconPlus className="w-3.5 h-3.5 stroke-[2.2]" />
                    <span>Daftarkan Cabang Baru</span>
                  </button>
                </div>
              </div>

              {/* Admin Console Card (If Admin) */}
              {isAdmin && (
                <div
                  onClick={() => navigateWithTransition('/system-admin')}
                  className="bg-white dark:bg-slate-900 border border-blue-200/90 dark:border-blue-900/60 hover:border-blue-400 dark:hover:border-blue-700 rounded-2xl p-4.5 shadow-xs transition-all cursor-pointer group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-2xs">
                      <IconShieldCheck className="w-4.5 h-4.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        Konsol System Admin
                      </h4>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 line-clamp-1">
                        Antrean KYC & manajemen platform
                      </p>
                    </div>
                    <IconArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all mt-1" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-4 text-center text-xs text-slate-400 dark:text-slate-600 border-t border-slate-200/60 dark:border-slate-900">
        &copy; {new Date().getFullYear()} MENUIN
      </footer>
    </div>
  );
}
