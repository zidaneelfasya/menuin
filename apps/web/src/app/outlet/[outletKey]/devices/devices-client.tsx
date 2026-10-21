'use client';

import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
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
import { QRCodeSVG } from 'qrcode.react';
import { 
  Plus, 
  Search, 
  Smartphone, 
  Tablet, 
  Laptop, 
  Clock, 
  Calendar, 
  Copy, 
  Check, 
  Trash2, 
  MoreVertical, 
  AlertTriangle,
  Loader2,
  PackageSearch
} from 'lucide-react';
import { motion } from 'framer-motion';
import { generatePairingCodeAction, revokeDeviceAction } from '@/lib/actions/devices';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface Device {
  id: string;
  name: string;
  deviceIdentifier: string;
  status: string;
  lastSeenAt: Date | string | null;
  createdAt: Date | string;
}

export function DevicesClient({ 
  initialDevices, 
  canManage, 
  outletKey 
}: { 
  initialDevices: Device[]; 
  canManage: boolean; 
  outletKey: string;
}) {
  const [devices, setDevices] = useState<Device[]>(initialDevices);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'REVOKED'>('ALL');
  
  // Pairing Modal state
  const [isPairingModalOpen, setIsPairingModalOpen] = useState(false);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Revoke Modal state
  const [selectedDeviceToRevoke, setSelectedDeviceToRevoke] = useState<Device | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  const router = useRouter();
  const initialCountRef = React.useRef(initialDevices.length);

  // Polling for device updates while pairing modal is open
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPairingModalOpen && pairingCode) {
      interval = setInterval(() => {
        router.refresh();
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isPairingModalOpen, pairingCode, router]);

  // Synchronize initialDevices from server refresh
  useEffect(() => {
    if (initialDevices.length > initialCountRef.current && isPairingModalOpen) {
      toast.success('Perangkat baru berhasil terhubung!');
      setIsPairingModalOpen(false);
      setPairingCode(null);
    }
    initialCountRef.current = initialDevices.length;
    setDevices(initialDevices);
  }, [initialDevices, isPairingModalOpen]);

  const handleGenerateCode = async () => {
    setIsGenerating(true);
    try {
      const res = await generatePairingCodeAction();
      if (res.error) {
        toast.error(res.error);
      } else if (res.code) {
        setPairingCode(res.code);
        setIsPairingModalOpen(true);
      }
    } catch {
      toast.error('Gagal membuat kode pairing');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirmRevoke = async () => {
    if (!selectedDeviceToRevoke) return;
    setIsRevoking(true);
    try {
      const res = await revokeDeviceAction(selectedDeviceToRevoke.id);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(`Perangkat ${selectedDeviceToRevoke.name} berhasil dicabut`);
        setDevices((prev) => prev.filter((d) => d.id !== selectedDeviceToRevoke.id));
        setSelectedDeviceToRevoke(null);
        router.refresh();
      }
    } catch {
      toast.error('Gagal mencabut perangkat');
    } finally {
      setIsRevoking(false);
    }
  };

  const copyPairingCode = () => {
    if (!pairingCode) return;
    navigator.clipboard.writeText(pairingCode);
    setCopiedCode(true);
    toast.success('Kode pairing disalin');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyDeviceId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    toast.success('ID perangkat disalin');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Stats calculation
  const totalCount = devices.length;
  const activeCount = devices.filter((d) => d.status === 'ACTIVE').length;
  const inactiveCount = devices.filter((d) => d.status !== 'ACTIVE').length;

  // Filtered devices list
  const filteredDevices = useMemo(() => {
    return devices.filter((device) => {
      const matchesSearch = 
        device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.deviceIdentifier.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = 
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && device.status === 'ACTIVE') ||
        (statusFilter === 'REVOKED' && device.status !== 'ACTIVE');

      return matchesSearch && matchesStatus;
    });
  }, [devices, searchQuery, statusFilter]);

  const formatDate = (dateVal: Date | string | null) => {
    if (!dateVal) return '-';
    try {
      const d = new Date(dateVal);
      return format(d, 'd MMM yyyy, HH:mm', { locale: idLocale });
    } catch {
      return '-';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Perangkat Kasir
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Kelola tablet, smartphone, dan mesin POS kasir yang terhubung ke outlet ini.
          </p>
        </div>

        {canManage && (
          <Button 
            onClick={handleGenerateCode} 
            disabled={isGenerating}
            className="inline-flex items-center gap-2 bg-[#0e59f9] hover:bg-[#0b4de0] active:translate-y-0 text-white h-9 px-4 rounded-full text-xs font-semibold transition-all duration-150 ease-out hover:-translate-y-px shadow-md shrink-0 cursor-pointer"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            <span>Tautkan Perangkat Baru</span>
          </Button>
        )}
      </div>

      {/* Stats Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Card 1: Total Perangkat (Hero Blue) */}
        <div className="rounded-2xl border-none shadow-md bg-[#0e59f9] text-white p-5 hover:shadow-lg transition-all">
          <p className="text-xs font-medium text-blue-100/90">Total Perangkat</p>
          <p className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1.5 sm:mt-2">
            {totalCount}
          </p>
        </div>

        {/* Card 2: Perangkat Aktif */}
        <div className="bg-white border-none rounded-2xl p-5 shadow-sm-md hover:shadow-md transition-all">
          <p className="text-xs font-medium text-slate-500">Perangkat Aktif</p>
          <p className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1.5 sm:mt-2">
            {activeCount}
          </p>
        </div>

        {/* Card 3: Status Sinkronisasi */}
        <div className="bg-white border-none rounded-2xl p-5 shadow-sm-md hover:shadow-md transition-all">
          <p className="text-xs font-medium text-slate-500">Status Sinkronisasi</p>
          <p className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1.5 sm:mt-2">
            {activeCount > 0 ? 'Realtime Sync' : 'Siaga'}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-2">
        {/* Status Filter Tabs (Underline style with live counters) */}
        <div className="flex items-center gap-6 overflow-x-auto pb-1 sm:pb-0">
          {[
            { key: 'ALL', label: 'Semua Perangkat', count: totalCount },
            { key: 'ACTIVE', label: 'Aktif', count: activeCount },
            { key: 'REVOKED', label: 'Nonaktif', count: inactiveCount },
          ].map((tab) => {
            const isActive = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key as 'ALL' | 'ACTIVE' | 'REVOKED')}
                className={cn(
                  "relative pb-2.5 text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap",
                  isActive
                    ? "text-[#0e59f9] font-bold"
                    : "text-slate-500 hover:text-[#0e59f9]"
                )}
              >
                <span>{tab.label}</span>
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full font-semibold transition-colors",
                  isActive
                    ? "bg-blue-50 text-[#0e59f9]"
                    : "text-slate-400"
                )}>
                  {tab.count}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="activeDeviceTabUnderline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0e59f9] rounded-full"
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama atau ID perangkat..."
            className="pl-9 h-9 text-xs rounded-full bg-white border-none shadow-sm-md text-slate-800 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-[#0e59f9]/20"
          />
        </div>
      </div>

      {/* Devices Data Table */}
      <div className="bg-white border-none rounded-2xl shadow-sm-md overflow-hidden">
        {filteredDevices.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <div className="flex flex-col items-center justify-center space-y-2">
              <PackageSearch className="w-10 h-10 text-slate-300" />
              <p className="text-sm font-bold text-slate-800">
                {searchQuery ? 'Tidak ada perangkat ditemukan' : 'Belum ada perangkat kasir'}
              </p>
              <p className="text-xs text-slate-500 max-w-sm">
                {searchQuery 
                  ? 'Coba gunakan kata kunci pencarian lain atau ubah filter status.' 
                  : 'Tautkan tablet atau smartphone kasir untuk mulai menjalankan aplikasi POS.'}
              </p>
            </div>
            {canManage && !searchQuery && (
              <Button 
                onClick={handleGenerateCode} 
                className="mt-4 gap-2 bg-[#0e59f9] hover:bg-[#0b4de0] text-white h-9 px-4 rounded-full text-xs font-semibold shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tautkan Perangkat Pertama</span>
              </Button>
            )}
          </div>
        ) : (
          <div className="relative w-full overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/70 text-slate-500 font-semibold border-b border-slate-100">
                  <th className="py-3.5 px-4 text-xs font-semibold whitespace-nowrap text-slate-500 tracking-tight">
                    Perangkat
                  </th>
                  <th className="py-3.5 px-4 text-xs font-semibold whitespace-nowrap text-slate-500 tracking-tight">
                    Status
                  </th>
                  <th className="py-3.5 px-4 text-xs font-semibold whitespace-nowrap text-slate-500 tracking-tight">
                    Terakhir Aktif
                  </th>
                  <th className="py-3.5 px-4 text-xs font-semibold whitespace-nowrap text-slate-500 tracking-tight">
                    Terdaftar Pada
                  </th>
                  {canManage && (
                    <th className="py-3.5 px-4 text-xs font-semibold whitespace-nowrap text-right text-slate-500 tracking-tight">
                      Aksi
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDevices.map((device) => {
                  const isActive = device.status === 'ACTIVE';

                  return (
                    <tr 
                      key={device.id} 
                      className="transition-colors hover:bg-slate-100/60"
                    >
                      {/* Device info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                            isActive 
                              ? "bg-blue-50 text-[#0e59f9]" 
                              : "bg-slate-100 text-slate-500"
                          )}>
                            <Tablet className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 text-xs tracking-tight truncate">
                              {device.name}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] text-slate-400 font-mono truncate max-w-[180px]">
                                ID: {device.deviceIdentifier}
                              </span>
                              <span className="text-slate-300 text-[10px]">•</span>
                              <button
                                type="button"
                                onClick={() => copyDeviceId(device.deviceIdentifier)}
                                className="inline-flex items-center gap-1 text-[10px] text-[#0e59f9] hover:text-[#0b4de0] font-medium cursor-pointer hover:underline"
                                title="Salin ID Perangkat"
                              >
                                {copiedId === device.deviceIdentifier ? (
                                  <>
                                    <Check className="w-2.5 h-2.5 text-emerald-600" />
                                    <span>Tersalin</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-2.5 h-2.5" />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Status - Zero Dot Policy */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isActive ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700">
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">
                            Dicabut
                          </span>
                        )}
                      </td>

                      {/* Last Seen */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                        <div className="flex items-center gap-1.5 text-xs">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatDate(device.lastSeenAt)}</span>
                        </div>
                      </td>

                      {/* Registered Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                        <div className="flex items-center gap-1.5 text-xs">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatDate(device.createdAt)}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      {canManage && (
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-8 w-8 p-0 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full cursor-pointer"
                              >
                                <span className="sr-only">Menu aksi</span>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 p-1.5 rounded-2xl shadow-2xl border-none bg-white">
                              <DropdownMenuItem 
                                onClick={() => setSelectedDeviceToRevoke(device)}
                                className="text-xs font-medium py-2 px-3 rounded-xl cursor-pointer text-rose-600 focus:text-rose-600 focus:bg-rose-50 flex items-center gap-2"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Putuskan Perangkat</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* PAIRING MODAL */}
      {/* ========================================================================= */}
      <Dialog open={isPairingModalOpen} onOpenChange={setIsPairingModalOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md p-6 sm:p-7 bg-white border-none rounded-3xl shadow-2xl">
          <DialogHeader className="text-center space-y-1">
            <DialogTitle className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
              Tautkan Perangkat Kasir
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 max-w-xs mx-auto">
              Scan QR Code ini menggunakan kamera aplikasi Menuin POS, atau ketik kode pairing berikut di layar tablet kasir.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center py-4 space-y-5">
            {/* QR Card */}
            <div className="p-4 bg-white border-none shadow-sm-md rounded-2xl">
              {pairingCode && (
                <QRCodeSVG 
                  value={JSON.stringify({ code: pairingCode, outletKey })} 
                  size={180}
                  level="Q"
                />
              )}
            </div>

            {/* Monospace Pairing Code Box */}
            <div className="w-full bg-slate-50/80 border-none rounded-2xl p-4 shadow-sm-md flex flex-col items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Kode Pairing 6 Digit
              </span>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-mono font-bold tracking-widest text-[#0e59f9]">
                  {pairingCode}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={copyPairingCode}
                  className="h-8 px-3 rounded-full text-xs gap-1.5 cursor-pointer border-none bg-white shadow-sm-md hover:bg-slate-100 text-slate-700"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600 font-semibold">Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Salin</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Waiting Beacon */}
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span className="w-2 h-2 rounded-full bg-[#0e59f9] animate-ping" />
              <span>Menunggu sambungan dari perangkat kasir...</span>
            </div>

            <p className="text-[11px] text-slate-400 text-center px-4 leading-relaxed">
              Kode berlaku selama <strong>10 menit</strong>. Jendela dialog ini akan otomatis tertutup begitu perangkat berhasil terhubung.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* REVOKE CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      <Dialog 
        open={Boolean(selectedDeviceToRevoke)} 
        onOpenChange={(open) => { if (!open) setSelectedDeviceToRevoke(null); }}
      >
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md p-6 sm:p-7 bg-white border-none rounded-3xl shadow-2xl">
          <DialogHeader className="text-left space-y-1">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-1">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <DialogTitle className="text-base sm:text-lg font-bold text-slate-900">
              Putuskan Sambungan Perangkat?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Apakah Anda yakin ingin memutuskan sambungan <strong>{selectedDeviceToRevoke?.name}</strong>? 
              Aplikasi kasir pada perangkat ini akan langsung keluar (logout) dan harus ditautkan ulang untuk dapat beroperasi kembali.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4 flex flex-col sm:flex-row gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={isRevoking}
              onClick={() => setSelectedDeviceToRevoke(null)}
              className="h-9 px-4 rounded-full text-xs font-semibold border-none bg-white shadow-sm-md hover:bg-slate-100 text-slate-700 cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="button"
              disabled={isRevoking}
              onClick={handleConfirmRevoke}
              className="h-9 px-4 rounded-full text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-md cursor-pointer border-none"
            >
              {isRevoking ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  <span>Memutuskan...</span>
                </>
              ) : (
                <span>Putuskan Sambungan</span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
