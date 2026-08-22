import { describe, it, expect } from 'vitest';
import { rupiah, tahun } from './format';

describe('rupiah', () => {
  it('menulis angka penuh tanpa singkatan', () => {
    expect(rupiah(340_000_000)).toContain('340.000.000');
  });

  it('memberi tanda minus untuk nilai negatif', () => {
    expect(rupiah(-1_250_000)).toContain('-');
  });

  it('tidak menampilkan angka di belakang koma', () => {
    expect(rupiah(1_000_000)).not.toContain(',');
  });

  it('menulis nol sebagai Rp 0', () => {
    expect(rupiah(0)).toContain('0');
  });
});

describe('tahun', () => {
  it('memakai koma desimal, bukan titik', () => {
    // Di layar yang sama "Rp 3.400.000" memakai titik sebagai pemisah ribuan.
    expect(tahun(3.2)).toBe('3,2');
  });

  it('tidak menempelkan desimal nol pada bilangan bulat', () => {
    expect(tahun(2)).toBe('2');
  });
});
