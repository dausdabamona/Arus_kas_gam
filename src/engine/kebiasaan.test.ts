import { describe, it, expect } from 'vitest';
import {
  refleksMemaksa,
  majukanPelepasan,
  terapkanBanding,
  type PeristiwaPelepasan,
} from './kebiasaan';
import { stateAwal } from './reducer';
import { cariKartuKebiasaan, KARTU_KEBIASAAN } from '../data/kartu-kebiasaan';
import type { StatePermainan, KebiasaanBerjalan } from '../types/state';

const aktif = (id: string): KebiasaanBerjalan => ({
  id,
  kemajuan: 0,
  lepas: false,
  lawanUnggul: false,
});

const AMBANG_PANIK = (() => {
  const e = cariKartuKebiasaan('refleks-panik').efek;
  if (e.jenis !== 'panik') throw new Error('tidak mungkin');
  return e.ambangTurun;
})();

const AMBANG_KEJAR = (() => {
  const e = cariKartuKebiasaan('refleks-kejar').efek;
  if (e.jenis !== 'kejar') throw new Error('tidak mungkin');
  return e.ambangImbal;
})();

describe('refleksMemaksa — panik', () => {
  it('memaksa saat turun melampaui ambangnya', () => {
    const hasil = refleksMemaksa([aktif('refleks-panik')], {
      jenis: 'pasar',
      turunPersen: AMBANG_PANIK + 0.05,
    });
    expect(hasil.dipaksa).toBe(true);
    expect(hasil.kartuId).toBe('refleks-panik');
  });

  it('tidak memaksa di bawah ambang', () => {
    expect(
      refleksMemaksa([aktif('refleks-panik')], {
        jenis: 'pasar',
        turunPersen: AMBANG_PANIK - 0.01,
      }).dipaksa,
    ).toBe(false);
  });

  it('tidak memaksa tepat di ambang — syaratnya melampaui, bukan menyentuh', () => {
    expect(
      refleksMemaksa([aktif('refleks-panik')], { jenis: 'pasar', turunPersen: AMBANG_PANIK })
        .dipaksa,
    ).toBe(false);
  });

  it('tidak memaksa lagi setelah refleksnya lepas', () => {
    const lepas: KebiasaanBerjalan = { ...aktif('refleks-panik'), lepas: true };
    expect(
      refleksMemaksa([lepas], { jenis: 'pasar', turunPersen: AMBANG_PANIK + 0.5 }).dipaksa,
    ).toBe(false);
  });

  it('tidak memaksa saat pemain tidak membawa kartunya', () => {
    expect(
      refleksMemaksa([aktif('refleks-kejar')], { jenis: 'pasar', turunPersen: 0.9 }).dipaksa,
    ).toBe(false);
  });
});

describe('refleksMemaksa — kejar', () => {
  it('memaksa saat imbal hasil melampaui ambangnya', () => {
    const hasil = refleksMemaksa([aktif('refleks-kejar')], {
      jenis: 'kartu',
      imbalPersen: AMBANG_KEJAR + 0.1,
    });
    expect(hasil.dipaksa).toBe(true);
    expect(hasil.kartuId).toBe('refleks-kejar');
  });

  it('tidak memaksa di bawah ambang', () => {
    expect(
      refleksMemaksa([aktif('refleks-kejar')], {
        jenis: 'kartu',
        imbalPersen: AMBANG_KEJAR - 0.01,
      }).dipaksa,
    ).toBe(false);
  });

  it('tidak memaksa lagi setelah lepas', () => {
    const lepas: KebiasaanBerjalan = { ...aktif('refleks-kejar'), lepas: true };
    expect(refleksMemaksa([lepas], { jenis: 'kartu', imbalPersen: 5 }).dipaksa).toBe(false);
  });

  it('tidak menyilangkan konteks — panik tidak menjawab tawaran kartu', () => {
    expect(
      refleksMemaksa([aktif('refleks-panik')], { jenis: 'kartu', imbalPersen: 5 }).dipaksa,
    ).toBe(false);
  });

  it('tidak memaksa apa pun saat tidak ada kebiasaan sama sekali', () => {
    expect(refleksMemaksa([], { jenis: 'pasar', turunPersen: 0.9 }).dipaksa).toBe(false);
    expect(refleksMemaksa([], { jenis: 'kartu', imbalPersen: 9 }).dipaksa).toBe(false);
  });
});

