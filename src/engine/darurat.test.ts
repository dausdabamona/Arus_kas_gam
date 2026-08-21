import { describe, it, expect } from 'vitest';
import {
  sisaPlafonPinjaman, bisaBerhemat, berhemat, tuasTersedia,
  hitungLaporan, MAKS_BERHEMAT, POTONGAN_BERHEMAT, PLAFON_PINJAMAN_GAJI,
} from './keuangan';
import { cariProfesi } from '../data/profesi';
import { reduce, stateAwal } from './reducer';
import type { StatePermainan } from '../types/state';

const guru = () => cariProfesi('guru-honorer').kondisiAwal;

describe('plafon pinjaman', () => {
  it('bernilai 6x gaji bulanan saat belum ada utang darurat', () => {
    const k = guru();
    expect(sisaPlafonPinjaman(k)).toBe(k.gajiBersihBulanan * PLAFON_PINJAMAN_GAJI);
  });

  it('menyusut sebesar utang darurat yang sudah ada', () => {
    const k = guru();
    const dengan = {
      ...k,
      liabilitas: [...k.liabilitas, {
        id: 'darurat-1', nama: 'Pinjaman darurat',
        sisaUtang: 5_000_000, cicilanBulanan: 100_000, bungaBulanan: 0.02,
        pokokAwal: 5_000_000,
      }],
    };
    expect(sisaPlafonPinjaman(dengan)).toBe(k.gajiBersihBulanan * PLAFON_PINJAMAN_GAJI - 5_000_000);
  });

  it('tidak pernah negatif', () => {
    const k = guru();
    const penuh = {
      ...k,
      liabilitas: [{
        id: 'darurat-1', nama: 'Pinjaman darurat',
        sisaUtang: 999_000_000, cicilanBulanan: 100_000, bungaBulanan: 0.02,
        pokokAwal: 999_000_000,
      }],
    };
    expect(sisaPlafonPinjaman(penuh)).toBe(0);
  });

  it('tidak menghitung utang bawaan profesi sebagai utang darurat', () => {
    const k = guru();
    expect(sisaPlafonPinjaman(k)).toBe(k.gajiBersihBulanan * PLAFON_PINJAMAN_GAJI);
  });
});

describe('berhemat', () => {
  it('menurunkan pengeluaran tetap 15%', () => {
    const k = guru();
    expect(berhemat(k).pengeluaranTetap).toBe(Math.round(k.pengeluaranTetap * (1 - POTONGAN_BERHEMAT)));
  });

  it('menaikkan hitungan berhemat', () => {
    expect(berhemat(guru()).kaliBerhemat).toBe(1);
  });

  it(`mentok setelah ${MAKS_BERHEMAT} kali`, () => {
    let k = guru();
    for (let i = 0; i < MAKS_BERHEMAT; i++) k = berhemat(k);
    expect(bisaBerhemat(k)).toBe(false);
    expect(berhemat(k)).toEqual(k);
  });

  it('menurunkan total pengeluaran, bukan cuma satu barisnya', () => {
    const k = guru();
    expect(hitungLaporan(berhemat(k)).totalPengeluaran)
      .toBeLessThan(hitungLaporan(k).totalPengeluaran);
  });
});

describe('invarian konvergensi §5.4', () => {
  it('penghematan maksimum melebihi bunga pada plafon penuh', () => {
    for (const id of ['asn-3b', 'guru-honorer', 'pegawai-bank']) {
      const k = cariProfesi(id).kondisiAwal;
      let hemat = k;
      for (let i = 0; i < MAKS_BERHEMAT; i++) hemat = berhemat(hemat);
      const penghematan = k.pengeluaranTetap - hemat.pengeluaranTetap;
      const bungaMaksimum = k.gajiBersihBulanan * PLAFON_PINJAMAN_GAJI * 0.02;
      expect(penghematan).toBeGreaterThan(bungaMaksimum);
    }
  });
});

