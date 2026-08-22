/**
 * Naskah layar Jurnal. Isinya milik pemain — kalimat yang ia tulis sendiri —
 * jadi suara permainan di sini seharusnya nyaris tidak terdengar: judul,
 * label, dan tidak lebih. Setiap kalimat tambahan di layar ini adalah
 * permainan yang ikut berkomentar atas catatan orang.
 */

export const JUDUL_JURNAL = 'Jurnal';
export const PENJELASAN_JURNAL =
  'Kalimat yang kamu tanam, dari semua permainan. Tetap tersimpan meski permainannya dihapus.';
export const JURNAL_KOSONG_SEMUA = 'Belum ada kalimat yang ditanam.';

export const LABEL_EKSPOR = 'Simpan salinan';
export const PENJELASAN_EKSPOR =
  'Berkas .json ke folder Unduhan, supaya catatan ini selamat kalau data aplikasi terhapus.';
export const LABEL_KEMBALI = 'Kembali';

/** Nama kebutuhan §9.1, untuk ditampilkan apa adanya sebagai penanda. */
export const NAMA_KEBUTUHAN = {
  keamanan: 'Keamanan',
  kendali: 'Kendali',
  pengakuan: 'Pengakuan',
  pemisahan: 'Pemisahan',
} as const;
