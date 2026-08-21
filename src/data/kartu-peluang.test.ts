import { describe, it, expect } from 'vitest';
import { KARTU_PELUANG_KECIL, KARTU_PELUANG_BESAR, cariKartu } from './kartu-peluang';

const semua = [...KARTU_PELUANG_KECIL, ...KARTU_PELUANG_BESAR];

describe('data kartu peluang', () => {
  it('menyediakan minimal 5 kartu kecil dan 3 kartu besar', () => {
    expect(KARTU_PELUANG_KECIL.length).toBeGreaterThanOrEqual(5);
    expect(KARTU_PELUANG_BESAR.length).toBeGreaterThanOrEqual(3);
  });

  it('memakai id yang unik', () => {
    expect(new Set(semua.map((k) => k.id)).size).toBe(semua.length);
  });

  it('mencantumkan tumpukan yang cocok dengan daftarnya', () => {
    expect(KARTU_PELUANG_KECIL.every((k) => k.tumpukan === 'PELUANG_KECIL')).toBe(true);
    expect(KARTU_PELUANG_BESAR.every((k) => k.tumpukan === 'PELUANG_BESAR')).toBe(true);
  });

  it('tidak pernah menetapkan uang muka melebihi harga', () => {
    expect(semua.every((k) => k.uangMuka <= k.harga)).toBe(true);
  });

  it('menjaga harga = uang muka + sisa utang', () => {
    expect(semua.every((k) => k.harga === k.uangMuka + k.sisaUtang)).toBe(true);
  });

  it('memuat satu instrumen membosankan tanpa arus kas — sesuai §8.2', () => {
    expect(semua.some((k) => k.arusKasBulanan === 0)).toBe(true);
  });

  it('menemukan kartu berdasarkan id', () => {
    expect(cariKartu(semua[0].id)?.judul).toBe(semua[0].judul);
  });

  it('mengembalikan undefined untuk id yang tidak ada', () => {
    expect(cariKartu('tidak-ada')).toBeUndefined();
  });
});
