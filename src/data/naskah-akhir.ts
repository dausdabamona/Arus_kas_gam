import type { Kuadran } from '../engine/ringkasan';
import type { AlasanAkhir } from '../types/state';

/**
 * Naskah Layar Akhir. Teks paling berbahaya di seluruh permainan: ia dibaca
 * sebagai penilaian atas seorang manusia, tepat pada menit ia paling terbuka.
 *
 * Aturannya lebih ketat daripada naskah pemandu — di sini bahkan menerangkan
 * pun harus hati-hati. Yang boleh dikatakan hanyalah APA YANG TERJADI di dua
 * papan. Tidak ada kata sifat untuk orangnya.
 */

export const JUDUL_LAYAR = 'Dua papan';

/** §10.1 dan §10.2. Dua papan, dua nama, tidak ada yang jadi anak judul. */
export const JUDUL_KEKAYAAN = 'Kekayaan';
export const JUDUL_KEMERDEKAAN = 'Kemerdekaan';

export const LABEL_KEKAYAAN_BERSIH = 'Kekayaan bersih';
export const LABEL_PENDAPATAN_PASIF = 'Pendapatan pasif';
export const LABEL_PENGELUARAN = 'Pengeluaran';
export const LABEL_SKOR = 'Keputusan tenang';
export const LABEL_UJIAN = 'Keputusan bertekanan';

/**
 * "Belum teruji" bukan pujian dan bukan teguran. Kalimatnya menerangkan
 * keadaan alat ukurnya, bukan sifat pemainnya: yang kurang adalah bahan
 * ukuran, bukan orangnya.
 */
export const BELUM_TERUJI =
  'Belum cukup keputusan bertekanan untuk diukur. Papan ini menunggu, bukan menilai.';

/** Judul §10.3, apa adanya dari GDD. */
export const JUDUL_KUADRAN: Record<Kuadran, string> = {
  bebas: 'Bebas',
  'kaya-terikat': 'Kaya tapi terikat',
  'tenang-belum-berdaya': 'Tenang tapi belum berdaya',
  'belum-jalan': 'Belum jalan',
};

/**
 * Keterangan kuadran menyebut ulang KEADAAN kedua papan, tanpa satu pun kata
 * sifat untuk orangnya. Pemain boleh menarik kesimpulan sendiri; permainan
 * tidak menariknya untuk dia.
 */
export const KETERANGAN_KUADRAN: Record<Kuadran, string> = {
  bebas:
    'Pendapatan pasif menutup pengeluaran, dan keputusan bertekanan diambil setelah suhunya turun.',
  'kaya-terikat':
    'Pendapatan pasif menutup pengeluaran. Keputusan bertekanan masih diambil selagi suhunya tinggi.',
  'tenang-belum-berdaya':
    'Keputusan bertekanan diambil setelah suhunya turun. Pendapatan pasif belum menutup pengeluaran.',
  'belum-jalan':
    'Pendapatan pasif belum menutup pengeluaran, dan keputusan bertekanan masih diambil selagi suhunya tinggi.',
};

/**
 * §7.3: berhenti dengan sadar dicatat sebagai KEMENANGAN di papan Kemerdekaan,
 * bukan kekalahan. Kata "menyerah" hidup sebagai id di kode dan tidak pernah
 * sampai ke mata siapa pun.
 */
export const KETERANGAN_AKHIR: Record<AlasanAkhir, string> = {
  lolos: 'Niat yang ditulis di Gerbang tercapai.',
  menyerah: 'Berhenti di sini, dipilih dengan sadar.',
  bangkrut: 'Kas habis dan tidak ada tuas yang tersisa.',
};

export const LABEL_NIAT = 'Niat yang ditulis';
export const LABEL_GILIRAN = 'Giliran dijalani';
export const JUDUL_JURNAL_PERMAINAN = 'Yang ditanam di permainan ini';
export const JURNAL_KOSONG = 'Belum ada yang ditanam.';

export const AJAKAN_MAIN_LAGI = 'Mulai lagi';
export const AJAKAN_JURNAL = 'Buka jurnal';

/** §15.4 dan §2 — keduanya wajib berdiri di layar hasil akhir. */
export const CATATAN_ALAT_LATIHAN =
  'Ini alat latihan, bukan pengganti kerja batin yang sebenarnya.';
export const DISCLAIMER =
  'Simulasi untuk latihan. Angka disederhanakan dan bukan saran investasi.';

/**
 * Dua syarat menang tahap 2 (§7.3). Keduanya penilaian PEMAIN, bukan mesin:
 * niat adalah kalimat yang ia tulis sendiri di Gerbang, dan hanya ia yang tahu
 * apakah kalimat itu sudah terjadi.
 *
 * Kalimat penjelasnya ada supaya "berhenti" tidak terbaca sebagai keluar dari
 * permainan karena kehabisan tenaga. §7.3 menyebutnya kemenangan; layar harus
 * mengatakannya sebelum pemain mengetuk, bukan sesudah.
 */
export const AJAKAN_NIAT_TERCAPAI = 'Niat saya tercapai';
export const AJAKAN_BERHENTI = 'Berhenti di sini';
export const PENJELASAN_BERHENTI =
  'Berhenti dengan sadar dihitung sebagai kemenangan di papan Kemerdekaan.';
