import { describe, it, expect } from 'vitest';
import { reduce, stateAwal } from './reducer';
import { cariKartu } from '../data/kartu-peluang';
import type { StatePermainan } from '../types/state';

/** Menaruh satu aset kartu di neraca, lalu memajukan sejumlah giliran. */
function jalankanDengan(kartuId: string, giliran: number): { awal: number; akhir: number; arusAwal: number; arusAkhir: number } {
  const kartu = cariKartu(kartuId)!;
  let s: StatePermainan = stateAwal('uji-nilai', 'asn-3b', false);
  s = {
    ...s,
    keuangan: {
      ...s.keuangan,
      aset: [{
        id: 'a1',
        nama: kartu.judul,
        nilai: kartu.harga,
        arusKasBulanan: kartu.arusKasBulanan,
        driftBulanan: kartu.driftBulanan,
        volatilitasBulanan: kartu.volatilitasBulanan,
      }],
    },
  };
  const awal = s.keuangan.aset[0].nilai;
  const arusAwal = s.keuangan.aset[0].arusKasBulanan;
  for (let t = 1; t <= giliran; t++) {
    s = reduce(s, { t, tipe: 'LEMPAR_DADU', isi: { pemainId: 'p1' } });
    if (s.kartuTerbuka) {
      s = reduce(s, { t: t + 50_000, tipe: 'PUTUSKAN',
        isi: { kartuId: s.kartuTerbuka.id, pilihan: 'tolak' } });
    }
    if (s.pasarTerbuka) {
      s = reduce(s, { t: t + 60_000, tipe: 'TRANSAKSI_PASAR',
        isi: { instrumenId: s.pasarTerbuka, aksi: 'lewat', unit: 0, ketukan: 4 } });
    }
  }
  return {
    awal,
    akhir: s.keuangan.aset[0].nilai,
    arusAwal,
    arusAkhir: s.keuangan.aset[0].arusKasBulanan,
  };
}

describe('§8.3 nilai aset kartu benar-benar bergerak', () => {
  it('aset apresiasi menumpuk nilai diam-diam', () => {
    const { awal, akhir } = jalankanDengan('tanah-kavling', 60);
    expect(akhir).toBeGreaterThan(awal);
  });

  it('aset depresiasi menyusut meski arus kasnya paling deras', () => {
    const { awal, akhir } = jalankanDengan('gerobak-minuman', 60);
    expect(akhir).toBeLessThan(awal);
  });

  it('aset stagnan nyaris tidak bergerak', () => {
    const { awal, akhir } = jalankanDengan('kontrakan-enam-pintu', 60);
    expect(Math.abs(akhir - awal) / awal).toBeLessThan(0.25);
  });

  // Inti §8.3: arus kas dan apresiasi adalah dua sumbu berbeda. Sewa kos
  // tetap sewa kos meski nilai jualnya bergerak.
  it('arus kas aset kartu tidak ikut bergerak', () => {
    for (const id of ['tanah-kavling', 'gerobak-minuman', 'kontrakan-enam-pintu']) {
      const { arusAwal, arusAkhir } = jalankanDengan(id, 60);
      expect(arusAkhir).toBe(arusAwal);
    }
  });

  it('deterministik — seed dan giliran sama memberi nilai sama persis', () => {
    expect(jalankanDengan('kapal-pancing', 40)).toEqual(jalankanDengan('kapal-pancing', 40));
  });
});
