import { JUMLAH_PETAK } from '../types/state';

export type JenisPetak =
  | 'GAJIAN'
  | 'PELUANG_KECIL'
  | 'PELUANG_BESAR'
  | 'PASAR'
  | 'BIAYA_TAK_TERDUGA'
  | 'GUNCANG'
  | 'AMAL'
  | 'TAMBAH_ANAK';

/** Susunan 24 petak Lingkar Harian. Komposisi mengikuti dokumen desain §6.1. */
export const PAPAN: readonly JenisPetak[] = [
  'GAJIAN',            // 0
  'PELUANG_KECIL',     // 1
  'PASAR',             // 2
  'BIAYA_TAK_TERDUGA', // 3
  'PELUANG_BESAR',     // 4
  'GUNCANG',           // 5
  'GAJIAN',            // 6
  'PELUANG_KECIL',     // 7
  'PASAR',             // 8
  'AMAL',              // 9
  'PELUANG_KECIL',     // 10
  'BIAYA_TAK_TERDUGA', // 11
  'GAJIAN',            // 12
  'PELUANG_BESAR',     // 13
  'PASAR',             // 14
  'PELUANG_KECIL',     // 15
  'GUNCANG',           // 16
  'TAMBAH_ANAK',       // 17
  'GAJIAN',            // 18
  'PELUANG_KECIL',     // 19
  'PASAR',             // 20
  'BIAYA_TAK_TERDUGA', // 21
  'PELUANG_BESAR',     // 22
  'GUNCANG',           // 23
] as const;

export function petakDi(posisi: number): JenisPetak {
  return PAPAN[((posisi % JUMLAH_PETAK) + JUMLAH_PETAK) % JUMLAH_PETAK];
}

export function posisiSetelah(posisi: number, langkah: number): number {
  return (posisi + langkah) % JUMLAH_PETAK;
}

/**
 * Gaji diterima saat MELEWATI maupun mendarat di petak gajian —
 * jadi lintasan yang dihitung adalah posisi+1 sampai posisi+langkah.
 */
export function hitungGajianDilewati(posisi: number, langkah: number): number {
  let jumlah = 0;
  for (let i = 1; i <= langkah; i++) {
    if (petakDi(posisi + i) === 'GAJIAN') jumlah++;
  }
  return jumlah;
}
