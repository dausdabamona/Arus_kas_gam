import { describe, it, expect } from 'vitest';
import { buatPrng, prngUntuk } from './prng';

describe('buatPrng', () => {
  it('menghasilkan urutan yang sama untuk seed yang sama', () => {
    const a = buatPrng('sorong-2026');
    const b = buatPrng('sorong-2026');
    const deretA = [a(), a(), a(), a(), a()];
    const deretB = [b(), b(), b(), b(), b()];
    expect(deretA).toEqual(deretB);
  });

  it('menghasilkan urutan berbeda untuk seed berbeda', () => {
    const a = buatPrng('seed-satu');
    const b = buatPrng('seed-dua');
    expect(a()).not.toEqual(b());
  });

  it('selalu mengembalikan nilai dalam rentang [0, 1)', () => {
    const prng = buatPrng('rentang');
    for (let i = 0; i < 1000; i++) {
      const n = prng();
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(1);
    }
  });
});

describe('prngUntuk', () => {
  it('memberi hasil sama untuk seed dan indeks yang sama', () => {
    expect(prngUntuk('s', 7)()).toEqual(prngUntuk('s', 7)());
  });

  it('memberi hasil berbeda untuk indeks berbeda', () => {
    expect(prngUntuk('s', 7)()).not.toEqual(prngUntuk('s', 8)());
  });
});
