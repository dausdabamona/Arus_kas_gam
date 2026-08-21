export type TumpukanKartu = 'PELUANG_KECIL' | 'PELUANG_BESAR';

/**
 * Kelas nilai aset (§8.3). Arus kas dan apresiasi adalah dua sumbu berbeda,
 * dan tidak boleh ada kelas yang unggul di keduanya — kalau ada, kelas lain
 * cuma hiasan. Dijaga tes Pareto di kartu-peluang.test.ts.
 */
export type KelasAset = 'apresiasi' | 'stagnan' | 'depresiasi';

export interface KartuPeluang {
  id: string;
  tumpukan: TumpukanKartu;
  judul: string;
  keterangan: string;
  /** Nilai aset yang tercatat di neraca. */
  harga: number;
  /** Kas yang keluar saat kartu diambil. */
  uangMuka: number;
  /** Tambahan pendapatan pasif per bulan. Boleh nol. */
  arusKasBulanan: number;
  /** Utang yang ikut menempel. Nol berarti dibeli tunai. */
  sisaUtang: number;
  /** Cicilan yang menambah pengeluaran. Nol bila tanpa utang. */
  cicilanBulanan: number;
  /** Kelas nilai (§8.3). */
  kelas: KelasAset;
  /** Pertumbuhan nilai rata-rata per bulan. Negatif untuk aset yang menyusut. */
  driftBulanan: number;
  /** Simpangan acak nilai per bulan. */
  volatilitasBulanan: number;
}
