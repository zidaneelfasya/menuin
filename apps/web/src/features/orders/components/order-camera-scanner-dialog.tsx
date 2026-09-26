"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import jsQR from "jsqr";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Camera, VideoOff } from "lucide-react";

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

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const isMountedRef = useRef(false);
  const hasScannedRef = useRef(false);
  const isStartingRef = useRef(false);

  // Directly and unconditionally stop all tracks on the active MediaStream
  const stopCamera = useCallback(() => {
    // 1. Cancel the scan frame request immediately
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // 2. Explicitly stop every track on the hardware MediaStream
    if (streamRef.current) {
      try {
        const tracks = streamRef.current.getTracks();
        tracks.forEach((track) => {
          track.enabled = false;
          track.stop();
        });
      } catch (err) {
        console.warn("Failed to stop media track:", err);
      }
      streamRef.current = null;
    }

    // 3. Clear video element source and pause
    if (videoRef.current) {
      try {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
      } catch (_) {}
    }

    setIsScanning(false);
  }, []);

  // Handle closing modal
  const handleClose = useCallback(() => {
    stopCamera();
    onClose();
  }, [stopCamera, onClose]);

  // Frame scanner loop using native BarcodeDetector if available, falling back to jsQR
  const startScanLoop = useCallback(() => {
    let nativeDetector: any = null;
    if (typeof window !== "undefined" && "BarcodeDetector" in window) {
      try {
        nativeDetector = new (window as any).BarcodeDetector({
          formats: ["qr_code"],
        });
      } catch (_) {
        nativeDetector = null;
      }
    }

    let lastScanTime = 0;
    const scanIntervalMs = 70; // 70ms interval = ~14 FPS scan rate, buttery smooth and zero lag

    const tick = async (currentTime: number) => {
      if (hasScannedRef.current || !streamRef.current || !isMountedRef.current) {
        return;
      }

      const video = videoRef.current;
      if (
        video &&
        video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
        currentTime - lastScanTime >= scanIntervalMs
      ) {
        lastScanTime = currentTime;

        try {
          let detectedText: string | null = null;

          // Strategy 1: Native BarcodeDetector (Chrome/Edge hardware accelerated C++)
          if (nativeDetector) {
            const barcodes = await nativeDetector.detect(video);
            if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
              detectedText = barcodes[0].rawValue;
            }
          }

          // Strategy 2: Fast lightweight jsQR pure JS engine fallback
          if (!detectedText) {
            if (!canvasRef.current) {
              canvasRef.current = document.createElement("canvas");
            }
            const canvas = canvasRef.current;
            const ctx = canvas.getContext("2d", { willReadFrequently: true });
            if (ctx && video.videoWidth > 0 && video.videoHeight > 0) {
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "dontInvert",
              });
              if (qrCode && qrCode.data) {
                detectedText = qrCode.data;
              }
            }
          }

          // Process detected QR code
          if (detectedText && !hasScannedRef.current) {
            hasScannedRef.current = true;
            // IMMEDIATELY KILL HARDWARE CAMERA STREAM BEFORE CALLING HANDLERS
            stopCamera();
            onScan(detectedText.trim());
            onClose();
            return;
          }
        } catch (_) {
          // Ignore individual frame decoding errors
        }
      }

      if (!hasScannedRef.current && streamRef.current && isMountedRef.current) {
        animationFrameRef.current = requestAnimationFrame(tick);
      }
    };

    animationFrameRef.current = requestAnimationFrame(tick);
  }, [onClose, onScan, stopCamera]);

  // Start camera device and attach to video element
  const startCamera = useCallback(
    async (deviceIdToUse?: string) => {
      if (isStartingRef.current) return;
      isStartingRef.current = true;
      setCameraError(null);
      hasScannedRef.current = false;

      // Stop any existing stream before starting a new one
      stopCamera();

      try {
        if (!navigator?.mediaDevices?.getUserMedia) {
          setCameraError("Browser Anda tidak mendukung akses kamera.");
          return;
        }

        const constraints: MediaStreamConstraints = {
          audio: false,
          video: deviceIdToUse
            ? { deviceId: { exact: deviceIdToUse } }
            : {
                facingMode: { ideal: "environment" },
                width: { ideal: 1280 },
                height: { ideal: 720 },
              },
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        // If component unmounted while awaiting stream, terminate it immediately
        if (!isMountedRef.current) {
          stream.getTracks().forEach((track) => {
            track.enabled = false;
            track.stop();
          });
          return;
        }

        streamRef.current = stream;

        // Bind stream to video element
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch((err) => {
            console.warn("Video playback was interrupted:", err);
          });
        }

        // Enumerate video devices so user can switch between cameras
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoDevices = devices
            .filter((d) => d.kind === "videoinput")
            .map((d, index) => ({
              id: d.deviceId,
              label: d.label || `Kamera ${index + 1}`,
            }));
          setCameras(videoDevices);

          if (!deviceIdToUse) {
            const activeTrack = stream.getVideoTracks()[0];
            const settings = activeTrack?.getSettings();
            if (settings?.deviceId) {
              setSelectedCameraId(settings.deviceId);
            }
          }
        } catch (_) {}

        setIsScanning(true);
        startScanLoop();
      } catch (err: any) {
        console.error("Camera access error:", err);
        stopCamera();
        if (isMountedRef.current) {
          const errStr = (err?.message || String(err)).toLowerCase();
          if (
            errStr.includes("permission") ||
            errStr.includes("denied") ||
            errStr.includes("notallowed")
          ) {
            setCameraError(
              "Izin kamera ditolak. Silakan izinkan akses kamera di pengaturan browser Anda."
            );
          } else {
            setCameraError(
              "Gagal mengakses kamera perangkat. Periksa koneksi kamera atau gunakan scanner barcode fisik."
            );
          }
        }
      } finally {
        isStartingRef.current = false;
      }
    },
    [startScanLoop, stopCamera]
  );

  const selectedCameraIdRef = useRef(selectedCameraId);
  useEffect(() => {
    selectedCameraIdRef.current = selectedCameraId;
  }, [selectedCameraId]);

  // Manage camera lifecycle based on isOpen prop
  useEffect(() => {
    isMountedRef.current = true;

    if (isOpen) {
      startCamera(selectedCameraIdRef.current || undefined);
    } else {
      stopCamera();
      setCameraError(null);
    }

    return () => {
      isMountedRef.current = false;
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          handleClose();
        }
      }}
    >
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
          {/* Direct HTML5 Video Stream Node */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />

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
                const newCameraId = e.target.value;
                setSelectedCameraId(newCameraId);
                startCamera(newCameraId);
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
          onClick={handleClose}
          className="w-full h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-foreground font-semibold text-xs transition-colors cursor-pointer"
        >
          Tutup
        </button>
      </DialogContent>
    </Dialog>
  );
}