describe('majukanPelepasan', () => {
  it('menaikkan kemajuan hanya untuk kebiasaan yang syaratnya cocok', () => {
    const semua = [aktif('refleks-panik'), aktif('refleks-kejar'), aktif('refleks-banding')];
    const sesudah = majukanPelepasan(semua, 'jeda-pasar-turun');
    expect(sesudah.find((k) => k.id === 'refleks-panik')!.kemajuan).toBe(1);
    expect(sesudah.find((k) => k.id === 'refleks-kejar')!.kemajuan).toBe(0);
    expect(sesudah.find((k) => k.id === 'refleks-banding')!.kemajuan).toBe(0);
  });

  it('menandai lepas saat kemajuan mencapai jumlah yang disyaratkan', () => {
    const kali = cariKartuKebiasaan('refleks-panik').syaratLepas.kali;
    let daftar = [aktif('refleks-panik')];
    for (let i = 0; i < kali; i++) daftar = majukanPelepasan(daftar, 'jeda-pasar-turun');
    expect(daftar[0].kemajuan).toBe(kali);
    expect(daftar[0].lepas).toBe(true);
  });

  it('belum menandai lepas sebelum syaratnya penuh', () => {
    const daftar = majukanPelepasan([aktif('refleks-panik')], 'jeda-pasar-turun');
    expect(daftar[0].lepas).toBe(false);
  });

  it('melepas refleks-kejar dengan satu penolakan tenang', () => {
    const daftar = majukanPelepasan([aktif('refleks-kejar')], 'tolak-tenang');
    expect(daftar[0].lepas).toBe(true);
  });

  it('melepas refleks-banding lewat jeda di kebutuhan pengakuan', () => {
    const daftar = majukanPelepasan([aktif('refleks-banding')], 'jeda-pengakuan');
    expect(daftar[0].lepas).toBe(true);
  });

  it('tidak mengubah kebiasaan yang sudah lepas', () => {
    const sudah: KebiasaanBerjalan = { id: 'refleks-kejar', kemajuan: 1, lepas: true, lawanUnggul: false };
    expect(majukanPelepasan([sudah], 'tolak-tenang')).toEqual([sudah]);
  });

  /**
   * Penjaga peta padanan: kartu baru yang syaratnya tidak punya peristiwa
   * pasangan akan diam-diam tidak pernah bisa dilepas — kartu tanpa jalan
   * keluar, persis yang §7.2 larang, tanpa satu tes pun menyala.
   */
  it('memberi setiap kartu peristiwa yang benar-benar memajukannya', () => {
    for (const kartu of KARTU_KEBIASAAN) {
      const semua: PeristiwaPelepasan[] = ['jeda-pasar-turun', 'tolak-tenang', 'jeda-pengakuan'];
      const yangMemajukan = semua.filter(
        (p) => majukanPelepasan([aktif(kartu.id)], p)[0].kemajuan > 0,
      );
      expect(yangMemajukan, `${kartu.id} tidak punya jalan keluar`).toHaveLength(1);
    }
  });

  it('tidak memutasi daftar aslinya', () => {
    const asli = [aktif('refleks-panik')];
    majukanPelepasan(asli, 'jeda-pasar-turun');
    expect(asli[0].kemajuan).toBe(0);
  });
});

