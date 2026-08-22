import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import tema from '../../tailwind.config.js';

/**
 * Kelas warna yang tidak ada di palet TIDAK menyalakan apa pun: Tailwind
 * mengabaikannya, teksnya tampil dengan warna bawaan, dan tidak satu tes pun
 * berubah. Ia hanya terlihat kalau seseorang memandangi layarnya dan
 * kebetulan tahu warnanya seharusnya apa.
 *
 * Ditemukan begitu: `text-amber-tua` di layar Jurnal — palet cuma punya
 * `amber` dan `amber-muda`, jadi "tersulut" tampil hitam biasa di sebelah
 * "tenang" yang teal. §9.3 justru meminta dua sisi berbobot sama.
 */

const WARNA = (tema as { theme: { extend: { colors: Record<string, unknown> } } }).theme.extend.colors;

/** Semua nama warna yang sah, termasuk bentuk "teal-muda" dan "teal" sendiri. */
const SAH = new Set<string>();
for (const [nama, nilai] of Object.entries(WARNA)) {
  if (typeof nilai === 'string') {
    SAH.add(nama);
    continue;
  }
  for (const kunci of Object.keys(nilai as Record<string, string>)) {
    SAH.add(kunci === 'DEFAULT' ? nama : `${nama}-${kunci}`);
  }
}

function berkasTsx(dir: string, keluar: string[] = []): string[] {
  for (const isi of readdirSync(dir, { withFileTypes: true })) {
    const jalur = join(dir, isi.name);
    if (isi.isDirectory()) berkasTsx(jalur, keluar);
    else if (isi.name.endsWith('.tsx') && !isi.name.endsWith('.test.tsx')) keluar.push(jalur);
  }
  return keluar;
}

const BERKAS = berkasTsx('src');
const AWALAN = new Set(Object.keys(WARNA));

/**
 * Hanya kelas yang JELAS menunjuk palet ini yang diperiksa. Kelas Tailwind
 * bawaan (text-sm, text-xs, border-t) tidak diawali nama warna kita.
 */
function kelasWarna(sumber: string): string[] {
  const hasil: string[] = [];
  for (const m of sumber.matchAll(/\b(?:text|bg|border|ring|fill|stroke|from|via|to)-([a-z]+(?:-[a-z]+)?)(?:\/\d+)?\b/g)) {
    const nama = m[1];
    if (AWALAN.has(nama.split('-')[0])) hasil.push(nama);
  }
  return hasil;
}

describe('kelas warna selalu ada di palet', () => {
  it('benar-benar memindai komponen, dan menemukan kelas warna di dalamnya', () => {
    expect(BERKAS.length).toBeGreaterThan(10);
    const semua = BERKAS.flatMap((f) => kelasWarna(readFileSync(f, 'utf8')));
    expect(semua.length).toBeGreaterThan(30);
  });

  it.each(BERKAS)('%s tidak memakai warna yang tidak ada', (berkas) => {
    const hantu = kelasWarna(readFileSync(berkas, 'utf8')).filter((k) => !SAH.has(k));
    expect([...new Set(hantu)]).toEqual([]);
  });
});
