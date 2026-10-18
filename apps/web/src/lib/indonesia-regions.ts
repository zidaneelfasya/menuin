/**
 * Indonesian Administrative Regions Utility
 * Provides official Kemendagri data for Provinces, Regencies (Kabupaten/Kota), and Districts (Kecamatan).
 */

import rawRegencies from './data/regencies.json';

export interface RegionItem {
  id: string;
  name: string;
  province_id?: string;
  regency_id?: string;
}

export function formatRegionName(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .split(' ')
    .map((word) => {
      if (['dki', 'di'].includes(word)) return word.toUpperCase();
      if (word === 'dan') return 'dan';
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

// 38 Official Provinces of Indonesia (Kemendagri)
export const INDONESIA_PROVINCES: RegionItem[] = [
  { id: '11', name: 'Aceh' },
  { id: '12', name: 'Sumatera Utara' },
  { id: '13', name: 'Sumatera Barat' },
  { id: '14', name: 'Riau' },
  { id: '15', name: 'Jambi' },
  { id: '16', name: 'Sumatera Selatan' },
  { id: '17', name: 'Bengkulu' },
  { id: '18', name: 'Lampung' },
  { id: '19', name: 'Kepulauan Bangka Belitung' },
  { id: '21', name: 'Kepulauan Riau' },
  { id: '31', name: 'DKI Jakarta' },
  { id: '32', name: 'Jawa Barat' },
  { id: '33', name: 'Jawa Tengah' },
  { id: '34', name: 'DI Yogyakarta' },
  { id: '35', name: 'Jawa Timur' },
  { id: '36', name: 'Banten' },
  { id: '51', name: 'Bali' },
  { id: '52', name: 'Nusa Tenggara Barat' },
  { id: '53', name: 'Nusa Tenggara Timur' },
  { id: '61', name: 'Kalimantan Barat' },
  { id: '62', name: 'Kalimantan Tengah' },
  { id: '63', name: 'Kalimantan Selatan' },
  { id: '64', name: 'Kalimantan Timur' },
  { id: '65', name: 'Kalimantan Utara' },
  { id: '71', name: 'Sulawesi Utara' },
  { id: '72', name: 'Sulawesi Tengah' },
  { id: '73', name: 'Sulawesi Selatan' },
  { id: '74', name: 'Sulawesi Tenggara' },
  { id: '75', name: 'Gorontalo' },
  { id: '76', name: 'Sulawesi Barat' },
  { id: '81', name: 'Maluku' },
  { id: '82', name: 'Maluku Utara' },
  { id: '91', name: 'Papua Barat' },
  { id: '92', name: 'Papua Barat Daya' },
  { id: '93', name: 'Papua Selatan' },
  { id: '94', name: 'Papua' },
  { id: '95', name: 'Papua Tengah' },
  { id: '96', name: 'Papua Pegunungan' },
];

const ALL_REGENCIES: RegionItem[] = (
  rawRegencies as Array<{ id: string; province_id: string; name: string }>
).map((item) => ({
  id: item.id,
  province_id: item.province_id,
  name: formatRegionName(item.name),
}));

const districtCache = new Map<string, RegionItem[]>();

/**
 * Get regencies (Kabupaten / Kota) for a given province ID from local official dataset.
 */
export async function getRegenciesByProvinceId(provinceId: string): Promise<RegionItem[]> {
  if (!provinceId) return [];
  return ALL_REGENCIES.filter((r) => r.province_id === provinceId);
}

/**
 * Fetch districts (Kecamatan) for a given regency ID with in-memory caching.
 */
export async function getDistrictsByRegencyId(regencyId: string): Promise<RegionItem[]> {
  if (!regencyId) return [];
  if (districtCache.has(regencyId)) {
    return districtCache.get(regencyId)!;
  }

  try {
    const res = await fetch(
      `https://www.emsifa.com/api-wilayah-indonesia/api/districts/${regencyId}.json`
    );
    if (!res.ok) throw new Error('Gagal mengambil data kecamatan');
    const data: RegionItem[] = await res.json();
    const formatted = data.map((item) => ({
      ...item,
      name: formatRegionName(item.name),
    }));
    districtCache.set(regencyId, formatted);
    return formatted;
  } catch (err) {
    console.warn(`Error fetching districts for regency ${regencyId}:`, err);
    return [];
  }
}

/**
 * Helper to find province item by name or id
 */
export function findProvince(query?: string): RegionItem | undefined {
  if (!query) return undefined;
  const q = query.toLowerCase().trim();
  return INDONESIA_PROVINCES.find(
    (p) => p.id === q || p.name.toLowerCase() === q || p.name.toLowerCase().includes(q)
  );
}