describe('tuasTersedia', () => {
  it('menawarkan hemat dan pinjam saat belum punya aset', () => {
    expect(tuasTersedia(guru())).toEqual(expect.arrayContaining(['hemat', 'pinjam']));
  });

  it('kosong saat ketiga tuas habis — inilah syarat bangkrut', () => {
    let k = guru();
    for (let i = 0; i < MAKS_BERHEMAT; i++) k = berhemat(k);
    k = {
      ...k,
      aset: [],
      liabilitas: [{
        id: 'darurat-1', nama: 'Pinjaman darurat',
        sisaUtang: k.gajiBersihBulanan * PLAFON_PINJAMAN_GAJI,
        cicilanBulanan: 1, bungaBulanan: 0.02,
        pokokAwal: k.gajiBersihBulanan * PLAFON_PINJAMAN_GAJI,
      }],
    };
    expect(tuasTersedia(k)).toEqual([]);
  });
});

describe('tuas bawaan saat pemain tidak memilih', () => {
  /** Kondisi kas minus dengan ketiga tuas masih tersedia. */
  const kasMinus = (): StatePermainan => {
    const awal = stateAwal('uji-tuas', 'asn-3b');
    return {
      ...awal,
      keuangan: {
        ...awal.keuangan,
        saldoKas: -1_000_000,
        aset: [{ id: 'kos-0', nama: 'Kamar kos', nilai: 45_000_000, arusKasBulanan: 750_000 }],
      },
    };
  };

  it('memilih berhemat, bukan menjual aset — tidak ada jalur yang berujung panik', () => {
    const sebelum = kasMinus();
    expect(tuasTersedia(sebelum.keuangan)).toEqual(['jual', 'pinjam', 'hemat']);

    const sesudah = reduce(sebelum, { t: 1, tipe: 'TINDAKAN_DARURAT', isi: {} });

    expect(sesudah.keuangan.kaliBerhemat).toBe(1);
    expect(sesudah.keuangan.aset).toHaveLength(1); // asetnya utuh
    expect(sesudah.keuangan.liabilitas).toHaveLength(sebelum.keuangan.liabilitas.length);
  });

  it('jatuh ke pinjam saat penghematan sudah mentok', () => {
    let k = kasMinus().keuangan;
    for (let i = 0; i < MAKS_BERHEMAT; i++) k = berhemat(k);
    const sebelum = { ...kasMinus(), keuangan: { ...k, saldoKas: -1_000_000 } };

    const sesudah = reduce(sebelum, { t: 1, tipe: 'TINDAKAN_DARURAT', isi: {} });

    expect(sesudah.keuangan.liabilitas.length).toBe(sebelum.keuangan.liabilitas.length + 1);
    expect(sesudah.keuangan.aset).toHaveLength(1); // masih belum menjual apa pun
  });

  it('menjual hanya sebagai pilihan terakhir', () => {
    let k = kasMinus().keuangan;
    for (let i = 0; i < MAKS_BERHEMAT; i++) k = berhemat(k);
    const sebelum = {
      ...kasMinus(),
      keuangan: {
        ...k,
        saldoKas: -1_000_000,
        liabilitas: [{
          id: 'darurat-1', nama: 'Pinjaman darurat',
          sisaUtang: k.gajiBersihBulanan * PLAFON_PINJAMAN_GAJI,
          cicilanBulanan: 1, bungaBulanan: 0.02,
          pokokAwal: k.gajiBersihBulanan * PLAFON_PINJAMAN_GAJI,
        }],
      },
    };
    expect(tuasTersedia(sebelum.keuangan)).toEqual(['jual']);

    const sesudah = reduce(sebelum, { t: 1, tipe: 'TINDAKAN_DARURAT', isi: {} });

    expect(sesudah.keuangan.aset).toHaveLength(0);
  });

  it('tidak mengubah urutan yang dikembalikan tuasTersedia', () => {
    expect(tuasTersedia(kasMinus().keuangan)).toEqual(['jual', 'pinjam', 'hemat']);
  });
});
