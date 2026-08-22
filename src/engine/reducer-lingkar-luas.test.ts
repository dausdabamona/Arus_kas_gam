import { describe, it, expect } from 'vitest';
import { reduce, stateAwal } from './reducer';
import { ringkasKemerdekaan, MINIMUM_UJIAN } from './kemerdekaan';
import { KARTU_KEBIASAAN } from '../data/kartu-kebiasaan';
import type { StatePermainan } from '../types/state';
import type { Kejadian } from '../types/kejadian';

function jalankan(state: StatePermainan, daftar: Kejadian[]): StatePermainan {
  return daftar.reduce(reduce, state);
}

/** Kondisi yang benar-benar lolos Tahap Satu: pendapatan pasif menutup pengeluaran. */
function sudahLolos(s: StatePermainan): StatePermainan {
  return {
    ...s,
    keuangan: {
      ...s.keuangan,
      aset: [
        {
          id: 'kos-besar-0',
          nama: 'Kos besar',
          nilai: 900_000_000,
          arusKasBulanan: 20_000_000,
        },
      ],
    },
  };
}

const NIAT: Kejadian = { t: 5, tipe: 'GERBANG_NIAT', isi: { niat: 'Menemani anak tumbuh.' } };
const MASUK: Kejadian = { t: 6, tipe: 'MASUK_LINGKAR_LUAS', isi: {} };

describe('keadaan awal tahap', () => {
  it('memulai permainan di Lingkar Harian tanpa niat dan tanpa kebiasaan', () => {
    const s = stateAwal('uji-luas', 'asn-3b');
    expect(s.tahap).toBe('harian');
    expect(s.niat).toBeNull();
    expect(s.kebiasaan).toEqual([]);
  });
});

describe('GERBANG_NIAT', () => {
  it('menyimpan kalimat niat pemain', () => {
    expect(reduce(stateAwal('uji-niat', 'asn-3b'), NIAT).niat).toBe('Menemani anak tumbuh.');
  });

  it('menolak niat kosong atau hanya spasi — tetap null', () => {
    const kosong = reduce(stateAwal('uji-niat', 'asn-3b'), {
      t: 1, tipe: 'GERBANG_NIAT', isi: { niat: '   ' },
    });
    expect(kosong.niat).toBeNull();
  });

  it('merapikan spasi di ujung kalimat', () => {
    const s = reduce(stateAwal('uji-niat', 'asn-3b'), {
      t: 1, tipe: 'GERBANG_NIAT', isi: { niat: '  Berhenti takut.  ' },
    });
    expect(s.niat).toBe('Berhenti takut.');
  });
});

describe('MASUK_LINGKAR_LUAS', () => {
  it('tidak melakukan apa pun sebelum syarat lolos terpenuhi', () => {
    const belum = jalankan(stateAwal('uji-curang', 'asn-3b'), [NIAT, MASUK]);
    expect(belum.tahap).toBe('harian');
    expect(belum.kebiasaan).toEqual([]);
  });

  it('tidak melakukan apa pun sebelum niat ditulis', () => {
    const tanpaNiat = reduce(sudahLolos(stateAwal('uji-tanpa-niat', 'asn-3b')), MASUK);
    expect(tanpaNiat.tahap).toBe('harian');
  });

  it('memindahkan pemain ke Lingkar Luas setelah lolos dan menulis niat', () => {
    const s = jalankan(sudahLolos(stateAwal('uji-masuk', 'asn-3b')), [NIAT, MASUK]);
    expect(s.tahap).toBe('luas');
    expect(s.niat).toBe('Menemani anak tumbuh.');
  });

  it('membawa kartu sebanyak yang diputuskan ringkasKemerdekaan', () => {
    const banyak = MINIMUM_UJIAN + 5;
    for (const [tenang, tekanan] of [[0, 0], [banyak, banyak], [Math.round(banyak * 0.5), banyak], [1, banyak]]) {
      const dasar: StatePermainan = {
        ...sudahLolos(stateAwal(`uji-jumlah-${tenang}-${tekanan}`, 'asn-3b')),
        skor: { keputusanTenang: tenang, keputusanBertekanan: tekanan },
      };
      const s = jalankan(dasar, [NIAT, MASUK]);
      expect(s.kebiasaan).toHaveLength(
        ringkasKemerdekaan({ keputusanTenang: tenang, keputusanBertekanan: tekanan }).kartuKebiasaan,
      );
    }
  });

  it('memulai setiap kebiasaan dari kemajuan nol dan belum lepas', () => {
    const dasar: StatePermainan = {
      ...sudahLolos(stateAwal('uji-awal-kebiasaan', 'asn-3b')),
      skor: { keputusanTenang: 0, keputusanBertekanan: 0 },
    };
    const s = jalankan(dasar, [NIAT, MASUK]);
    expect(s.kebiasaan.every((k) => k.kemajuan === 0 && k.lepas === false)).toBe(true);
    expect(s.kebiasaan.every((k) => KARTU_KEBIASAAN.some((x) => x.id === k.id))).toBe(true);
  });

  it('memilih kartu yang deterministik untuk seed yang sama', () => {
    const buat = (seed: string) => {
      const dasar: StatePermainan = {
        ...sudahLolos(stateAwal(seed, 'asn-3b')),
        skor: { keputusanTenang: 0, keputusanBertekanan: 0 },
      };
      return jalankan(dasar, [NIAT, MASUK]).kebiasaan.map((k) => k.id);
    };
    expect(buat('sama')).toEqual(buat('sama'));
  });

  it('tidak selalu memberi kartu yang sama lintas seed — dikocok, bukan diurut', () => {
    const kombinasi = new Set<string>();
    for (let i = 0; i < 40; i++) {
      const dasar: StatePermainan = {
        ...sudahLolos(stateAwal(`kocok-${i}`, 'asn-3b')),
        skor: { keputusanTenang: 0, keputusanBertekanan: 0 },
      };
      kombinasi.add(jalankan(dasar, [NIAT, MASUK]).kebiasaan.map((k) => k.id).sort().join('+'));
    }
    expect(kombinasi.size).toBeGreaterThan(1);
  });

  it('tidak pernah membawa kartu kembar', () => {
    for (let i = 0; i < 20; i++) {
      const dasar: StatePermainan = {
        ...sudahLolos(stateAwal(`kembar-${i}`, 'asn-3b')),
        skor: { keputusanTenang: 0, keputusanBertekanan: 0 },
      };
      const ids = jalankan(dasar, [NIAT, MASUK]).kebiasaan.map((k) => k.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('tidak berbuat apa-apa bila dipanggil dua kali', () => {
    const dasar = sudahLolos(stateAwal('uji-dua-kali', 'asn-3b'));
    const sekali = jalankan(dasar, [NIAT, MASUK]);
    const duaKali = reduce(sekali, { t: 7, tipe: 'MASUK_LINGKAR_LUAS', isi: {} });
    expect(duaKali).toBe(sekali);
  });
});
