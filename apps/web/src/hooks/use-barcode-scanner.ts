import { useEffect, useRef } from 'react';

type UseBarcodeScannerOptions = {
  onScan: (barcode: string) => void;
  latency?: number; // Max time between keystrokes in ms (default: 50)
  minLength?: number; // Minimum length of barcode (default: 5)
};

export function useBarcodeScanner({
  onScan,
  latency = 50,
  minLength = 5,
}: UseBarcodeScannerOptions) {
  const buffer = useRef<string>('');
  const lastKeyTime = useRef<number>(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input field (except if it's the barcode scanner bypassing it)
      // Actually, if the barcode scanner types into an input field, we still want to capture it.
      // But we shouldn't interfere with normal user typing. The latency check handles this.
      
      const currentTime = performance.now();
      const timeDiff = currentTime - lastKeyTime.current;

      // If time between keystrokes is greater than latency, reset buffer
      if (timeDiff > latency) {
        buffer.current = '';
      }

      // If Enter is pressed, check if buffer is valid barcode
      if (e.key === 'Enter') {
        if (buffer.current.length >= minLength) {
          // Valid barcode scan
          onScan(buffer.current);
          buffer.current = ''; // Reset after scan
          e.preventDefault(); // Prevent form submission if in input
          e.stopPropagation();
        } else {
          // Reset buffer if Enter pressed but not long enough
          buffer.current = '';
        }
      } 
      // If it's a printable character (length 1) and no modifier keys
      else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        buffer.current += e.key;
      }

      lastKeyTime.current = currentTime;
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });

    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [onScan, latency, minLength]);
}
