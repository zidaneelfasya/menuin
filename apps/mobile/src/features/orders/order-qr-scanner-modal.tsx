import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  Animated,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  Camera,
  Flashlight,
  FlashlightOff,
  SwitchCamera,
  Search,
  QrCode,
  CheckCircle2,
} from 'lucide-react-native';

export interface OrderQrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (scannedText: string) => void;
  isSearching?: boolean;
}

export function OrderQrScannerModal({
  isOpen,
  onClose,
  onScan,
  isSearching = false,
}: OrderQrScannerModalProps) {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [scannedFeedback, setScannedFeedback] = useState<string | null>(null);

  const isScanningLockedRef = useRef(false);
  const laserAnim = useRef(new Animated.Value(0)).current;

  // Animate laser up and down continuously
  useEffect(() => {
    if (!isOpen) {
      isScanningLockedRef.current = false;
      setScannedFeedback(null);
      setManualCode('');
      setTorchEnabled(false);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(laserAnim, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(laserAnim, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [isOpen, laserAnim]);

  const handleBarcodeScanned = useCallback(
    ({ data }: { data: string }) => {
      if (!data || isScanningLockedRef.current || isSearching) return;
      isScanningLockedRef.current = true;
      setScannedFeedback(data);

      // Trigger callback with raw scanned text
      onScan(data.trim());

      // Auto unlock after a delay if needed
      setTimeout(() => {
        isScanningLockedRef.current = false;
      }, 1500);
    },
    [onScan, isSearching]
  );

  const handleManualSubmit = () => {
    const trimmed = manualCode.trim();
    if (!trimmed || isSearching) return;
    isScanningLockedRef.current = true;
    setScannedFeedback(trimmed);
    onScan(trimmed);
  };

  const handleToggleTorch = () => {
    setTorchEnabled((prev) => !prev);
  };

  const handleToggleFacing = () => {
    setFacing((prev) => (prev === 'back' ? 'front' : 'back'));
  };

  const laserTranslateY = laserAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [12, 168],
  });

  if (!isOpen) return null;

  return (
    <Modal
      visible={isOpen}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View className="flex-1 bg-slate-50">
        {/* Top Header Bar */}
        <View
          style={{ paddingTop: Math.max(insets.top, 16) }}
          className="px-4 pb-3 flex-row items-center justify-between z-30 bg-white border-b border-slate-200 shadow-xs"
        >
          <View className="flex-row items-center gap-2.5">
            <View className="w-9 h-9 rounded-xl bg-blue-50 items-center justify-center border border-blue-100">
              <Camera size={19} color="#2563eb" />
            </View>
            <View>
              <Text className="text-sm font-semibold text-slate-900 tracking-tight">
                Pindai QR Pesanan
              </Text>
              <Text className="text-[11px] text-slate-500 font-normal">
                Arahkan kamera ke QR code pesanan pelanggan di kasir.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.7}
            className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 items-center justify-center active:bg-slate-200"
          >
            <X size={18} color="#475569" />
          </TouchableOpacity>
        </View>

        {/* Center Content: Framed Camera Box (Matching Web Modal) */}
        <View className="flex-1 items-center justify-center px-4 py-3 bg-slate-50">
          {!permission?.granted ? (
            /* Permission Request Fallback (Light Card) */
            <View className="w-full max-w-[270px] p-6 items-center justify-center text-center space-y-3 bg-white rounded-3xl border border-slate-200 shadow-sm">
              <View className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 items-center justify-center mb-1">
                <Camera size={28} color="#2563eb" />
              </View>
              <Text className="text-base font-semibold text-slate-900 text-center">
                Izin Kamera Diperlukan
              </Text>
              <Text className="text-xs text-slate-500 text-center leading-relaxed font-normal">
                Aktifkan izin kamera untuk memindai kode QR pesanan pelanggan saat pembayaran kasir.
              </Text>
              <TouchableOpacity
                onPress={requestPermission}
                activeOpacity={0.8}
                className="mt-3 px-5 py-2.5 bg-blue-600 active:bg-blue-700 rounded-xl flex-row items-center gap-2 shadow-xs"
              >
                <Camera size={16} color="#ffffff" />
                <Text className="text-xs font-semibold text-white">
                  Berikan Izin Kamera
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Kotak Kedua: Pembatas Kamera (Outer Bounded Box like Web) */}
              <View className="w-[270px] h-[270px] rounded-3xl overflow-hidden bg-slate-900 border-2 border-slate-200 shadow-sm relative items-center justify-center">
                {/* Live Camera View - clipped strictly inside outer box */}
                <CameraView
                  style={StyleSheet.absoluteFill}
                  facing={facing}
                  enableTorch={torchEnabled}
                  barcodeScannerSettings={{
                    barcodeTypes: ['qr', 'code128', 'ean13'],
                  }}
                  onBarcodeScanned={
                    isScanningLockedRef.current ? undefined : handleBarcodeScanned
                  }
                />

                {/* Kotak Pertama: Kotak untuk Scan / Reticle Target (Dashed Blue Box like Web) */}
                <View className="w-48 h-48 border-2 border-dashed border-blue-400/80 rounded-2xl relative items-center justify-center">
                  {/* Corner Markers */}
                  <View className="absolute -top-1 -left-1 w-5 h-5 border-t-2 border-l-2 border-blue-500 rounded-tl-lg" />
                  <View className="absolute -top-1 -right-1 w-5 h-5 border-t-2 border-r-2 border-blue-500 rounded-tr-lg" />
                  <View className="absolute -bottom-1 -left-1 w-5 h-5 border-b-2 border-l-2 border-blue-500 rounded-bl-lg" />
                  <View className="absolute -bottom-1 -right-1 w-5 h-5 border-b-2 border-r-2 border-blue-500 rounded-br-lg" />

                  {/* Animated Laser Scanning Line */}
                  {!scannedFeedback && (
                    <Animated.View
                      style={{
                        transform: [{ translateY: laserTranslateY }],
                      }}
                      className="absolute left-2 right-2 h-0.5 bg-blue-500 shadow-md shadow-blue-500"
                    />
                  )}

                  {/* Scanned / Searching Feedback inside reticle */}
                  {isSearching && (
                    <View className="bg-white/95 px-3.5 py-2 rounded-xl flex-row items-center gap-2 border border-slate-200 shadow-md">
                      <ActivityIndicator size="small" color="#2563eb" />
                      <Text className="text-xs font-semibold text-slate-800">
                        Mencari Pesanan...
                      </Text>
                    </View>
                  )}

                  {scannedFeedback && !isSearching && (
                    <View className="bg-emerald-600 px-3.5 py-1.5 rounded-xl flex-row items-center gap-1.5 border border-emerald-500 shadow-md">
                      <CheckCircle2 size={16} color="#ffffff" />
                      <Text className="text-xs font-semibold text-white font-mono">
                        QR Terbaca
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Guidance Text Below Camera Box */}
              <Text className="text-center text-xs text-slate-500 font-normal mt-3.5 mb-2.5">
                Arahkan QR pelanggan atau struk ke dalam kotak bidik
              </Text>

              {/* Quick Camera Action Controls (White pills on light background) */}
              <View className="flex-row items-center gap-2">
                <TouchableOpacity
                  onPress={handleToggleTorch}
                  activeOpacity={0.7}
                  className={`px-3 py-1.5 rounded-full flex-row items-center gap-1.5 border shadow-xs ${
                    torchEnabled
                      ? 'bg-amber-500 border-amber-400'
                      : 'bg-white border-slate-200 active:bg-slate-100'
                  }`}
                >
                  {torchEnabled ? (
                    <Flashlight size={14} color="#ffffff" />
                  ) : (
                    <FlashlightOff size={14} color="#64748b" />
                  )}
                  <Text
                    className={`text-[11px] font-semibold ${
                      torchEnabled ? 'text-white' : 'text-slate-600'
                    }`}
                  >
                    {torchEnabled ? 'Flash Nyala' : 'Flash'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleToggleFacing}
                  activeOpacity={0.7}
                  className="px-3 py-1.5 rounded-full flex-row items-center gap-1.5 bg-white border border-slate-200 shadow-xs active:bg-slate-100"
                >
                  <SwitchCamera size={14} color="#64748b" />
                  <Text className="text-[11px] font-semibold text-slate-600">
                    Ganti Kamera
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        {/* Bottom Panel: Manual Input Option (Raised up with generous padding to prevent cutoff) */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ paddingBottom: Math.max(insets.bottom, 24) + 16 }}
          className="bg-white border-t border-slate-200 px-4 pt-4 shadow-sm"
        >
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Atau Input Manual
            </Text>
            {isSearching && (
              <View className="flex-row items-center gap-1.5">
                <ActivityIndicator size="small" color="#2563eb" />
                <Text className="text-[11px] font-medium text-blue-600">
                  Memproses...
                </Text>
              </View>
            )}
          </View>

          <View className="flex-row items-center gap-2 mb-8 sm:mb-0">
            <View className="flex-1 flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus:border-blue-500">
              <Search size={15} color="#94a3b8" />
              <TextInput
                placeholder="Contoh: ORD-12345 atau UUID..."
                placeholderTextColor="#94a3b8"
                value={manualCode}
                onChangeText={setManualCode}
                onSubmitEditing={handleManualSubmit}
                returnKeyType="search"
                autoCapitalize="characters"
                autoCorrect={false}
                className="flex-1 ml-2 text-xs font-semibold text-slate-900 py-1 font-mono"
              />
              {manualCode.length > 0 && (
                <TouchableOpacity onPress={() => setManualCode('')} className="p-1">
                  <X size={14} color="#94a3b8" />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              onPress={handleManualSubmit}
              disabled={!manualCode.trim() || isSearching}
              activeOpacity={0.8}
              className={`px-4 py-2.5 rounded-xl flex-row items-center gap-1.5 ${
                manualCode.trim() && !isSearching
                  ? 'bg-blue-600 active:bg-blue-700 shadow-xs'
                  : 'bg-slate-100 border border-slate-200'
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  manualCode.trim() && !isSearching
                    ? 'text-white'
                    : 'text-slate-400'
                }`}
              >
                Cari
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

export default OrderQrScannerModal;
