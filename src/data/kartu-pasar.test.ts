import { describe, it, expect } from 'vitest';
import { KARTU_PASAR, cariKartuPasar } from './kartu-pasar';
import { cariInstrumen } from '../engine/pasar';

describe('data kartu pasar', () => {
  it('menyediakan minimal satu kartu per instrumen', () => {
    const dipakai = new Set(KARTU_PASAR.map((k) => k.instrumenId));
    expect(dipakai.size).toBeGreaterThanOrEqual(6);
  });

  it('memakai id yang unik', () => {
    expect(new Set(KARTU_PASAR.map((k) => k.id)).size).toBe(KARTU_PASAR.length);
  });

  it('menunjuk instrumen yang benar-benar ada', () => {
    expect(KARTU_PASAR.every((k) => cariInstrumen(k.instrumenId) !== undefined)).toBe(true);
  });

  it('selalu menetapkan harga pembuka yang positif', () => {
    expect(KARTU_PASAR.every((k) => k.hargaPembuka > 0)).toBe(true);
  });

  it('menetapkan lot yang terjangkau — kartu termurah di bawah lima juta', () => {
    expect(Math.min(...KARTU_PASAR.map((k) => k.hargaPembuka))).toBeLessThan(5_000_000);
  });

  it('menulis keterangan tanpa menyuruh dan tanpa menjanjikan', () => {
    // §8.2: isi kartu wajib benar secara literasi finansial, tidak menjual mimpi.
    const terlarang = /pasti|dijamin|untung besar|sayang dilewatkan|harus beli|peluang emas/i;
    expect(KARTU_PASAR.every((k) => !terlarang.test(k.keterangan))).toBe(true);
  });

  it('tidak memakai merek yang dilarang §2', () => {
    const merek = /cashflow|rich dad|rat race/i;
    const semuaTeks = KARTU_PASAR.map((k) => `${k.judul} ${k.keterangan}`).join(' ');
    expect(merek.test(semuaTeks)).toBe(false);
  });

  it('menemukan kartu berdasarkan id', () => {
    expect(cariKartuPasar(KARTU_PASAR[0].id)?.judul).toBe(KARTU_PASAR[0].judul);
  });

  it('mengembalikan undefined untuk id yang tidak ada', () => {
    expect(cariKartuPasar('tidak-ada')).toBeUndefined();
  });
});
