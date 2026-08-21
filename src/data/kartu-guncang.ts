import type { KartuGuncang } from '../types/guncang';

/**
 * Delapan kartu, empat pemicu. Setiap pemicu punya minimal satu kartu tak
 * bersyarat supaya petak GUNCANG tidak pernah kehabisan kartu.
 *
 * Pengali kas di sini adalah dugaan awal. Tugas 5 yang mengikatnya ke Invarian 6
 * lewat simulator — kalau keduanya berselisih, simulator yang menang.
 */
export const KARTU_GUNCANG: readonly KartuGuncang[] = [
  {
    id: 'orang-tua-sakit',
    judul: 'Orang tua masuk rumah sakit',
    teks: 'Biayanya sekarang, bukan nanti. Tidak ada pilihan menolak.',
    pemicu: 'keamanan',
    efek: { jenis: 'kas', pengali: [2.5, 5] },
  },
  {
    id: 'atap-rumah',
    judul: 'Atap rumah jebol kena angin',
    teks: 'Hujan masuk kamar. Tukang minta uang muka hari ini.',
    pemicu: 'keamanan',
    efek: { jenis: 'kas', pengali: [1.5, 3] },
  },
  {
    id: 'harga-naik',
    judul: 'Harga-harga naik',
    teks: 'Belanja bulanan yang sama, angkanya tidak sama lagi. Ini tidak akan turun.',
    pemicu: 'keamanan',
    efek: { jenis: 'inflasi', kenaikan: 0.08 },
  },
  {
    id: 'kena-tipu-kecil',
    judul: 'Transfer ke nomor yang salah',
    teks: 'Uangnya tidak kembali. Yang paling mengganggu bukan jumlahnya.',
    pemicu: 'kendali',
    efek: { jenis: 'kas', pengali: [0.5, 1.5] },
  },
  {
    /**
     * "Harusnya" di sini adalah suara bot, bukan suara pemandu. Penjaga nada
     * di naskah-jeda.test.ts sengaja tidak menjangkau kartu — kartu memang
     * boleh menusuk, naskah pemandu tidak.
     */
    id: 'bot-lolos',
    judul: '{nama} lolos duluan',
    teks: '"Saya bilang juga apa. Harusnya ambil yang kemarin itu."',
    pemicu: 'pengakuan',
    efek: { jenis: 'tanpa-efek' },
    syarat: 'ada-bot-lolos',
  },
  {
    id: 'reuni',
    judul: 'Undangan reuni',
    teks: 'Semua akan bercerita sedang di posisi apa. Kamu akan bercerita apa?',
    pemicu: 'pengakuan',
    efek: { jenis: 'tanpa-efek' },
  },
  {
    id: 'yang-ditolak-naik',
    judul: 'Yang kemarin kamu tolak, naik',
    teks: '{barang} yang kamu lewati sekarang bernilai jauh lebih tinggi.',
    pemicu: 'kendali',
    efek: { jenis: 'tanpa-efek' },
    syarat: 'ada-riwayat-ditolak',
  },
  {
    id: 'grup-keluarga',
    judul: 'Foto rumah baru di grup keluarga',
    teks: 'Sepupumu pindah. Semua mengucapkan selamat, dan kamu ikut mengetik selamat.',
    pemicu: 'pemisahan',
    efek: { jenis: 'tanpa-efek' },
  },
  {
    id: 'saudara-pinjam',
    judul: 'Saudara datang meminjam uang',
    teks: 'Jumlahnya tidak kecil, dan menolak keluarga rasanya bukan pilihan.',
    pemicu: 'pemisahan',
    efek: { jenis: 'kas', pengali: [1, 2.5] },
  },
];

export function cariKartuGuncang(id: string): KartuGuncang {
  const kartu = KARTU_GUNCANG.find((k) => k.id === id);
  if (!kartu) throw new Error(`Kartu guncang tidak dikenal: ${id}`);
  return kartu;
}
