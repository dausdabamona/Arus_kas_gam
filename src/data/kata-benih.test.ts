import { describe, it, expect } from 'vitest';
import { KATA_BENIH } from './kata-benih';

describe('daftar kata benih siap diketik manusia', () => {
  it('tiga daftar, masing-masing cukup panjang', () => {
    expect(KATA_BENIH).toHaveLength(3);
    for (const daftar of KATA_BENIH) expect(daftar.length).toBeGreaterThanOrEqual(40);
  });

  it('hanya huruf kecil a-z — tanpa angka, spasi, atau tanda', () => {
    for (const daftar of KATA_BENIH) {
      for (const kata of daftar) expect(kata).toMatch(/^[a-z]+$/);
    }
  });

  it('panjang kata masuk akal untuk diketik di ponsel', () => {
    for (const daftar of KATA_BENIH) {
      for (const kata of daftar) {
        expect(kata.length).toBeGreaterThanOrEqual(3);
        expect(kata.length).toBeLessThanOrEqual(9);
      }
    }
  });

  it('tanpa kembar di dalam satu daftar', () => {
    for (const daftar of KATA_BENIH) {
      expect(new Set(daftar).size).toBe(daftar.length);
    }
  });

  /**
   * Daftar dibuat tak beririsan supaya "bakau-rusa-bakau" tidak pernah muncul.
   * Benih dengan kata kembar membuat orang yang menyalinnya berhenti dan
   * bertanya apakah ia salah menulis dua kali.
   */
  it('tanpa kata yang muncul di dua daftar', () => {
    const semua = KATA_BENIH.flat();
    expect(new Set(semua).size).toBe(semua.length);
  });

  it('ruang benih cukup luas untuk membedakan laporan', () => {
    const ruang = KATA_BENIH.reduce((j, d) => j * d.length, 1);
    expect(ruang).toBeGreaterThan(50_000);
  });
});

/**
 * Penjaga nada dan kesetiaan (Peran 4). Benih muncul di layar mulai DAN kelak
 * di Ringkasan Akhir — bersebelahan dengan kalimat seperti "bangkrut di
 * giliran 34". Kata bermuatan muram di posisi itu terbaca seperti keterangan
 * gambar, bukan seperti nama.
 *
 * Ini penilaian, bukan pengukuran. Daftarnya ditulis terang supaya keputusannya
 * bisa dibantah, bukan supaya kelihatan objektif.
 */
describe('kosakata benih tidak ikut berkomentar', () => {
  const BERMUATAN = [
    'mendung', 'redup', 'badai', 'petir', 'kemarau', 'dingin',
    'gelap', 'suram', 'murung', 'sepi', 'hilang', 'jatuh', 'rugi',
  ];

  it.each(BERMUATAN)('tidak memuat kata "%s"', (kata) => {
    expect(KATA_BENIH.flat()).not.toContain(kata);
  });

  /**
   * Kata yang di bahasa sehari-hari hanya hidup dalam bentuk ulang. Penyalin
   * yang membaca "kupu" akan membetulkannya jadi "kupu-kupu" — dan benih yang
   * dibetulkan adalah benih yang salah. Bentuk tunggalnya tampak seperti salah
   * ketik justru karena memang tidak pernah dipakai sendirian.
   */
  it.each(['kupu', 'kunang', 'alang', 'ubur', 'laba', 'anai'])(
    'tidak memuat "%s" yang hanya hidup sebagai kata ulang',
    (kata) => {
      expect(KATA_BENIH.flat()).not.toContain(kata);
    },
  );

  /**
   * Ejaannya masih diperdebatkan penutur aslinya (lembap/lembab). Benih yang
   * dieja dua cara adalah benih yang gagal dibuka separuh waktu.
   */
  it('tidak memuat kata yang ejaannya masih berdua', () => {
    for (const kata of ['lembap', 'lembab', 'praktik', 'praktek', 'nasihat', 'nasehat']) {
      expect(KATA_BENIH.flat()).not.toContain(kata);
    }
  });
});
