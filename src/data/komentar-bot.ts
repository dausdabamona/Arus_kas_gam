import type { JenisMomen } from '../engine/komentar';

/**
 * Komentar bot — §11 dan Prinsip 4.
 *
 * Bot mengucapkan apa yang IA lakukan dan rasakan, tidak pernah menasihati
 * pemain. Bot adalah cermin, bukan guru: begitu bot mulai berkhotbah, pemain
 * berhenti menyimpulkan sendiri. Tidak ada kata "sebaiknya", "jangan", atau
 * "seharusnya" di berkas ini, dan itu diuji.
 */
export const KOMENTAR_BOT: Record<string, Partial<Record<JenisMomen, readonly string[]>>> = {
  'pak-rudi': {
    'jual-panik': [
      'Lepas semua. Turun begini bisa habis saya.',
      'Sudah, jual. Tidur saya lebih mahal dari ini.',
      'Untung keburu lepas. Eh, harganya balik naik?',
    ],
    'beli-saham': [
      'Semua orang beli, masa saya tidak.',
      'Naik terus dari kemarin. Sekarang atau ketinggalan.',
      'Sekali ini saja. Sayang kalau lewat.',
    ],
    pinjam: [
      'Pinjam dulu, nanti ditutup dari yang kemarin.',
      'Sebentar saja kok. Bulan depan sudah longgar.',
      'Daripada aset saya kejual murah.',
    ],
    'ambil-kartu': [
      'Ini kelihatannya aman.',
      'Yang begini biasanya tidak mengecewakan.',
      'Boleh lah, satu saja.',
    ],
    bangkrut: [
      'Sudah, saya berhenti dulu.',
      'Habis. Saya kira masih bisa dikejar.',
      'Cukup sampai sini.',
    ],
    lolos: ['Akhirnya. Capek juga bolak-balik begini.'],
  },
  'bu-sinta': {
    'ambil-kartu': [
      'Ambil. Rezeki begini tidak datang dua kali.',
      'Yang penting punya dulu, hitungnya nanti.',
      'Sayang kalau dilewat.',
    ],
    'beli-saham': [
      'Yang ini imbalnya paling tinggi.',
      'Modal saya masih ada. Gas.',
      'Kalau tidak sekarang, kapan lagi.',
    ],
    pinjam: [
      'Pinjam sedikit tidak apa-apa, nanti juga tertutup.',
      'Kas saya memang tipis, tapi asetnya banyak.',
    ],
    'jual-panik': [
      'Yah, terpaksa dilepas satu.',
      'Saya jual yang ini dulu, yang lain masih jalan.',
    ],
    'tolak-kartu': ['Yang ini uang mukanya kebesaran.'],
    lolos: ['Nah. Saya bilang juga apa.'],
    bangkrut: ['Kok bisa habis ya. Padahal asetnya banyak.'],
  },
  'pak-umar': {
    'tolak-kartu': [
      'Belum. Uangnya belum berdiri sendiri.',
      'Bagus, tapi bukan untuk saya sekarang.',
      'Saya lewat dulu yang ini.',
    ],
    'ambil-kartu': [
      'Yang ini masuk hitungan saya.',
      'Cukup satu. Tidak usah banyak-banyak.',
    ],
    berhemat: [
      'Saya kecilkan dulu pengeluarannya.',
      'Bisa dikurangi. Tidak apa-apa.',
    ],
    lolos: [
      'Alhamdulillah. Pelan-pelan juga sampai.',
      'Tidak cepat, tapi sampai juga.',
    ],
    // Umar tidak pernah menyentuh saham individual — dan itu diuji.
    'beli-saham': [],
  },
};
