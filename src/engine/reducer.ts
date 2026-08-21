import { prngUntuk, buatPrng } from './prng';
import { lemparDadu, bilanganAcak, ambilSatu } from './acak';
import { petakDi, posisiSetelah, hitungGajianDilewati } from './papan';
import {
  arusKasBulanan,
  jualAset,
  lolosTahapSatu,
  hitungLaporan,
  lunasiPinjaman,
  nilaiUlangAsetPasar,
  nilaiUlangAsetKartu,
  perluTindakanDarurat,
  tuasTersedia,
  berhemat,
  ambilPinjamanDarurat,
  sisaPlafonPinjaman,
  type KondisiKeuangan,
} from './keuangan';
import { gerakkanHarga, hargaAwalSemua, hargaPadaKetukan, nilaiKartuBerikutnya } from './pasar';
import { botAwal, majukanBot } from './bot';
import { komentarUntuk, momenDari } from './komentar';
import { KARTU_PELUANG_KECIL, KARTU_PELUANG_BESAR, cariKartu } from '../data/kartu-peluang';
import { INSTRUMEN, cariInstrumen } from '../data/instrumen';
import { KARTU_GUNCANG, cariKartuGuncang } from '../data/kartu-guncang';
import { PROFIL_BOT } from '../data/bot';
import { cariProfesi } from '../data/profesi';
import type { Kejadian } from '../types/kejadian';
import {
  JUMLAH_PETAK,
  type StatePermainan,
  type KeadaanEmosi,
  type RiwayatDitolak,
} from '../types/state';
import type { KartuPeluang } from '../types/kartu';
import type { Prng } from './prng';

/**
 * Rentang biaya tak terduga, dalam persepuluhan SKALA GUNCANGAN — arus kas
 * bersih awal profesi, dikunci sekali di awal permainan (§5.4 Invarian 3).
 * Angkanya terikat Invarian 3 di `simulasi.test.ts`.
 */
const BIAYA_PENGALI_MIN = 2; // 0,2x skala guncangan
const BIAYA_PENGALI_MAKS = 4; // 0,4x skala guncangan

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

/** Jarak panen, dalam giliran. Cukup jauh untuk lupa, cukup dekat untuk sempat. */
const PANEN_MIN = 4;
const PANEN_MAKS = 10;

/**
 * Turunnya suhu yang dianggap benar-benar mereda. Di bawah ini keputusan
 * dihitung bertekanan — bukan hukuman, cuma pengukuran.
 */
const AMBANG_REDA = 3;

const EMOSI_KOSONG: KeadaanEmosi = {
  suhuSebelum: null,
  suhuSesudah: null,
  jedaDiambil: false,
  kebutuhan: null,
};

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
    guncangTerbuka: null,
    riwayatDitolak: [],
    emosi: EMOSI_KOSONG,
    tanamTertunda: [],
    panenTerbuka: null,
    skor: { keputusanBertekanan: 0, keputusanTenang: 0 },
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


/** Nama yang enak dibaca untuk barang yang pernah ditolak. */
function namaBarang(entri: RiwayatDitolak): string {
  if (entri.jenis === 'kartu') return cariKartu(entri.id)?.judul ?? entri.id;
  return cariInstrumen(entri.id)?.nama ?? entri.id;
}

/**
 * Memilih kartu guncang.
 *
 * DUA undian selalu dijalankan, dalam urutan tetap, meski cadangannya tidak
 * terpakai. Kalau undian kedua hanya berjalan saat syarat gagal, deret acak
 * bergeser mengikuti konteks — dan state pemain berbeda antara dunia yang
 * berbot dan yang tidak. Invarian isolasi Fase 4 langsung menyala.
 *
 * Cadangan selalu diambil dari pemicu yang sama, dan data kartu menjamin tiap
 * pemicu punya kartu tak bersyarat (ada tesnya di kartu-guncang.test.ts).
 */
