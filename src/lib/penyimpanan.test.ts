import { describe, it, expect, beforeEach, vi } from 'vitest';
import { db, tambahJurnal } from './db';
import { mintaPenyimpananPermanen, statusPenyimpanan, buatCadanganJurnal } from './penyimpanan';

beforeEach(async () => {
  await db.jurnal.clear();
});

describe('mintaPenyimpananPermanen', () => {
  it('mengembalikan false bila API tidak tersedia', async () => {
    vi.stubGlobal('navigator', {});
    expect(await mintaPenyimpananPermanen()).toBe(false);
    vi.unstubAllGlobals();
  });

  it('mengembalikan true bila permintaan dikabulkan', async () => {
    vi.stubGlobal('navigator', {
      storage: { persist: async () => true, persisted: async () => false },
    });
    expect(await mintaPenyimpananPermanen()).toBe(true);
    vi.unstubAllGlobals();
  });

  it('tidak meminta ulang bila sudah permanen', async () => {
    const persist = vi.fn(async () => true);
    vi.stubGlobal('navigator', { storage: { persist, persisted: async () => true } });
    expect(await mintaPenyimpananPermanen()).toBe(true);
    expect(persist).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});

describe('statusPenyimpanan', () => {
  it('melaporkan nol bila API tidak tersedia', async () => {
    vi.stubGlobal('navigator', {});
    expect(await statusPenyimpanan()).toEqual({ permanen: false, terpakaiMB: 0, kuotaMB: 0 });
    vi.unstubAllGlobals();
  });
});

describe('buatCadanganJurnal', () => {
  it('menghasilkan JSON berisi versi dan entri jurnal', async () => {
    await tambahJurnal({
      permainanId: 'g1',
      dibuatPada: 1700000000000,
      kebutuhan: 'keamanan',
      kalimat: 'Cukup itu keputusan, bukan jumlah.',
      tindakan: 'Tunda satu giliran.',
      hasilLuar: -500000,
      hasilDalam: 'tenang',
    });
    const teks = await buatCadanganJurnal();
    const isi = JSON.parse(teks);
    expect(isi.versi).toBe(2);  // versi 2: ringkasan permainan ikut, untuk uji manusia Fase 8
    expect(isi.jurnal).toHaveLength(1);
    expect(isi.jurnal[0].kebutuhan).toBe('keamanan');
  });
});
