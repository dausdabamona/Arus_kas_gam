/**
 * Pesan sistem — bukan suara pemandu 4T, tapi tetap tunduk pada nadanya:
 * menerangkan apa yang terjadi, tanpa menyalahkan pemain atas keadaan yang
 * bukan perbuatannya.
 */

/**
 * Permainan yang direkam sebelum pembaruan besar tidak bisa diputar ulang
 * dengan setia: aturan yang berubah memberi hasil berbeda untuk log yang sama.
 * Menolak dengan terang lebih jujur daripada memuatnya dan diam-diam
 * menampilkan angka yang salah.
 */
export const PESAN_LOG_USANG =
  'Permainan lama tidak bisa dilanjutkan setelah pembaruan besar. Catatan jurnalmu tetap tersimpan.';

/**
 * Benih permainan. Bahasanya sengaja tidak teknis: yang perlu dimengerti
 * pemain bukan PRNG, melainkan bahwa dunia yang sama bisa dibuka lagi — dan
 * bahwa benih saja tidak cukup tanpa profesinya.
 */
export const LABEL_BENIH = 'Benih';
export const LABEL_BENIH_BARU = 'Benih baru';
export const PENJELASAN_BENIH =
  'Benih dan profesi yang sama membuka dunia yang sama — angka, kartu, dan pasar yang persis sama.';
export const PESAN_BENIH_KOSONG = 'Benih tidak boleh kosong. Tulis apa saja, atau ambil benih baru.';