function bukaGuncang(state: StatePermainan, prng: Prng): StatePermainan {
  const adaBotLolos = state.bot.some((b) => b.lolosPadaGiliran !== null);
  const terpenuhi = (syarat: string | undefined): boolean => {
    if (syarat === undefined) return true;
    if (syarat === 'ada-bot-lolos') return adaBotLolos;
    return state.riwayatDitolak.length > 0;
  };

  const utama = ambilSatu(prng, KARTU_GUNCANG);
  const cadangan = ambilSatu(
    prng,
    KARTU_GUNCANG.filter((k) => k.pemicu === utama.pemicu && k.syarat === undefined),
  );
  const kartu = terpenuhi(utama.syarat) ? utama : cadangan;

  // Bot yang lolos paling awal — dialah yang paling menusuk untuk disebut.
  const lolosDuluan = [...state.bot]
    .filter((b) => b.lolosPadaGiliran !== null)
    .sort((a, b) => a.lolosPadaGiliran! - b.lolosPadaGiliran!)[0];
  const nama = PROFIL_BOT.find((p) => p.id === lolosDuluan?.id)?.nama ?? 'Dia';
  const terakhirDitolak = state.riwayatDitolak.at(-1);
  const barang = terakhirDitolak ? namaBarang(terakhirDitolak) : 'Yang kemarin itu';

  const isi = (teks: string) => teks.replace('{nama}', nama).replace('{barang}', barang);

  return {
    ...state,
    guncangTerbuka: { kartuId: kartu.id, judul: isi(kartu.judul), teks: isi(kartu.teks) },
  };
}

/**
 * Menghitung skor Kemerdekaan untuk satu keputusan, lalu mengosongkan emosi.
 *
 * Dipanggil dari cabang KEPUTUSAN saja — cabang suhu hanya mencatat. Keputusan
 * tanpa suhu tercatat tidak dihitung sama sekali: pemicu yang tidak pernah
 * menyalakan Jeda memang bukan bahan ukur.
 */
function hitungSkor(state: StatePermainan): StatePermainan {
  const { suhuSebelum, suhuSesudah, jedaDiambil } = state.emosi;
  if (suhuSebelum === null) return state;

  const tenang = jedaDiambil && suhuSesudah !== null && suhuSesudah <= suhuSebelum - AMBANG_REDA;

  return {
    ...state,
    skor: {
      keputusanBertekanan: state.skor.keputusanBertekanan + 1,
      keputusanTenang: state.skor.keputusanTenang + (tenang ? 1 : 0),
    },
    // Tanam yang lahir dari pemicu ini baru bisa distempel sekarang: suhu
    // "sesudah" tiba setelah TANAM, tidak sebelum.
    tanamTertunda: state.tanamTertunda.map((t) =>
      t.hasilDalam === null ? { ...t, hasilDalam: tenang ? ('tenang' as const) : ('tersulut' as const) } : t,
    ),
    emosi: EMOSI_KOSONG,
  };
}

