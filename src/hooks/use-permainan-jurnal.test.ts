import { describe, it, expect, beforeEach } from 'vitest';
import { usePermainan } from './use-permainan';
import { stateAwal } from '../engine/reducer';
import { db, semuaJurnal, hapusPermainan } from '../lib/db';
import type { StatePermainan, TanamTertunda } from '../types/state';

const PANEN: TanamTertunda = {
  t: 4,
  kalimat: 'Saya takut kurang.',
  tindakan: 'Cek saldo sekali saja.',
  padaGiliran: 5,
  panenPadaGiliran: 11,
  objek: null,
  kebutuhan: 'keamanan',
  hasilDalam: 'tenang',
};

function pasang(panen: TanamTertunda | null) {
  const dasar: StatePermainan = { ...stateAwal('uji-jurnal', 'asn-3b'), giliran: 12 };
  usePermainan.setState({
    state: { ...dasar, panenTerbuka: panen },
    permainanId: 'g-jurnal',
    nomorKejadian: 1,
    memproses: false,
  });
}

beforeEach(async () => {
  await db.permainan.clear();
  await db.kejadian.clear();
  await db.jurnal.clear();
});

describe('jurnal ditulis saat panen dituai', () => {
  it('menyimpan kalimat, tindakan, kebutuhan, dan kedua hasil', async () => {
    pasang(PANEN);
    await usePermainan
      .getState()
      .kirim({ tipe: 'TUAI', isi: { tanamT: 4, hasilLuar: -250_000, hasilDalam: 'tenang' } });

    const jurnal = await semuaJurnal();
    expect(jurnal).toHaveLength(1);
    expect(jurnal[0]).toMatchObject({
      permainanId: 'g-jurnal',
      kebutuhan: 'keamanan',
      kalimat: PANEN.kalimat,
      tindakan: PANEN.tindakan,
      hasilLuar: -250_000,
      hasilDalam: 'tenang',
    });
  });

  it('menyimpan entri yang selamat setelah permainannya dihapus', async () => {
    pasang(PANEN);
    await usePermainan
      .getState()
      .kirim({ tipe: 'TUAI', isi: { tanamT: 4, hasilLuar: 0, hasilDalam: 'tenang' } });

    await hapusPermainan('g-jurnal');
    expect(await semuaJurnal()).toHaveLength(1);
  });

  it('tidak menulis apa pun untuk kejadian selain TUAI', async () => {
    pasang(PANEN);
    await usePermainan.getState().kirim({ tipe: 'LEMPAR_DADU', isi: { pemainId: 'p1' } });
    expect(await semuaJurnal()).toEqual([]);
  });

  it('tidak mengarang isi jurnal saat kebutuhannya tidak pernah ternamai', async () => {
    pasang({ ...PANEN, kebutuhan: null });
    await usePermainan
      .getState()
      .kirim({ tipe: 'TUAI', isi: { tanamT: 4, hasilLuar: 0, hasilDalam: 'tenang' } });
    expect(await semuaJurnal()).toEqual([]);
  });
});
