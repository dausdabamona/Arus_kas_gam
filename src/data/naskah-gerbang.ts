/**
 * Naskah Gerbang Niat (§7.1) dan bingkai Kartu Kebiasaan Lama (§7.2).
 *
 * ATURAN NASKAH Fase 5 berlaku penuh di sini: pertanyaan terbuka, tanpa
 * "seharusnya", tanpa pujian, kalimat pendek.
 *
 * PENJELASAN_KEBIASAAN adalah kalimat paling rawan di seluruh proyek. Satu kata
 * yang salah mengubah keadaan-awal-yang-jujur menjadi vonis, dan seluruh
 * fondasi §7.2 bergantung padanya — kalau kartu ini terasa denda, Aturan Naskah
 * 6 ("Lewati tanpa penalti") runtuh diam-diam, sebab melewati jeda berujung
 * sesuatu yang dirasakan sebagai biaya.
 */

/** Tenang, bukan selebrasi. Yang terjadi dinyatakan apa adanya. */
export const UCAPAN_LOLOS = 'Pendapatan pasif sudah menutup pengeluaranmu.';

export const TANYA_NIAT = 'Kebebasan ini untuk apa?';

export const PETUNJUK_NIAT =
  'Satu kalimat saja. Nanti ia muncul lagi, di giliran saat angka besar terasa paling menarik.';

export const JUDUL_KEBIASAAN = 'Yang ikut terbawa';

/**
 * Bingkainya: sebab, bukan penilaian. Kalimat kedua menerangkan mekanisme
 * ("menyala sendiri sebelum sempat dipikir"), bukan orangnya. Kalimat ketiga
 * menjelaskan kenapa uang saja tidak cukup, sehingga membawanya tidak terbaca
 * sebagai kekurangan. Kalimat terakhir menunjuk ke pekerjaan, bukan ke vonis.
 */
export const PENJELASAN_KEBIASAAN =
  'Uangnya sudah berubah. Beberapa refleks belum — ia masih menyala sendiri sebelum sempat dipikir. ' +
  'Refleks berubah lewat latihan, bukan lewat penghasilan. Tiap kartu di bawah membawa cara melatihnya.';

/**
 * Untuk pemain tanpa kartu: kebiasaan TIDAK disebut sama sekali. Layar kosong
 * berjudul "Kebiasaan lama: tidak ada" justru membuat penasaran, dan memuji
 * yang tidak membawa apa-apa melanggar Aturan Naskah.
 */
export const TANPA_KEBIASAAN = 'Lingkar Luas menunggu.';

export const LABEL_MASUK = 'Masuk';
export const LABEL_SIMPAN_NIAT = 'Simpan';
