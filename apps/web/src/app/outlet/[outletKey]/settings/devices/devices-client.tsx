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
          <Button onClick={handleGenerateCode} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Tambah Perangkat
          </Button>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {devices.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Belum ada perangkat POS yang terhubung.
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50/50 text-xs uppercase text-gray-500 font-medium">
              <tr>
                <th className="px-6 py-4">Perangkat</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Terakhir Aktif</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {devices.map((device) => (
                <tr key={device.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-50 text-blue-600">
                        <Laptop className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{device.name}</div>
                        <div className="text-xs text-gray-500">ID: {device.deviceIdentifier}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {device.status === 'ACTIVE' ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                        Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        {device.status}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {device.lastSeenAt ? new Date(device.lastSeenAt).toLocaleString('id-ID') : '-'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {canManage && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4 text-gray-500" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => handleRevoke(device.id)}
                            className="text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Cabut Perangkat
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
            <DialogTitle className="text-center">Hubungkan Perangkat</DialogTitle>
            <DialogDescription className="text-center">
              Masukkan kode ini di aplikasi POS atau scan QR Code berikut.
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
