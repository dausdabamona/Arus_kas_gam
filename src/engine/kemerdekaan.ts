import type { StatePermainan } from '../types/state';

/**
 * Batas "belum teruji": di bawah ini, refleks pemain memang belum pernah
 * dibentuk, berapa pun rasio kemenangannya.
 *
 * ANGKA INI BELUM PERNAH DIUJI PADA MANUSIA, persis seperti `AMBANG_REDA` di
 * reducer.ts — dan keduanya harus diuji SEBAGAI SATU PAKET. Pemain tekun yang
 * suhunya tidak turun tiga poin lolos gerbang minimum ini lalu jatuh di tabel
 * §7.2; kalau kedua angka meleset bersama, yang paling serius yang paling
 * dihukum.
 *
 * Simulator tidak bisa menjawabnya — pelari simulasi tidak pernah menyentuh
 * suhu maupun jeda. Yang bisa diukur cuma pagarnya: tiap permainan yang lolos
 * berdiri di depan minimal 31 pemicu Jeda (30 seed x 3 profesi, gaya seimbang),
 * jadi nilai mana pun antara 3 dan 10 memisahkan "menolak diukur" dari "ikut
 * diukur" tanpa menyentuh pemain normal.
 *
 * Jangan disetel dari tebakan. Ia disetel di Fase 8, dari orang sungguhan.
 */
export const MINIMUM_UJIAN = 5;

/** Ambang tabel §7.2. */
export const AMBANG_SKOR_BERSIH = 70;
export const AMBANG_SKOR_SEDANG = 40;

export interface RingkasKemerdekaan {
  /** 0..100. Pemain yang tidak pernah diuji mendapat 100 — lihat catatan di bawah. */
  skor: number;
  ujian: number;
  belumTeruji: boolean;
  /** 0..2, per tabel §7.2. */
  kartuKebiasaan: number;
}

/**
 * Skor Kemerdekaan beserta pembacaan §7.2-nya.
 *
 * Dua angka dibaca, bukan satu. `skor` sendiri tetap memegang kontrak lama:
 * pembagi nol dihitung sebagai skor penuh, sebab "tidak pernah diuji bukanlah
 * kegagalan" — itu benar untuk sebuah rasio. Tapi jumlah kartu kebiasaan
 * menjawab pertanyaan yang berbeda: seberapa terlatih refleksnya. Untuk
 * pertanyaan itu, tidak pernah diuji berarti paling belum terlatih.
 *
 * Ini bukan menghukum yang main aman. Aman dan terlatih adalah dua hal berbeda,
 * dan kartu kebiasaan bukan denda — ia keadaan awal yang jujur, dan tiap kartu
 * datang dengan cara melatihnya (§7.2).
 */
export function ringkasKemerdekaan(skor: StatePermainan['skor']): RingkasKemerdekaan {
  const { keputusanBertekanan: ujian, keputusanTenang } = skor;

  const nilai = ujian === 0 ? 100 : Math.round((keputusanTenang / ujian) * 100);
  const skorTerbatas = Math.min(100, Math.max(0, nilai));
  const belumTeruji = ujian < MINIMUM_UJIAN;

  return {
    skor: skorTerbatas,
    ujian,
    belumTeruji,
    kartuKebiasaan: belumTeruji ? 2 : bandKartu(skorTerbatas),
  };
}

function bandKartu(skor: number): number {
  if (skor >= AMBANG_SKOR_BERSIH) return 0;
  if (skor >= AMBANG_SKOR_SEDANG) return 1;
  return 2;
}
