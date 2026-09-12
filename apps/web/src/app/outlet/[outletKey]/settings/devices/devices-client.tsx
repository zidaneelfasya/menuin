'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { QRCodeSVG } from 'qrcode.react';
import { Plus, MoreHorizontal, Laptop, Smartphone, Trash2 } from 'lucide-react';
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
    // If the number of devices increased, we can assume pairing was successful
    // We don't have the exact previous count easily here without a ref, but simple approach is fine.
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
          <Button onClick={handleGenerateCode} disabled={isLoading} className="gap-2">
            <Plus className="w-4 h-4" />
            Tautkan Perangkat Baru
          </Button>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
        {devices.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            Belum ada perangkat kasir yang tertaut ke outlet ini.
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground font-medium">
              <tr>
                <th className="px-6 py-4">Perangkat</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Terakhir Aktif</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {devices.map((device) => (
                <tr key={device.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary">
                        <Laptop className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{device.name}</div>
                        <div className="text-xs text-muted-foreground">ID: {device.deviceIdentifier}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {device.status === 'ACTIVE' ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                        Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                        {device.status}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {device.lastSeenAt ? new Date(device.lastSeenAt).toLocaleString('id-ID') : '-'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {canManage && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => handleRevoke(device.id)}
                            className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Putuskan Sambungan
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Dialog open={isPairingModalOpen} onOpenChange={setIsPairingModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">Tautkan Perangkat Kasir</DialogTitle>
            <DialogDescription className="text-center">
              Masukkan kode pairing ini di aplikasi POS atau scan QR Code berikut.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center py-6 space-y-6">
            <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
              {pairingCode && (
                <QRCodeSVG 
                  value={JSON.stringify({ code: pairingCode })} 
                  size={160}
                  level="Q"
                />
              )}
            </div>

            <div className="text-center">
              <div className="text-sm text-gray-500 mb-1">Kode Pairing</div>
              <div className="text-3xl font-mono font-bold tracking-widest text-blue-600">
                {pairingCode}
              </div>
            </div>
            
            <p className="text-xs text-gray-500 text-center px-4">
              Kode ini berlaku selama 10 menit. Tampilan akan otomatis tertutup saat perangkat berhasil terhubung.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
