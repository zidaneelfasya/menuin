import { describe, expect, it } from 'vitest';
import {
  maskBankAccountNumber,
  calculateNameMatchScore,
} from '@/lib/verification/settlement-utils';
import {
  createSettlementAccountSchema,
  updateOutletComplianceSchema,
} from '@menuin/validation';
import { evaluatePaymentReadiness } from './state-machine';

describe('Settlement Accounts (Pilar 2) - Masking & Security', () => {
  it('masks bank account numbers preserving only last 4 digits', () => {
    expect(maskBankAccountNumber('1234567890')).toBe('•••••• 7890');
    expect(maskBankAccountNumber('5270123456')).toBe('•••••• 3456');
    expect(maskBankAccountNumber('0081234567890123')).toBe('•••••• 0123');
  });

  it('handles short or malformed account numbers safely', () => {
    expect(maskBankAccountNumber('123')).toBe('••••');
    expect(maskBankAccountNumber('')).toBe('••••');
    expect(maskBankAccountNumber('12-34-5678')).toBe('•••••• 5678');
  });
});

describe('Settlement Accounts (Pilar 2) - Name Matching Intelligence', () => {
  it('gives 100% score for exact match (case-insensitive and trimmed)', () => {
    const score = calculateNameMatchScore('ZIDANE ELFASYA', 'zidane elfasya');
    expect(score).toBe(100);
  });

  it('gives high score (>= 80%) for token order variation (Indonesian name permutations)', () => {
    const score = calculateNameMatchScore('ZIDANE ELFASYA', 'ELFASYA ZIDANE');
    expect(score).toBeGreaterThanOrEqual(80);
  });

  it('gives acceptable score (>= 65%) when middle name or title is omitted', () => {
    const score = calculateNameMatchScore('MUHAMMAD ZIDANE ELFASYA', 'ZIDANE ELFASYA');
    expect(score).toBeGreaterThanOrEqual(65);
  });

  it('gives low score (< 50%) for completely different identities', () => {
    const score = calculateNameMatchScore('BUDI SANTOSO', 'PT ANUGERAH KITA');
    expect(score).toBeLessThan(50);
  });
});

describe('Settlement Accounts & Outlet Compliance Validation Schemas', () => {
  it('validates correct settlement account creation payload', () => {
    const valid = createSettlementAccountSchema.safeParse({
      businessProfileId: 'cbdf5d14-19ac-4fb7-821c-9da2e987a479',
      bankName: 'BCA',
      bankAccountNumber: '1234567890',
      bankAccountHolder: 'ZIDANE ELFASYA',
      isDefault: true,
    });
    expect(valid.success).toBe(true);
  });

  it('rejects invalid bank names or short account numbers', () => {
    const invalidBank = createSettlementAccountSchema.safeParse({
      businessProfileId: 'cbdf5d14-19ac-4fb7-821c-9da2e987a479',
      bankName: 'B', // Too short (< 2 chars)
      bankAccountNumber: '1234567890',
      bankAccountHolder: 'ZIDANE ELFASYA',
    });
    expect(invalidBank.success).toBe(false);

    const invalidAccNumber = createSettlementAccountSchema.safeParse({
      businessProfileId: 'cbdf5d14-19ac-4fb7-821c-9da2e987a479',
      bankName: 'BCA',
      bankAccountNumber: '12', // Too short (< 4 chars)
      bankAccountHolder: 'ZIDANE ELFASYA',
    });
    expect(invalidAccNumber.success).toBe(false);
  });

  it('validates outlet compliance with indoorPhotoUrl and mapsUrl', () => {
    const valid = updateOutletComplianceSchema.safeParse({
      address: 'Jl. Malioboro No. 12',
      city: 'Yogyakarta',
      postalCode: '55271',
      latitude: -7.7928,
      longitude: 110.3658,
      mapsUrl: 'https://maps.google.com/?q=-7.7928,110.3658',
      storefrontPhotoUrl: 'https://storage.menuin.id/photos/front.jpg',
      indoorPhotoUrl: 'https://storage.menuin.id/photos/indoor.jpg',
      settlementAccountId: 'a1b2c3d4-19ac-4fb7-821c-9da2e987a479',
    });
    expect(valid.success).toBe(true);
  });
});

describe('evaluatePaymentReadiness with 3 Pillars', () => {
  it('returns READY when all 3 pillars and platform settings are verified', () => {
    const result = evaluatePaymentReadiness({
      businessProfileStatus: 'verified',
      settlementAccountStatus: 'verified',
      outletComplianceStatus: 'verified',
      dokuSubAccountId: 'SAC-1234',
      dokuSubAccountStatus: 'ACTIVE',
      onlinePaymentEnabled: true,
      isPlatformConfigured: true,
    });

    expect(result.isReady).toBe(true);
    expect(result.status).toBe('READY');
    expect(result.settlementAccountVerified).toBe(true);
    expect(result.reasons).toHaveLength(0);
  });

  it('blocks readiness when settlement account (Pilar 2) is pending', () => {
    const result = evaluatePaymentReadiness({
      businessProfileStatus: 'verified',
      settlementAccountStatus: 'pending',
      outletComplianceStatus: 'verified',
      dokuSubAccountId: 'SAC-1234',
      dokuSubAccountStatus: 'ACTIVE',
      onlinePaymentEnabled: true,
      isPlatformConfigured: true,
    });

    expect(result.isReady).toBe(false);
    expect(result.settlementAccountVerified).toBe(false);
    expect(result.reasons.some((r) => r.includes('settlement'))).toBe(true);
  });

  it('blocks readiness when settlement account (Pilar 2) is rejected', () => {
    const result = evaluatePaymentReadiness({
      businessProfileStatus: 'verified',
      settlementAccountStatus: 'rejected',
      outletComplianceStatus: 'verified',
      dokuSubAccountId: 'SAC-1234',
      dokuSubAccountStatus: 'ACTIVE',
      onlinePaymentEnabled: true,
      isPlatformConfigured: true,
    });

    expect(result.isReady).toBe(false);
    expect(result.settlementAccountVerified).toBe(false);
    expect(result.reasons.some((r) => r.includes('settlement'))).toBe(true);
  });
});
