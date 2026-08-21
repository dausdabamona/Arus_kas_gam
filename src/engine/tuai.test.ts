import { describe, it, expect } from 'vitest';
import { hitungHasilLuar } from './tuai';
import { stateAwal } from './reducer';
import { cariKartu } from '../data/kartu-peluang';
import type { StatePermainan } from '../types/state';

type Objek = NonNullable<StatePermainan['tanamTertunda'][number]['objek']>;

function state(ubah: Partial<StatePermainan> = {}): StatePermainan {
  return { ...stateAwal('uji-tuai', 'asn-3b'), giliran: 10, ...ubah };
}

function objekInstrumen(harga: number): Objek {
  return { jenis: 'instrumen', id: 'saham-individu', nilaiSaatItu: harga, padaGiliran: 3 };
}

describe('hasil luar instrumen', () => {
  it('merah saat yang ditolak ternyata naik', () => {
    const s = state({ hargaPasar: { ...stateAwal('uji-tuai', 'asn-3b').hargaPasar, 'saham-individu': 1_300_000 } });
    expect(hitungHasilLuar(s, objekInstrumen(1_000_000), 'tolak')).toBe(-300_000);
  });

  it('hijau saat yang ditolak ternyata turun', () => {
    const s = state({ hargaPasar: { ...stateAwal('uji-tuai', 'asn-3b').hargaPasar, 'saham-individu': 700_000 } });
    expect(hitungHasilLuar(s, objekInstrumen(1_000_000), 'tolak')).toBe(300_000);
  });

  it('mengikuti selisih apa adanya saat diambil', () => {
    const s = state({ hargaPasar: { ...stateAwal('uji-tuai', 'asn-3b').hargaPasar, 'saham-individu': 1_300_000 } });
    expect(hitungHasilLuar(s, objekInstrumen(1_000_000), 'ambil')).toBe(300_000);
  });

  it('memberi nol untuk instrumen yang tidak dikenal', () => {
    const objek: Objek = { jenis: 'instrumen', id: 'entah-apa', nilaiSaatItu: 1_000, padaGiliran: 1 };
    expect(hitungHasilLuar(state(), objek, 'tolak')).toBe(0);
  });
});

describe('hasil luar guncang', () => {
  it('selalu nol — tidak ada jalur tak terpilih yang bisa diukur', () => {
    const objek: Objek = { jenis: 'guncang', id: 'orang-tua-sakit', nilaiSaatItu: 0, padaGiliran: 2 };
    expect(hitungHasilLuar(state(), objek, 'ambil')).toBe(0);
    expect(hitungHasilLuar(state(), objek, 'tolak')).toBe(0);
  });
});

describe('hasil luar kartu peluang', () => {
  const kartu = cariKartu('kos-satu-pintu')!;
  const objek: Objek = {
    jenis: 'kartu',
    id: kartu.id,
    nilaiSaatItu: kartu.harga,
    padaGiliran: 3,
  };

  function denganAset(nilai: number): StatePermainan {
    const dasar = state();
    return {
      ...dasar,
      keuangan: {
        ...dasar.keuangan,
        aset: [
          {
            id: `${kartu.id}-0`,
            nama: kartu.judul,
            nilai,
            arusKasBulanan: kartu.arusKasBulanan,
            driftBulanan: kartu.driftBulanan,
            volatilitasBulanan: kartu.volatilitasBulanan,
          },
        ],
      },
    };
  }

  it('mengikuti nilai aset yang sudah bergerak saat kartunya diambil', () => {
    const s = denganAset(kartu.harga + 4_000_000);
    expect(hitungHasilLuar(s, objek, 'ambil')).toBe(4_000_000);
  });

  it('memberi nol saat asetnya sudah dijual — tidak ada lagi yang bisa dibaca', () => {
    expect(hitungHasilLuar(state(), objek, 'ambil')).toBe(0);
  });

  it('merah saat kartu yang ditolak ternyata mengapresiasi', () => {
    const naik = cariKartu('kos-satu-pintu')!;
    expect(naik.driftBulanan).toBeGreaterThan(0);
    const hasil = hitungHasilLuar(state({ giliran: 10 }), objek, 'tolak');
    expect(hasil).toBeLessThan(0);
  });

  it('hijau saat kartu yang ditolak ternyata menyusut', () => {
    const turun = cariKartu('motor-sewa');
    expect(turun, 'tidak ada kartu depresiasi untuk diuji').toBeDefined();
    expect(turun!.driftBulanan).toBeLessThan(0);
    const objekTurun: Objek = {
      jenis: 'kartu',
      id: turun!.id,
      nilaiSaatItu: turun!.harga,
      padaGiliran: 3,
    };
    expect(hitungHasilLuar(state({ giliran: 10 }), objekTurun, 'tolak')).toBeGreaterThan(0);
  });

  it('memberi nol saat belum ada giliran yang berlalu', () => {
    expect(hitungHasilLuar(state({ giliran: 3 }), objek, 'tolak')).toBe(0);
  });
});

describe('kesetiaan hitungan', () => {
  it('memberi angka yang sama untuk masukan yang sama', () => {
    const s = state();
    const objek: Objek = { jenis: 'kartu', id: 'kos-satu-pintu', nilaiSaatItu: 45_000_000, padaGiliran: 2 };
    expect(hitungHasilLuar(s, objek, 'tolak')).toBe(hitungHasilLuar(s, objek, 'tolak'));
  });

  it('membalik tanda antara menolak dan mengambil', () => {
    const s = state({ hargaPasar: { ...stateAwal('uji-tuai', 'asn-3b').hargaPasar, 'saham-individu': 1_200_000 } });
    const objek = objekInstrumen(1_000_000);
    expect(hitungHasilLuar(s, objek, 'tolak')).toBe(-hitungHasilLuar(s, objek, 'ambil'));
  });
});
