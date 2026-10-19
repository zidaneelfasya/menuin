import { describe, it, expect, vi } from 'vitest';
import { createBusinessProfileSchema, updateOutletComplianceSchema } from '@menuin/validation';

describe('Merchant Verification Schemas & Validation', () => {
  it('validates valid business profile input for PT', () => {
    const input = {
      name: 'PT Digital Solusi Bersama',
      entityType: 'PT',
      taxId: '01.234.567.8-123.000',
      businessLicenseNumber: '9120001234567',
      responsiblePersonName: 'Ahmad Fauzi',
      responsiblePersonNik: '3171012345670001',
      responsiblePersonContact: '081234567890',
      bankName: 'BCA',
      bankAccountNumber: '1234567890',
      bankAccountHolder: 'PT Digital Solusi Bersama',
    };

    const parsed = createBusinessProfileSchema.safeParse(input);
    expect(parsed.success).toBe(true);
  });

  it('rejects invalid NIK (not 16 digits)', () => {
    const input = {
      name: 'Warung Kopi Jaya',
      entityType: 'INDIVIDUAL',
      responsiblePersonName: 'Budi Santoso',
      responsiblePersonNik: '12345', // Invalid
      responsiblePersonContact: '081234567890',
      bankName: 'MANDIRI',
      bankAccountNumber: '9876543210',
      bankAccountHolder: 'Budi Santoso',
    };

    const parsed = createBusinessProfileSchema.safeParse(input);
    expect(parsed.success).toBe(false);
  });

  it('validates outlet compliance input', () => {
    const input = {
      address: 'Jl. Senopati No. 45, Kebayoran Baru',
      city: 'Jakarta Selatan',
      postalCode: '12190',
      latitude: -6.2241,
      longitude: 106.8098,
      storefrontPhotoUrl: 'https://example.com/storefront.jpg',
    };

    const parsed = updateOutletComplianceSchema.safeParse(input);
    expect(parsed.success).toBe(true);
  });

  it('rejects invalid postal code (not 5 digits)', () => {
    const input = {
      address: 'Jl. Senopati No. 45',
      city: 'Jakarta Selatan',
      postalCode: '123', // Invalid
    };

    const parsed = updateOutletComplianceSchema.safeParse(input);
    expect(parsed.success).toBe(false);
  });
});
