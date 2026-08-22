import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import tema from '../../tailwind.config.js';

/**
 * Kontras teks minimal 4,5:1 (WCAG AA teks biasa). Pengguna sasaran §1.4
 * memakai HP Android kelas bawah — layar murah, sering di luar ruangan.
 *
 * Diukur, bukan dikira. tinta #1C1917 di atas ivory #FDFBF7 memberi 16,92:1
 * penuh, tapi opasitasnya menggerus cepat:
 *
 *   45% -> 2,88    50% -> 3,33    55% -> 3,87    60% -> 4,54    65% -> 5,35
 *
 * Dan di atas panel teal-muda/40 yang dipakai beberapa kotak, 60% turun jadi
 * 4,49 — LOLOS di satu latar, GAGAL di latar sebelahnya. Karena itu batasnya
 * 65%, bukan 60%.
 *
 * Sebelum ini seluruh label kecil memakai /50 dan /45: 38 pelanggaran terukur
 * di peramban, di 12 px, pada teks seperti "Pendapatan pasif" dan "Pengeluaran".
 */
const BATAS_ALPHA = 65;

function hex(h: string): number[] {
  return [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
}
function luminansi(c: number[]): number {
  const s = c.map((v) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * s[0] + 0.7152 * s[1] + 0.0722 * s[2];
}
function kontras(a: number[], b: number[]): number {
  const [L1, L2] = [luminansi(a), luminansi(b)];
  return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
}
const campur = (fg: number[], bg: number[], a: number) => fg.map((v, i) => v * a + bg[i] * (1 - a));

const WARNA = (tema as { theme: { extend: { colors: Record<string, string | Record<string, string>> } } })
  .theme.extend.colors;
const IVORY = hex(WARNA.ivory as string);
const TINTA = hex(WARNA.tinta as string);
const PANEL = campur(hex((WARNA.teal as Record<string, string>).muda), IVORY, 0.4);

function berkas(dir: string, keluar: string[] = []): string[] {
  for (const isi of readdirSync(dir, { withFileTypes: true })) {
    const jalur = join(dir, isi.name);
    if (isi.isDirectory()) berkas(jalur, keluar);
    else if (isi.name.endsWith('.tsx') && !isi.name.endsWith('.test.tsx')) keluar.push(jalur);
  }
  return keluar;
}
const BERKAS = berkas('src');

describe('kontras teks', () => {
  it('ambangnya benar-benar berasal dari hitungan, bukan dari selera', () => {
    expect(kontras(campur(TINTA, IVORY, 0.5), IVORY)).toBeLessThan(4.5);
    expect(kontras(campur(TINTA, PANEL, 0.6), PANEL)).toBeLessThan(4.5);
    expect(kontras(campur(TINTA, IVORY, BATAS_ALPHA / 100), IVORY)).toBeGreaterThanOrEqual(4.5);
    expect(kontras(campur(TINTA, PANEL, BATAS_ALPHA / 100), PANEL)).toBeGreaterThanOrEqual(4.5);
  });

  it('memindai komponen sungguhan, dan menemukan kelas teks di dalamnya', () => {
    expect(BERKAS.length).toBeGreaterThan(10);
    const semua = BERKAS.flatMap((f) => readFileSync(f, 'utf8').match(/text-tinta\/\d+/g) ?? []);
    expect(semua.length).toBeGreaterThan(50);
  });

  it.each(BERKAS)('%s tidak memakai teks di bawah ambang', (f) => {
    const kelas: string[] = readFileSync(f, 'utf8').match(/text-tinta\/\d+/g) ?? [];
    const pelanggar = kelas.filter((k) => Number(k.split('/')[1]) < BATAS_ALPHA);
    expect([...new Set(pelanggar)]).toEqual([]);
  });

  it('warna aksen palet lolos untuk teks biasa', () => {
    for (const nama of ['untung', 'rugi'] as const) {
      expect(kontras(hex(WARNA[nama] as string), IVORY)).toBeGreaterThanOrEqual(4.5);
    }
    expect(kontras(hex((WARNA.amber as Record<string, string>).DEFAULT), IVORY)).toBeGreaterThanOrEqual(4.5);
    expect(kontras(hex((WARNA.teal as Record<string, string>).DEFAULT), IVORY)).toBeGreaterThanOrEqual(4.5);
  });
});