describe('refleks-banding menyala sekali per pelampauan', () => {
  function dunia(kasBot: number, kasPemain: number, kebiasaan: KebiasaanBerjalan[]): StatePermainan {
    const dasar = stateAwal('uji-banding', 'asn-3b');
    return {
      ...dasar,
      tahap: 'luas',
      kebiasaan,
      keuangan: { ...dasar.keuangan, saldoKas: kasPemain },
      bot: dasar.bot.slice(0, 1).map((b) => ({
        ...b,
        state: { ...b.state, keuangan: { ...b.state.keuangan, saldoKas: kasBot, liabilitas: [] } },
      })),
    };
  }

  const tetap = 3_400_000;

  it('tidak menaikkan apa pun selagi bot masih tertinggal', () => {
    const s = terapkanBanding(dunia(1_000_000, 500_000_000, [aktif('refleks-banding')]));
    expect(s.keuangan.pengeluaranTetap).toBe(tetap);
    expect(s.kebiasaan[0].lawanUnggul).toBe(false);
  });

  it('menaikkan sekali saat bot melampaui', () => {
    const s = terapkanBanding(dunia(900_000_000, 1_000_000, [aktif('refleks-banding')]));
    expect(s.keuangan.pengeluaranTetap).toBeGreaterThan(tetap);
    expect(s.kebiasaan[0].lawanUnggul).toBe(true);
  });

  /** Inti Tugas ini: efek berulang tanpa pemicu diskrit meledak. */
  it('TIDAK menaikkan lagi selama bot tetap unggul beberapa giliran', () => {
    let s = terapkanBanding(dunia(900_000_000, 1_000_000, [aktif('refleks-banding')]));
    const sesudahSekali = s.keuangan.pengeluaranTetap;
    for (let i = 0; i < 5; i++) s = terapkanBanding(s);
    expect(s.keuangan.pengeluaranTetap).toBe(sesudahSekali);
  });

  it('menyalakan ulang penanda saat pemain menyusul kembali', () => {
    const unggul = terapkanBanding(dunia(900_000_000, 1_000_000, [aktif('refleks-banding')]));
    const disusul = terapkanBanding({
      ...unggul,
      keuangan: { ...unggul.keuangan, saldoKas: 2_000_000_000 },
    });
    expect(disusul.kebiasaan[0].lawanUnggul).toBe(false);
    expect(disusul.keuangan.pengeluaranTetap).toBe(unggul.keuangan.pengeluaranTetap);
  });

  it('menaikkan lagi pada pelampauan BERIKUTNYA, bukan pada giliran yang sama', () => {
    const unggul = terapkanBanding(dunia(900_000_000, 1_000_000, [aktif('refleks-banding')]));
    const disusul = terapkanBanding({
      ...unggul,
      keuangan: { ...unggul.keuangan, saldoKas: 2_000_000_000 },
    });
    const unggulLagi = terapkanBanding({
      ...disusul,
      keuangan: { ...disusul.keuangan, saldoKas: 1_000_000 },
    });
    expect(unggulLagi.keuangan.pengeluaranTetap).toBeGreaterThan(disusul.keuangan.pengeluaranTetap);
  });

  it('tidak berbuat apa pun setelah refleksnya lepas', () => {
    const lepas: KebiasaanBerjalan = { ...aktif('refleks-banding'), lepas: true };
    const s = terapkanBanding(dunia(900_000_000, 1_000_000, [lepas]));
    expect(s.keuangan.pengeluaranTetap).toBe(tetap);
  });

  it('tidak berbuat apa pun saat pemain tidak membawa kartunya', () => {
    const s = terapkanBanding(dunia(900_000_000, 1_000_000, [aktif('refleks-panik')]));
    expect(s.keuangan.pengeluaranTetap).toBe(tetap);
  });

  it('tidak berbuat apa pun di Lingkar Harian', () => {
    const harian: StatePermainan = {
      ...dunia(900_000_000, 1_000_000, [aktif('refleks-banding')]),
      tahap: 'harian',
    };
    expect(terapkanBanding(harian).keuangan.pengeluaranTetap).toBe(tetap);
  });
});
