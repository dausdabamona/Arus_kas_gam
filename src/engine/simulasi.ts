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
}): HasilSimulasi {
  let state = stateAwal(opsi.seed, opsi.profesiId);
  let t = 1;
  let puncakPengeluaran = 0;
  let puncakUtang = 0;
  let totalPemasukan = 0;
  let totalDrain = 0;
  let giliranDijalani = 0;

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
  });

  let hargaGiliranLalu: Record<string, number> = { ...state.hargaPasar };

  for (let giliran = 0; giliran < opsi.maksGiliran; giliran++) {
    const sebelumDadu = state;
    hargaGiliranLalu = { ...sebelumDadu.hargaPasar };
    kirim({ tipe: 'LEMPAR_DADU', isi: { pemainId: 'p1' } });
    ukur(sebelumDadu, state);

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
      if (state === sebelum || state.status === 'selesai') break;
    }

    if (state.status === 'selesai') {
      return { giliran, akhir: 'bangkrut', ...rerata(), puncakPengeluaran, puncakUtang, state };
    }
    if (lolosTahapSatu(hitungLaporan(state.keuangan))) {
      return { giliran, akhir: 'lolos', ...rerata(), puncakPengeluaran, puncakUtang, state };
    }
  }

  return {
    giliran: opsi.maksGiliran,
    akhir: 'batas-giliran',
    ...rerata(),
    puncakPengeluaran,
    puncakUtang,
    state,
  };
}
