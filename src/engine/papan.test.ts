import { describe, it, expect } from 'vitest';
import { PAPAN, petakDi, posisiSetelah, hitungGajianDilewati, type JenisPetak } from './papan';

describe('PAPAN', () => {
  it('berisi tepat 24 petak', () => {
    expect(PAPAN).toHaveLength(24);
  });

  it('mengikuti komposisi dokumen desain §6.1', () => {
    const hitung = (jenis: JenisPetak) => PAPAN.filter((p) => p === jenis).length;
    expect(hitung('GAJIAN')).toBe(4);
    expect(hitung('PELUANG_KECIL')).toBe(5);
    expect(hitung('PELUANG_BESAR')).toBe(3);
    expect(hitung('PASAR')).toBe(4);
    expect(hitung('BIAYA_TAK_TERDUGA')).toBe(3);
    expect(hitung('GUNCANG')).toBe(3);
    expect(hitung('AMAL')).toBe(1);
    expect(hitung('TAMBAH_ANAK')).toBe(1);
  });

  it('menyebar petak gajian merata setiap 6 langkah', () => {
    expect([0, 6, 12, 18].every((i) => PAPAN[i] === 'GAJIAN')).toBe(true);
  });
});

describe('posisiSetelah', () => {
  it('bergerak maju di dalam papan', () => {
    expect(posisiSetelah(3, 4)).toBe(7);
  });

  it('membungkus di ujung papan', () => {
    expect(posisiSetelah(22, 5)).toBe(3);
  });

  it('kembali ke titik yang sama setelah 24 langkah', () => {
    expect(posisiSetelah(5, 24)).toBe(5);
  });
});

describe('hitungGajianDilewati', () => {
  it('menghitung satu saat mendarat tepat di petak gajian', () => {
    expect(hitungGajianDilewati(3, 3)).toBe(1);
  });

  it('menghitung satu saat melewati tanpa mendarat', () => {
    expect(hitungGajianDilewati(5, 3)).toBe(1);
  });

  it('menghitung nol bila tidak ada gajian di lintasan', () => {
    expect(hitungGajianDilewati(1, 4)).toBe(0);
  });

  it('menghitung dua bila melewati dua petak gajian', () => {
    expect(hitungGajianDilewati(17, 8)).toBe(2);
  });

  it('menghitung empat untuk satu putaran penuh', () => {
    expect(hitungGajianDilewati(0, 24)).toBe(4);
  });
});

describe('petakDi', () => {
  it('membungkus posisi di luar rentang', () => {
    expect(petakDi(24)).toBe(PAPAN[0]);
  });
});
