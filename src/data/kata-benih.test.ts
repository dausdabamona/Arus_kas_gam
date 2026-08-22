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
