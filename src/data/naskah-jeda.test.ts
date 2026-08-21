import { describe, it, expect } from 'vitest';
import {
  NASKAH_TENANG,
  TANYA_LOKASI,
  LOKASI_TUBUH,
  TANYA_TEMU,
  PETUNJUK_TEKS_BEBAS,
  LABEL_PANCINGAN,
  TANYA_PILAH,
  JENIS_TEMUAN,
  NASKAH_PELEPASAN,
  NASKAH_INFORMASI,
  NASKAH_KEBIASAAN,
  NASKAH_TANAM,
  NASKAH_TUAI,
} from './naskah-jeda';

/**
 * Kumpulkan setiap kalimat yang pernah dibaca pemain. `pembuka` di NASKAH_TUAI
 * adalah fungsi, jadi dipanggil dengan angka contoh supaya isinya ikut diperiksa.
 */
const semuaKalimat: string[] = [
  ...NASKAH_TENANG,
  TANYA_LOKASI,
  ...LOKASI_TUBUH.map((l) => l.label),
  ...Object.values(TANYA_TEMU),
  PETUNJUK_TEKS_BEBAS,
  LABEL_PANCINGAN,
  TANYA_PILAH,
  ...JENIS_TEMUAN.flatMap((j) => [j.label, j.keterangan]),
  NASKAH_PELEPASAN.pembuka,
  ...NASKAH_PELEPASAN.tiga,
  NASKAH_PELEPASAN.bilaRagu,
  NASKAH_PELEPASAN.catatan,
  NASKAH_INFORMASI,
  NASKAH_KEBIASAAN,
  ...Object.values(NASKAH_TANAM),
  NASKAH_TUAI.pembuka(6),
  NASKAH_TUAI.hasilLuar,
  NASKAH_TUAI.hasilDalam,
  NASKAH_TUAI.tenang,
  NASKAH_TUAI.tersulut,
];

/** Kalimat yang menghakimi, memuji, atau menyuruh. Semuanya haram di naskah pemandu. */
const KATA_TERLARANG = ['seharusnya', 'bagus', 'hebat', 'jangan khawatir'];

describe('naskah jeda batin', () => {
  it('mengumpulkan seluruh kalimat yang dibaca pemain', () => {
    expect(semuaKalimat.length).toBeGreaterThan(20);
    expect(semuaKalimat.every((s) => typeof s === 'string' && s.length > 0)).toBe(true);
  });

  it.each(KATA_TERLARANG)('tidak pernah memakai kata "%s"', (kata) => {
    const melanggar = semuaKalimat.filter((s) => s.toLowerCase().includes(kata));
    expect(melanggar).toEqual([]);
  });

  it('tidak pernah memulai kalimat dengan perintah "harus"', () => {
    const melanggar = semuaKalimat.filter((s) =>
      s
        .split(/(?<=[.?!])\s+/)
        .some((kalimat) => /^harus\s/i.test(kalimat.trim())),
    );
    expect(melanggar).toEqual([]);
  });

  it('menutup setiap pertanyaan Temu dengan tanda tanya', () => {
    expect(Object.values(TANYA_TEMU).every((t) => t.trimEnd().endsWith('?'))).toBe(true);
  });

  it('menyediakan satu pertanyaan Temu untuk tiap kebutuhan', () => {
    expect(Object.keys(TANYA_TEMU).sort()).toEqual([
      'keamanan',
      'kendali',
      'pemisahan',
      'pengakuan',
    ]);
  });

  it('memakai tiga pertanyaan pelepasan persis seperti sumbernya', () => {
    expect(NASKAH_PELEPASAN.tiga).toEqual([
      'Bisakah saya melepaskannya?',
      'Maukah saya melepaskannya?',
      'Kapan?',
    ]);
  });

  it('menyimpan pertanyaan cadangan persis seperti sumbernya', () => {
    expect(NASKAH_PELEPASAN.bilaRagu).toBe('Mendingan pegangan terus, atau mendingan bebas?');
  });

  it('menurunkan Tenang ke badan, bukan ke hitungan napas', () => {
    const gabungan = NASKAH_TENANG.join(' ').toLowerCase();
    expect(gabungan).not.toContain('detik');
    expect(gabungan).not.toContain('hitung');
  });

  it('menyebut telapak kaki, berat badan, dan napas biasa di fase Tenang', () => {
    const gabungan = NASKAH_TENANG.join(' ').toLowerCase();
    expect(gabungan).toContain('telapak kaki');
    expect(gabungan).toContain('berat badan');
    expect(gabungan).toContain('napas');
  });

  it('memakai label pancingan persis seperti aturan naskah', () => {
    expect(LABEL_PANCINGAN).toBe('Jangan dipilih kalau tidak benar-benar terasa.');
  });

  it('menyediakan empat jenis temuan dengan id yang unik', () => {
    expect(JENIS_TEMUAN).toHaveLength(4);
    expect(new Set(JENIS_TEMUAN.map((j) => j.id)).size).toBe(4);
  });

  it('menyediakan lima lokasi tubuh termasuk jalan keluar "tidak jelas"', () => {
    expect(LOKASI_TUBUH).toHaveLength(5);
    expect(LOKASI_TUBUH.some((l) => l.id === 'tidak-jelas')).toBe(true);
  });

  it('menegaskan kalimat Tanam ditulis sekali saja, bukan mantra', () => {
    expect(NASKAH_TANAM.sekali.toLowerCase()).toContain('sekali');
  });
});
