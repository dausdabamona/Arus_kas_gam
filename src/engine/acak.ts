import type { Prng } from './prng';

/** Lemparan satu dadu enam sisi. */
export function lemparDadu(prng: Prng): number {
  return Math.floor(prng() * 6) + 1;
}

/** Bilangan bulat acak antara min dan max, keduanya inklusif. */
export function bilanganAcak(prng: Prng, min: number, max: number): number {
  return min + Math.floor(prng() * (max - min + 1));
}

/** Mengambil satu anggota daftar secara acak. */
export function ambilSatu<T>(prng: Prng, daftar: readonly T[]): T {
  if (daftar.length === 0) throw new Error('Daftar kosong');
  return daftar[Math.floor(prng() * daftar.length)];
}

/** Mengocok daftar (Fisher–Yates) dan mengembalikan salinan baru. */
export function kocok<T>(prng: Prng, daftar: readonly T[]): T[] {
  const hasil = [...daftar];
  for (let i = hasil.length - 1; i > 0; i--) {
    const j = Math.floor(prng() * (i + 1));
    [hasil[i], hasil[j]] = [hasil[j], hasil[i]];
  }
  return hasil;
}
