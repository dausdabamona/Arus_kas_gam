import { describe, it, expect } from 'vitest';
import { komentarUntuk, momenDari, type JenisMomen } from './komentar';
import { KOMENTAR_BOT } from '../data/komentar-bot';
import { stateAwal } from './reducer';
import type { BotBerjalan } from '../types/state';

function botKosong(id: string): BotBerjalan {
  return {
    id,
    state: { ...stateAwal('uji-komentar', 'asn-3b', false), bot: [] },
    hargaLalu: {},
    lolosPadaGiliran: null,
    bangkrutPadaGiliran: null,
    komentar: null,
  };
}

describe('komentarUntuk', () => {
  it('deterministik — seed dan t sama menghasilkan kalimat sama', () => {
    const a = komentarUntuk('s', 7, 'pak-rudi', 'jual-panik');
    const b = komentarUntuk('s', 7, 'pak-rudi', 'jual-panik');
    expect(a).toBe(b);
  });

  it('memberi kalimat berbeda untuk t yang berbeda', () => {
    const kalimat = new Set(
      Array.from({ length: 20 }, (_, t) => komentarUntuk('s', t, 'pak-rudi', 'jual-panik')),
    );
    expect(kalimat.size).toBeGreaterThan(1);
  });

  it('tidak pernah kosong untuk momen yang punya varian', () => {
    for (const [botId, momen] of Object.entries(KOMENTAR_BOT)) {
      for (const [jenis, varian] of Object.entries(momen)) {
        if (!varian || varian.length === 0) continue;
        const kalimat = komentarUntuk('s', 3, botId, jenis as JenisMomen);
        expect(kalimat).toBeTruthy();
        expect(varian).toContain(kalimat);
      }
    }
  });

  it('diam berarti tidak ada kalimat sama sekali', () => {
    expect(komentarUntuk('s', 1, 'pak-rudi', 'diam')).toBeNull();
  });

  it('Pak Umar tidak punya satu pun varian beli-saham', () => {
    expect(KOMENTAR_BOT['pak-umar']['beli-saham']).toEqual([]);
    expect(komentarUntuk('s', 1, 'pak-umar', 'beli-saham')).toBeNull();
  });
});

describe('bot adalah cermin, bukan guru — Prinsip 4', () => {
  const semua = Object.values(KOMENTAR_BOT).flatMap((m) => Object.values(m).flat());

  it('tidak pernah menasihati pemain', () => {
    const menggurui = /sebaiknya|seharusnya|jangan |kamu |anda |mestinya|pelajaran/i;
    for (const kalimat of semua) {
      expect(kalimat, `menggurui: ${kalimat}`).not.toMatch(menggurui);
    }
  });

  it('memakai sudut pandang orang pertama, bukan menunjuk pemain', () => {
    expect(semua.length).toBeGreaterThan(20);
    const menunjuk = semua.filter((k) => /\bkamu\b|\banda\b/i.test(k));
    expect(menunjuk).toEqual([]);
  });
});

describe('momenDari', () => {
  it('mengenali jual panik saat unit pasar menyusut', () => {
    const sebelum = botKosong('pak-rudi');
    sebelum.state = {
      ...sebelum.state,
      keuangan: {
        ...sebelum.state.keuangan,
        aset: [{ id: 'a', nama: 'Saham', nilai: 1, arusKasBulanan: 0, instrumenId: 'saham-individu', unit: 3 }],
      },
    };
    const sesudah = botKosong('pak-rudi');
    expect(momenDari(sebelum, sesudah)).toBe('jual-panik');
  });

  it('mengenali beli saat unit pasar bertambah', () => {
    const sebelum = botKosong('bu-sinta');
    const sesudah = botKosong('bu-sinta');
    sesudah.state = {
      ...sesudah.state,
      keuangan: {
        ...sesudah.state.keuangan,
        aset: [{ id: 'a', nama: 'Saham', nilai: 1, arusKasBulanan: 0, instrumenId: 'saham-individu', unit: 1 }],
      },
    };
    expect(momenDari(sebelum, sesudah)).toBe('beli-saham');
  });

  it('mengenali bangkrut, dan bangkrut mengalahkan momen lain', () => {
    const sebelum = botKosong('pak-rudi');
    const sesudah = { ...botKosong('pak-rudi'), bangkrutPadaGiliran: 12 };
    expect(momenDari(sebelum, sesudah)).toBe('bangkrut');
  });

  it('mengenali lolos', () => {
    const sebelum = botKosong('pak-umar');
    const sesudah = { ...botKosong('pak-umar'), lolosPadaGiliran: 40 };
    expect(momenDari(sebelum, sesudah)).toBe('lolos');
  });

  it('diam bila tidak ada yang menonjol', () => {
    expect(momenDari(botKosong('pak-umar'), botKosong('pak-umar'))).toBe('diam');
  });
});
