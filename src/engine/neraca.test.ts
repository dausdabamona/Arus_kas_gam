import { describe, it, expect } from 'vitest';
import { reduce, stateAwal } from './reducer';
import {
  utangMelekat,
  ekuitasAset,
  kekayaanBersih,
  jualAset,
  totalPengeluaran,
  pendapatanPasif,
  MAKS_BERHEMAT,
  PLAFON_PINJAMAN_GAJI,
  type KondisiKeuangan,
} from './keuangan';
import { putuskanKartu, putuskanPasar, urutanTuas } from './kebijakan';
import { perluTindakanDarurat, tuasTersedia, hitungLaporan, lolosTahapSatu } from './keuangan';
import { cariKartu } from '../data/kartu-peluang';
import type { StatePermainan } from '../types/state';
import type { Kejadian } from '../types/kejadian';

/**
 * Menjalankan permainan tiruan penuh dan menyerahkan setiap state antara,
 * supaya integritas referensial bisa diperiksa di SETIAP titik — bukan cuma
 * di akhir, tempat tautan yatim sudah keburu terhapus bersama asetnya.
 */
function setiapState(seed: string, profesiId: string, maks: number): StatePermainan[] {
  let state: StatePermainan = { ...stateAwal(seed, profesiId), bot: [] };
  const semua: StatePermainan[] = [state];
  let t = 1;
  const kirim = (k: Omit<Kejadian, 't'>) => {
    state = reduce(state, { ...k, t: t++ } as Kejadian);
    semua.push(state);
  };
  let hargaLalu = { ...state.hargaPasar };

  for (let g = 0; g < maks; g++) {
    hargaLalu = { ...state.hargaPasar };
    kirim({ tipe: 'LEMPAR_DADU', isi: { pemainId: 'p1' } });
    if (state.guncangTerbuka) {
      kirim({ tipe: 'TUTUP_GUNCANG', isi: { kartuId: state.guncangTerbuka.kartuId } });
    }
    if (state.kartuTerbuka) {
      kirim({
        tipe: 'PUTUSKAN',
        isi: { kartuId: state.kartuTerbuka.id, pilihan: putuskanKartu(state, 'seimbang') },
      });
    }
    if (state.pasarTerbuka) {
      const a = putuskanPasar(state, hargaLalu, 'sisakan');
      kirim({ tipe: 'TRANSAKSI_PASAR', isi: { instrumenId: state.pasarTerbuka, ...a } });
    }
    let p = 0;
    while (perluTindakanDarurat(state.keuangan) && p++ < 10) {
      const sb = state;
      const ters = tuasTersedia(state.keuangan);
      kirim({
        tipe: 'TINDAKAN_DARURAT',
        // Urutan PANIK, bukan sadar. Dengan urutan sadar, hemat dan pinjam
        // selalu keburu menutup krisis dan aset TIDAK PERNAH terjual sekali pun
        // dalam 300 giliran x 5 seed — jalur penghapusan aset tak pernah
        // dijalani, dan pemeriksaan integritas ini lulus tanpa memeriksa apa
        // pun. Panik adalah perilaku sungguhan (Pak Rudi, §11), bukan
        // rekayasa demi menyalakan tes.
        isi: ters.length === 0 ? {} : { tuas: urutanTuas('panik').find((x) => ters.includes(x)) ?? ters[0] },
      });
      if (state === sb || state.status === 'selesai') break;
    }
    if (state.status === 'selesai' || lolosTahapSatu(hitungLaporan(state.keuangan))) break;
  }
  return semua;
}

describe('integritas referensial aset-utang', () => {
  const SEED = ['n1', 'n2', 'n3', 'n4', 'n5'];

  it.each(SEED)('tidak pernah menyisakan utang yatim sepanjang permainan (seed %s)', (seed) => {
    let diperiksa = 0;
    for (const state of setiapState(seed, 'asn-3b', 300)) {
      const idAset = new Set(state.keuangan.aset.map((a) => a.id));
      for (const l of state.keuangan.liabilitas) {
        if (l.asetId === undefined) continue;
        diperiksa++;
        expect(idAset.has(l.asetId), `utang ${l.id} menunjuk aset ${l.asetId} yang tidak ada`).toBe(
          true,
        );
      }
    }
    // Pemeriksaan yang tidak pernah memeriksa apa pun bukan pemeriksaan.
    expect(diperiksa).toBeGreaterThan(0);
  });

  /**
   * Penjaga bagi penjaga di atasnya. Integritas referensial hanya berarti bila
   * jalur PENGHAPUSAN aset benar-benar dijalani — dan dengan urutan tuas sadar
   * ia tidak pernah dijalani sama sekali.
   */
  it('benar-benar menjalani penjualan aset berutang, bukan lulus karena tak pernah menjual', () => {
    let penjualanBerutang = 0;
    for (const seed of SEED) {
      const semua = setiapState(seed, 'asn-3b', 300);
      for (let i = 1; i < semua.length; i++) {
        const sebelum = semua[i - 1].keuangan;
        const sesudah = semua[i].keuangan;
        if (sesudah.aset.length >= sebelum.aset.length) continue;
        const hilang = sebelum.aset.filter((a) => !sesudah.aset.some((b) => b.id === a.id));
        if (hilang.some((a) => sebelum.liabilitas.some((l) => l.asetId === a.id))) {
          penjualanBerutang++;
        }
      }
    }
    expect(penjualanBerutang, 'jalur jual-aset-berutang tidak pernah dijalani').toBeGreaterThan(0);
  });
});

