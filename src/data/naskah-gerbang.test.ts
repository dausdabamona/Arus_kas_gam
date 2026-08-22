import { describe, it, expect } from 'vitest';
import * as NASKAH from './naskah-gerbang';
import { PENJELASAN_KEBIASAAN, TANPA_KEBIASAAN, TANYA_NIAT, UCAPAN_LOLOS } from './naskah-gerbang';
import { KARTU_KEBIASAAN } from './kartu-kebiasaan';

/**
 * Penjaga lantai untuk fondasi §7.2. Kartu kebiasaan bukan hukuman; kalau
 * layar Gerbang membingkainya sebagai denda, Aturan Naskah 6 runtuh diam-diam.
 *
 * Ini LANTAI, bukan langit-langit: kalimat bisa lolos keempat kata terlarang
 * dan tetap terdengar menghakimi. Penilaian itu tidak bisa diserahkan ke tes.
 */
const KATA_VONIS = ['denda', 'hukuman', 'gagal', 'kalah'];

const semuaKalimat = Object.values(NASKAH).filter((n): n is string => typeof n === 'string');

describe('naskah gerbang niat', () => {
  it.each(KATA_VONIS)('tidak pernah memakai kata "%s"', (kata) => {
    expect(semuaKalimat.filter((s) => s.toLowerCase().includes(kata))).toEqual([]);
  });

  it.each(KATA_VONIS)('kartu kebiasaan pun tidak memakai kata "%s"', (kata) => {
    const melanggar = KARTU_KEBIASAAN.filter((k) =>
      `${k.nama} ${k.keterangan} ${k.caraLepas}`.toLowerCase().includes(kata),
    ).map((k) => k.id);
    expect(melanggar).toEqual([]);
  });

  it('tidak pernah menyapa pemain dengan kata "kamu" yang menuduh', () => {
    // "kamu membawanya" boleh; "kamu belum/tidak/kurang" adalah jari yang
    // menunjuk. Yang dilarang adalah bentuk kekurangan yang ditempelkan ke orang.
    expect(/kamu (belum|tidak|kurang|gagal)/i.test(PENJELASAN_KEBIASAAN)).toBe(false);
  });

  it('menerangkan sebab, bukan menilai — menyebut latihan sebagai jalannya', () => {
    expect(PENJELASAN_KEBIASAAN.toLowerCase()).toContain('latih');
  });

  it('menunjuk ke jalan keluar yang benar-benar ada di tiap kartu', () => {
    expect(KARTU_KEBIASAAN.every((k) => k.caraLepas.trim().length > 0)).toBe(true);
  });

  it('tidak menyebut kebiasaan sama sekali pada jalur nol kartu', () => {
    expect(TANPA_KEBIASAAN.toLowerCase()).not.toContain('kebiasaan');
    expect(TANPA_KEBIASAAN.toLowerCase()).not.toContain('refleks');
  });

  it('menutup pertanyaan niat dengan tanda tanya', () => {
    expect(TANYA_NIAT.trimEnd().endsWith('?')).toBe(true);
  });

  it('menyatakan lolos apa adanya, tanpa seruan', () => {
    expect(UCAPAN_LOLOS).not.toContain('!');
  });
});
