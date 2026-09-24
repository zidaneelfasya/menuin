"use client";

import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeCameraScanConfig } from "html5-qrcode";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Camera, AlertCircle, RefreshCw, X, VideoOff } from "lucide-react";

export interface OrderCameraScannerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (scannedText: string) => void;
}

export function OrderCameraScannerDialog({
  isOpen,
  onClose,
  onScan,
}: OrderCameraScannerDialogProps) {
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = "order-qr-camera-viewport";

  // Cleanup scanner instance safely
  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (err) {
        console.warn("Failed to stop camera scanner cleanly:", err);
      } finally {
        scannerRef.current = null;
        setIsScanning(false);
      }
    }
  };

  // Enumerate cameras and start scanning when dialog opens
  useEffect(() => {
    let isMounted = true;

    if (!isOpen) {
      stopScanner();
      setCameraError(null);
      return;
    }

    const startCamera = async () => {
      setCameraError(null);

      // Brief delay to allow Dialog DOM element to mount
      await new Promise((r) => setTimeout(r, 120));
      if (!isMounted) return;

      const element = document.getElementById(containerId);
      if (!element) return;

      try {
        // Enumerate devices
        const devices = await Html5Qrcode.getCameras();
        if (!isMounted) return;

        if (!devices || devices.length === 0) {
          setCameraError("Tidak ada kamera yang terdeteksi pada perangkat ini.");
          return;
        }

        setCameras(devices);

        // Prefer back camera (environment) if available, otherwise first device
        const backCamera = devices.find((d) =>
          d.label.toLowerCase().includes("back") ||
          d.label.toLowerCase().includes("rear") ||
          d.label.toLowerCase().includes("environment")
        );
        const activeCameraId = selectedCameraId || (backCamera ? backCamera.id : devices[0].id);
        setSelectedCameraId(activeCameraId);

        const html5QrCode = new Html5Qrcode(containerId);
        scannerRef.current = html5QrCode;

        const config: Html5QrcodeCameraScanConfig = {
          fps: 15,
          qrbox: { width: 220, height: 220 },
          aspectRatio: 1.0,
        };

        await html5QrCode.start(
          activeCameraId,
          config,
          (decodedText) => {
            // Successfully scanned
            if (isMounted) {
              stopScanner().then(() => {
                onScan(decodedText.trim());
                onClose();
              });
            }
          },
          () => {
            // Frame scan failure (no QR in frame) - standard ignore
          }
        );

        if (isMounted) {
          setIsScanning(true);
        }
      } catch (err: any) {
        console.error("Camera access error:", err);
        if (isMounted) {
          const errStr = (err?.message || String(err)).toLowerCase();
          if (errStr.includes("permission") || errStr.includes("denied") || errStr.includes("notallowed")) {
            setCameraError("Izin kamera ditolak. Silakan izinkan akses kamera di pengaturan browser Anda.");
          } else {
            setCameraError("Gagal mengakses kamera perangkat. Periksa koneksi kamera atau gunakan scanner barcode fisik.");
          }
        }
      }
    };

    startCamera();

    return () => {
      isMounted = false;
      stopScanner();
    };
  }, [isOpen, selectedCameraId]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xs sm:max-w-sm rounded-3xl p-5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
              <Camera className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold tracking-tight text-foreground">
                Pindai QR Pesanan
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Arahkan kamera ke QR code pesanan pelanggan di kasir.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Viewfinder Area */}
        <div className="relative my-2 w-full aspect-square max-w-[270px] mx-auto rounded-2xl overflow-hidden bg-slate-900 border border-slate-700/60 shadow-inner flex items-center justify-center">
          {/* HTML5 QR Code Mount Node */}
          <div id={containerId} className="w-full h-full object-cover overflow-hidden" />

          {/* Scanner Reticle Overlay (Laser scan guide) */}
          {isScanning && !cameraError && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-48 h-48 border-2 border-dashed border-blue-400/80 rounded-2xl relative">
                {/* Corner Markers */}
                <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-blue-500 rounded-tl-lg" />
                <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-blue-500 rounded-tr-lg" />
                <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-blue-500 rounded-bl-lg" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-blue-500 rounded-br-lg" />

                {/* Animated Laser Scanning Line */}
                <div className="w-full h-0.5 bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.9)] animate-pulse relative top-1/2 -translate-y-1/2" />
              </div>
            </div>
          )}

          {/* Camera Error / Permission Fallback View */}
          {cameraError && (
            <div className="absolute inset-0 bg-slate-900/95 p-4 flex flex-col items-center justify-center text-center space-y-2.5 z-20">
              <div className="w-10 h-10 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center">
                <VideoOff className="w-5 h-5" />
              </div>
              <p className="text-xs font-medium text-slate-300 leading-relaxed max-w-[220px]">
                {cameraError}
              </p>
            </div>
          )}
        </div>

        {/* Camera Selector (If multiple cameras exist) */}
        {cameras.length > 1 && !cameraError && (
          <div className="flex items-center justify-between text-xs px-1">
            <span className="text-muted-foreground">Pilih Kamera:</span>
            <select
              value={selectedCameraId}
              onChange={(e) => {
                stopScanner().then(() => {
                  setSelectedCameraId(e.target.value);
                });
              }}
              className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 max-w-[170px] truncate"
            >
              {cameras.map((c, i) => (
                <option key={c.id} value={c.id}>
                  {c.label || `Kamera ${i + 1}`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Action Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-foreground font-semibold text-xs transition-colors cursor-pointer"
        >
          Tutup
        </button>
      </DialogContent>
    </Dialog>
  );
}
