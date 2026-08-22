import { describe, it, expect } from 'vitest';
import { KARTU_KEBIASAAN, cariKartuKebiasaan } from './kartu-kebiasaan';

/** Pasangan sah antara efek dan jalan keluarnya. */
const PASANGAN: Record<string, string> = {
  panik: 'lolos-jeda-pasar-turun',
  kejar: 'tolak-tenang',
  banding: 'lolos-jeda-pengakuan',
};

const KATA_MENUDUH = ['gagal', 'salah', 'buruk'];

describe('data kartu kebiasaan lama', () => {
  it('menyediakan tiga kartu §7.2 dengan id unik', () => {
    expect(KARTU_KEBIASAAN).toHaveLength(3);
    expect(new Set(KARTU_KEBIASAAN.map((k) => k.id)).size).toBe(3);
  });

  /** Kartu tanpa jalan keluar adalah hukuman, dan §7.2 melarangnya. */
  it('memberi setiap kartu jalan keluar yang tertulis', () => {
    for (const kartu of KARTU_KEBIASAAN) {
      expect(kartu.caraLepas.trim().length, kartu.id).toBeGreaterThan(0);
      expect(kartu.syaratLepas.kali, kartu.id).toBeGreaterThan(0);
    }
  });

  it.each(KATA_MENUDUH)('tidak pernah memakai kata "%s"', (kata) => {
    const melanggar = KARTU_KEBIASAAN.filter((k) =>
      `${k.nama} ${k.keterangan} ${k.caraLepas}`.toLowerCase().includes(kata),
    ).map((k) => k.id);
    expect(melanggar).toEqual([]);
  });

  it('mencocokkan jenis syarat lepas dengan jenis efeknya', () => {
    for (const kartu of KARTU_KEBIASAAN) {
      expect(kartu.syaratLepas.jenis, kartu.id).toBe(PASANGAN[kartu.efek.jenis]);
    }
  });

  it('menutup ketiga jenis efek §7.2', () => {
    expect(new Set(KARTU_KEBIASAAN.map((k) => k.efek.jenis))).toEqual(
      new Set(['panik', 'kejar', 'banding']),
    );
  });

  it('menetapkan ambang yang masuk akal — memaksa, tapi tidak setiap saat', () => {
    for (const kartu of KARTU_KEBIASAAN) {
      if (kartu.efek.jenis === 'panik') {
        expect(kartu.efek.ambangTurun).toBeGreaterThan(0);
        expect(kartu.efek.ambangTurun).toBeLessThan(1);
      }
      if (kartu.efek.jenis === 'kejar') {
        expect(kartu.efek.ambangImbal).toBeGreaterThan(0);
      }
      if (kartu.efek.jenis === 'banding') {
        expect(kartu.efek.kenaikanGayaHidup).toBeGreaterThan(0);
        expect(kartu.efek.kenaikanGayaHidup).toBeLessThan(0.5);
      }
    }
  });

  it('menulis caraLepas sebagai pekerjaan, bukan larangan', () => {
    // Setiap jalan keluar menyebut tindakan yang dilakukan pemain, bukan hal
    // yang harus dihindarinya. Kata kerjanya wajib muncul.
    for (const kartu of KARTU_KEBIASAAN) {
      expect(/ambil|tolak|jeda|latih/i.test(kartu.caraLepas), kartu.id).toBe(true);
    }
  });

  it('mengenali kartu dari id dan menolak id asing', () => {
    expect(cariKartuKebiasaan('refleks-panik').id).toBe('refleks-panik');
    expect(() => cariKartuKebiasaan('entah-apa')).toThrow();
  });
});
