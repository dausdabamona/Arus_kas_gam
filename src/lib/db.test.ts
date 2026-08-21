import { describe, it, expect, beforeEach } from 'vitest';
import { db, simpanKejadian, muatKejadian, hapusPermainan, tambahJurnal, semuaJurnal } from './db';

beforeEach(async () => {
  await db.permainan.clear();
  await db.kejadian.clear();
  await db.jurnal.clear();
});

describe('event log', () => {
  it('menyimpan dan memuat kejadian sesuai urutan t', async () => {
    await simpanKejadian('g1', { t: 1, tipe: 'LEMPAR_DADU', isi: { pemainId: 'p1' } });
    await simpanKejadian('g1', { t: 0, tipe: 'MULAI', isi: { seed: 's', profesiId: 'asn-3b' } });
    const hasil = await muatKejadian('g1');
    expect(hasil.map((k) => k.t)).toEqual([0, 1]);
  });

  it('memisahkan kejadian antar permainan', async () => {
    await simpanKejadian('g1', { t: 0, tipe: 'MULAI', isi: { seed: 's', profesiId: 'asn-3b' } });
    await simpanKejadian('g2', { t: 0, tipe: 'MULAI', isi: { seed: 'x', profesiId: 'guru' } });
    expect(await muatKejadian('g1')).toHaveLength(1);
  });
});

describe('hapusPermainan', () => {
  it('membuang kejadian permainan tersebut', async () => {
    await simpanKejadian('g1', { t: 0, tipe: 'MULAI', isi: { seed: 's', profesiId: 'asn-3b' } });
    await hapusPermainan('g1');
    expect(await muatKejadian('g1')).toHaveLength(0);
  });

  it('TIDAK menghapus jurnal — jurnal milik pemain, bukan milik sesi', async () => {
    await tambahJurnal({
      permainanId: 'g1',
      dibuatPada: Date.now(),
      kebutuhan: 'keamanan',
      kalimat: 'Rezeki saya tidak ditentukan oleh satu tawaran.',
      tindakan: 'Tunggu satu giliran sebelum memutuskan.',
      hasilLuar: 0,
      hasilDalam: 'tenang',
    });
    await hapusPermainan('g1');
    expect(await semuaJurnal()).toHaveLength(1);
  });
});
