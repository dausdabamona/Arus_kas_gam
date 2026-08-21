import { prngUntuk } from './prng';
import { lemparDadu, bilanganAcak, ambilSatu } from './acak';
import { petakDi, posisiSetelah, hitungGajianDilewati } from './papan';
import {
  arusKasBulanan,
  jualAset,
  lolosTahapSatu,
  hitungLaporan,
  lunasiPinjaman,
  nilaiUlangAsetPasar,
  perluTindakanDarurat,
  tuasTersedia,
  berhemat,
  ambilPinjamanDarurat,
  sisaPlafonPinjaman,
  type KondisiKeuangan,
} from './keuangan';
import { gerakkanHarga, hargaAwalSemua, hargaPadaKetukan } from './pasar';
import { botAwal, majukanBot } from './bot';
import { KARTU_PELUANG_KECIL, KARTU_PELUANG_BESAR, cariKartu } from '../data/kartu-peluang';
import { INSTRUMEN, cariInstrumen } from '../data/instrumen';
import { cariProfesi } from '../data/profesi';
import type { Kejadian } from '../types/kejadian';
import { JUMLAH_PETAK, type StatePermainan } from '../types/state';
import type { KartuPeluang } from '../types/kartu';
import type { Prng } from './prng';

/**
 * Rentang biaya tak terduga, dalam persepuluhan SKALA GUNCANGAN — arus kas
 * bersih awal profesi, dikunci sekali di awal permainan (§5.4 Invarian 3).
 * Angkanya terikat Invarian 3 di `simulasi.test.ts`.
 */
const BIAYA_PENGALI_MIN = 2; // 0,2x penghasilan bebas
const BIAYA_PENGALI_MAKS = 4; // 0,4x penghasilan bebas

/** Batas derma, sebagai kelipatan skala guncangan. */
const AMAL_BATAS_PENGHASILAN = 0.3;

/**
 * Batas jumlah anak (§5.4). Tanpa batas, pengeluaran naik permanen tiap
 * putaran papan dan kebangkrutan menjadi pasti terlepas dari keterampilan
 * pemain. Bebannya dijaga Invarian 4: 3 x biaya per anak <= 60% arus kas
 * bersih awal.
 */
export const MAKS_ANAK = 3;

/**
 * Tuas yang dipilih mesin bila pemain tidak menyebutkan satu pun: tekan
 * pengeluaran dulu, pinjam kalau perlu, jual paling akhir. Berbeda dari
 * urutan tampil `tuasTersedia()`, yang tidak boleh ikut berubah.
 */
const URUTAN_TUAS_BAWAAN = ['hemat', 'pinjam', 'jual'] as const;

/**
 * State kosong sebelum kejadian apa pun dijalankan.
 *
 * `denganBot` dimatikan saat `botAwal` memanggil balik ke sini — tanpa itu
 * tiap bot akan melahirkan tiga bot lagi, tanpa henti.
 */
