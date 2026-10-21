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
            className="inline-flex items-center gap-1.5 bg-[#0e59f9] hover:bg-[#0b4de0] text-white h-9 px-5 rounded-full text-xs font-semibold shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tautkan Perangkat Baru</span>
          </Button>
        </div>
      )}

      <div className="rounded-2xl border-none bg-white overflow-hidden shadow-sm-md">
        {devices.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs space-y-2">
            <div className="w-10 h-10 rounded-full bg-[#0e59f9] text-white flex items-center justify-center mx-auto shadow-xs">
              <Laptop className="w-5 h-5" />
            </div>
            <p className="font-semibold text-slate-800">Belum ada perangkat kasir</p>
            <p className="text-slate-500 max-w-sm mx-auto">
              Tautkan tablet atau laptop kasir ke outlet ini untuk mulai memproses pesanan di POS.
            </p>
          </div>
        ) : (
          <div className="relative w-full overflow-x-auto">
            <Table className="w-full text-xs text-left">
              <TableHeader>
                <tr className="bg-slate-50/70 text-slate-500 font-semibold border-b border-slate-100">
                  <TableHead className="px-6 py-3.5 text-xs font-semibold whitespace-nowrap text-slate-500 tracking-tight">Perangkat</TableHead>
                  <TableHead className="px-6 py-3.5 text-xs font-semibold whitespace-nowrap text-slate-500 tracking-tight">Status</TableHead>
                  <TableHead className="px-6 py-3.5 text-xs font-semibold whitespace-nowrap text-slate-500 tracking-tight">Terakhir Aktif</TableHead>
                  <TableHead className="px-6 py-3.5 text-xs font-semibold whitespace-nowrap text-right text-slate-500 tracking-tight">Aksi</TableHead>
                </tr>
              </TableHeader>
              <TableBody className="divide-y divide-slate-100">
                {devices.map((device) => (
                  <TableRow key={device.id} className="h-16 hover:bg-slate-100/60 transition-colors">
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-9 h-9 rounded-full bg-[#0e59f9] text-white shrink-0 shadow-xs">
                          <Laptop className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{device.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">ID: {device.deviceIdentifier}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      {device.status === 'ACTIVE' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border-none">
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border-none">
                          {device.status}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-slate-500 text-xs font-inter">
                      {device.lastSeenAt ? new Date(device.lastSeenAt).toLocaleString('id-ID') : '-'}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right">
                      {canManage && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer">
                              <span className="sr-only">Open menu</span>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-[180px] p-1.5 rounded-2xl shadow-2xl border-none bg-white text-xs">
                            <DropdownMenuItem 
                              onClick={() => handleRevoke(device.id)}
                              className="py-1.5 px-2.5 rounded-xl cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 font-medium"
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
        <DialogContent className="max-w-sm rounded-3xl bg-white border-none p-6 sm:p-7 shadow-2xl">
          <DialogHeader className="text-center">
            <DialogTitle className="text-center font-semibold text-base text-slate-900">
              Tautkan Perangkat Kasir
            </DialogTitle>
            <DialogDescription className="text-center text-xs text-slate-500 mt-1">
              Masukkan kode pairing ini di aplikasi POS atau scan QR Code berikut.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center py-4 space-y-5">
            <div className="p-4 bg-white border-none rounded-2xl shadow-sm-md">
              {pairingCode && (
                <QRCodeSVG 
                  value={JSON.stringify({ code: pairingCode })} 
                  size={160}
                  level="Q"
                />
              )}
            </div>

            <div className="text-center">
              <div className="text-xs text-slate-400 mb-1">Kode Pairing</div>
              <div className="text-3xl font-mono font-semibold tracking-widest text-[#0e59f9]">
                {pairingCode}
              </div>
            </div>
            
            <p className="text-[11px] text-slate-400 text-center px-4 leading-relaxed">
              Kode ini berlaku selama 10 menit. Tampilan akan otomatis tertutup saat perangkat berhasil terhubung.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
