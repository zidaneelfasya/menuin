import { z } from 'zod';

export const modifierGroupSchema = z.object({
  name: z.string().min(1, 'Nama grup wajib diisi'),
  isRequired: z.boolean().default(false),
  minSelections: z.number().min(0).default(0),
  maxSelections: z.number().min(1).default(1),
});

export const modifierSchema = z.object({
  name: z.string().min(1, 'Nama opsi wajib diisi'),
  price: z.string().or(z.number()).transform(val => Number(val) || 0),
});
