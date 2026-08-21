export type TumpukanKartu = 'PELUANG_KECIL' | 'PELUANG_BESAR';

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
}
