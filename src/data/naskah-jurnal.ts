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
export const LABEL_SALIN_TEKS = 'Ambil sebagai teks';
export const PENJELASAN_SALIN_TEKS =
  'Berkas .md berisi kalimatmu, untuk disalin ke jurnal 30 hari yang sesungguhnya.';
export const LABEL_KEMBALI = 'Kembali';

/** Nama kebutuhan §9.1, untuk ditampilkan apa adanya sebagai penanda. */
export const NAMA_KEBUTUHAN = {
  keamanan: 'Keamanan',
  kendali: 'Kendali',
  pengakuan: 'Pengakuan',
  pemisahan: 'Pemisahan',
} as const;

/**
 * Satu pola, dihitung dan tidak ditafsirkan (§12). Kalimatnya sengaja tidak
 * memakai kata sambung yang menyimpulkan — bukan "berarti", bukan "karena",
 * bukan "kamu cenderung". Hanya dua angka dan satu nama.
 */
export function kalimatPola(total: number, jumlah: number, kebutuhan: keyof typeof NAMA_KEBUTUHAN): string {
  return `Dari ${total} momen bertekanan, ${jumlah} berhenti di ${NAMA_KEBUTUHAN[kebutuhan].toLowerCase()}.`;
}
