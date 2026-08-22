import { ambilSatu } from './acak';
import type { Prng } from './prng';
import { KATA_BENIH } from '../data/kata-benih';

/** Tanda hubung, bukan spasi — supaya benih selamat melewati URL dan pesan. */
export const PEMISAH_BENIH = '-';

/**
 * Merapikan teks menjadi benih. Dipanggil TEPAT SEKALI, di pintu masuk,
 * sebelum teks itu menjadi benih permainan.
 *
 * Sesudah itu benih tidak pernah dirapikan lagi — benih yang dipercantik saat
 * ditampilkan adalah benih yang salah: ia tidak lagi membuka dunia yang sama.
 *
 * Wajib idempoten. Kalau tidak, benih yang tampil di layar bisa berbeda dari
 * benih yang dipakai mesin, dan seluruh gunanya lenyap tanpa suara.
 */
export function normalkanBenih(teks: string): string {
  return teks
    .toLowerCase()
    .replace(/[\s_]+/g, PEMISAH_BENIH)
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, PEMISAH_BENIH)
    .replace(/^-+|-+$/g, '');
}

/**
 * Longgar dengan sengaja: apa pun yang menyisakan huruf atau angka diterima,
 * termasuk benih format lama (`arus-1755870421123`) dan benih yang diarang
 * sendiri oleh pemain. Yang dijaga cuma satu — benih kosong bukan benih.
 */
export function benihSah(teks: string): boolean {
  return normalkanBenih(teks).length > 0;
}

/**
 * Merakit benih baru dari kosakata. Murni: sumber acaknya datang dari luar,
 * karena memilih benih adalah satu-satunya langkah yang memang tidak boleh
 * deterministik — dan langkah itu hidup di `lib/`, bukan di sini.
 *
 * Menarik tepat tiga angka, selalu (§4.2).
 */
export function rakitBenih(prng: Prng): string {
  return KATA_BENIH.map((daftar) => ambilSatu(prng, daftar)).join(PEMISAH_BENIH);
}
