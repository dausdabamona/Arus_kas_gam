import { reduce, stateAwal } from './reducer';
import {
  perluTindakanDarurat,
  hitungLaporan,
  lolosTahapSatu,
  tuasTersedia,
  arusKasBulanan,
} from './keuangan';
import { petakDi, hitungGajianDilewati } from './papan';
import {
  putuskanKartu,
  putuskanPasar,
  urutanTuas,
  type GayaKartu,
  type GayaPasar,
  type GayaDarurat,
} from './kebijakan';
import type { StatePermainan } from '../types/state';
import type { Kejadian } from '../types/kejadian';

export type Kebijakan =
  | 'hati-hati'
  | 'serakah'
  | 'seimbang'
  | 'pasar-indeks'
  | 'pasar-saham'
  | 'pasar-panik';

export interface HasilSimulasi {
  giliran: number;
  akhir: 'lolos' | 'bangkrut' | 'batas-giliran';
  puncakPengeluaran: number;
  puncakUtang: number;
  /** Rata-rata kas masuk dari petak GAJIAN per giliran, diukur dari jalannya simulasi. */
  pemasukanPerGiliran: number;
  /**
   * Rata-rata kas keluar ACAK per giliran: BIAYA_TAK_TERDUGA dan AMAL saja.
   * Biaya anak sengaja TIDAK dihitung di sini (§5.4): mendarat di TAMBAH_ANAK
   * tidak mengurangi kas sama sekali — yang naik adalah pengeluaran bulanan,
   * yang menurunkan arus kas bersih, yang menurunkan pembayaran Gajian.
   * Efeknya sudah terhitung penuh di sisi pemasukan; memasukkannya lagi di
   * sini berarti menghitungnya dua kali.
   */
  drainPerGiliran: number;
  /** Nilai akhir seluruh aset pasar yang dipegang — dipakai Invarian 5. */
  nilaiAkhirPasar: number;
  /** Berapa giliran kas sempat minus. Invarian 6. */
  jumlahKrisis: number;
  /** Berapa kali tuas darurat benar-benar dipakai dan mengubah keadaan. */
  jumlahTuasTerpakai: number;
  /** Giliran per krisis. Tak hingga bila krisis tidak pernah terjadi. */
  giliranPerKrisis: number;
  /**
   * Giliran saat kas pertama kali minus. Tak hingga bila tidak pernah.
   *
   * Ini ukuran Invarian 6 yang sebenarnya bisa dipakai: kas yang menumpuk
   * membuat guncangan berskala tetap mustahil menembusnya di akhir permainan,
   * jadi laju krisis seumur permainan selalu melandai. Yang bisa dijaga adalah
   * KAPAN tekanan pertama tiba — dan di situlah pemain masih telanjang.
   */
  giliranKrisisPertama: number;
  /** Giliran saat pemain masuk Lingkar Luas. Null bila tidak pernah sampai. */
  masukLuasPadaGiliran: number | null;
  /** Kartu kebiasaan yang terbawa ke tahap dua. */
  kebiasaanDibawa: string[];
  kartuKebiasaanDibawa: number;
  /**
   * Berapa kebiasaan yang berhasil dilepas. Pelari tidak pernah mengambil Jeda,
   * jadi angka ini SELALU nol — dan itu memang yang diukur: berat refleks yang
   * tidak pernah dilatih.
   */
  kebiasaanTerlepas: number;
  state: StatePermainan;
}

/**
 * Tiap kebijakan simulasi tersusun dari tiga gaya di `kebijakan.ts` — rumah
 * yang sama dengan yang dipakai bot. Peta ini satu-satunya tempat nama
 * kebijakan lama diterjemahkan.
 */
const GAYA: Record<Kebijakan, { kartu: GayaKartu; pasar: GayaPasar; darurat: GayaDarurat }> = {
  'hati-hati': { kartu: 'hati-hati', pasar: 'abaikan', darurat: 'sadar' },
  serakah: { kartu: 'serakah', pasar: 'kejar', darurat: 'panik' },
  seimbang: { kartu: 'seimbang', pasar: 'sisakan', darurat: 'sadar' },
  'pasar-indeks': { kartu: 'seimbang', pasar: 'indeks', darurat: 'sadar' },
  'pasar-saham': { kartu: 'seimbang', pasar: 'saham', darurat: 'sadar' },
  'pasar-panik': { kartu: 'seimbang', pasar: 'panik', darurat: 'sadar' },
};

