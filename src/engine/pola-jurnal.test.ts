import { describe, it, expect } from 'vitest';
import { polaKebutuhan } from './pola-jurnal';
import type { KebutuhanId } from '../types/kejadian';

const dari = (...kebutuhan: KebutuhanId[]) => kebutuhan.map((k) => ({ kebutuhan: k }));

describe('pola kebutuhan §12', () => {
  it('menghitung total dan yang terbanyak', () => {
    const p = polaKebutuhan(dari('keamanan', 'keamanan', 'kendali'))!;
    expect(p.total).toBe(3);
    expect(p.kebutuhan).toBe('keamanan');
    expect(p.jumlah).toBe(2);
  });

  it('tidak ada pola dari jurnal kosong', () => {
    expect(polaKebutuhan([])).toBeNull();
  });

  /**
   * Satu entri tidak punya pembanding. "Dari 1 momen bertekanan, 1 berhenti di
   * keamanan" berbentuk pola tapi tidak menyatakan apa-apa — dan bentuk itulah
   * yang menafsirkan, bukan angkanya. §12 meminta pola tanpa tafsir.
   */
  it('tidak ada pola dari satu entri', () => {
    expect(polaKebutuhan(dari('keamanan'))).toBeNull();
  });

  /**
   * Seri berarti tidak ada SATU pola. Memilih salah satunya — yang pertama,
   * yang abjadnya duluan, yang mana pun — adalah permainan yang mengarang
   * kesimpulan dari data yang tidak memberikannya.
   */
  it('tidak ada pola saat dua kebutuhan seri di puncak', () => {
    expect(polaKebutuhan(dari('keamanan', 'kendali'))).toBeNull();
    expect(polaKebutuhan(dari('keamanan', 'keamanan', 'kendali', 'kendali'))).toBeNull();
  });

  it('seri di bawah puncak tidak menghalangi pola', () => {
    const p = polaKebutuhan(dari('keamanan', 'keamanan', 'keamanan', 'kendali', 'pengakuan'))!;
    expect(p.kebutuhan).toBe('keamanan');
    expect(p.jumlah).toBe(3);
    expect(p.total).toBe(5);
  });

  it('semua di satu kebutuhan tetap pola — itu justru yang paling kuat', () => {
    const p = polaKebutuhan(dari('kendali', 'kendali', 'kendali'))!;
    expect(p.kebutuhan).toBe('kendali');
    expect(p.jumlah).toBe(3);
    expect(p.total).toBe(3);
  });

  it('contoh §12 terhitung persis', () => {
    // "Dari 14 momen bertekanan, 9 berhenti di keamanan."
    const entri = [
      ...Array(9).fill({ kebutuhan: 'keamanan' as const }),
      ...Array(3).fill({ kebutuhan: 'kendali' as const }),
      ...Array(2).fill({ kebutuhan: 'pengakuan' as const }),
    ];
    const p = polaKebutuhan(entri)!;
    expect(p).toEqual({ total: 14, kebutuhan: 'keamanan', jumlah: 9 });
  });

  it('murni — daftarnya tidak tersentuh', () => {
    const entri = dari('keamanan', 'kendali', 'keamanan');
    const salinan = JSON.parse(JSON.stringify(entri));
    polaKebutuhan(entri);
    expect(entri).toEqual(salinan);
  });
});
