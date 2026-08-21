/**
 * Pembangkit acak deterministik (mulberry32) dengan seed berupa teks.
 * Seluruh keacakan dalam permainan WAJIB lewat sini — tidak ada Math.random().
 */

export type Prng = () => number;

/** FNV-1a: mengubah seed teks menjadi bilangan 32-bit. */
function cacahSeed(seed: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Membuat PRNG dari seed teks. */
export function buatPrng(seed: string): Prng {
  let a = cacahSeed(seed);
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * PRNG khusus satu kejadian. Karena diturunkan dari seed + indeks kejadian,
 * pemutaran ulang event log tidak perlu menyimpan keadaan PRNG sama sekali.
 */
export function prngUntuk(seed: string, indeksKejadian: number): Prng {
  return buatPrng(`${seed}#${indeksKejadian}`);
}
