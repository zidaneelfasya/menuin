'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser } from './auth';

export async function uploadImageToSupabase(formData: FormData, bucketName: string = 'product_image') {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return { success: false, error: 'Unauthorized: Sesi login tidak valid' };
    }

    const file = formData.get('file') as File;
    if (!file) {
      return { success: false, error: 'File gambar tidak ditemukan' };
    }

    // Validasi tipe file
    if (!file.type.startsWith('image/')) {
      return { success: false, error: 'Format file tidak didukung. Harap unggah file gambar (JPG, PNG, WEBP)' };
    }

    // Validasi ukuran file (Max 5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return { success: false, error: 'Ukuran gambar terlalu besar. Maksimal 5MB' };
    }

    const supabaseAdmin = createAdminClient();

    // Pastikan bucket sudah ada (jika belum, otomatis buat public bucket)
    try {
      const { data: buckets } = await supabaseAdmin.storage.listBuckets();
      const bucketExists = buckets?.some((b) => b.name === bucketName);

      if (!bucketExists) {
        await supabaseAdmin.storage.createBucket(bucketName, {
          public: true,
          fileSizeLimit: 5242880, // 5MB
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'],
        });
      }
    } catch (bucketErr) {
      console.warn('Bucket check/creation notice:', bucketErr);
    }

    // Buat nama file unik dengan prefix tenantId agar rapi dan terisolasi
    const fileExt = file.name.split('.').pop() || 'jpg';
    const cleanFileName = `${user.tenantId}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload ke Supabase Storage Bucket
    const { data, error } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(cleanFileName, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (error) {
      console.error('Supabase storage upload error:', error);
      return { success: false, error: `Gagal upload ke Supabase Storage: ${error.message}` };
    }

    // Ambil Public URL Supabase
    const { data: publicUrlData } = supabaseAdmin.storage
      .from(bucketName)
      .getPublicUrl(cleanFileName);

    return { 
      success: true, 
      url: publicUrlData.publicUrl,
      fileName: cleanFileName 
    };

  } catch (err: any) {
    console.error('Error in uploadImageToSupabase:', err);
    return { 
      success: false, 
      error: err?.message || 'Terjadi kesalahan saat mengunggah gambar ke Supabase' 
    };
  }
}