describe('tautan eksplisit, bukan kebetulan pola nama', () => {
  const kartu = cariKartu('ruko-pasar')!;

  function setelahAmbil(): KondisiKeuangan {
    const dasar: StatePermainan = {
      ...stateAwal('uji-tautan', 'asn-3b'),
      bot: [],
      kartuTerbuka: kartu,
      keuangan: { ...stateAwal('uji-tautan', 'asn-3b').keuangan, saldoKas: 500_000_000 },
    };
    return reduce(dasar, { t: 2, tipe: 'PUTUSKAN', isi: { kartuId: kartu.id, pilihan: 'ambil' } })
      .keuangan;
  }

  it('menautkan utang kartu ke id aset yang baru dibuat', () => {
    const k = setelahAmbil();
    const aset = k.aset.at(-1)!;
    const melekat = utangMelekat(k, aset.id);
    expect(melekat).toHaveLength(1);
    expect(melekat[0].sisaUtang).toBe(kartu.sisaUtang);
  });

  it('tidak menautkan utang bawaan profesi ke aset mana pun', () => {
    const k = stateAwal('uji-bawaan', 'asn-3b').keuangan;
    expect(k.liabilitas.every((l) => l.asetId === undefined)).toBe(true);
  });

  it('menghitung ekuitas sebagai nilai dikurangi utang melekatnya', () => {
    const k = setelahAmbil();
    const aset = k.aset.at(-1)!;
    expect(ekuitasAset(k, aset.id)).toBe(aset.nilai - kartu.sisaUtang);
  });

  it('menyamakan ekuitas dengan nilai penuh untuk aset tanpa utang', () => {
    const k: KondisiKeuangan = {
      ...stateAwal('uji-lunas', 'asn-3b').keuangan,
      aset: [{ id: 'emas-0', nama: 'Emas', nilai: 7_000_000, arusKasBulanan: 0 }],
    };
    expect(ekuitasAset(k, 'emas-0')).toBe(7_000_000);
  });

  it('mengembalikan nol untuk aset yang tidak ada', () => {
    expect(ekuitasAset(stateAwal('kosong', 'asn-3b').keuangan, 'entah-apa')).toBe(0);
    expect(utangMelekat(stateAwal('kosong', 'asn-3b').keuangan, 'entah-apa')).toEqual([]);
  });

  it('tidak ikut terbawa saat kekayaan bersih dihitung dua kali', () => {
    const k = setelahAmbil();
    // Kekayaan bersih tetap kas + Σ nilai aset − Σ sisa utang (§5.1): tautan
    // hanya mengelompokkan, tidak menambah atau mengurangi apa pun.
    const manual =
      k.saldoKas +
      k.aset.reduce((j, a) => j + a.nilai, 0) -
      k.liabilitas.reduce((j, l) => j + l.sisaUtang, 0);
    expect(kekayaanBersih(k)).toBe(manual);
  });
});

