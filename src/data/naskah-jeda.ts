import type { KebutuhanId, JenisTemuan } from '../types/kejadian';

/**
 * ATURAN NASKAH — lihat kepala rencana Fase 5. Ringkasnya:
 * pertanyaan terbuka tanpa kesimpulan; tanpa "seharusnya"; tanpa pujian;
 * kalimat pendek; Ya dan Tidak sama-sama valid.
 *
 * Semua teks pemandu tinggal di berkas ini, tidak pernah di dalam komponen,
 * supaya tes penjaga nada benar-benar menjaga seluruh naskah.
 */

/**
 * Tenang = turun ke badan, bukan teknik napas. Tidak ada hitungan detik dan
 * tidak ada napas yang diatur — itu justru jenis pengaturan yang dihindari sumber.
 */
export const NASKAH_TENANG: readonly string[] = [
  'Rasakan telapak kaki menempel di lantai. Dirasakan saja, tidak perlu dipikirkan.',
  'Rasakan berat badan di tempat duduk.',
  'Napas biasa, tiga sampai empat kali. Tidak perlu diatur.',
];

/** Dua kali pengukuran suhu: sebelum jeda dan sesudahnya. */
export const TANYA_SUHU = {
  sebelum: 'Sepanas apa rasanya sekarang?',
  sesudah: 'Dan sekarang?',
  kiri: 'dingin',
  kanan: 'panas',
} as const;

/** Tawaran setelah suhu dicatat. Keduanya netral; tidak ada yang dianjurkan. */
export const TAWARAN_JEDA = {
  jeda: 'Jeda sebentar',
  langsung: 'Langsung putuskan',
} as const;

/** Ketuk, bukan timer. Ini jeda, bukan tekanan baru. */
export const PETUNJUK_TENANG = 'Ketuk kalau sudah.';

export const TANYA_LOKASI = 'Di bagian tubuh mana rasanya paling terasa?';

/** Laporan badan, bukan pertanyaan batin — salah satu dari dua pengecualian tap. */
export const LOKASI_TUBUH = [
  { id: 'dada', label: 'Dada' },
  { id: 'perut', label: 'Perut' },
  { id: 'tenggorokan', label: 'Tenggorokan' },
  { id: 'bahu', label: 'Bahu' },
  { id: 'tidak-jelas', label: 'Tidak jelas' },
] as const;

/** Satu pertanyaan Temu per kebutuhan. Terbuka, tanpa kesimpulan. */
export const TANYA_TEMU: Record<KebutuhanId, string> = {
  keamanan: 'Kalau uang ini benar-benar keluar, apa yang sebenarnya terancam?',
  kendali: 'Bagian mana yang paling tidak bisa kamu atur — dan bagaimana rasanya membiarkan itu?',
  pengakuan: 'Kalau tidak ada seorang pun yang tahu posisimu sekarang, masih sepenting itukah?',
  pemisahan: 'Kalau kamu tidak perlu membandingkan dengan siapa pun, apa yang tersisa dari rasa ini?',
};

export const PETUNJUK_TEKS_BEBAS = 'Tulis yang pertama muncul. Satu kalimat cukup.';

/** Label wajib di bawah setiap pancingan tap. Kata-katanya dikunci oleh tes. */
export const LABEL_PANCINGAN = 'Jangan dipilih kalau tidak benar-benar terasa.';

export const TANYA_PILAH = 'Yang menahan ini — rasanya seperti apa?';

/** Pemilahan jenis temuan — pengecualian tap yang kedua. */
export const JENIS_TEMUAN: readonly { id: JenisTemuan; label: string; keterangan: string }[] = [
  {
    id: 'program',
    label: 'Kalimat di kepala',
    keterangan: 'Ada keyakinan yang bicara: "kalau begini, nanti begitu."',
  },
  { id: 'emosi', label: 'Rasa pekat', keterangan: 'Tidak berbentuk kalimat. Sesak, berat, panas.' },
  {
    id: 'informasi',
    label: 'Ada yang nyata kurang',
    keterangan: 'Angka, data, atau hal yang memang belum jelas.',
  },
  {
    id: 'kebiasaan',
    label: 'Tidak ada yang menolak',
    keterangan: 'Sebenarnya lega. Cuma belum pernah ada jalurnya.',
  },
];

/** Cabang EMOSI — pelepasan. Pertanyaan, bukan perintah. */
export const NASKAH_PELEPASAN = {
  pembuka: 'Bisakah rasa ini dibiarkan ada sebentar, apa adanya?',
  tiga: ['Bisakah saya melepaskannya?', 'Maukah saya melepaskannya?', 'Kapan?'],
  bilaRagu: 'Mendingan pegangan terus, atau mendingan bebas?',
  catatan: 'Ya dan tidak sama-sama boleh. Yang terjadi ada di menjawabnya.',
} as const;

/** Cabang INFORMASI — bukan urusan batin. */
export const NASKAH_INFORMASI = 'Ini bukan soal rasa. Ini datanya:';

/** Label panel data di cabang INFORMASI. Angka, bukan tafsir. */
export const LABEL_DATA = {
  arusKas: 'Arus kas bulanan',
  sisaPlafon: 'Sisa plafon pinjaman',
  totalCicilan: 'Total cicilan bulanan',
} as const;

/** Cabang KEBIASAAN — langsung ke tindakan, tanpa kalimat. */
export const NASKAH_KEBIASAAN =
  'Kalau tidak ada yang menolak, tidak perlu digali. Tentukan saja satu langkah terkecilnya.';

/** TANAM. */
export const NASKAH_TANAM = {
  kalimat:
    'Tulis satu kalimat yang jujur. Tidak melompati fakta, dan tidak menuntut sampai garis akhir.',
  tindakan: 'Satu tindakan terkecil yang sanggup — diukur dari hari terburuk, bukan hari terbaik.',
  sekali: 'Sekali saja. Tidak perlu diulang-ulang.',
} as const;

/**
 * Label tombol. Sengaja pendek dan datar — tidak ada tombol yang terdengar
 * lebih benar daripada tombol sebelahnya.
 */
export const LABEL_TOMBOL = {
  catat: 'Catat',
  lanjut: 'Lanjut',
  lewati: 'Lewati',
  simpan: 'Simpan',
  ya: 'Ya',
  tidak: 'Tidak',
} as const;

/** TUAI. Kalimat pemain muncul lagi di sini sebagai kenangan, bukan mantra. */
export const NASKAH_TUAI = {
  pembuka: (giliran: number) => `${giliran} giliran lalu kamu menulis:`,
  hasilLuar: 'Hasil di luar',
  hasilDalam: 'Hasil di dalam',
  tenang: 'diputuskan dalam keadaan tenang',
  tersulut: 'diputuskan sambil tersulut',
  /**
   * Untuk hasil yang memang tidak bisa diukur — guncangan tidak pernah
   * menawarkan jalur lain, dan aset yang sudah dijual tidak punya nilai
   * berjalan lagi. Tanda hubung, bukan "Rp 0": nol akan terbaca "impas".
   */
  takTerukur: '—',
} as const;