export function jalankanSimulasi(opsi: {
  seed: string;
  profesiId: string;
  kebijakan: Kebijakan;
  maksGiliran: number;
  /**
   * Bila true, pelari tidak berhenti saat lolos: ia menulis niat, masuk
   * Lingkar Luas, lalu terus berjalan sampai batas giliran. Bawaan false,
   * sehingga seluruh pengukuran Invarian 1-6 tetap persis seperti sebelumnya.
   */
  lanjutKeLuas?: boolean;
  /**
   * Memaksa kartu kebiasaan tertentu saat masuk Lingkar Luas, menggantikan
   * kocokan. Ini ALAT UKUR, bukan aturan permainan: tanpa kendali, "pemain
   * tanpa refleks-panik" selalu berarti "pemain dengan refleks-banding DAN
   * refleks-kejar" — sebab pelari selalu berskor 0/0 dan karenanya selalu
   * membawa dua dari tiga kartu. Perbandingan yang terkonfound seperti itu
   * mengukur pasangan kartunya, bukan kartu yang ditanyakan.
   */
  paksaKebiasaan?: string[];
}): HasilSimulasi {
  // Bot dimatikan di jalur simulasi biasa: simulator mengukur ekonomi pemain,
  // dan menjalankan tiga dunia tambahan tiap giliran hanya memperlambat.
  // Invarian isolasi menjamin hasilnya sama.
  //
  // KECUALI saat mengukur Lingkar Luas. refleks-banding hanya terpicu oleh bot
  // yang melampaui pemain, jadi mengukurnya dengan bot mati membuat beban satu
  // dari tiga kartu sistematis lebih ringan dari kenyataan — dan Fase 8 akan
  // menyetel ambangnya dari data yang kehilangan sepertiga sumbernya.
  const awal = stateAwal(opsi.seed, opsi.profesiId);
  let state: StatePermainan = opsi.lanjutKeLuas ? awal : { ...awal, bot: [] };
  let t = 1;
  let puncakPengeluaran = 0;
  let puncakUtang = 0;
  let totalPemasukan = 0;
  let totalDrain = 0;
  let giliranDijalani = 0;
  let jumlahKrisis = 0;
  let jumlahTuasTerpakai = 0;
  let giliranKrisisPertama = Infinity;
  let masukLuasPadaGiliran: number | null = null;

  const catat = () => {
    puncakPengeluaran = Math.max(puncakPengeluaran, hitungLaporan(state.keuangan).totalPengeluaran);
    puncakUtang = Math.max(
      puncakUtang,
      state.keuangan.liabilitas
        .filter((l) => l.bungaBulanan !== undefined)
        .reduce((jml, l) => jml + l.sisaUtang, 0),
    );
  };

  const kirim = (kejadian: Omit<Kejadian, 't'>) => {
    state = reduce(state, { ...kejadian, t: t++ } as Kejadian);
    catat();
  };

  /** Diukur tepat di sekitar satu lemparan dadu, dari selisih kas yang nyata. */
  const ukur = (sebelum: StatePermainan, sesudah: StatePermainan) => {
    giliranDijalani++;
    const mata = sesudah.riwayatDadu[sesudah.riwayatDadu.length - 1];
    const gajian = hitungGajianDilewati(sebelum.posisi, mata);

    const arus = arusKasBulanan(sebelum.keuangan);
    const kasDariGajian = arus * gajian;

    totalPemasukan += kasDariGajian;

    const petak = petakDi(sesudah.posisi);
    if (petak === 'BIAYA_TAK_TERDUGA' || petak === 'AMAL') {
      totalDrain += sebelum.keuangan.saldoKas + kasDariGajian - sesudah.keuangan.saldoKas;
    }
  };

  const rerata = () => ({
    pemasukanPerGiliran: giliranDijalani === 0 ? 0 : totalPemasukan / giliranDijalani,
    drainPerGiliran: giliranDijalani === 0 ? 0 : totalDrain / giliranDijalani,
    nilaiAkhirPasar: state.keuangan.aset
      .filter((a) => a.instrumenId !== undefined)
      .reduce((jml, a) => jml + a.nilai, 0),
    jumlahKrisis,
    jumlahTuasTerpakai,
    // Tak hingga, bukan nol: permainan tanpa krisis adalah yang PALING jauh
    // dari Invarian 6, dan nol akan membuatnya lulus dengan angka terbaik.
    giliranPerKrisis: jumlahKrisis === 0 ? Infinity : giliranDijalani / jumlahKrisis,
    giliranKrisisPertama,
    masukLuasPadaGiliran,
    kebiasaanDibawa: state.kebiasaan.map((k) => k.id),
    kartuKebiasaanDibawa: state.kebiasaan.length,
    kebiasaanTerlepas: state.kebiasaan.filter((k) => k.lepas).length,
  });

  let hargaGiliranLalu: Record<string, number> = { ...state.hargaPasar };

  for (let giliran = 0; giliran < opsi.maksGiliran; giliran++) {
    const sebelumDadu = state;
    hargaGiliranLalu = { ...sebelumDadu.hargaPasar };
    kirim({ tipe: 'LEMPAR_DADU', isi: { pemainId: 'p1' } });
    ukur(sebelumDadu, state);

    // Guncang ditutup, tidak dilewati. Pelari yang melempar dadu menembus
    // kartu guncang mengukur dunia yang berbeda dari yang dimainkan orang,
    // dan angkanya bohong. Suhu dan jeda sengaja tidak disentuh: yang diukur
    // di sini keuangan, bukan batin.
    if (state.guncangTerbuka) {
      kirim({ tipe: 'TUTUP_GUNCANG', isi: { kartuId: state.guncangTerbuka.kartuId } });
    }

    if (state.kartuTerbuka) {
      kirim({
        tipe: 'PUTUSKAN',
        isi: {
          kartuId: state.kartuTerbuka.id,
          pilihan: putuskanKartu(state, GAYA[opsi.kebijakan].kartu),
        },
      });
    }

    if (state.pasarTerbuka) {
      const { aksi, unit, ketukan } = putuskanPasar(
        state,
        hargaGiliranLalu,
        GAYA[opsi.kebijakan].pasar,
      );
      kirim({
        tipe: 'TRANSAKSI_PASAR',
        isi: { instrumenId: state.pasarTerbuka, aksi, unit, ketukan },
      });
    }

    // Satu giliran dihitung satu krisis, sebanyak apa pun tuas yang dipakai
    // untuk keluar darinya — kalau tidak, satu lubang dalam terbaca seperti
    // tiga lubang dangkal.
    if (perluTindakanDarurat(state.keuangan)) {
      jumlahKrisis++;
      if (giliranKrisisPertama === Infinity) giliranKrisisPertama = giliran + 1;
    }

    // Tuas darurat, berulang sampai kas tidak minus lagi atau kehabisan pilihan.
    let putaran = 0;
    while (perluTindakanDarurat(state.keuangan) && putaran++ < 10) {
      const sebelum = state;
      const tersedia = tuasTersedia(state.keuangan);
      kirim({
        tipe: 'TINDAKAN_DARURAT',
        isi:
          tersedia.length === 0
            ? {}
            : {
                tuas:
                  urutanTuas(GAYA[opsi.kebijakan].darurat).find((x) => tersedia.includes(x)) ??
                  tersedia[0],
              },
      });
      if (state !== sebelum) jumlahTuasTerpakai++;
      if (state === sebelum || state.status === 'selesai') break;
    }

    if (state.status === 'selesai') {
      return { giliran, akhir: 'bangkrut', ...rerata(), puncakPengeluaran, puncakUtang, state };
    }
    if (lolosTahapSatu(hitungLaporan(state.keuangan))) {
      if (!opsi.lanjutKeLuas) {
        return { giliran, akhir: 'lolos', ...rerata(), puncakPengeluaran, puncakUtang, state };
      }
      if (state.tahap === 'harian') {
        // Niat diisi teks tetap: pelari mengukur keuangan, bukan kalimat.
        kirim({ tipe: 'GERBANG_NIAT', isi: { niat: 'Berhenti mengejar.' } });
        kirim({ tipe: 'MASUK_LINGKAR_LUAS', isi: {} });
        if (opsi.paksaKebiasaan) {
          state = {
            ...state,
            kebiasaan: opsi.paksaKebiasaan.map((id) => ({
              id,
              kemajuan: 0,
              lepas: false,
              lawanUnggul: false,
            })),
          };
        }
        masukLuasPadaGiliran = giliran + 1;
      }
    }
  }

  return {
    giliran: opsi.maksGiliran,
    akhir: masukLuasPadaGiliran === null ? 'batas-giliran' : 'lolos',
    ...rerata(),
    puncakPengeluaran,
    puncakUtang,
    state,
  };
}
