import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';

/**
 * Aturan GDD §4.2 — `engine/` murni: tanpa React, tanpa Dexie, tanpa efek
 * samping, dan seluruh keacakan lewat PRNG ber-seed.
 *
 * Selama enam fase aturan ini hijau karena ingatan, bukan karena tes. Ia
 * diuji sekarang justru karena benih yang terlihat menggodanya: tempat paling
 * wajar untuk menaruh pembuat benih baru adalah `engine/benih.ts`, dan satu
 * `Math.random()` di sana membuat seluruh janji "benih sama, dunia sama"
 * jadi bohong yang tidak menyalakan satu tes pun.
 */

const BERKAS_MESIN = readdirSync('src/engine')
  .filter((n) => n.endsWith('.ts') && !n.endsWith('.test.ts'))
  .sort();

const TERLARANG: Array<{ pola: RegExp; sebab: string }> = [
  { pola: /Math\.random\s*\(/, sebab: 'keacakan di luar PRNG ber-seed' },
  { pola: /Date\.now\s*\(/, sebab: 'waktu jam dinding' },
  { pola: /new Date\s*\(/, sebab: 'waktu jam dinding' },
  { pola: /performance\.now\s*\(/, sebab: 'waktu jam dinding' },
  { pola: /setTimeout\s*\(/, sebab: 'efek samping berjadwal' },
  { pola: /setInterval\s*\(/, sebab: 'efek samping berjadwal' },
  { pola: /\bfetch\s*\(/, sebab: 'jaringan' },
  { pola: /\b(localStorage|sessionStorage|indexedDB)\b/, sebab: 'penyimpanan' },
  { pola: /\b(window|document|navigator)\./, sebab: 'peramban' },
  { pola: /console\.(log|warn|error)\s*\(/, sebab: 'efek samping keluaran' },
];

/** Impor yang membuat mesin tak lagi bisa dipindahkan ke server multiplayer. */
const IMPOR_TERLARANG = /from\s+'(react[^']*|zustand[^']*|dexie[^']*|\.\.\/lib\/[^']*|\.\.\/hooks\/[^']*|\.\.\/components\/[^']*|\.\.\/screens\/[^']*)'/;

/** Baris komentar disaring: aturan ini soal kode, bukan soal menyebut namanya. */
function baris(sumber: string): string[] {
  return sumber
    .split('\n')
    .map((b) => b.trim())
    .filter((b) => !b.startsWith('*') && !b.startsWith('//') && !b.startsWith('/*'));
}

describe('engine/ murni — dibuktikan tes, bukan diingat', () => {
  it('benar-benar membaca berkas mesin, dan yang penting ada di dalamnya', () => {
    // Penjaga tak-hampa: daftar kosong akan membuat seluruh describe ini
    // hijau tanpa memeriksa apa pun.
    expect(BERKAS_MESIN.length).toBeGreaterThan(10);
    for (const wajib of ['reducer.ts', 'benih.ts', 'prng.ts', 'keuangan.ts']) {
      expect(BERKAS_MESIN).toContain(wajib);
    }
  });

  it.each(BERKAS_MESIN)('%s tanpa keacakan, waktu, dan efek samping', (nama) => {
    const isi = baris(readFileSync(`src/engine/${nama}`, 'utf8'));
    for (const { pola, sebab } of TERLARANG) {
      const kena = isi.find((b) => pola.test(b));
      expect(kena, `${nama}: ${sebab} — ${kena}`).toBeUndefined();
    }
  });

  it.each(BERKAS_MESIN)('%s tanpa impor dari luar mesin dan data', (nama) => {
    const isi = baris(readFileSync(`src/engine/${nama}`, 'utf8'));
    const kena = isi.find((b) => IMPOR_TERLARANG.test(b));
    expect(kena, `${nama}: impor terlarang — ${kena}`).toBeUndefined();
  });
});
