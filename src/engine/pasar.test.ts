import { describe, it, expect } from 'vitest';
import { buatPrng } from './prng';
import {
  INSTRUMEN,
  cariInstrumen,
  hargaBerikutnya,
  deretHarga,
  TICK_PASAR,
  DETIK_PER_TICK,
  DETIK_TIMER_PASAR,
} from './pasar';

describe('daftar instrumen', () => {
  it('memuat keenam instrumen §8', () => {
    expect(INSTRUMEN.map((i) => i.id)).toEqual([
      'deposito',
      'reksa-indeks',
      'saham',
      'emas',
      'properti-sewa',
      'usaha-kecil',
    ]);
  });

  it('memakai id yang unik', () => {
    expect(new Set(INSTRUMEN.map((i) => i.id)).size).toBe(INSTRUMEN.length);
  });

  it('menempatkan volatilitas sesuai urutan §8 — deposito paling tenang, usaha kecil paling liar', () => {
    const vol = Object.fromEntries(INSTRUMEN.map((i) => [i.id, i.volatilitasBulanan]));
    expect(vol.deposito).toBe(0);
    expect(vol['properti-sewa']).toBeLessThan(vol['reksa-indeks']);
    expect(vol['reksa-indeks']).toBeLessThan(vol.emas);
    expect(vol.emas).toBeLessThan(vol.saham);
    expect(vol.saham).toBeLessThan(vol['usaha-kecil']);
  });

  it('hanya deposito dan properti sewa yang memberi arus kas rutin — §8', () => {
    const berarus = INSTRUMEN.filter((i) => i.arusKasPersen > 0).map((i) => i.id);
    expect(berarus.sort()).toEqual(['deposito', 'properti-sewa']);
  });

  it('menemukan instrumen berdasarkan id', () => {
    expect(cariInstrumen('emas')?.nama).toBe('Emas');
  });

  it('mengembalikan undefined untuk id yang tidak ada', () => {
    expect(cariInstrumen('tidak-ada')).toBeUndefined();
  });
});

describe('hargaBerikutnya', () => {
  it('tidak menggerakkan instrumen tanpa volatilitas', () => {
    expect(hargaBerikutnya(buatPrng('x'), 1_000_000, 0)).toBe(1_000_000);
  });

  it('tetap di dalam pita volatilitas', () => {
    const prng = buatPrng('pita');
    for (let i = 0; i < 500; i++) {
      const harga = hargaBerikutnya(prng, 1_000_000, 0.18);
      expect(harga).toBeGreaterThanOrEqual(820_000);
      expect(harga).toBeLessThanOrEqual(1_180_000);
    }
  });

  it('bergerak ke dua arah, bukan cuma naik', () => {
    const prng = buatPrng('arah');
    const arah = new Set<string>();
    for (let i = 0; i < 200; i++) {
      const harga = hargaBerikutnya(prng, 1_000_000, 0.18);
      arah.add(harga > 1_000_000 ? 'naik' : harga < 1_000_000 ? 'turun' : 'diam');
    }
    expect(arah.has('naik')).toBe(true);
    expect(arah.has('turun')).toBe(true);
  });

  it('selalu bilangan bulat rupiah', () => {
    const prng = buatPrng('bulat');
    for (let i = 0; i < 100; i++) {
      expect(Number.isInteger(hargaBerikutnya(prng, 1_234_567, 0.18))).toBe(true);
    }
  });

  it('tidak pernah menjadikan harga nol atau negatif', () => {
    const prng = buatPrng('lantai');
    let harga = 1_000_000;
    for (let i = 0; i < 1000; i++) harga = hargaBerikutnya(prng, harga, 0.25);
    expect(harga).toBeGreaterThan(0);
  });
});

describe('deretHarga', () => {
  it('menghasilkan satu harga per tick, ditambah harga pembuka', () => {
    expect(deretHarga('s', 1, 1_000_000, 0.18)).toHaveLength(TICK_PASAR + 1);
  });

  it('dimulai tepat dari harga pembuka', () => {
    expect(deretHarga('s', 1, 1_000_000, 0.18)[0]).toBe(1_000_000);
  });

  it('memberi deret yang sama persis untuk seed dan t yang sama', () => {
    expect(deretHarga('s', 7, 1_000_000, 0.18)).toEqual(deretHarga('s', 7, 1_000_000, 0.18));
  });

  it('memberi deret berbeda untuk t berbeda', () => {
    expect(deretHarga('s', 7, 1_000_000, 0.18)).not.toEqual(deretHarga('s', 8, 1_000_000, 0.18));
  });

  it('memberi deret berbeda untuk seed berbeda', () => {
    expect(deretHarga('a', 7, 1_000_000, 0.18)).not.toEqual(deretHarga('b', 7, 1_000_000, 0.18));
  });

  it('mendatarkan deret instrumen tanpa volatilitas', () => {
    expect(new Set(deretHarga('s', 1, 1_000_000, 0))).toEqual(new Set([1_000_000]));
  });
});

describe('takaran waktu §8.1', () => {
  it('timer berjalan 20 detik dan harga berubah tiap 5 detik', () => {
    expect(DETIK_TIMER_PASAR).toBe(20);
    expect(DETIK_PER_TICK).toBe(5);
    expect(TICK_PASAR).toBe(DETIK_TIMER_PASAR / DETIK_PER_TICK);
  });
});
