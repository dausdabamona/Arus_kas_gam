import { describe, it, expect } from 'vitest';
import * as NASKAH from './naskah-akhir';
import {
  JUDUL_KUADRAN,
  KETERANGAN_KUADRAN,
  KETERANGAN_AKHIR,
  BELUM_TERUJI,
  CATATAN_ALAT_LATIHAN,
  DISCLAIMER,
} from './naskah-akhir';
import { KUADRAN } from '../engine/ringkasan';

/**
 * Penjaga lantai untuk layar paling berbahaya di permainan ini. LANTAI, bukan
 * langit-langit: kalimat bisa lolos semua kata di bawah dan tetap terdengar
 * seperti vonis.
 */
const KATA_VONIS = ['gagal', 'kalah', 'menyerah', 'sayang sekali', 'seharusnya', 'padahal'];

function semua(nilai: unknown, keluar: string[] = []): string[] {
  if (typeof nilai === 'string') keluar.push(nilai);
  else if (nilai && typeof nilai === 'object') for (const x of Object.values(nilai)) semua(x, keluar);
  return keluar;
}
const KALIMAT = semua(NASKAH);

describe('naskah layar akhir', () => {
  it('benar-benar memeriksa kalimat', () => {
    expect(KALIMAT.length).toBeGreaterThan(15);
  });

  it.each(KATA_VONIS)('tidak pernah memakai kata "%s"', (kata) => {
    expect(KALIMAT.filter((s) => s.toLowerCase().includes(kata))).toEqual([]);
  });

  it('tidak pernah menyapa pemain dengan bentuk kekurangan', () => {
    for (const s of KALIMAT) expect(/kamu (belum|tidak|kurang|gagal)/i.test(s)).toBe(false);
  });

  it('tanpa seruan — layar hasil tidak meninggikan suara ke arah mana pun', () => {
    for (const s of KALIMAT) expect(s).not.toContain('!');
  });

  it('keempat kuadran punya judul dan keterangan, tidak ada yang kosong', () => {
    for (const id of Object.keys(KUADRAN)) {
      expect(JUDUL_KUADRAN[id as keyof typeof KUADRAN]?.trim()).toBeTruthy();
      expect(KETERANGAN_KUADRAN[id as keyof typeof KUADRAN]?.trim()).toBeTruthy();
    }
  });

  /**
   * Keterangan kuadran WAJIB menyebut kedua papan. Keterangan yang cuma
   * membicarakan uang membuat papan Kemerdekaan jadi hiasan, dan keterangan
   * yang cuma membicarakan batin membuat papan Kekayaan jadi hiasan — dua-
   * duanya membatalkan §0.
   */
  it.each(Object.keys(KUADRAN))('keterangan %s menyebut kedua papan', (id) => {
    const s = KETERANGAN_KUADRAN[id as keyof typeof KUADRAN].toLowerCase();
    expect(s).toContain('pendapatan pasif');
    expect(s).toContain('keputusan bertekanan');
  });

  /**
   * §7.3. Berhenti dengan sadar adalah kemenangan di papan Kemerdekaan. Yang
   * dijaga di sini: kalimatnya menyebut PILIHAN, bukan kehabisan.
   */
  it('berhenti dengan sadar dibingkai sebagai pilihan', () => {
    expect(KETERANGAN_AKHIR.menyerah.toLowerCase()).toMatch(/pilih|sadar/);
  });

  it('kata "menyerah" tidak pernah sampai ke mata pemain', () => {
    expect(KALIMAT.filter((s) => s.toLowerCase().includes('menyerah'))).toEqual([]);
  });

  it('bangkrut diterangkan sebagai keadaan, bukan sebagai sifat orang', () => {
    expect(KETERANGAN_AKHIR.bangkrut.toLowerCase()).toContain('kas');
    expect(KETERANGAN_AKHIR.bangkrut.toLowerCase()).not.toContain('kamu');
  });

  it('belum teruji menerangkan alat ukurnya, bukan pemainnya', () => {
    expect(BELUM_TERUJI.toLowerCase()).toContain('diukur');
    expect(BELUM_TERUJI.toLowerCase()).not.toMatch(/menghindar|takut|enggan/);
  });

  it('kedua catatan wajib §2 dan §15.4 ada dan berbeda', () => {
    expect(DISCLAIMER).toContain('bukan saran investasi');
    expect(CATATAN_ALAT_LATIHAN).toContain('alat latihan');
    expect(DISCLAIMER).not.toBe(CATATAN_ALAT_LATIHAN);
  });
});
