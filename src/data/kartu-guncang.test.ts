import { describe, it, expect } from 'vitest';
import { KARTU_GUNCANG } from './kartu-guncang';
import type { KebutuhanId } from '../types/kejadian';

const PEMICU: readonly KebutuhanId[] = ['keamanan', 'kendali', 'pengakuan', 'pemisahan'];

describe('data kartu guncang', () => {
  it('menyediakan minimal delapan kartu', () => {
    expect(KARTU_GUNCANG.length).toBeGreaterThanOrEqual(8);
  });

  /**
   * Satu kartu per pemicu membuat pemain hafal setelah dua kali mendarat.
   * Penyaringan per pemicu di reducer baru punya arti kalau ada yang dipilih.
   */
  it('menyediakan minimal dua kartu untuk setiap pemicu', () => {
    for (const pemicu of PEMICU) {
      const sepemicu = KARTU_GUNCANG.filter((k) => k.pemicu === pemicu);
      expect(sepemicu.length, `pemicu ${pemicu}`).toBeGreaterThanOrEqual(2);
    }
  });

  it('memakai id yang unik', () => {
    expect(new Set(KARTU_GUNCANG.map((k) => k.id)).size).toBe(KARTU_GUNCANG.length);
  });

  it.each(PEMICU)('menutup pemicu %s', (pemicu) => {
    expect(KARTU_GUNCANG.some((k) => k.pemicu === pemicu)).toBe(true);
  });

  /**
   * Kartu bersyarat bisa gugur karena konteks. Tanpa padanan tak bersyarat
   * pada pemicu yang sama, petak GUNCANG bisa kehabisan kartu dan diam saja.
   */
  it('menyediakan padanan tak bersyarat untuk setiap kartu bersyarat', () => {
    const bersyarat = KARTU_GUNCANG.filter((k) => k.syarat !== undefined);
    expect(bersyarat.length).toBeGreaterThan(0);
    for (const kartu of bersyarat) {
      const padanan = KARTU_GUNCANG.filter(
        (k) => k.pemicu === kartu.pemicu && k.syarat === undefined,
      );
      expect(padanan.length, `pemicu ${kartu.pemicu} tanpa padanan tak bersyarat`).toBeGreaterThan(
        0,
      );
    }
  });

  it('menyediakan padanan tak bersyarat pada setiap pemicu', () => {
    for (const pemicu of PEMICU) {
      expect(
        KARTU_GUNCANG.some((k) => k.pemicu === pemicu && k.syarat === undefined),
        `pemicu ${pemicu}`,
      ).toBe(true);
    }
  });

  /** Pukulan tanpa kerugian uang: bukti yang dipancing rasa, bukan saldo. */
  it('memuat kartu tanpa efek uang sama sekali', () => {
    expect(KARTU_GUNCANG.some((k) => k.efek.jenis === 'tanpa-efek')).toBe(true);
  });

  /**
   * Kelayakan kartu `ada-bot-lolos` bergantung pada nasib bot, jadi kartu yang
   * tampil bisa berbeda antara dunia berbot dan dunia tanpa bot. Selama seluruh
   * pemicunya tanpa efek uang, perbedaan itu tidak pernah bisa menggeser kas
   * pemain — dan invarian isolasi Fase 4 tetap utuh dalam hal yang penting.
   */
  it('menjaga seluruh pemicu kartu bergantung-bot bebas dari efek uang', () => {
    const bergantungBot = KARTU_GUNCANG.filter((k) => k.syarat === 'ada-bot-lolos');
    expect(bergantungBot.length).toBeGreaterThan(0);
    for (const kartu of bergantungBot) {
      const sepemicu = KARTU_GUNCANG.filter((k) => k.pemicu === kartu.pemicu);
      for (const lain of sepemicu) {
        expect(lain.efek.jenis, `${lain.id} sepemicu dengan ${kartu.id}`).toBe('tanpa-efek');
      }
    }
  });

  it('memakai kenaikan inflasi persis 0,08 sesuai §8.3', () => {
    const inflasi = KARTU_GUNCANG.filter((k) => k.efek.jenis === 'inflasi');
    expect(inflasi.length).toBeGreaterThan(0);
    for (const kartu of inflasi) {
      if (kartu.efek.jenis !== 'inflasi') throw new Error('tidak mungkin');
      expect(kartu.efek.kenaikan).toBe(0.08);
    }
  });

  it('menjaga rentang pengali kas naik dan positif', () => {
    for (const kartu of KARTU_GUNCANG) {
      if (kartu.efek.jenis !== 'kas') continue;
      const [bawah, atas] = kartu.efek.pengali;
      expect(bawah, kartu.id).toBeGreaterThan(0);
      expect(atas, kartu.id).toBeGreaterThan(bawah);
    }
  });

  it('hanya memakai penanda {nama} dan {barang} pada kartu yang bersyarat', () => {
    for (const kartu of KARTU_GUNCANG) {
      const teks = `${kartu.judul} ${kartu.teks}`;
      if (teks.includes('{nama}')) expect(kartu.syarat, kartu.id).toBe('ada-bot-lolos');
      if (teks.includes('{barang}')) expect(kartu.syarat, kartu.id).toBe('ada-riwayat-ditolak');
    }
  });

  it('memberi setiap kartu bersyarat penanda yang bisa diisi', () => {
    for (const kartu of KARTU_GUNCANG) {
      if (kartu.syarat === undefined) continue;
      const teks = `${kartu.judul} ${kartu.teks}`;
      const penanda = kartu.syarat === 'ada-bot-lolos' ? '{nama}' : '{barang}';
      expect(teks, kartu.id).toContain(penanda);
    }
  });

  it('menulis judul dan teks yang tidak kosong', () => {
    expect(KARTU_GUNCANG.every((k) => k.judul.length > 0 && k.teks.length > 0)).toBe(true);
  });
});
