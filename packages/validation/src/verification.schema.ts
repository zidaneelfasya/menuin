import { z } from 'zod';

export const entityTypeEnum = z.enum(['INDIVIDUAL', 'PT', 'CV', 'YAYASAN', 'KOPERASI']);

export const documentTypeEnum = z.enum([
  'KTP',
  'NPWP',
  'NIB',
  'AKTA',
  'BUKU_TABUNGAN',
  'FOTO_TAMPAK_DEPAN',
  'FOTO_KASIR',
  'IZIN_LOKASI',
]);

export const documentScopeEnum = z.enum(['BUSINESS_PROFILE', 'SETTLEMENT_ACCOUNT', 'OUTLET']);

export const documentReviewStatusEnum = z.enum(['PENDING', 'ACCEPTED', 'REJECTED']);

export const supportedBankEnum = z.enum([
  'BCA',
  'MANDIRI',
  'BRI',
  'BNI',
  'CIMB',
  'PERMATA',
  'DANAMON',
  'BSI',
  'OTHER',
]);

// Indonesian NIK validator: 16 digits
export const nikRegex = /^\d{16}$/;

// Indonesian NPWP validator: 15 or 16 digits, with or without dots/dashes
export const npwpRegex = /^[0-9.\-]{15,20}$/;

export const createBusinessProfileSchema = z.object({
  name: z.string().trim().min(3, 'Nama badan usaha/merek minimal 3 karakter').max(100, 'Nama maksimal 100 karakter'),
  entityType: entityTypeEnum,
  taxId: z.string().trim().regex(npwpRegex, 'Format NPWP tidak valid').optional().nullable(),
  businessLicenseNumber: z.string().trim().min(9, 'Nomor Induk Berusaha (NIB) minimal 9 digit').max(20).optional().nullable(),
  responsiblePersonName: z.string().trim().min(3, 'Nama penanggung jawab minimal 3 karakter').max(100),
  responsiblePersonNik: z.string().trim().regex(nikRegex, 'NIK harus 16 digit angka'),
  responsiblePersonContact: z.string().trim().min(8, 'Nomor kontak tidak valid').max(20),
  responsiblePersonPosition: z.string().trim().max(100).optional().nullable(),
  responsiblePersonEmail: z.string().trim().email('Format email tidak valid').optional().nullable().or(z.literal('')),
  responsiblePersonNationality: z.string().trim().max(100).optional().nullable(),
  responsiblePersonPhone: z.string().trim().max(20).optional().nullable(),
  bankName: z.string().trim().min(2, 'Nama bank wajib diisi').max(50).optional().nullable(),
  bankAccountNumber: z.string().trim().min(4, 'Nomor rekening minimal 4 digit').max(30).optional().nullable(),
  bankAccountHolder: z.string().trim().min(2, 'Nama pemilik rekening wajib diisi').max(100).optional().nullable(),
});

export const createSettlementAccountSchema = z.object({
  businessProfileId: z.string().uuid('ID Profil Bisnis tidak valid'),
  bankName: z.string().trim().min(2, 'Nama bank wajib diisi').max(50),
  bankAccountNumber: z.string().trim().min(4, 'Nomor rekening minimal 4 digit').max(30),
  bankAccountHolder: z.string().trim().min(2, 'Nama pemilik rekening wajib diisi').max(100),
  isDefault: z.boolean().default(false).optional(),
  proofDocumentKey: z.string().trim().optional().nullable(),
});

export const updateOutletComplianceSchema = z.object({
  address: z.string().trim().min(5, 'Alamat outlet minimal 5 karakter').max(255),
  province: z.string().trim().max(100).optional().nullable(),
  city: z.string().trim().min(2, 'Kota/Kabupaten minimal 2 karakter').max(100),
  district: z.string().trim().max(100).optional().nullable(),
  postalCode: z.string().trim().regex(/^\d{5}$/, 'Kode pos harus 5 digit angka'),
  latitude: z.coerce.number().min(-90).max(90).optional().nullable(),
  longitude: z.coerce.number().min(-180).max(180).optional().nullable(),
  storefrontPhotoUrl: z.string().trim().optional().nullable(),
  indoorPhotoUrl: z.string().trim().optional().nullable(),
  mapsUrl: z.string().trim().optional().nullable(),
  settlementAccountId: z.string().uuid().optional().nullable(),
});

export const documentReviewItemSchema = z.object({
  documentId: z.string().uuid(),
  status: z.enum(['ACCEPTED', 'REJECTED']),
  note: z.string().trim().max(500).optional().nullable(),
});

export const sectionReviewItemSchema = z.object({
  section: z.enum(['BUSINESS_PROFILE', 'REPRESENTATIVE', 'SETTLEMENT', 'OUTLET']),
  status: z.enum(['APPROVED', 'CHANGES_REQUESTED', 'INHERITED']),
  note: z.string().trim().max(1000).optional().nullable(),
  flaggedFields: z.array(z.string()).optional().nullable(),
});

export const adminReviewDecisionSchema = z.object({
  decision: z.enum(['APPROVE', 'REQUEST_CHANGES', 'REJECT']),
  reason: z.string().trim().max(1000).optional().nullable(),
  internalNotes: z.string().trim().max(2000).optional().nullable(),
  documentReviews: z.array(documentReviewItemSchema).optional(),
  sectionReviews: z.array(sectionReviewItemSchema).optional(),
});
