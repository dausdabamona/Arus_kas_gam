import { describe, it, expect } from 'vitest';
import { hargaAwalSemua, gerakkanHarga, hargaPadaKetukan, KETUKAN_PER_GILIRAN } from './pasar';
import { INSTRUMEN, cariInstrumen } from '../data/instrumen';

describe('gerakkanHarga', () => {
  it('deterministik untuk seed dan t yang sama', () => {
    const awal = hargaAwalSemua();
    expect(gerakkanHarga('s', 4, awal)).toEqual(gerakkanHarga('s', 4, awal));
  });

  it('berbeda untuk t yang berbeda', () => {
    const awal = hargaAwalSemua();
    expect(gerakkanHarga('s', 4, awal)).not.toEqual(gerakkanHarga('s', 5, awal));
  });

  it('tidak menggerakkan deposito sama sekali', () => {
    const awal = hargaAwalSemua();
    let harga = awal;
    for (let t = 1; t < 50; t++) harga = gerakkanHarga('s', t, harga);
    expect(harga.deposito).toBe(awal.deposito);
  });

  it('tidak pernah menjatuhkan harga ke nol atau negatif', () => {
    let harga = hargaAwalSemua();
    for (let t = 1; t < 500; t++) {
      harga = gerakkanHarga('jatuh', t, harga);
      for (const i of INSTRUMEN) expect(harga[i.id]).toBeGreaterThan(0);
    }
  });

  it('saham lebih bergejolak daripada reksa indeks sepanjang 200 giliran', () => {
    let harga = hargaAwalSemua();
    let goyangSaham = 0;
    let goyangReksa = 0;
    for (let t = 1; t < 200; t++) {
      const berikut = gerakkanHarga('goyang', t, harga);
      goyangSaham += Math.abs(berikut['saham-individu'] - harga['saham-individu']) / harga['saham-individu'];
      goyangReksa += Math.abs(berikut['reksa-indeks'] - harga['reksa-indeks']) / harga['reksa-indeks'];
      harga = berikut;
    }
    expect(goyangSaham).toBeGreaterThan(goyangReksa * 2);
  });
});

describe('hargaPadaKetukan', () => {
  it('ketukan 0 sama dengan harga dasar', () => {
    expect(hargaPadaKetukan('s', 3, 'saham-individu', 1_000_000, 0)).toBe(1_000_000);
  });

  it('deterministik', () => {
    const a = hargaPadaKetukan('s', 3, 'saham-individu', 1_000_000, 2);
    const b = hargaPadaKetukan('s', 3, 'saham-individu', 1_000_000, 2);
    expect(a).toBe(b);
  });

  it('bergerak — menunggu tidak pernah aman', () => {
    const harga = Array.from({ length: KETUKAN_PER_GILIRAN + 1 }, (_, k) =>
      hargaPadaKetukan('s', 3, 'saham-individu', 1_000_000, k),
    );
    expect(new Set(harga).size).toBeGreaterThan(1);
  });

  it('tidak berayun lebih dari volatilitas bulanan instrumen', () => {
    const saham = cariInstrumen('saham-individu')!;
    for (let k = 0; k <= KETUKAN_PER_GILIRAN; k++) {
      const harga = hargaPadaKetukan('s', 7, 'saham-individu', 1_000_000, k);
      expect(Math.abs(harga - 1_000_000) / 1_000_000).toBeLessThanOrEqual(saham.volatilitasBulanan);
    }
  });

  it('tidak menggerakkan deposito', () => {
    expect(hargaPadaKetukan('s', 3, 'deposito', 1_000_000, 3)).toBe(1_000_000);
  });
});
