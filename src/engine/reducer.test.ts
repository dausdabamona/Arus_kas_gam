import { describe, it, expect } from 'vitest';
import { reduce, putarUlang, stateAwal } from './reducer';
import type { Kejadian } from '../types/kejadian';

const daftarKejadian: Kejadian[] = [
  { t: 0, tipe: 'MULAI', isi: { seed: 'sorong-2026', profesiId: 'asn-3b' } },
  { t: 1, tipe: 'LEMPAR_DADU', isi: { pemainId: 'p1' } },
  { t: 2, tipe: 'LEMPAR_DADU', isi: { pemainId: 'p1' } },
  { t: 3, tipe: 'LEMPAR_DADU', isi: { pemainId: 'p1' } },
];

describe('putarUlang', () => {
  it('menghasilkan state identik untuk log yang sama', () => {
    expect(putarUlang(daftarKejadian)).toEqual(putarUlang(daftarKejadian));
  });

  it('menghasilkan state berbeda untuk seed berbeda', () => {
    const lain: Kejadian[] = [
      { t: 0, tipe: 'MULAI', isi: { seed: 'seed-lain', profesiId: 'asn-3b' } },
      ...daftarKejadian.slice(1),
    ];
    expect(putarUlang(lain).riwayatDadu).not.toEqual(putarUlang(daftarKejadian).riwayatDadu);
  });

  it('menambah satu giliran per lemparan', () => {
    expect(putarUlang(daftarKejadian).giliran).toBe(3);
  });

  it('mencatat tiga hasil dadu yang sah', () => {
    const { riwayatDadu } = putarUlang(daftarKejadian);
    expect(riwayatDadu).toHaveLength(3);
    riwayatDadu.forEach((n) => {
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(6);
    });
  });

  it('melempar galat bila kejadian pertama bukan MULAI', () => {
    expect(() => putarUlang([{ t: 0, tipe: 'LEMPAR_DADU', isi: { pemainId: 'p1' } }]))
      .toThrow('Kejadian pertama harus MULAI');
  });
});

describe('reduce', () => {
  it('tidak mengubah state lama', () => {
    const awal = stateAwal('s', 'asn-3b');
    const salinan = { ...awal, riwayatDadu: [...awal.riwayatDadu] };
    reduce(awal, { t: 1, tipe: 'LEMPAR_DADU', isi: { pemainId: 'p1' } });
    expect(awal).toEqual(salinan);
  });

  it('membungkus posisi di petak ke-24', () => {
    let state = stateAwal('s', 'asn-3b');
    state = { ...state, posisi: 23 };
    const sesudah = reduce(state, { t: 1, tipe: 'LEMPAR_DADU', isi: { pemainId: 'p1' } });
    expect(sesudah.posisi).toBeGreaterThanOrEqual(0);
    expect(sesudah.posisi).toBeLessThan(24);
  });

  it('menandai selesai pada kejadian AKHIR', () => {
    const state = stateAwal('s', 'asn-3b');
    const sesudah = reduce(state, { t: 1, tipe: 'AKHIR', isi: { alasan: 'lolos' } });
    expect(sesudah.status).toBe('selesai');
  });
});
