import { describe, it, expect } from 'vitest';
import { reduce, stateAwal } from './reducer';
import { hargaPadaKetukan } from './pasar';
import type { StatePermainan } from '../types/state';

function statePada(posisi: number): StatePermainan {
  return { ...stateAwal('uji-pasar', 'asn-3b'), posisi };
}

function daratDi(sebelum: StatePermainan, tujuan: number): StatePermainan {
  for (let t = 1; t < 400; t++) {
    const coba = reduce(sebelum, { t, tipe: 'LEMPAR_DADU', isi: { pemainId: 'p1' } });
    if (coba.posisi === tujuan) return coba;
  }
  throw new Error(`Tidak pernah mendarat di petak ${tujuan}`);
}

describe('petak PASAR', () => {
  it('membuka satu instrumen saat mendarat', () => {
    const sesudah = daratDi(statePada(1), 2);
    expect(sesudah.pasarTerbuka).not.toBeNull();
  });

  it('membuka instrumen yang sama untuk seed dan t yang sama', () => {
    const a = daratDi(statePada(1), 2);
    const b = daratDi(statePada(1), 2);
    expect(a.pasarTerbuka).toBe(b.pasarTerbuka);
  });
});

describe('harga pasar', () => {
  it('bergerak setiap giliran', () => {
    const sebelum = statePada(0);
    const sesudah = reduce(sebelum, { t: 1, tipe: 'LEMPAR_DADU', isi: { pemainId: 'p1' } });
    expect(sesudah.hargaPasar['saham-individu']).not.toBe(sebelum.hargaPasar['saham-individu']);
  });

  it('menilai ulang aset pasar yang dipegang', () => {
    let state = statePada(0);
    state = {
      ...state,
      keuangan: {
        ...state.keuangan,
        aset: [{
          id: 'a1', nama: 'Saham', nilai: 1_000_000,
          arusKasBulanan: 0, instrumenId: 'saham-individu', unit: 1,
        }],
      },
    };
    const sesudah = reduce(state, { t: 1, tipe: 'LEMPAR_DADU', isi: { pemainId: 'p1' } });
    expect(sesudah.keuangan.aset[0].nilai).toBe(sesudah.hargaPasar['saham-individu']);
  });

  it('memulihkan harga yang sama persis saat log diputar ulang', () => {
    const a = reduce(statePada(0), { t: 1, tipe: 'LEMPAR_DADU', isi: { pemainId: 'p1' } });
    const b = reduce(statePada(0), { t: 1, tipe: 'LEMPAR_DADU', isi: { pemainId: 'p1' } });
    expect(a.hargaPasar).toEqual(b.hargaPasar);
  });
});

describe('TRANSAKSI_PASAR', () => {
  it('membeli: kas berkurang sesuai harga pada ketukan yang dicatat', () => {
    const sebelum = { ...statePada(2), pasarTerbuka: 'saham-individu' };
    const harga = hargaPadaKetukan(sebelum.seed, 9, 'saham-individu', sebelum.hargaPasar['saham-individu'], 2);
    const sesudah = reduce(sebelum, {
      t: 9, tipe: 'TRANSAKSI_PASAR',
      isi: { instrumenId: 'saham-individu', aksi: 'beli', unit: 2, ketukan: 2 },
    });
    expect(sesudah.keuangan.saldoKas).toBe(sebelum.keuangan.saldoKas - harga * 2);
  });

  it('menolak pembelian bila kas tidak cukup', () => {
    const sebelum = {
      ...statePada(2), pasarTerbuka: 'saham-individu',
      keuangan: { ...statePada(2).keuangan, saldoKas: 1000 },
    };
    const sesudah = reduce(sebelum, {
      t: 9, tipe: 'TRANSAKSI_PASAR',
      isi: { instrumenId: 'saham-individu', aksi: 'beli', unit: 5, ketukan: 1 },
    });
    expect(sesudah.keuangan.saldoKas).toBe(1000);
    expect(sesudah.pasarTerbuka).toBeNull();
  });

  it('lewat: tidak mengubah apa pun selain menutup tawaran', () => {
    const sebelum = { ...statePada(2), pasarTerbuka: 'saham-individu' };
    const sesudah = reduce(sebelum, {
      t: 9, tipe: 'TRANSAKSI_PASAR',
      isi: { instrumenId: 'saham-individu', aksi: 'lewat', unit: 0, ketukan: 4 },
    });
    expect(sesudah.keuangan).toEqual(sebelum.keuangan);
    expect(sesudah.pasarTerbuka).toBeNull();
  });

  it('menjual: unit berkurang dan kas bertambah', () => {
    let sebelum = { ...statePada(2), pasarTerbuka: 'saham-individu' };
    sebelum = {
      ...sebelum,
      keuangan: {
        ...sebelum.keuangan,
        aset: [{
          id: 'a1', nama: 'Saham', nilai: sebelum.hargaPasar['saham-individu'],
          arusKasBulanan: 0, instrumenId: 'saham-individu', unit: 3,
        }],
      },
    };
    const sesudah = reduce(sebelum, {
      t: 9, tipe: 'TRANSAKSI_PASAR',
      isi: { instrumenId: 'saham-individu', aksi: 'jual', unit: 2, ketukan: 1 },
    });
    expect(sesudah.keuangan.aset[0].unit).toBe(1);
    expect(sesudah.keuangan.saldoKas).toBeGreaterThan(sebelum.keuangan.saldoKas);
  });

  it('menghapus aset dari neraca saat seluruh unit dijual', () => {
    let sebelum = { ...statePada(2), pasarTerbuka: 'emas' };
    sebelum = {
      ...sebelum,
      keuangan: {
        ...sebelum.keuangan,
        aset: [{
          id: 'a1', nama: 'Emas', nilai: sebelum.hargaPasar.emas,
          arusKasBulanan: 0, instrumenId: 'emas', unit: 1,
        }],
      },
    };
    const sesudah = reduce(sebelum, {
      t: 9, tipe: 'TRANSAKSI_PASAR',
      isi: { instrumenId: 'emas', aksi: 'jual', unit: 1, ketukan: 0 },
    });
    expect(sesudah.keuangan.aset).toHaveLength(0);
  });

  it('deposito memberi arus kas bulanan, saham hampir tidak', () => {
    const sebelum = { ...statePada(2), pasarTerbuka: 'deposito' };
    const sesudah = reduce(sebelum, {
      t: 9, tipe: 'TRANSAKSI_PASAR',
      isi: { instrumenId: 'deposito', aksi: 'beli', unit: 10, ketukan: 0 },
    });
    expect(sesudah.keuangan.aset[0].arusKasBulanan).toBeGreaterThan(0);
  });

  it('harga tidak diambil dari isi kejadian — dihitung ulang dari ketukan', () => {
    const sebelum = { ...statePada(2), pasarTerbuka: 'saham-individu' };
    const k0 = reduce(sebelum, {
      t: 9, tipe: 'TRANSAKSI_PASAR',
      isi: { instrumenId: 'saham-individu', aksi: 'beli', unit: 1, ketukan: 0 },
    });
    const k3 = reduce(sebelum, {
      t: 9, tipe: 'TRANSAKSI_PASAR',
      isi: { instrumenId: 'saham-individu', aksi: 'beli', unit: 1, ketukan: 3 },
    });
    expect(k0.keuangan.saldoKas).not.toBe(k3.keuangan.saldoKas);
  });
});
