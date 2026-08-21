/**
 * Kartu Pasar — tawaran instrumen yang harganya bergerak selama pemain
 * menimbang (§8.1). Keterangan ditulis apa adanya: tidak menjanjikan,
 * tidak menyuruh, dan tidak menyembunyikan biayanya (§8.2).
 */

export interface KartuPasar {
  id: string;
  instrumenId: string;
  judul: string;
  keterangan: string;
  /** Harga satu lot saat kartu pertama terbuka. */
  hargaPembuka: number;
}

export const KARTU_PASAR: readonly KartuPasar[] = [
  {
    id: 'deposito-12-bulan',
    instrumenId: 'deposito',
    judul: 'Deposito 12 bulan',
    keterangan:
      'Bunganya kecil dan tetap. Harganya tidak akan bergerak sedetik pun selama Anda menimbang.',
    hargaPembuka: 5_000_000,
  },
  {
    id: 'indeks-bulanan',
    instrumenId: 'reksa-indeks',
    judul: 'Reksa dana indeks',
    keterangan:
      'Mengikuti pasar secara keseluruhan, tanpa memilih saham satu per satu. Tidak ada arus kas bulanan.',
    hargaPembuka: 2_000_000,
  },
  {
    id: 'saham-tetangga',
    instrumenId: 'saham',
    judul: 'Saham yang sedang ramai dibicarakan',
    keterangan:
      'Naik 40% bulan lalu. Kenaikan yang sudah lewat tidak memberi tahu apa pun tentang bulan depan.',
    hargaPembuka: 3_000_000,
  },
  {
    id: 'saham-sepi',
    instrumenId: 'saham',
    judul: 'Saham perusahaan yang jarang disebut',
    keterangan: 'Tidak ada yang membicarakannya. Bergerak sama jauhnya, ke dua arah.',
    hargaPembuka: 2_500_000,
  },
  {
    id: 'emas-batangan',
    instrumenId: 'emas',
    judul: 'Emas batangan',
    keterangan:
      'Disimpan, bukan dipekerjakan. Tidak menghasilkan apa-apa tiap bulan, dan ada biaya penyimpanan.',
    hargaPembuka: 4_000_000,
  },
  {
    id: 'kios-sewa',
    instrumenId: 'properti-sewa',
    judul: 'Kios kecil untuk disewakan',
    keterangan:
      'Sewanya masuk tiap bulan. Harganya bergerak pelan, tapi perbaikan datang tanpa memberi tahu.',
    hargaPembuka: 30_000_000,
  },
  {
    id: 'warung-kopi',
    instrumenId: 'usaha-kecil',
    judul: 'Bagi hasil warung kopi',
    keterangan:
      'Paling liar di antara semuanya. Bisa berlipat, bisa juga tinggal separuh dalam sebulan.',
    hargaPembuka: 8_000_000,
  },
  {
    id: 'deposito-kecil',
    instrumenId: 'deposito',
    judul: 'Deposito nominal kecil',
    keterangan: 'Membosankan dan bisa ditebak. Itu memang seluruh isinya.',
    hargaPembuka: 1_000_000,
  },
];

export function cariKartuPasar(id: string): KartuPasar | undefined {
  return KARTU_PASAR.find((k) => k.id === id);
}
