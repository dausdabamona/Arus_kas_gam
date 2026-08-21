import { prngUntuk } from './prng';
import { lemparDadu, bilanganAcak, ambilSatu } from './acak';
import { petakDi, posisiSetelah, hitungGajianDilewati } from './papan';
import {
  arusKasBulanan,
  jualAset,
  lunasiPinjaman,
  penghasilanBebas,
  perluTindakanDarurat,
  tuasTersedia,
  berhemat,
  ambilPinjamanDarurat,
  sisaPlafonPinjaman,
  type KondisiKeuangan,
} from './keuangan';
import { KARTU_PELUANG_KECIL, KARTU_PELUANG_BESAR, cariKartu } from '../data/kartu-peluang';
import { cariProfesi } from '../data/profesi';
import type { Kejadian } from '../types/kejadian';
import { JUMLAH_PETAK, type StatePermainan } from '../types/state';
import type { KartuPeluang } from '../types/kartu';
import type { Prng } from './prng';

/**
 * Rentang biaya tak terduga, dalam persepuluhan PENGHASILAN BEBAS
 * (gaji dikurangi biaya hidup tetap) — bukan gaji. Gaji dan daya tahan
 * adalah dua satuan berbeda: guru bergaji Rp 2,2 juta hanya bersisa
 * Rp 400 ribu, jadi skala-ke-gaji menghukumnya jauh lebih berat daripada
 * ASN. Angkanya terikat Invarian 3 di `simulasi.test.ts`.
 */
const BIAYA_PENGALI_MIN = 2; // 0,2x penghasilan bebas
const BIAYA_PENGALI_MAKS = 4; // 0,4x penghasilan bebas

/** Batas derma, sebagai kelipatan penghasilan bebas. */
const AMAL_BATAS_PENGHASILAN = 0.3;

/**
 * Batas jumlah anak. Tanpa batas, petak TAMBAH_ANAK menaikkan pengeluaran
 * permanen tiap ~24 giliran sampai profesi mana pun pasti bangkrut — dan
 * satu permainan hanya 20–35 menit, jadi belasan anak juga tidak masuk akal.
 */
export const MAKS_ANAK = 2;

/**
 * Tuas yang dipilih mesin bila pemain tidak menyebutkan satu pun: tekan
 * pengeluaran dulu, pinjam kalau perlu, jual paling akhir. Berbeda dari
 * urutan tampil `tuasTersedia()`, yang tidak boleh ikut berubah.
 */
const URUTAN_TUAS_BAWAAN = ['hemat', 'pinjam', 'jual'] as const;

/** State kosong sebelum kejadian apa pun dijalankan. */
export function stateAwal(seed: string, profesiId: string): StatePermainan {
  return {
    seed,
    profesiId,
    giliran: 0,
    posisi: 0,
    riwayatDadu: [],
    status: 'berjalan',
    keuangan: strukturUlang(cariProfesi(profesiId).kondisiAwal),
    kartuTerbuka: null,
  };
}

/** Salinan dalam, supaya data profesi tidak pernah termutasi. */
function strukturUlang(kondisi: KondisiKeuangan): KondisiKeuangan {
  return {
    ...kondisi,
    aset: kondisi.aset.map((a) => ({ ...a })),
    liabilitas: kondisi.liabilitas.map((l) => ({ ...l })),
  };
}

/** Menjalankan efek petak tempat pemain mendarat. */
function efekPetak(state: StatePermainan, prng: Prng): StatePermainan {
  const petak = petakDi(state.posisi);

  switch (petak) {
    case 'PELUANG_KECIL':
      return { ...state, kartuTerbuka: ambilSatu(prng, KARTU_PELUANG_KECIL) };

    case 'PELUANG_BESAR':
      return { ...state, kartuTerbuka: ambilSatu(prng, KARTU_PELUANG_BESAR) };

    case 'BIAYA_TAK_TERDUGA': {
      // Proporsional terhadap penghasilan bebas, bukan nominal tetap —
      // supaya beratnya terasa sama di semua profesi tanpa penyetelan satu
      // per satu, dan tanpa menghukum profesi bermargin tipis.
      const pengali = bilanganAcak(prng, BIAYA_PENGALI_MIN, BIAYA_PENGALI_MAKS) / 10;
      const biaya = Math.round(penghasilanBebas(state.keuangan) * pengali);
      return {
        ...state,
        keuangan: { ...state.keuangan, saldoKas: state.keuangan.saldoKas - biaya },
      };
    }

    case 'AMAL': {
      // Sepersepuluh kas, tapi dibatasi terhadap penghasilan bebas. Tanpa
      // batas ini kas yang menumpuk membuat derma tumbuh tanpa henti sampai
      // menyerap seluruh pemasukan — Invarian 3 lalu mustahil dipenuhi.
      const batas = penghasilanBebas(state.keuangan) * AMAL_BATAS_PENGHASILAN;
      const derma = Math.max(0, Math.round(Math.min(state.keuangan.saldoKas * 0.1, batas)));
      return {
        ...state,
        keuangan: { ...state.keuangan, saldoKas: state.keuangan.saldoKas - derma },
      };
    }

    case 'TAMBAH_ANAK':
      if (state.keuangan.jumlahAnak >= MAKS_ANAK) return state;
      return {
        ...state,
        keuangan: { ...state.keuangan, jumlahAnak: state.keuangan.jumlahAnak + 1 },
      };

    // PASAR ditangani Fase 3, GUNCANG ditangani Fase 5.
    // Di fase ini keduanya sengaja tidak berefek, dan itu diuji.
    case 'PASAR':
    case 'GUNCANG':
    case 'GAJIAN':
      return state;
  }
}

