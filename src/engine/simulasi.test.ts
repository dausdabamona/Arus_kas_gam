import { describe, it, expect } from 'vitest';
import { jalankanSimulasi } from './simulasi';
import { PROFESI } from '../data/profesi';

const SEED = ['a1', 'b2', 'c3', 'd4', 'e5'];

describe('konvergensi sistem', () => {
  it.each(PROFESI.map((p) => p.id))(
    'profesi %s tidak pernah meledak dengan kebijakan hati-hati',
    (profesiId) => {
      for (const seed of SEED) {
        const hasil = jalankanSimulasi({ seed, profesiId, kebijakan: 'hati-hati', maksGiliran: 1000 });
        expect(hasil.puncakPengeluaran).toBeLessThan(1_000_000_000);
      }
    },
  );

  it('selalu berakhir — tidak ada permainan tanpa ujung', () => {
    for (const seed of SEED) {
      for (const profesi of PROFESI) {
        const hasil = jalankanSimulasi({
          seed, profesiId: profesi.id, kebijakan: 'serakah', maksGiliran: 1000,
        });
        expect(hasil.akhir).not.toBe('batas-giliran');
      }
    }
  });

  it('utang darurat tidak pernah melampaui plafon 6x gaji bulanan', () => {
    for (const seed of SEED) {
      const hasil = jalankanSimulasi({
        seed, profesiId: 'guru-honorer', kebijakan: 'serakah', maksGiliran: 1000,
      });
      const gaji = hasil.state.keuangan.gajiBersihBulanan;
      expect(hasil.puncakUtang).toBeLessThanOrEqual(gaji * 6);
    }
  });

  it('kebijakan hati-hati bisa lolos, bukan sekadar bertahan', () => {
    const hasil = SEED.map((seed) =>
      jalankanSimulasi({ seed, profesiId: 'asn-3b', kebijakan: 'seimbang', maksGiliran: 1000 }),
    );
    expect(hasil.some((h) => h.akhir === 'lolos')).toBe(true);
  });
});
