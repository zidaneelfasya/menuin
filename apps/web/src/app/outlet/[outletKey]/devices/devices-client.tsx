'use client';

import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Loader2
} from 'lucide-react';
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
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Perangkat Kasir
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Kelola tablet, smartphone, dan mesin POS kasir yang terhubung ke outlet ini.
          </p>
        </div>

        {canManage && (
          <Button 
            onClick={handleGenerateCode} 
            disabled={isGenerating}
            className="inline-flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] active:translate-y-0 text-white h-9 px-4 rounded-xl text-xs font-medium transition-all duration-150 ease-out hover:-translate-y-px shadow-xs shrink-0 cursor-pointer"
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
        {/* Card 1: Total Perangkat */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs">
          <p className="text-xs font-medium text-muted-foreground">Total Perangkat</p>
          <p className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 mt-1.5 sm:mt-2">
            {totalCount}
          </p>
        </div>

        {/* Card 2: Perangkat Aktif */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs">
          <p className="text-xs font-medium text-muted-foreground">Perangkat Aktif</p>
          <p className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 mt-1.5 sm:mt-2">
            {activeCount}
          </p>
        </div>

        {/* Card 3: Status Sinkronisasi */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs">
          <p className="text-xs font-medium text-muted-foreground">Status Sinkronisasi</p>
          <p className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 mt-1.5 sm:mt-2">
            {activeCount > 0 ? 'Realtime Sync' : 'Siaga'}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100/80 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700/60 self-start">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer",
              statusFilter === 'ALL'
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-semibold"
                : "text-muted-foreground hover:text-slate-900 dark:hover:text-slate-100"
            )}
          >
            Semua ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('ACTIVE')}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer",
              statusFilter === 'ACTIVE'
                ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs font-semibold"
                : "text-muted-foreground hover:text-slate-900 dark:hover:text-slate-100"
            )}
          >
            Aktif ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('REVOKED')}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer",
              statusFilter === 'REVOKED'
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-semibold"
                : "text-muted-foreground hover:text-slate-900 dark:hover:text-slate-100"
            )}
          >
            Nonaktif ({inactiveCount})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama atau ID perangkat..."
            className="pl-9 h-9 text-xs rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
          />
        </div>
      </div>

      {/* Devices Data Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {filteredDevices.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3">
              <Smartphone className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {searchQuery ? 'Tidak Ada Perangkat yang Cocok' : 'Belum Ada Perangkat Kasir'}
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
              {searchQuery 
                ? 'Coba gunakan kata kunci pencarian lain atau ubah filter status.' 
                : 'Tautkan tablet atau smartphone kasir untuk mulai menjalankan aplikasi POS.'}
            </p>
            {canManage && !searchQuery && (
              <Button 
                onClick={handleGenerateCode} 
                className="mt-4 gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white h-9 px-4 rounded-xl text-xs font-medium cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tautkan Perangkat Pertama</span>
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                  <th className="px-5 py-3.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Perangkat
                  </th>
                  <th className="px-5 py-3.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-5 py-3.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Terakhir Aktif
                  </th>
                  <th className="px-5 py-3.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Terdaftar Pada
                  </th>
                  {canManage && (
                    <th className="px-5 py-3.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-right">
                      Aksi
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                {filteredDevices.map((device) => {
                  const isActive = device.status === 'ACTIVE';

                  return (
                    <tr 
                      key={device.id} 
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      {/* Device info */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                            isActive 
                              ? "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400" 
                              : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                          )}>
                            <Tablet className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 dark:text-slate-100 text-xs truncate">
                              {device.name}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[11px] text-muted-foreground font-mono truncate max-w-[180px]">
                                ID: {device.deviceIdentifier}
                              </span>
                              <button
                                type="button"
                                onClick={() => copyDeviceId(device.deviceIdentifier)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-0.5 rounded cursor-pointer"
                                title="Salin ID Perangkat"
                              >
                                {copiedId === device.deviceIdentifier ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            Dicabut
                          </span>
                        )}
                      </td>

                      {/* Last Seen */}
                      <td className="px-5 py-4 whitespace-nowrap text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>{formatDate(device.lastSeenAt)}</span>
                        </div>
                      </td>

                      {/* Registered Date */}
                      <td className="px-5 py-4 whitespace-nowrap text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>{formatDate(device.createdAt)}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      {canManage && (
                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                              >
                                <MoreVertical className="w-4 h-4 text-slate-500" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 rounded-xl p-1 shadow-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                              <DropdownMenuItem
                                onClick={() => setSelectedDeviceToRevoke(device)}
                                className="flex items-center gap-2 px-3 py-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Putuskan Sambungan</span>
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
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl">
          <DialogHeader className="text-center space-y-1">
            <DialogTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Tautkan Perangkat Kasir
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground max-w-xs mx-auto">
              Scan QR Code ini menggunakan kamera aplikasi Menuin POS, atau ketik kode pairing berikut di layar tablet kasir.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center py-4 space-y-5">
            {/* QR Card */}
            <div className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-sm">
              {pairingCode && (
                <QRCodeSVG 
                  value={JSON.stringify({ code: pairingCode, outletKey })} 
                  size={180}
                  level="Q"
                />
              )}
            </div>

            {/* Monospace Pairing Code Box */}
            <div className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 flex flex-col items-center gap-2">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Kode Pairing 6 Digit
              </span>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-mono font-bold tracking-widest text-blue-600 dark:text-blue-400">
                  {pairingCode}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={copyPairingCode}
                  className="h-8 px-2.5 rounded-lg text-xs gap-1.5 cursor-pointer border-slate-200 dark:border-slate-700"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600 font-medium">Tersalin</span>
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
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
              <span>Menunggu sambungan dari perangkat kasir...</span>
            </div>

            <p className="text-[11px] text-muted-foreground text-center px-4 leading-relaxed">
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
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl">
          <DialogHeader className="text-left space-y-1">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-1">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <DialogTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Putuskan Sambungan Perangkat?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
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
              className="h-9 px-4 rounded-xl text-xs font-medium cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="button"
              disabled={isRevoking}
              onClick={handleConfirmRevoke}
              className="h-9 px-4 rounded-xl text-xs font-medium bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
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
