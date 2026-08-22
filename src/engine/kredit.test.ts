import { describe, it, expect } from 'vitest';
import { ringkasKredit } from './kredit';
import type { KartuPeluang } from '../types/kartu';

function kartu(bagian: Partial<KartuPeluang> = {}): KartuPeluang {
  return {
    id: 'uji',
    tumpukan: 'PELUANG_KECIL',
    judul: 'Uji',
    keterangan: '',
    harga: 100_000_000,
    uangMuka: 12_000_000,
    arusKasBulanan: 1_000_000,
    sisaUtang: 88_000_000,
    cicilanBulanan: 500_000,
    kelas: 'stagnan',
    driftBulanan: 0,
    volatilitasBulanan: 0,
    ...bagian,
  };
}

describe('ringkasan kredit kartu tawaran', () => {
  it('tidak ada ringkasan untuk kartu tanpa utang', () => {
    expect(ringkasKredit(kartu({ sisaUtang: 0, cicilanBulanan: 0 }))).toBeNull();
  });

  it('selisih adalah arus kas dikurangi cicilan', () => {
    const r = ringkasKredit(kartu({ arusKasBulanan: 1_000_000, cicilanBulanan: 500_000 }))!;
    expect(r.cicilan).toBe(500_000);
    expect(r.selisih).toBe(500_000);
  });

  it('balik modal dihitung dari uang muka dibagi selisih, dalam tahun', () => {
    // 12.000.000 / 500.000 = 24 bulan = 2,0 tahun
    const r = ringkasKredit(kartu({ uangMuka: 12_000_000, arusKasBulanan: 1_000_000, cicilanBulanan: 500_000 }))!;
    expect(r.balikModal).toBe(2);
  });

  it('dibulatkan ke satu desimal', () => {
    // 10.000.000 / 300.000 = 33,33 bulan = 2,777... tahun -> 2,8
    const r = ringkasKredit(kartu({ uangMuka: 10_000_000, arusKasBulanan: 800_000, cicilanBulanan: 500_000 }))!;
    expect(r.balikModal).toBe(2.8);
  });

  /**
   * Selisih nol atau minus berarti kredit ini menguras kas tiap bulan; tidak
   * ada yang "balik". Angka balik modal di situ akan tak hingga atau negatif —
   * dua-duanya omong kosong yang terlihat seperti data.
   */
  it.each([
    [500_000, 500_000],
    [300_000, 500_000],
    [0, 500_000],
  ])('tanpa balik modal saat arus kas %s tidak melampaui cicilan %s', (arusKasBulanan, cicilanBulanan) => {
    const r = ringkasKredit(kartu({ arusKasBulanan, cicilanBulanan }))!;
    expect(r.balikModal).toBeNull();
    expect(r.selisih).toBeLessThanOrEqual(0);
  });

  it('murni — kartunya tidak tersentuh', () => {
    const k = kartu();
    const salinan = JSON.parse(JSON.stringify(k));
    ringkasKredit(k);
    expect(k).toEqual(salinan);
  });
});