describe('penjualan neto', () => {
  const kartu = cariKartu('ruko-pasar')!;

  function denganRuko(nilai = kartu.harga): KondisiKeuangan {
    const dasar = stateAwal('uji-jual', 'asn-3b').keuangan;
    return {
      ...dasar,
      saldoKas: 5_000_000,
      aset: [
        {
          id: 'ruko-0',
          nama: kartu.judul,
          nilai,
          arusKasBulanan: kartu.arusKasBulanan,
        },
      ],
      liabilitas: [
        ...dasar.liabilitas,
        {
          id: 'utang-ruko-0',
          nama: `Utang ${kartu.judul}`,
          sisaUtang: kartu.sisaUtang,
          cicilanBulanan: kartu.cicilanBulanan,
          pokokAwal: kartu.sisaUtang,
          asetId: 'ruko-0',
        },
      ],
    };
  }

  it('menyerahkan ekuitas ke kas, bukan nilai penuhnya', () => {
    const sebelum = denganRuko();
    const sesudah = jualAset(sebelum, 'ruko-0');
    expect(sesudah.saldoKas).toBe(sebelum.saldoKas + (kartu.harga - kartu.sisaUtang));
  });

  /** Inti tambalan: cicilan untuk barang yang tak lagi dimiliki adalah utang hantu. */
  it('membuang utang yang melekat bersama asetnya', () => {
    const sesudah = jualAset(denganRuko(), 'ruko-0');
    expect(sesudah.liabilitas.some((l) => l.id === 'utang-ruko-0')).toBe(false);
    expect(sesudah.liabilitas.every((l) => l.asetId === undefined)).toBe(true);
  });

  it('menurunkan total pengeluaran sebesar cicilan yang lenyap', () => {
    const sebelum = denganRuko();
    const sesudah = jualAset(sebelum, 'ruko-0');
    expect(totalPengeluaran(sebelum) - totalPengeluaran(sesudah)).toBe(kartu.cicilanBulanan);
  });

  it('menurunkan pendapatan pasif sebesar arus kas asetnya', () => {
    const sebelum = denganRuko();
    const sesudah = jualAset(sebelum, 'ruko-0');
    expect(pendapatanPasif(sebelum) - pendapatanPasif(sesudah)).toBe(kartu.arusKasBulanan);
  });

  /** Ekuitas berpindah ke kas; tidak ada nilai yang lahir maupun lenyap (§5.1). */
  it('tidak mengubah kekayaan bersih sepeser pun', () => {
    const sebelum = denganRuko();
    expect(kekayaanBersih(jualAset(sebelum, 'ruko-0'))).toBe(kekayaanBersih(sebelum));
  });

  it('tidak menyentuh utang murni milik profesi', () => {
    const sebelum = denganRuko();
    const sesudah = jualAset(sebelum, 'ruko-0');
    expect(sesudah.liabilitas.map((l) => l.id).sort()).toEqual(
      sebelum.liabilitas.filter((l) => l.asetId === undefined).map((l) => l.id).sort(),
    );
  });
});

describe('ekuitas negatif bukan tuas', () => {
  function terbenam(): KondisiKeuangan {
    const dasar = stateAwal('uji-benam', 'asn-3b').keuangan;
    return {
      ...dasar,
      aset: [{ id: 'motor-0', nama: 'Motor sewa', nilai: 4_000_000, arusKasBulanan: 500_000 }],
      liabilitas: [
        ...dasar.liabilitas,
        {
          id: 'utang-motor-0',
          nama: 'Utang motor sewa',
          sisaUtang: 9_000_000,
          cicilanBulanan: 400_000,
          pokokAwal: 9_000_000,
          asetId: 'motor-0',
        },
      ],
    };
  }

  it('menolak menjual aset yang ekuitasnya nol atau minus', () => {
    const sebelum = terbenam();
    expect(ekuitasAset(sebelum, 'motor-0')).toBeLessThan(0);
    expect(jualAset(sebelum, 'motor-0')).toEqual(sebelum);
  });

  it('tidak menawarkan tuas jual saat satu-satunya aset terbenam', () => {
    expect(tuasTersedia({ ...terbenam(), saldoKas: -1_000_000 })).not.toContain('jual');
  });

  it('tetap menawarkan tuas jual saat ada aset ber-ekuitas positif', () => {
    const k = terbenam();
    const dengan = {
      ...k,
      saldoKas: -1_000_000,
      aset: [...k.aset, { id: 'emas-0', nama: 'Emas', nilai: 6_000_000, arusKasBulanan: 0 }],
    };
    expect(tuasTersedia(dengan)).toContain('jual');
  });

  /**
   * Bangkrut yang sah (§5.3) harus tetap tercapai. Tanpa syarat ekuitas, pemain
   * dengan aset terbenam menggantung selamanya: tuas jual terlihat tersedia,
   * ditekan, dan tidak terjadi apa-apa.
   */
  it('membiarkan bangkrut tercapai, bukan menggantung', () => {
    const k = terbenam();
    const mentok: KondisiKeuangan = {
      ...k,
      saldoKas: -1_000_000,
      kaliBerhemat: MAKS_BERHEMAT,
      liabilitas: [
        ...k.liabilitas,
        {
          id: 'darurat-penuh',
          nama: 'Pinjaman darurat',
          sisaUtang: k.gajiBersihBulanan * PLAFON_PINJAMAN_GAJI,
          cicilanBulanan: 0,
          pokokAwal: k.gajiBersihBulanan * PLAFON_PINJAMAN_GAJI,
          bungaBulanan: 0.02,
        },
      ],
    };
    expect(tuasTersedia(mentok)).toEqual([]);
  });
});
