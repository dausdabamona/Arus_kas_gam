/**
 * Kosakata benih permainan. Tiga daftar, satu kata diambil dari masing-masing,
 * menghasilkan benih seperti `kabut-rusa-lontar`.
 *
 * Semua kata sengaja dipilih dari alam — cuaca, satwa, tumbuhan — dan bukan
 * dari dunia uang. Benih ini muncul di layar mulai DAN di ringkasan akhir;
 * kata yang bermuatan akan terbaca seperti komentar permainan atas pemainnya.
 *
 * Aturan bentuk (dikunci di kata-benih.test.ts): huruf kecil a-z saja, 3-9
 * huruf, tanpa kembar di dalam maupun antar daftar. Batas panjang bukan selera
 * tata letak — benih ini akan diketik ulang di ponsel oleh orang yang
 * menyalinnya dari sebuah pesan.
 */

/** Cuaca dan langit. */
const CUACA = [
  'kabut', 'embun', 'fajar', 'senja', 'hujan', 'angin', 'awan', 'mendung',
  'petir', 'pelangi', 'gerimis', 'bayu', 'bintang', 'bulan', 'purnama', 'sabit',
  'cahaya', 'kilat', 'badai', 'teduh', 'terang', 'redup', 'subuh', 'pagi',
  'petang', 'malam', 'dingin', 'hangat', 'sejuk', 'lembap', 'kemarau', 'musim',
  'langit', 'ufuk', 'mega', 'halimun', 'rembulan', 'matahari', 'kemilau',
  'sinar', 'angkasa', 'lintang', 'sepoi', 'semilir', 'rinai', 'surya',
  'candra', 'kartika',
] as const;

/** Satwa, banyak di antaranya dari timur Indonesia. */
const SATWA = [
  'rusa', 'elang', 'kancil', 'merak', 'penyu', 'kepiting', 'camar', 'tapir',
  'anoa', 'kasuari', 'bangau', 'walet', 'jalak', 'kutilang', 'murai', 'tekukur',
  'belibis', 'pelanduk', 'landak', 'musang', 'kelinci', 'duyung', 'hiu', 'pari',
  'kakap', 'kerapu', 'tenggiri', 'cakalang', 'tongkol', 'teri', 'udang',
  'kerang', 'siput', 'kunang', 'capung', 'kupu', 'lebah', 'nuri', 'kakatua',
  'mambruk', 'julang', 'rangkong', 'kuskus', 'kanguru', 'walabi', 'komodo',
  'biawak', 'tarsius',
] as const;

/** Tumbuhan. */
const TUMBUHAN = [
  'lontar', 'cendana', 'bakau', 'pandan', 'rotan', 'sagu', 'damar', 'meranti',
  'matoa', 'kelapa', 'nipah', 'gaharu', 'kenanga', 'melati', 'cempaka',
  'teratai', 'bambu', 'jati', 'ulin', 'sengon', 'mahoni', 'akasia', 'waru',
  'ketapang', 'beringin', 'randu', 'kemiri', 'pinang', 'sirih', 'kunyit',
  'jahe', 'lengkuas', 'serai', 'lumut', 'anggrek', 'pakis', 'alang', 'ilalang',
  'rumbia', 'sukun', 'langsat', 'duku', 'rambutan', 'salak', 'kecapi',
  'gandaria', 'jambu', 'kemuning',
] as const;

export const KATA_BENIH: readonly (readonly string[])[] = [CUACA, SATWA, TUMBUHAN];
