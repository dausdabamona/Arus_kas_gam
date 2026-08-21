import type { Prng } from './prng';
import { prngUntuk } from './prng';

/**
 * Pasar dan instrumen — §8 dokumen desain.
 *
 * Murni dan deterministik seperti seluruh isi engine/. Harga tidak pernah
 * disimpan sebagai state: deret harga selama satu kartu Pasar terbuka
 * diturunkan dari seed + indeks kejadian, jadi pemutaran ulang event log
 * menghasilkan pergerakan yang sama persis tanpa menyimpan apa pun.
 */

/** Lama timer satu kartu Pasar, dalam detik (§8.1). */
export const DETIK_TIMER_PASAR = 20;

/** Harga berubah tiap sekian detik di depan mata pemain (§8.1). */
export const DETIK_PER_TICK = 5;

/** Banyaknya perubahan harga selama satu kartu terbuka. */
export const TICK_PASAR = DETIK_TIMER_PASAR / DETIK_PER_TICK;

export interface Instrumen {
  id: string;
  nama: string;
  keterangan: string;
  /** Simpangan harga maksimum per bulan, sebagai pecahan. 0 berarti diam. */
  volatilitasBulanan: number;
  /** Arus kas rutin per bulan sebagai pecahan dari nilai. Boleh nol. */
  arusKasPersen: number;
}

/**
 * Urutan sengaja mengikuti §8: dari yang paling tenang dan membosankan ke
 * yang paling liar. Yang membosankan diletakkan lebih dulu karena memang
 * itu yang paling sering diremehkan pemain.
 */
export const INSTRUMEN: readonly Instrumen[] = [
  {
    id: 'deposito',
    nama: 'Deposito',
    keterangan: 'Harganya tidak bergerak sama sekali. Bunga kecil, masuk tiap bulan.',
    volatilitasBulanan: 0,
    arusKasPersen: 0.003,
  },
  {
    id: 'reksa-indeks',
    nama: 'Reksa dana indeks',
    keterangan: 'Naik turun pelan mengikuti pasar secara keseluruhan. Tidak ada arus kas bulanan.',
    volatilitasBulanan: 0.04,
    arusKasPersen: 0,
  },
  {
    id: 'saham',
    nama: 'Saham individual',
    keterangan: 'Bergerak jauh ke dua arah. Dividennya tidak bisa diandalkan.',
    volatilitasBulanan: 0.18,
    arusKasPersen: 0,
  },
  {
    id: 'emas',
    nama: 'Emas',
    keterangan: 'Disimpan, bukan dipekerjakan. Tidak menghasilkan apa-apa tiap bulan.',
    volatilitasBulanan: 0.06,
    arusKasPersen: 0,
  },
  {
    id: 'properti-sewa',
    nama: 'Properti sewa',
    keterangan: 'Harga bergerak pelan, sewanya masuk tiap bulan. Perawatannya datang tiba-tiba.',
    volatilitasBulanan: 0.02,
    arusKasPersen: 0.008,
  },
  {
    id: 'usaha-kecil',
    nama: 'Usaha kecil',
    keterangan: 'Paling liar di antara semuanya. Hasilnya besar bila bertahan.',
    volatilitasBulanan: 0.25,
    arusKasPersen: 0,
  },
];

export function cariInstrumen(id: string): Instrumen | undefined {
  return INSTRUMEN.find((i) => i.id === id);
}

/**
 * Satu langkah harga. Simpangannya sebaran rata di dalam pita volatilitas,
 * ke dua arah. Harga tidak pernah boleh menyentuh nol — instrumen yang
 * jatuh ke nol menghapus keputusan pemain, dan itu bukan pelajaran apa pun.
 */
export function hargaBerikutnya(prng: Prng, harga: number, volatilitas: number): number {
  if (volatilitas === 0) return harga;
  const simpangan = (prng() * 2 - 1) * volatilitas;
  return Math.max(1, Math.round(harga * (1 + simpangan)));
}

/**
 * Deret harga selama satu kartu Pasar terbuka: harga pembuka diikuti satu
 * harga per tick. Diturunkan dari seed + indeks kejadian, sehingga UI cukup
 * menampilkan deret ini sesuai detik yang berjalan — tidak ada keacakan baru
 * yang lahir di lapisan tampilan.
 */
export function deretHarga(
  seed: string,
  indeksKejadian: number,
  hargaPembuka: number,
  volatilitas: number,
): number[] {
  const prng = prngUntuk(`${seed}#pasar`, indeksKejadian);
  const deret = [hargaPembuka];
  for (let i = 0; i < TICK_PASAR; i++) {
    deret.push(hargaBerikutnya(prng, deret[deret.length - 1], volatilitas));
  }
  return deret;
}