/** Menerapkan kartu yang diambil ke neraca. */
function ambilKartu(keuangan: KondisiKeuangan, kartu: KartuPeluang): KondisiKeuangan {
  if (keuangan.saldoKas < kartu.uangMuka) return keuangan;

  const kunci = `${kartu.id}-${keuangan.aset.length}`;
  const keuanganBaru: KondisiKeuangan = {
    ...keuangan,
    saldoKas: keuangan.saldoKas - kartu.uangMuka,
    aset: [
      ...keuangan.aset,
      {
        id: kunci,
        nama: kartu.judul,
        nilai: kartu.harga,
        arusKasBulanan: kartu.arusKasBulanan,
      },
    ],
  };

  if (kartu.sisaUtang === 0) return keuanganBaru;

  return {
    ...keuanganBaru,
    liabilitas: [
      ...keuanganBaru.liabilitas,
      {
        id: `utang-${kunci}`,
        nama: `Utang ${kartu.judul}`,
        sisaUtang: kartu.sisaUtang,
        cicilanBulanan: kartu.cicilanBulanan,
        pokokAwal: kartu.sisaUtang,
      },
    ],
  };
}

/** Fungsi murni: satu kejadian menghasilkan state baru. */
export function reduce(state: StatePermainan, kejadian: Kejadian): StatePermainan {
  switch (kejadian.tipe) {
    case 'MULAI':
      return stateAwal(kejadian.isi.seed, kejadian.isi.profesiId);

    case 'LEMPAR_DADU': {
      const prng = prngUntuk(state.seed, kejadian.t);
      const mata = lemparDadu(prng);
      const gajian = hitungGajianDilewati(state.posisi, mata);
      const arus = arusKasBulanan(state.keuangan);

      const bergerak: StatePermainan = {
        ...state,
        giliran: state.giliran + 1,
        posisi: posisiSetelah(state.posisi, mata),
        riwayatDadu: [...state.riwayatDadu, mata],
        keuangan: {
          ...state.keuangan,
          saldoKas: state.keuangan.saldoKas + arus * gajian,
        },
      };

      return efekPetak(bergerak, prng);
    }

    case 'PUTUSKAN': {
      const kartu = cariKartu(kejadian.isi.kartuId);
      if (!kartu || kejadian.isi.pilihan === 'tolak') {
        return { ...state, kartuTerbuka: null };
      }
      return { ...state, keuangan: ambilKartu(state.keuangan, kartu), kartuTerbuka: null };
    }

    case 'LUNASI':
      return {
        ...state,
        keuangan: lunasiPinjaman(state.keuangan, kejadian.isi.liabilitasId, kejadian.isi.jumlah),
      };

    case 'JUAL_ASET':
      return { ...state, keuangan: jualAset(state.keuangan, kejadian.isi.asetId) };

    case 'TINDAKAN_DARURAT': {
      if (!perluTindakanDarurat(state.keuangan)) return state;

      const tersedia = tuasTersedia(state.keuangan);
      if (tersedia.length === 0) {
        return { ...state, status: 'selesai' }; // bangkrut, §5.3
      }

      // Urutan bawaan sengaja berbeda dari urutan tampil di tuasTersedia:
      // urutan bawaan di kode diam-diam berfungsi sebagai rekomendasi, dan
      // tidak ada jalur yang pantas berujung panik tanpa pemain memilihnya.
      // Menjual aset produktif adalah refleks yang game ini ingin ditunjukkan
      // dari luar, bukan yang dilakukan mesin atas nama pemain.
      const bawaan = URUTAN_TUAS_BAWAAN.find((t) => tersedia.includes(t));
      const tuas = kejadian.isi.tuas ?? bawaan;
      if (!tuas || !tersedia.includes(tuas)) return state;

      switch (tuas) {
        case 'hemat':
          return { ...state, keuangan: berhemat(state.keuangan) };
        case 'jual': {
          const asetId = kejadian.isi.asetId ?? state.keuangan.aset[0]?.id;
          return asetId ? { ...state, keuangan: jualAset(state.keuangan, asetId) } : state;
        }
        case 'pinjam': {
          const butuh = Math.abs(state.keuangan.saldoKas) + state.keuangan.gajiBersihBulanan;
          const jumlah = Math.min(butuh, sisaPlafonPinjaman(state.keuangan));
          return { ...state, keuangan: ambilPinjamanDarurat(state.keuangan, jumlah) };
        }
      }
      break;
    }

    case 'AKHIR':
      return { ...state, status: 'selesai' };

    default:
      // Kejadian Fase 3+ belum mengubah state; sengaja dibiarkan lewat.
      return state;
  }
}

/** Menghitung ulang state dari nol dengan memutar seluruh event log. */
export function putarUlang(kejadian: readonly Kejadian[]): StatePermainan {
  if (kejadian.length === 0 || kejadian[0].tipe !== 'MULAI') {
    throw new Error('Kejadian pertama harus MULAI');
  }
  const awal = kejadian[0] as Extract<Kejadian, { tipe: 'MULAI' }>;
  return kejadian.reduce(reduce, stateAwal(awal.isi.seed, awal.isi.profesiId));
}

export { JUMLAH_PETAK };
