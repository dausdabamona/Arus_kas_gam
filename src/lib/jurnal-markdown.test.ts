import { describe, it, expect } from 'vitest';
import { jurnalKeMarkdown } from './jurnal-markdown';
import type { EntriJurnal } from './db';

function entri(bagian: Partial<EntriJurnal> = {}): EntriJurnal {
  return {
    id: 1,
    permainanId: 'g1',
    dibuatPada: Date.UTC(2026, 7, 22, 3, 0, 0),
    kebutuhan: 'keamanan',
    kalimat: 'Rezeki saya tidak ditentukan satu tawaran.',
    tindakan: 'Tunggu satu giliran sebelum memutuskan.',
    hasilLuar: 0,
    hasilDalam: 'tenang',
    ...bagian,
  };
}

describe('jurnal ke markdown (§12)', () => {
  it('memuat kalimat dan tindakan apa adanya', () => {
    const md = jurnalKeMarkdown([entri()]);
    expect(md).toContain('Rezeki saya tidak ditentukan satu tawaran.');
    expect(md).toContain('Tunggu satu giliran sebelum memutuskan.');
  });

  it('menulis kedua sisi hasil, bukan sisi uangnya saja', () => {
    const md = jurnalKeMarkdown([entri({ hasilLuar: 2_500_000, hasilDalam: 'tersulut' })]);
    expect(md).toContain('Hasil di luar');
    expect(md).toContain('Hasil di dalam');
    expect(md.toLowerCase()).toContain('tersulut');
  });

  /**
   * Nol berarti tak terukur, bukan impas — aturan yang sama dengan Layar Panen
   * dan layar Jurnal. Menuliskannya "Rp 0" di berkas yang disalin ke jurnal 30
   * hari akan membekukan kekeliruan itu di luar aplikasi, tempat ia tidak bisa
   * dibetulkan lagi.
   */
  it('hasil luar nol ditulis sebagai tanda hubung, bukan Rp 0', () => {
    const md = jurnalKeMarkdown([entri({ hasilLuar: 0 })]);
    expect(md).toContain('—');
    expect(md).not.toContain('Rp 0');
  });

  it('menyertakan pola kebutuhan bila ada', () => {
    const md = jurnalKeMarkdown([
      entri({ id: 1, kebutuhan: 'keamanan' }),
      entri({ id: 2, kebutuhan: 'keamanan' }),
      entri({ id: 3, kebutuhan: 'kendali' }),
    ]);
    expect(md).toContain('3 momen bertekanan');
    expect(md).toContain('2 berhenti di');
  });

  it('tanpa pola, tidak mengarang satu pun kalimat pola', () => {
    const md = jurnalKeMarkdown([entri({ id: 1, kebutuhan: 'keamanan' }), entri({ id: 2, kebutuhan: 'kendali' })]);
    expect(md).not.toContain('berhenti di');
  });

  it('jurnal kosong tetap menghasilkan berkas yang sah, bukan teks kosong', () => {
    const md = jurnalKeMarkdown([]);
    expect(md.trim().length).toBeGreaterThan(0);
    expect(md).toContain('#');
  });

  it('markdown yang sah — judul, tanggal, pemisah antar entri', () => {
    const md = jurnalKeMarkdown([entri({ id: 1 }), entri({ id: 2, dibuatPada: Date.UTC(2026, 7, 23) })]);
    expect(md.startsWith('# ')).toBe(true);
    expect(md).toContain('2026');
    expect((md.match(/^---$/gm) ?? []).length).toBeGreaterThanOrEqual(1);
  });

  /**
   * Kalimat pemain bisa memuat tanda apa pun. Markdown yang rusak karena
   * kalimatnya mengandung bintang atau tanda pagar akan merusak jurnal
   * tujuannya — dan yang tampak rusak di sana adalah tulisan pemain.
   */
  it('kalimat bertanda baca tidak merusak strukturnya', () => {
    const md = jurnalKeMarkdown([entri({ kalimat: '# Bukan judul *dan* bukan _miring_' })]);
    expect(md).toContain('# Bukan judul *dan* bukan _miring_');
    expect(md.startsWith('# Jurnal')).toBe(true);
  });
});

describe('urutan berkas yang dibawa keluar', () => {
  /**
   * Layar menampilkan terbaru dulu — itu benar untuk menelusuri. Berkas ini
   * disalin ke buku catatan yang berjalan maju, dan blok terbalik di dalamnya
   * membuat latihan orang terbaca mundur.
   */
  it('terlama dulu, kebalikan dari layarnya', () => {
    const md = jurnalKeMarkdown([
      entri({ id: 1, dibuatPada: 3000, kalimat: 'Paling baru.' }),
      entri({ id: 2, dibuatPada: 1000, kalimat: 'Paling lama.' }),
      entri({ id: 3, dibuatPada: 2000, kalimat: 'Di tengah.' }),
    ]);
    expect(md.indexOf('Paling lama.')).toBeLessThan(md.indexOf('Di tengah.'));
    expect(md.indexOf('Di tengah.')).toBeLessThan(md.indexOf('Paling baru.'));
  });

  it('tidak mengubah daftar yang diberikan', () => {
    const daftar = [entri({ id: 1, dibuatPada: 3000 }), entri({ id: 2, dibuatPada: 1000 })];
    const salinan = JSON.parse(JSON.stringify(daftar));
    jurnalKeMarkdown(daftar);
    expect(daftar).toEqual(salinan);
  });
});
