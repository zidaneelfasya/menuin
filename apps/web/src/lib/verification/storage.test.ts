import { describe, it, expect } from 'vitest';
import { validateFileMagicBytes } from './storage-utils';

describe('validateFileMagicBytes', () => {
  it('identifies PDF magic bytes (%PDF-)', () => {
    const pdfHeader = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);
    const result = validateFileMagicBytes(pdfHeader);
    expect(result.valid).toBe(true);
    expect(result.detectedMime).toBe('application/pdf');
  });

  it('identifies PNG magic bytes', () => {
    const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
    const result = validateFileMagicBytes(pngHeader);
    expect(result.valid).toBe(true);
    expect(result.detectedMime).toBe('image/png');
  });

  it('identifies JPEG magic bytes', () => {
    const jpegHeader = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    const result = validateFileMagicBytes(jpegHeader);
    expect(result.valid).toBe(true);
    expect(result.detectedMime).toBe('image/jpeg');
  });

  it('rejects executable / non-allowed formats (e.g. MZ EXE, ELF, plain text)', () => {
    const exeHeader = Buffer.from([0x4d, 0x5a, 0x90, 0x00]); // MZ
    const resultExe = validateFileMagicBytes(exeHeader);
    expect(resultExe.valid).toBe(false);

    const txtHeader = Buffer.from('hello world this is plain text');
    const resultTxt = validateFileMagicBytes(txtHeader);
    expect(resultTxt.valid).toBe(false);
  });

  it('rejects empty or truncated buffers', () => {
    const empty = Buffer.from([]);
    const resultEmpty = validateFileMagicBytes(empty);
    expect(resultEmpty.valid).toBe(false);

    const tiny = Buffer.from([0x25, 0x50]);
    const resultTiny = validateFileMagicBytes(tiny);
    expect(resultTiny.valid).toBe(false);
  });
});
