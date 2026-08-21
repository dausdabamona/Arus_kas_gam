import { describe, it, expect } from 'vitest';
import { reduce, stateAwal, MAKS_ANAK } from './reducer';
import { arusKasBulanan, penghasilanBebas } from './keuangan';
import { cariKartu } from '../data/kartu-peluang';
import type { StatePermainan } from '../types/state';

function statePada(posisi: number): StatePermainan {
  return { ...stateAwal('uji-petak', 'asn-3b'), posisi };
}

describe('petak GAJIAN', () => {
  it('menambah kas sebesar arus kas bulanan saat dilewati', () => {
    const sebelum = statePada(3); // dadu apa pun ≥ 3 akan melewati petak 6
    const arus = arusKasBulanan(sebelum.keuangan);
    const sesudah = reduce(sebelum, { t: 100, tipe: 'LEMPAR_DADU', isi: { pemainId: 'p1' } });
    const gajianDilewati = (sesudah.keuangan.saldoKas - sebelum.keuangan.saldoKas) / arus;
    expect(Number.isInteger(gajianDilewati)).toBe(true);
    expect(gajianDilewati).toBeGreaterThanOrEqual(0);
  });
});

describe('petak PELUANG', () => {
  it('membuka kartu saat mendarat di petak peluang kecil', () => {
    const sebelum = { ...statePada(0), posisi: 0 };
    // cari t yang menghasilkan dadu 1 agar mendarat di petak 1 (PELUANG_KECIL)
    let sesudah = sebelum;
    for (let t = 1; t < 200; t++) {
      const coba = reduce(sebelum, { t, tipe: 'LEMPAR_DADU', isi: { pemainId: 'p1' } });
      if (coba.posisi === 1) { sesudah = coba; break; }
    }
    expect(sesudah.posisi).toBe(1);
    expect(sesudah.kartuTerbuka?.tumpukan).toBe('PELUANG_KECIL');
  });

  it('membuka kartu yang sama untuk seed dan t yang sama', () => {
    const a = reduce(statePada(0), { t: 5, tipe: 'LEMPAR_DADU', isi: { pemainId: 'p1' } });
    const b = reduce(statePada(0), { t: 5, tipe: 'LEMPAR_DADU', isi: { pemainId: 'p1' } });
    expect(a.kartuTerbuka?.id).toBe(b.kartuTerbuka?.id);
  });
});

describe('PUTUSKAN', () => {
  it('menolak kartu tanpa mengubah keuangan', () => {
    const kartu = cariKartu('ruko-pasar')!;
    const sebelum = { ...statePada(4), kartuTerbuka: kartu };
    const sesudah = reduce(sebelum, {
      t: 2, tipe: 'PUTUSKAN', isi: { kartuId: kartu.id, pilihan: 'tolak' },
    });
    expect(sesudah.keuangan).toEqual(sebelum.keuangan);
    expect(sesudah.kartuTerbuka).toBeNull();
  });

  it('mengambil kartu: kas berkurang sebesar uang muka', () => {
    const kartu = cariKartu('kos-satu-pintu')!;
    const sebelum = { ...statePada(1), kartuTerbuka: kartu };
    const sesudah = reduce(sebelum, {
      t: 2, tipe: 'PUTUSKAN', isi: { kartuId: kartu.id, pilihan: 'ambil' },
    });
    expect(sesudah.keuangan.saldoKas).toBe(sebelum.keuangan.saldoKas - kartu.uangMuka);
  });

  it('mengambil kartu: aset dan utangnya masuk neraca', () => {
    const kartu = cariKartu('kos-satu-pintu')!;
    const sebelum = { ...statePada(1), kartuTerbuka: kartu };
    const sesudah = reduce(sebelum, {
      t: 2, tipe: 'PUTUSKAN', isi: { kartuId: kartu.id, pilihan: 'ambil' },
    });
    expect(sesudah.keuangan.aset).toHaveLength(1);
    expect(sesudah.keuangan.liabilitas).toHaveLength(sebelum.keuangan.liabilitas.length + 1);
  });

  it('menolak pembelian bila kas tidak cukup untuk uang muka', () => {
    const kartu = cariKartu('ruko-pasar')!;
    const sebelum = { ...statePada(4), kartuTerbuka: kartu };
    const sesudah = reduce(sebelum, {
      t: 2, tipe: 'PUTUSKAN', isi: { kartuId: kartu.id, pilihan: 'ambil' },
    });
    expect(sesudah.keuangan).toEqual(sebelum.keuangan);
    expect(sesudah.kartuTerbuka).toBeNull();
  });
});

