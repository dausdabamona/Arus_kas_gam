import { describe, it, expect } from 'vitest';
import * as NASKAH from './naskah-jurnal';
import { PENJELASAN_JURNAL, NAMA_KEBUTUHAN } from './naskah-jurnal';

const KATA_VONIS = ['gagal', 'kalah', 'salah', 'seharusnya', 'sayang sekali'];

function semua(nilai: unknown, keluar: string[] = []): string[] {
  if (typeof nilai === 'string') keluar.push(nilai);
  else if (nilai && typeof nilai === 'object') for (const x of Object.values(nilai)) semua(x, keluar);
  return keluar;
}
const KALIMAT = semua(NASKAH);

describe('naskah jurnal', () => {
  it('benar-benar memeriksa kalimat', () => {
    expect(KALIMAT.length).toBeGreaterThan(6);
  });

  it.each(KATA_VONIS)('tidak pernah memakai kata "%s"', (kata) => {
    expect(KALIMAT.filter((s) => s.toLowerCase().includes(kata))).toEqual([]);
  });

  it('tanpa seruan', () => {
    for (const s of KALIMAT) expect(s).not.toContain('!');
  });

  /**
   * Janji yang sama dengan PESAN_LOG_USANG, diucapkan di layar tempat pemain
   * paling mungkin cemas kehilangannya. Kalau kalimatnya menghilang, penjaga
   * di jurnal-lintas-sesi.test.ts menjaga janji yang tidak lagi diucapkan.
   */
  it('menyebut bahwa jurnal selamat dari penghapusan permainan', () => {
    expect(PENJELASAN_JURNAL.toLowerCase()).toContain('dihapus');
    expect(PENJELASAN_JURNAL.toLowerCase()).toContain('tersimpan');
  });

  it('keempat kebutuhan §9.1 punya nama', () => {
    expect(Object.keys(NAMA_KEBUTUHAN).sort()).toEqual([
      'keamanan',
      'kendali',
      'pemisahan',
      'pengakuan',
    ]);
  });
});
