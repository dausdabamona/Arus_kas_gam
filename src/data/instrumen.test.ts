import { describe, it, expect } from 'vitest';
import { INSTRUMEN, cariInstrumen } from './instrumen';

describe('data instrumen', () => {
  it('memakai id yang unik', () => {
    expect(new Set(INSTRUMEN.map((i) => i.id)).size).toBe(INSTRUMEN.length);
  });

  it('menyediakan satu instrumen tanpa gejolak sama sekali', () => {
    expect(INSTRUMEN.some((i) => i.volatilitasBulanan === 0)).toBe(true);
  });

  it('Invarian 5 §5.4: reksa indeks >= saham individual > deposito', () => {
    const ekspektasi = (id: string) => {
      const i = cariInstrumen(id)!;
      return i.driftBulanan + i.imbalBulanan;
    };
    expect(ekspektasi('reksa-indeks')).toBeGreaterThanOrEqual(ekspektasi('saham-individu'));
    expect(ekspektasi('saham-individu')).toBeGreaterThan(ekspektasi('deposito'));
  });

  it('saham individual jauh lebih bergejolak daripada reksa indeks', () => {
    const saham = cariInstrumen('saham-individu')!;
    const reksa = cariInstrumen('reksa-indeks')!;
    expect(saham.volatilitasBulanan).toBeGreaterThan(reksa.volatilitasBulanan * 3);
  });

  it('emas: imbal setara deposito dengan gejolak berkali lipat', () => {
    const emas = cariInstrumen('emas')!;
    const deposito = cariInstrumen('deposito')!;
    expect(emas.driftBulanan + emas.imbalBulanan)
      .toBeLessThanOrEqual(deposito.driftBulanan + deposito.imbalBulanan);
    expect(emas.volatilitasBulanan).toBeGreaterThan(0.03);
  });

  // Deret harga diturunkan dari panjang id (lihat pasar.ts). Dua instrumen
  // dengan panjang id sama akan berbagi deret acak yang sama persis —
  // cacat senyap yang cuma muncul saat instrumen baru ditambahkan.
  it('memakai panjang id yang berbeda-beda', () => {
    const panjang = INSTRUMEN.map((i) => i.id.length);
    expect(new Set(panjang).size).toBe(panjang.length);
  });
});
