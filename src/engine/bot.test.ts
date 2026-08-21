import { describe, it, expect } from 'vitest';
import { reduce, stateAwal } from './reducer';
import type { StatePermainan } from '../types/state';

function maju(state: StatePermainan, giliran: number): StatePermainan {
  let s = state;
  for (let t = 1; t <= giliran; t++) {
    s = reduce(s, { t, tipe: 'LEMPAR_DADU', isi: { pemainId: 'p1' } });
    if (s.kartuTerbuka) {
      s = reduce(s, { t: t + 10_000, tipe: 'PUTUSKAN',
        isi: { kartuId: s.kartuTerbuka.id, pilihan: 'tolak' } });
    }
    if (s.pasarTerbuka) {
      s = reduce(s, { t: t + 20_000, tipe: 'TRANSAKSI_PASAR',
        isi: { instrumenId: s.pasarTerbuka, aksi: 'lewat', unit: 0, ketukan: 4 } });
    }
  }
  return s;
}

describe('kehadiran bot', () => {
  it('permainan dimulai dengan tiga bot', () => {
    const s = stateAwal('uji-bot', 'asn-3b');
    expect(s.bot).toHaveLength(3);
    expect(s.bot.map((b) => b.id)).toEqual(['pak-rudi', 'bu-sinta', 'pak-umar']);
  });

  it('bot di dalam bot selalu kosong — tidak ada dunia bersarang', () => {
    const s = maju(stateAwal('uji-bot', 'asn-3b'), 20);
    expect(s.bot.every((b) => b.state.bot.length === 0)).toBe(true);
  });

  it('bot ikut maju saat pemain melempar dadu', () => {
    const s = maju(stateAwal('uji-bot', 'asn-3b'), 10);
    expect(s.bot.every((b) => b.state.giliran === 10)).toBe(true);
  });

  it('bot tidak pernah punya kartu atau tawaran menggantung', () => {
    const s = maju(stateAwal('uji-bot', 'asn-3b'), 40);
    expect(s.bot.every((b) => b.state.kartuTerbuka === null && b.state.pasarTerbuka === null))
      .toBe(true);
  });
});

describe('determinisme bot', () => {
  it('seed sama menghasilkan dunia bot yang identik', () => {
    const a = maju(stateAwal('sama', 'asn-3b'), 30);
    const b = maju(stateAwal('sama', 'asn-3b'), 30);
    expect(a.bot).toEqual(b.bot);
  });

  it('tiga bot menjalani nasib yang berbeda-beda', () => {
    const s = maju(stateAwal('beda', 'asn-3b'), 30);
    const posisi = new Set(s.bot.map((b) => b.state.posisi));
    const kas = new Set(s.bot.map((b) => b.state.keuangan.saldoKas));
    expect(posisi.size + kas.size).toBeGreaterThan(2);
  });
});

describe('INVARIAN ISOLASI — bot tidak pernah menyentuh pemain', () => {
  it('state pemain identik bit demi bit dengan atau tanpa bot', () => {
    const dengan = maju(stateAwal('isolasi', 'asn-3b'), 50);
    const tanpa = maju({ ...stateAwal('isolasi', 'asn-3b'), bot: [] }, 50);

    const inti = ({ bot: _bot, ...sisa }: StatePermainan) => sisa;
    expect(inti(dengan)).toEqual(inti(tanpa));
  });

  it('bot yang bangkrut pun tidak menggeser sepeser kas pemain', () => {
    const dengan = maju(stateAwal('isolasi-panjang', 'guru-honorer'), 120);
    const tanpa = maju({ ...stateAwal('isolasi-panjang', 'guru-honorer'), bot: [] }, 120);
    expect(dengan.keuangan).toEqual(tanpa.keuangan);
    expect(dengan.hargaPasar).toEqual(tanpa.hargaPasar);
    expect(dengan.riwayatDadu).toEqual(tanpa.riwayatDadu);
  });
});
