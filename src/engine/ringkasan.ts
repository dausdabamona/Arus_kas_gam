import { hitungLaporan, lolosTahapSatu } from './keuangan';
import { ringkasKemerdekaan, AMBANG_SKOR_BERSIH, type RingkasKemerdekaan } from './kemerdekaan';
import type { AlasanAkhir, StatePermainan } from '../types/state';

/**
 * Empat kuadran §10.3. Idnya saja — kalimatnya hidup di `data/naskah-akhir.ts`,
 * karena label kuadran adalah teks paling berbahaya di seluruh permainan: ia
 * dibaca sebagai penilaian atas seorang manusia, tepat saat ia paling terbuka.
 */
export const KUADRAN = {
  bebas: 'bebas',
  'kaya-terikat': 'kaya-terikat',
  'tenang-belum-berdaya': 'tenang-belum-berdaya',
  'belum-jalan': 'belum-jalan',
} as const;

export type Kuadran = keyof typeof KUADRAN;

export interface PapanKekayaan {
  /** §10.1 angka pertama: seluruh yang dimiliki dikurangi seluruh yang diutang. */
  kekayaanBersih: number;
  /** §10.1 angka kedua: yang mengalir tiap bulan tanpa bekerja. */
  pendapatanPasif: number;
  /** Pembanding pendapatan pasif — tanpa ini "tinggi" tidak bisa dibaca. */
  totalPengeluaran: number;
  /**
   * Tinggi berarti pendapatan pasif menutup pengeluaran (§5.2) — DEFINISI YANG
   * SUDAH DIPAKAI SELURUH PERMAINAN, bukan ambang rupiah baru. Mengarang angka
   * kedua di sini berarti punya dua arti "cukup" yang berselisih diam-diam,
   * dan yang satu akan menang tanpa pernah dibahas.
   */
  tinggi: boolean;
}

export interface PapanKemerdekaan extends RingkasKemerdekaan {
  /**
   * Dua angka dibaca, bukan satu — sama seperti Gerbang §7.2. Skor 100 dari
   * nol ujian bukan kemerdekaan tinggi; ia belum terukur.
   */
  tinggi: boolean;
}

export interface RingkasanAkhir {
  kekayaan: PapanKekayaan;
  kemerdekaan: PapanKemerdekaan;
  kuadran: Kuadran;
  alasanAkhir: AlasanAkhir | null;
  giliran: number;
  tahap: StatePermainan['tahap'];
  niat: string | null;
  /** Supaya permainan ini bisa dibuka lagi persis — lihat GDD §4.2. */
  seed: string;
  profesiId: string;
}

/** Dua papan skor yang sengaja tidak selalu searah (§0, §10). */
export function ringkasAkhir(state: StatePermainan): RingkasanAkhir {
  const laporan = hitungLaporan(state.keuangan);
  const merdeka = ringkasKemerdekaan(state.skor);

  const kekayaanTinggi = lolosTahapSatu(laporan);
  const merdekaTinggi = !merdeka.belumTeruji && merdeka.skor >= AMBANG_SKOR_BERSIH;

  return {
    kekayaan: {
      kekayaanBersih: laporan.kekayaanBersih,
      pendapatanPasif: laporan.pendapatanPasif,
      totalPengeluaran: laporan.totalPengeluaran,
      tinggi: kekayaanTinggi,
    },
    kemerdekaan: { ...merdeka, tinggi: merdekaTinggi },
    kuadran: pilihKuadran(kekayaanTinggi, merdekaTinggi),
    alasanAkhir: state.alasanAkhir,
    giliran: state.giliran,
    tahap: state.tahap,
    niat: state.niat,
    seed: state.seed,
    profesiId: state.profesiId,
  };
}

function pilihKuadran(kaya: boolean, merdeka: boolean): Kuadran {
  if (kaya) return merdeka ? 'bebas' : 'kaya-terikat';
  return merdeka ? 'tenang-belum-berdaya' : 'belum-jalan';
}
