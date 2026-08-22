import type { KebutuhanId } from '../types/kejadian';

export interface PolaKebutuhan {
  /** Berapa momen bertekanan seluruhnya. */
  total: number;
  /** Kebutuhan yang paling sering tersentuh. */
  kebutuhan: KebutuhanId;
  jumlah: number;
}

/**
 * Satu pola dari jurnal, dihitung dan tidak ditafsirkan (§12).
 *
 * Null berarti tidak ada satu pola yang bisa dinyatakan, dan itu dua keadaan
 * yang berbeda sebabnya tapi sama jawabannya:
 *
 * - **Kurang dari dua entri.** Satu entri tidak punya pembanding. "Dari 1
 *   momen bertekanan, 1 berhenti di keamanan" berbentuk pola tapi tidak
 *   menyatakan apa-apa — dan bentuk itulah yang menafsirkan, bukan angkanya.
 * - **Seri di puncak.** Memilih salah satu dari dua yang sama banyak — yang
 *   pertama, yang abjadnya duluan, yang mana pun — adalah permainan yang
 *   mengarang kesimpulan dari data yang tidak memberikannya.
 *
 * Tidak ada ambang minimum yang dikarang di sini. Jumlah entri yang "cukup"
 * untuk terasa berarti adalah pertanyaan tentang manusia, dan menebaknya
 * berarti menambah satu lagi angka belum-teruji ke paket Fase 8.
 */
export function polaKebutuhan(entri: readonly { kebutuhan: KebutuhanId }[]): PolaKebutuhan | null {
  if (entri.length < 2) return null;

  const hitung = new Map<KebutuhanId, number>();
  for (const e of entri) hitung.set(e.kebutuhan, (hitung.get(e.kebutuhan) ?? 0) + 1);

  let jumlah = 0;
  let kebutuhan: KebutuhanId | null = null;
  let seri = false;
  for (const [k, n] of hitung) {
    if (n > jumlah) {
      jumlah = n;
      kebutuhan = k;
      seri = false;
    } else if (n === jumlah) {
      seri = true;
    }
  }

  if (kebutuhan === null || seri) return null;
  return { total: entri.length, kebutuhan, jumlah };
}
