'use server';

import { getCurrentUser } from './auth';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export async function uploadImageAction(
  formData: FormData
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return { success: false, error: 'Unauthorized' };
    }

    const file = formData.get('file') as File | null;
    const rawFolder = (formData.get('folder') as string) || 'general';

    if (!file) {
      return { success: false, error: 'File tidak ditemukan' };
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return {
        success: false,
        error: 'Format file tidak didukung. Harap gunakan format gambar (JPG, PNG, WebP, GIF, SVG).',
      };
    }

    if (file.size > MAX_FILE_SIZE) {
      return { success: false, error: 'Ukuran file terlalu besar. Maksimal 10MB.' };
    }

    const sanitizedFolder = rawFolder.replace(/[^a-zA-Z0-9_-]/g, '') || 'general';
    const ext = path.extname(file.name).toLowerCase() || `.${file.type.split('/')[1] || 'png'}`;
    const uniqueSuffix = crypto.randomBytes(8).toString('hex');
    const filename = `${Date.now()}-${uniqueSuffix}${ext}`;

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', sanitizedFolder);
    await fs.mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, filename);
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await fs.writeFile(filePath, buffer);

    const publicUrl = `/uploads/${sanitizedFolder}/${filename}`;

    return {
      success: true,
      url: publicUrl,
    };
  } catch (error: any) {
    console.error('Error uploading file in server action:', error);
    return {
      success: false,
      error: error.message || 'Gagal mengunggah file gambar.',
    };
  }
}
