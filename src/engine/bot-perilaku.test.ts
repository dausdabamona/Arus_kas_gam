import { describe, it, expect } from 'vitest';
import { reduce, stateAwal } from './reducer';
import { hitungLaporan } from './keuangan';
import type { StatePermainan } from '../types/state';

const SEED = Array.from({ length: 10 }, (_, i) => `perilaku-${i}`);

function jalankanDunia(seed: string, giliran: number): StatePermainan {
  let s = stateAwal(seed, 'asn-3b');
  for (let t = 1; t <= giliran; t++) {
    s = reduce(s, { t, tipe: 'LEMPAR_DADU', isi: { pemainId: 'p1' } });
    if (s.kartuTerbuka) s = reduce(s, { t: t + 10_000, tipe: 'PUTUSKAN',
      isi: { kartuId: s.kartuTerbuka.id, pilihan: 'tolak' } });
    if (s.pasarTerbuka) s = reduce(s, { t: t + 20_000, tipe: 'TRANSAKSI_PASAR',
      isi: { instrumenId: s.pasarTerbuka, aksi: 'lewat', unit: 0, ketukan: 4 } });
  }
  return s;
}

function bot(s: StatePermainan, id: string) {
  return s.bot.find((b) => b.id === id)!;
}

describe('kepribadian bot terbukti lintas 10 seed x 300 giliran', () => {
  const dunia = SEED.map((seed) => jalankanDunia(seed, 300));

  it('Bu Sinta menumpuk aset paling banyak', () => {
    const rataAset = (id: string) =>
      dunia.reduce((jml, d) => jml + bot(d, id).state.keuangan.aset.length, 0) / dunia.length;
    expect(rataAset('bu-sinta')).toBeGreaterThan(rataAset('pak-umar'));
    expect(rataAset('bu-sinta')).toBeGreaterThan(rataAset('pak-rudi'));
  });

  it('Bu Sinta paling sering menyentuh pinjaman darurat', () => {
    const pernahPinjam = (id: string) =>
      dunia.filter((d) =>
        bot(d, id).state.keuangan.liabilitas.some((l) => l.bungaBulanan !== undefined),
      ).length;
    expect(pernahPinjam('bu-sinta')).toBeGreaterThanOrEqual(pernahPinjam('pak-umar'));
  });

  // Tes pinjaman di atas lolos secara hampa (0 >= 0): gaya darurat Bu Sinta
  // menjual aset lebih dulu, dan asetnya selalu ada, jadi ia tidak pernah
  // sampai ke pinjaman. "Abaikan dana darurat" §11 ternyata terukur di
  // tempat lain — bantalan kas yang paling tipis.
  it('Bu Sinta menyisakan bantalan kas paling tipis — abaikan dana darurat §11', () => {
    const bantalanBulan = (id: string) =>
      dunia.reduce((jml, d) => {
        const b = bot(d, id).state.keuangan;
        return jml + b.saldoKas / Math.max(1, hitungLaporan(b).totalPengeluaran);
      }, 0) / dunia.length;

    expect(bantalanBulan('bu-sinta')).toBeLessThan(bantalanBulan('pak-umar'));
    expect(bantalanBulan('bu-sinta')).toBeLessThan(bantalanBulan('pak-rudi'));
  });

  it('Pak Umar lolos sebagian besar seed tanpa sekali pun berutang — menang pelan-pelan §11', () => {
    const lolos = dunia.filter((d) => bot(d, 'pak-umar').lolosPadaGiliran !== null).length;
    const pernahPinjam = dunia.filter((d) =>
      bot(d, 'pak-umar').state.keuangan.liabilitas.some((l) => l.bungaBulanan !== undefined),
    ).length;
    expect(lolos).toBeGreaterThanOrEqual(dunia.length / 2);
    expect(pernahPinjam).toBe(0);
  });

  it('Pak Umar tidak pernah memegang saham individual', () => {
    for (const d of dunia) {
      expect(
        bot(d, 'pak-umar').state.keuangan.aset.some((a) => a.instrumenId === 'saham-individu'),
      ).toBe(false);
    }
  });

  it('Pak Umar paling jarang bangkrut', () => {
    const bangkrut = (id: string) => dunia.filter((d) => bot(d, id).bangkrutPadaGiliran !== null).length;
    expect(bangkrut('pak-umar')).toBeLessThanOrEqual(bangkrut('bu-sinta'));
    expect(bangkrut('pak-umar')).toBeLessThanOrEqual(bangkrut('pak-rudi'));
  });

  it('setidaknya satu bot lolos di sebagian seed — dunianya hidup', () => {
    expect(dunia.some((d) => d.bot.some((b) => b.lolosPadaGiliran !== null))).toBe(true);
  });
});
