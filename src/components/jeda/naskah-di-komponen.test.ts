import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import * as NASKAH_JEDA from '../../data/naskah-jeda';
import * as NASKAH_GERBANG from '../../data/naskah-gerbang';
import * as NASKAH_AKHIR from '../../data/naskah-akhir';
import * as NASKAH_JURNAL from '../../data/naskah-jurnal';

const KOMPONEN = [
  'src/components/jeda/JedaBatin.tsx',
  'src/components/jeda/SuhuBatin.tsx',
  'src/components/jeda/LayarPanen.tsx',
  'src/components/papan/KartuGuncangTampil.tsx',
  'src/screens/LayarGerbang.tsx',
  'src/components/papan/PitaKebiasaan.tsx',
  // Layar paling berbahaya di permainan ini justru yang paling lama tanpa
  // penjaga: ia dibaca sebagai penilaian atas seorang manusia.
  'src/screens/LayarAkhir.tsx',
  'src/screens/LayarJurnal.tsx',
];

/** Semua kalimat yang benar-benar ada di naskah, untuk dibandingkan. */
function kumpulkan(nilai: unknown, keluar: string[] = []): string[] {
  if (typeof nilai === 'string') keluar.push(nilai);
  else if (typeof nilai === 'function') kumpulkan((nilai as (n: number) => unknown)(6), keluar);
  else if (Array.isArray(nilai)) for (const x of nilai) kumpulkan(x, keluar);
  else if (nilai && typeof nilai === 'object') for (const x of Object.values(nilai)) kumpulkan(x, keluar);
  return keluar;
}
const NASKAH_SAH = [
  ...kumpulkan(NASKAH_JEDA),
  ...kumpulkan(NASKAH_GERBANG),
  ...kumpulkan(NASKAH_AKHIR),
  ...kumpulkan(NASKAH_JURNAL),
];

/**
 * Teks yang sampai ke mata pemain: isi JSX di antara tag, dan isi string
 * literal. Kelas Tailwind disaring karena ia juga berspasi — cirinya tidak
 * pernah memuat huruf kapital, titik, maupun tanda tanya.
 */
function teksTampak(sumber: string): string[] {
  const hasil: string[] = [];
  // Satu baris, tanpa tanda kode: potongan seperti `(t) => t.memproses)` juga
  // terjepit di antara ">" dan "<", dan bukan teks yang dibaca siapa pun.
  for (const m of sumber.matchAll(/>([^<>{}\n;=()[\]]+)</g)) hasil.push(m[1]);
  for (const m of sumber.matchAll(/'([^'\\\n]{2,})'|"([^"\\\n]{2,})"/g)) hasil.push(m[1] ?? m[2]);
  return hasil
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
    .filter((t) => t.includes(' '))
    .filter((t) => /[A-Z?.]/.test(t));
}

describe('naskah tidak pernah ditulis di dalam komponen', () => {
  const sumber = KOMPONEN.map((berkas) => [berkas, readFileSync(berkas, 'utf8')] as const);

  it.each(sumber)('%s tidak memuat satu pun tanda tanya di teks tampak', (_berkas, isi) => {
    expect(teksTampak(isi).filter((t) => t.includes('?'))).toEqual([]);
  });

  it.each(sumber)('%s tidak memuat kalimat pemandu yang tidak berasal dari naskah', (_berkas, isi) => {
    const asing = teksTampak(isi)
      .filter((t) => t.split(/\s+/).length >= 4)
      .filter((t) => !NASKAH_SAH.some((n) => n.includes(t)));
    expect(asing).toEqual([]);
  });
});
