'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
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
  MoreVertical, 
  Laptop, 
  Smartphone, 
  Trash2 
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
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Device {
  id: string;
  name: string;
  deviceIdentifier: string;
  status: string;
  lastSeenAt: Date | null;
  createdAt: Date;
}

export function DevicesClient({ initialDevices, canManage }: { initialDevices: Device[], canManage: boolean }) {
  const [devices, setDevices] = useState(initialDevices);
  const [isPairingModalOpen, setIsPairingModalOpen] = useState(false);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Polling for device updates while modal is open
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPairingModalOpen && pairingCode) {
      interval = setInterval(() => {
        router.refresh();
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isPairingModalOpen, pairingCode, router]);

  // Update local state when initialDevices changes (from router.refresh)
  useEffect(() => {
    setDevices(initialDevices);
  }, [initialDevices]);

  const handleGenerateCode = async () => {
    setIsLoading(true);
    const res = await generatePairingCodeAction();
    setIsLoading(false);
    
    if (res.error) {
      toast.error(res.error);
    } else if (res.code) {
      setPairingCode(res.code);
      setIsPairingModalOpen(true);
    }
  };

  const handleRevoke = async (deviceId: string) => {
    if (!confirm('Apakah Anda yakin ingin mencabut perangkat ini? Perangkat akan otomatis terkeluar (logout).')) return;
    
    const res = await revokeDeviceAction(deviceId);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success('Perangkat berhasil dicabut.');
    }
  };

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex justify-end">
          <Button 
            onClick={handleGenerateCode} 
            disabled={isLoading} 
            className="inline-flex items-center gap-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white h-9 px-4 rounded-xl text-xs font-medium transition-all duration-150 ease-out hover:-translate-y-px shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tautkan Perangkat Baru</span>
          </Button>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden shadow-xs">
        {devices.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-xs space-y-2">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
              <Laptop className="w-5 h-5" />
            </div>
            <p className="font-medium text-slate-800 dark:text-slate-200">Belum ada perangkat kasir</p>
            <p className="text-muted-foreground max-w-sm mx-auto">
              Tautkan tablet atau laptop kasir ke outlet ini untuk mulai memproses pesanan di POS.
            </p>
          </div>
        ) : (
          <div className="relative w-full overflow-x-auto">
            <Table className="w-full text-xs text-left">
              <TableHeader>
                <tr className="bg-slate-50/70 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200/80 dark:border-slate-800">
                  <TableHead className="px-6 py-3.5 text-xs font-semibold whitespace-nowrap text-slate-500 dark:text-slate-400 tracking-tight">Perangkat</TableHead>
                  <TableHead className="px-6 py-3.5 text-xs font-semibold whitespace-nowrap text-slate-500 dark:text-slate-400 tracking-tight">Status</TableHead>
                  <TableHead className="px-6 py-3.5 text-xs font-semibold whitespace-nowrap text-slate-500 dark:text-slate-400 tracking-tight">Terakhir Aktif</TableHead>
                  <TableHead className="px-6 py-3.5 text-xs font-semibold whitespace-nowrap text-right text-slate-500 dark:text-slate-400 tracking-tight">Aksi</TableHead>
                </tr>
              </TableHeader>
              <TableBody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {devices.map((device) => (
                  <TableRow key={device.id} className="h-16 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-colors">
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 shrink-0">
                          <Laptop className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-medium text-slate-900 dark:text-slate-100">{device.name}</div>
                          <div className="text-[11px] text-muted-foreground font-mono">ID: {device.deviceIdentifier}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      {device.status === 'ACTIVE' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-100/80 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-none">
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-none">
                          {device.status}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-muted-foreground text-xs font-inter">
                      {device.lastSeenAt ? new Date(device.lastSeenAt).toLocaleString('id-ID') : '-'}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right">
                      {canManage && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer">
                              <span className="sr-only">Open menu</span>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-[180px] p-1 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs">
                            <DropdownMenuItem 
                              onClick={() => handleRevoke(device.id)}
                              className="py-1.5 px-2.5 rounded-lg cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/40 font-medium"
                            >
                              <Trash2 className="mr-2 h-3.5 w-3.5 text-red-600" />
                              Putuskan Sambungan
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={isPairingModalOpen} onOpenChange={setIsPairingModalOpen}>
        <DialogContent className="max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl">
          <DialogHeader className="text-center">
            <DialogTitle className="text-center font-semibold text-base text-slate-900 dark:text-slate-100">
              Tautkan Perangkat Kasir
            </DialogTitle>
            <DialogDescription className="text-center text-xs text-muted-foreground mt-1">
              Masukkan kode pairing ini di aplikasi POS atau scan QR Code berikut.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center py-4 space-y-5">
            <div className="p-4 bg-white border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
              {pairingCode && (
                <QRCodeSVG 
                  value={JSON.stringify({ code: pairingCode })} 
                  size={160}
                  level="Q"
                />
              )}
            </div>

            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">Kode Pairing</div>
              <div className="text-3xl font-mono font-semibold tracking-widest text-blue-600 dark:text-blue-400">
                {pairingCode}
              </div>
            </div>
            
            <p className="text-[11px] text-muted-foreground text-center px-4 leading-relaxed">
              Kode ini berlaku selama 10 menit. Tampilan akan otomatis tertutup saat perangkat berhasil terhubung.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
