import { describe, it, expect } from 'vitest';
import { buatPrng } from './prng';
import { lemparDadu, bilanganAcak, ambilSatu, kocok } from './acak';

describe('lemparDadu', () => {
  it('selalu menghasilkan 1 sampai 6', () => {
    const prng = buatPrng('dadu');
    for (let i = 0; i < 500; i++) {
      const n = lemparDadu(prng);
      expect(Number.isInteger(n)).toBe(true);
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(6);
    }
  });

  it('mencakup semua sisi dalam 500 lemparan', () => {
    const prng = buatPrng('cakupan');
    const muncul = new Set<number>();
    for (let i = 0; i < 500; i++) muncul.add(lemparDadu(prng));
    expect(muncul.size).toBe(6);
  });
});

describe('bilanganAcak', () => {
  it('inklusif di kedua ujung', () => {
    const prng = buatPrng('rentang');
    const muncul = new Set<number>();
    for (let i = 0; i < 500; i++) muncul.add(bilanganAcak(prng, 4, 10));
    expect(Math.min(...muncul)).toBe(4);
    expect(Math.max(...muncul)).toBe(10);
  });

  it('mengembalikan nilai tunggal bila min sama dengan max', () => {
    expect(bilanganAcak(buatPrng('x'), 3, 3)).toBe(3);
  });
});

describe('ambilSatu', () => {
  it('mengembalikan salah satu anggota daftar', () => {
    const daftar = ['a', 'b', 'c'] as const;
    const nilai = ambilSatu(buatPrng('ambil'), daftar);
    expect(daftar).toContain(nilai);
  });

  it('melempar galat bila daftar kosong', () => {
    expect(() => ambilSatu(buatPrng('kosong'), [])).toThrow('Daftar kosong');
  });
});

describe('kocok', () => {
  it('tidak mengubah daftar asli', () => {
    const asli = [1, 2, 3, 4, 5];
    kocok(buatPrng('kocok'), asli);
    expect(asli).toEqual([1, 2, 3, 4, 5]);
  });

  it('mempertahankan semua anggota', () => {
    const hasil = kocok(buatPrng('kocok'), [1, 2, 3, 4, 5]);
    expect([...hasil].sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it('memberi hasil sama untuk seed sama', () => {
    const a = kocok(buatPrng('sama'), [1, 2, 3, 4, 5, 6, 7, 8]);
    const b = kocok(buatPrng('sama'), [1, 2, 3, 4, 5, 6, 7, 8]);
    expect(a).toEqual(b);
  });
});