/** Objek keputusan yang sedang terbuka, untuk dicatat di Tanam. */
function objekPemicu(state: StatePermainan): StatePermainan['tanamTertunda'][number]['objek'] {
  if (state.guncangTerbuka) {
    return {
      jenis: 'guncang',
      id: state.guncangTerbuka.kartuId,
      nilaiSaatItu: 0,
      padaGiliran: state.giliran,
    };
  }
  if (state.kartuTerbuka) {
    return {
      jenis: 'kartu',
      id: state.kartuTerbuka.id,
      nilaiSaatItu: state.kartuTerbuka.harga,
      padaGiliran: state.giliran,
    };
  }
  if (state.pasarTerbuka) {
    return {
      jenis: 'instrumen',
      id: state.pasarTerbuka,
      nilaiSaatItu: state.hargaPasar[state.pasarTerbuka],
      padaGiliran: state.giliran,
    };
  }
  return null;
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
      // Diskalakan ke skala guncangan yang dikunci di awal permainan, bukan
      // ke gaji dan bukan ke pemasukan berjalan (§5.4 Invarian 3).
      const pengali = bilanganAcak(prng, BIAYA_PENGALI_MIN, BIAYA_PENGALI_MAKS) / 10;
      const biaya = Math.round(state.skalaGuncangan * pengali);
      return {
        ...state,
        keuangan: { ...state.keuangan, saldoKas: state.keuangan.saldoKas - biaya },
      };
    }

    case 'AMAL': {
      // Sepersepuluh kas, tapi dibatasi terhadap skala guncangan. Tanpa
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

    case 'GUNCANG':
      return bukaGuncang(state, prng);

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
        driftBulanan: kartu.driftBulanan,
        volatilitasBulanan: kartu.volatilitasBulanan,
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
        keuangan: nilaiUlangAsetKartu(
          nilaiUlangAsetPasar(
            { ...state.keuangan, saldoKas: state.keuangan.saldoKas + arus * gajian },
            hargaBaru,
            (id) => cariInstrumen(id)?.imbalBulanan ?? 0,
          ),
          (a) =>
            nilaiKartuBerikutnya(
              state.seed,
              kejadian.t,
              a.id,
              a.nilai,
              a.driftBulanan ?? 0,
              a.volatilitasBulanan ?? 0,
            ),
        ),
      };

      // Satu panen per giliran: yang jatuh tempo paling awal dibuka, sisanya
      // menunggu. Dua layar panen berturut-turut membuat keduanya jadi upacara.
      const jatuhTempo = bergerak.tanamTertunda.findIndex(
        (t) => t.panenPadaGiliran <= bergerak.giliran,
      );
      const denganPanen: StatePermainan =
        bergerak.panenTerbuka === null && jatuhTempo >= 0
          ? {
              ...bergerak,
              panenTerbuka: bergerak.tanamTertunda[jatuhTempo],
              tanamTertunda: bergerak.tanamTertunda.filter((_, i) => i !== jatuhTempo),
            }
          : bergerak;

      const setelahEfek = efekPetak(denganPanen, prng);

      // Satu kejadian memajukan seluruh dunia. Bot berjalan di dunianya
      // sendiri dengan seed turunan, jadi deret acaknya tidak pernah
      // bersinggungan dengan deret pemain.
      if (setelahEfek.bot.length === 0) return setelahEfek;

      return {
        ...setelahEfek,
        bot: setelahEfek.bot.map((b) => {
          const maju = majukanBot(b, kejadian.t, reduce);
          const sesudah = {
            ...maju,
            lolosPadaGiliran:
              maju.lolosPadaGiliran ??
              (lolosTahapSatu(hitungLaporan(maju.state.keuangan)) ? maju.state.giliran : null),
            bangkrutPadaGiliran:
              maju.bangkrutPadaGiliran ??
              (maju.state.status === 'selesai' ? maju.state.giliran : null),
          };
          // Bot bergerak diam-diam; komentar adalah satu-satunya suaranya.
          // Kalimat lama dipertahankan saat bot sedang diam, supaya layar
          // tidak berkedip kosong tiap giliran.
          const momen = momenDari(b, sesudah);
          const kalimat = komentarUntuk(state.seed, kejadian.t, b.id, momen);
          return { ...sesudah, komentar: kalimat ?? sesudah.komentar };
        }),
      };
    }

    case 'PUTUSKAN': {
      const kartu = cariKartu(kejadian.isi.kartuId);
      if (!kartu || kejadian.isi.pilihan === 'tolak') {
        // Yang dilewati disimpan lengkap dengan nilainya saat itu — bahan
        // pemicu menyesal, dan satu-satunya cara Tuai bisa mengukur jalan
        // yang tidak diambil.
        const riwayat = kartu
          ? [
              ...state.riwayatDitolak,
              {
                jenis: 'kartu' as const,
                id: kartu.id,
                nilaiSaatItu: kartu.harga,
                padaGiliran: state.giliran,
              },
            ]
          : state.riwayatDitolak;
        return hitungSkor({ ...state, kartuTerbuka: null, riwayatDitolak: riwayat });
      }
      return hitungSkor({
        ...state,
        keuangan: ambilKartu(state.keuangan, kartu),
        kartuTerbuka: null,
      });
    }

    case 'TRANSAKSI_PASAR': {
      const { instrumenId, aksi, unit, ketukan } = kejadian.isi;
      const instrumen = cariInstrumen(instrumenId);
      if (!instrumen || aksi === 'lewat' || unit <= 0) {
        const riwayat =
          instrumen && aksi === 'lewat'
            ? [
                ...state.riwayatDitolak,
                {
                  jenis: 'instrumen' as const,
                  id: instrumenId,
                  nilaiSaatItu: hargaPadaKetukan(
                    state.seed, kejadian.t, instrumenId, state.hargaPasar[instrumenId], ketukan,
                  ),
                  padaGiliran: state.giliran,
                },
              ]
            : state.riwayatDitolak;
        return hitungSkor({ ...state, pasarTerbuka: null, riwayatDitolak: riwayat });
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
          return hitungSkor({ ...state, pasarTerbuka: null });
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
        return hitungSkor({
          ...state,
          pasarTerbuka: null,
          keuangan: {
            ...state.keuangan,
            saldoKas: state.keuangan.saldoKas - nilaiTransaksi,
            aset: indeks >= 0
              ? aset.map((a, i) => (i === indeks ? barisBaru : a))
              : [...aset, barisBaru],
          },
        });
      }

      if (indeks < 0) return hitungSkor({ ...state, pasarTerbuka: null });
      const dimiliki = aset[indeks].unit ?? 0;
      const dijual = Math.min(unit, dimiliki);
      const sisa = dimiliki - dijual;

      return hitungSkor({
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
      });
    }

    case 'TUTUP_GUNCANG': {
      if (!state.guncangTerbuka || state.guncangTerbuka.kartuId !== kejadian.isi.kartuId) {
        return state;
      }
      const kartu = cariKartuGuncang(state.guncangTerbuka.kartuId);
      // Ruang nama teks, bukan aritmetika indeks: deret guncang tidak pernah
      // bersinggungan dengan deret dadu meski t-nya sama.
      const prng = buatPrng(`${state.seed}#guncang#${kejadian.t}`);
      const ditutup: StatePermainan = { ...state, guncangTerbuka: null };

      switch (kartu.efek.jenis) {
        case 'kas': {
          const [bawah, atas] = kartu.efek.pengali;
          // Perseratus, supaya rentang pecahan seperti 2,5–5 tetap bulat di dalam.
          const pengali = bilanganAcak(prng, Math.round(bawah * 100), Math.round(atas * 100)) / 100;
          const biaya = Math.round(state.skalaGuncangan * pengali);
          return hitungSkor({
            ...ditutup,
            keuangan: { ...state.keuangan, saldoKas: state.keuangan.saldoKas - biaya },
          });
        }
        case 'inflasi':
          // Permanen, dan satu-satunya inflasi di game (§8.3). Tidak pernah dikembalikan.
          return hitungSkor({
            ...ditutup,
            keuangan: {
              ...state.keuangan,
              pengeluaranTetap: Math.round(
                state.keuangan.pengeluaranTetap * (1 + kartu.efek.kenaikan),
              ),
            },
          });
        case 'tanpa-efek':
          // Pukulan tanpa kerugian sepeser pun. Kalau suhu tetap naik di sini,
          // yang dipancing memang rasa, bukan saldo.
          return hitungSkor(ditutup);
      }
      break;
    }

    case 'SUHU_BATIN':
      // Suhu hanya mencatat. Yang menghitung skor adalah cabang keputusan.
      return {
        ...state,
        emosi:
          kejadian.isi.fase === 'sebelum'
            ? { ...state.emosi, suhuSebelum: kejadian.isi.nilai }
            : { ...state.emosi, suhuSesudah: kejadian.isi.nilai },
      };

    case 'JEDA_BATIN':
      return {
        ...state,
        emosi: { ...state.emosi, jedaDiambil: true, kebutuhan: kejadian.isi.kebutuhan },
      };

    case 'LEWATI_JEDA':
      // Tanpa penalti: tidak ada penghitung yang turun, tidak ada bendera yang
      // menyala. Lewati memang salah satu jawaban yang sah.
      return state;

    case 'TANAM': {
      const jarak = bilanganAcak(
        buatPrng(`${state.seed}#panen#${kejadian.t}`),
        PANEN_MIN,
        PANEN_MAKS,
      );
      return {
        ...state,
        tanamTertunda: [
          ...state.tanamTertunda,
          {
            t: kejadian.t,
            kalimat: kejadian.isi.kalimat,
            tindakan: kejadian.isi.tindakan,
            padaGiliran: state.giliran,
            panenPadaGiliran: state.giliran + jarak,
            objek: objekPemicu(state),
            kebutuhan: state.emosi.kebutuhan,
            hasilDalam: null,
          },
        ],
      };
    }

    case 'TUAI':
      return { ...state, panenTerbuka: null };

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