export function stateAwal(seed: string, profesiId: string, denganBot = true): StatePermainan {
  const kondisiAwal = strukturUlang(cariProfesi(profesiId).kondisiAwal);
  return {
    seed,
    profesiId,
    giliran: 0,
    posisi: 0,
    riwayatDadu: [],
    status: 'berjalan',
    keuangan: kondisiAwal,
    hargaPasar: hargaAwalSemua(),
    skalaGuncangan: Math.max(1, arusKasBulanan(kondisiAwal)),
    kartuTerbuka: null,
    pasarTerbuka: null,
    bot: denganBot ? botAwal(seed, (s, p) => stateAwal(s, p, false)) : [],
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
      const biaya = Math.round(state.skalaGuncangan * pengali);
      return {
        ...state,
        keuangan: { ...state.keuangan, saldoKas: state.keuangan.saldoKas - biaya },
      };
    }

    case 'AMAL': {
      // Sepersepuluh kas, tapi dibatasi terhadap penghasilan bebas. Tanpa
      // batas ini kas yang menumpuk membuat derma tumbuh tanpa henti sampai
      // menyerap seluruh pemasukan — Invarian 3 lalu mustahil dipenuhi.
      const batas = state.skalaGuncangan * AMAL_BATAS_PENGHASILAN;
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

    case 'PASAR':
      return { ...state, pasarTerbuka: ambilSatu(prng, INSTRUMEN).id };

    // GUNCANG ditangani Fase 5; di fase ini sengaja tidak berefek, dan itu diuji.
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

      const hargaBaru = gerakkanHarga(state.seed, kejadian.t, state.hargaPasar);
      const bergerak: StatePermainan = {
        ...state,
        giliran: state.giliran + 1,
        posisi: posisiSetelah(state.posisi, mata),
        riwayatDadu: [...state.riwayatDadu, mata],
        hargaPasar: hargaBaru,
        keuangan: nilaiUlangAsetPasar(
          { ...state.keuangan, saldoKas: state.keuangan.saldoKas + arus * gajian },
          hargaBaru,
          (id) => cariInstrumen(id)?.imbalBulanan ?? 0,
        ),
      };

      const setelahEfek = efekPetak(bergerak, prng);

      // Satu kejadian memajukan seluruh dunia. Bot berjalan di dunianya
      // sendiri dengan seed turunan, jadi deret acaknya tidak pernah
      // bersinggungan dengan deret pemain.
      if (setelahEfek.bot.length === 0) return setelahEfek;

      return {
        ...setelahEfek,
        bot: setelahEfek.bot.map((b) => {
          const maju = majukanBot(b, kejadian.t, reduce);
          return {
            ...maju,
            lolosPadaGiliran:
              maju.lolosPadaGiliran ??
              (lolosTahapSatu(hitungLaporan(maju.state.keuangan)) ? maju.state.giliran : null),
            bangkrutPadaGiliran:
              maju.bangkrutPadaGiliran ??
              (maju.state.status === 'selesai' ? maju.state.giliran : null),
          };
        }),
      };
    }

    case 'PUTUSKAN': {
      const kartu = cariKartu(kejadian.isi.kartuId);
      if (!kartu || kejadian.isi.pilihan === 'tolak') {
        return { ...state, kartuTerbuka: null };
      }
      return { ...state, keuangan: ambilKartu(state.keuangan, kartu), kartuTerbuka: null };
    }

    case 'TRANSAKSI_PASAR': {
      const { instrumenId, aksi, unit, ketukan } = kejadian.isi;
      const instrumen = cariInstrumen(instrumenId);
      if (!instrumen || aksi === 'lewat' || unit <= 0) {
        return { ...state, pasarTerbuka: null };
      }

      // Harga dihitung ulang dari ketukan, tidak pernah diambil dari isi
      // kejadian — event log tidak boleh memuat angka yang bisa dipalsukan.
      const harga = hargaPadaKetukan(
        state.seed, kejadian.t, instrumenId, state.hargaPasar[instrumenId], ketukan,
      );
      const nilaiTransaksi = harga * unit;
      const aset = state.keuangan.aset;
      const indeks = aset.findIndex((a) => a.instrumenId === instrumenId);

      if (aksi === 'beli') {
        if (state.keuangan.saldoKas < nilaiTransaksi) {
          return { ...state, pasarTerbuka: null };
        }
        const unitBaru = (indeks >= 0 ? aset[indeks].unit ?? 0 : 0) + unit;
        const barisBaru = {
          id: indeks >= 0 ? aset[indeks].id : `pasar-${instrumenId}`,
          nama: instrumen.nama,
          nilai: harga * unitBaru,
          arusKasBulanan: Math.round(harga * unitBaru * instrumen.imbalBulanan),
          instrumenId,
          unit: unitBaru,
        };
        return {
          ...state,
          pasarTerbuka: null,
          keuangan: {
            ...state.keuangan,
            saldoKas: state.keuangan.saldoKas - nilaiTransaksi,
            aset: indeks >= 0
              ? aset.map((a, i) => (i === indeks ? barisBaru : a))
              : [...aset, barisBaru],
          },
        };
      }

      if (indeks < 0) return { ...state, pasarTerbuka: null };
      const dimiliki = aset[indeks].unit ?? 0;
      const dijual = Math.min(unit, dimiliki);
      const sisa = dimiliki - dijual;

      return {
        ...state,
        pasarTerbuka: null,
        keuangan: {
          ...state.keuangan,
          saldoKas: state.keuangan.saldoKas + harga * dijual,
          aset: sisa === 0
            ? aset.filter((_, i) => i !== indeks)
            : aset.map((a, i) =>
                i === indeks
                  ? {
                      ...a,
                      unit: sisa,
                      nilai: harga * sisa,
                      arusKasBulanan: Math.round(harga * sisa * instrumen.imbalBulanan),
                    }
                  : a,
              ),
        },
      };
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
