export interface Instrumen {
  id: string;
  nama: string;
  keterangan: string;
  /** Harga satu unit saat permainan dimulai. */
  hargaAwal: number;
  /** Simpangan acak per bulan. 0,04 berarti ±4%. */
  volatilitasBulanan: number;
  /** Pertumbuhan rata-rata per bulan. */
  driftBulanan: number;
  /** Arus kas per bulan sebagai pecahan nilai. */
  imbalBulanan: number;
}
