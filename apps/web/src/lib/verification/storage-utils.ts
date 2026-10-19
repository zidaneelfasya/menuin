/**
 * Verification Document Storage Utilities
 * Constants and binary magic-byte validators (non-server-action module).
 */

export const VERIFICATION_BUCKET = 'verification-documents';
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export interface MagicByteValidationResult {
  valid: boolean;
  detectedMime?: string;
  error?: string;
}

/**
 * Validates file binary signatures (magic bytes) to prevent extension spoofing.
 */
export function validateFileMagicBytes(buffer: Buffer): MagicByteValidationResult {
  if (!buffer || buffer.length < 4) {
    return { valid: false, error: 'File tidak valid atau kosong.' };
  }

  // PDF: %PDF- (0x25 0x50 0x44 0x46 0x2D)
  if (
    buffer.length >= 5 &&
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46 &&
    buffer[4] === 0x2d
  ) {
    return { valid: true, detectedMime: 'application/pdf' };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { valid: true, detectedMime: 'image/png' };
  }

  // JPEG: FF D8 FF
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return { valid: true, detectedMime: 'image/jpeg' };
  }

  return {
    valid: false,
    error: 'Format file tidak didukung. Harap unggah dokumen dalam format PDF, PNG, atau JPEG.',
  };
}