describe('petak yang belum berefek di fase ini', () => {
  it('PASAR dan GUNCANG tidak mengubah keuangan', () => {
    const sebelum = statePada(1); // dadu 1 → petak 2 (PASAR)
    let sesudah = sebelum;
    for (let t = 1; t < 200; t++) {
      const coba = reduce(sebelum, { t, tipe: 'LEMPAR_DADU', isi: { pemainId: 'p1' } });
      if (coba.posisi === 2) { sesudah = coba; break; }
    }
    expect(sesudah.posisi).toBe(2);
    expect(sesudah.keuangan.saldoKas).toBe(sebelum.keuangan.saldoKas);
  });
});

describe('BIAYA_TAK_TERDUGA proporsional', () => {
  // Terikat ke penghasilan bebas, bukan gaji: gaji dan daya tahan adalah dua
  // satuan berbeda, dan menyamakannya pernah membuat profesi bermargin tipis
  // net-negatif sebelum pemain memutuskan apa pun (§5.4 Invarian 3).
  it('tidak pernah melampaui 0,4x penghasilan bebas', () => {
    const sebelum = statePada(2); // dadu 1 → petak 3
    for (let t = 1; t < 300; t++) {
      const sesudah = reduce(sebelum, { t, tipe: 'LEMPAR_DADU', isi: { pemainId: 'p1' } });
      if (sesudah.posisi !== 3) continue;
      const biaya = sebelum.keuangan.saldoKas - sesudah.keuangan.saldoKas;
      expect(biaya).toBeLessThanOrEqual(penghasilanBebas(sebelum.keuangan) * 0.4);
      expect(biaya).toBeGreaterThan(0);
    }
  });
});

describe('petak TAMBAH_ANAK', () => {
  it('menambah satu anak dan menaikkan pengeluaran', () => {
    const sebelum = statePada(16); // dadu 1 → petak 17
    let sesudah = sebelum;
    for (let t = 1; t < 200; t++) {
      const coba = reduce(sebelum, { t, tipe: 'LEMPAR_DADU', isi: { pemainId: 'p1' } });
      if (coba.posisi === 17) { sesudah = coba; break; }
    }
    expect(sesudah.keuangan.jumlahAnak).toBe(sebelum.keuangan.jumlahAnak + 1);
  });

  // Tanpa batas ini, pengeluaran naik permanen tiap ~24 giliran sampai
  // profesi mana pun pasti bangkrut — dibuktikan simulasi sebelum batasnya ada.
  it('berhenti menambah anak setelah batas tercapai', () => {
    const penuh: StatePermainan = {
      ...statePada(16),
      keuangan: { ...stateAwal('uji-petak', 'asn-3b').keuangan, jumlahAnak: MAKS_ANAK },
    };
    for (let t = 1; t < 200; t++) {
      const coba = reduce(penuh, { t, tipe: 'LEMPAR_DADU', isi: { pemainId: 'p1' } });
      if (coba.posisi !== 17) continue;
      expect(coba.keuangan.jumlahAnak).toBe(MAKS_ANAK);
      return;
    }
    throw new Error('tidak pernah mendarat di petak tambah anak');
  });
});
