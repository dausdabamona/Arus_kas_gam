import { rakitBenih } from '../engine/benih';
import { buatPrng } from '../engine/prng';

/**
 * Membuat benih baru. Sengaja hidup DI LUAR `engine/`.
 *
 * Memilih benih adalah satu-satunya langkah dalam permainan ini yang memang
 * tidak boleh deterministik — dan begitu ia terpilih, seluruh sisa permainan
 * kembali deterministik sepenuhnya. Meletakkannya di `engine/` akan membuat
 * mesin ikut tidak murni demi satu baris yang cuma dipanggil sekali per
 * permainan; penjaga di `engine/kemurnian.test.ts` menolaknya.
 *
 * Dua sumber dipakai bersama: jam untuk memisahkan sesi, `Math.random()` untuk
 * memisahkan dua ketukan dalam milidetik yang sama.
 */
export function benihBaru(): string {
  return rakitBenih(buatPrng(`${Date.now()}#${Math.random()}`));
}
