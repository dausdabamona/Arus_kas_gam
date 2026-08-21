import { reduce, stateAwal } from './reducer';
import {
  perluTindakanDarurat,
  hitungLaporan,
  lolosTahapSatu,
  tuasTersedia,
  arusKasBulanan,
} from './keuangan';
import { petakDi, hitungGajianDilewati } from './papan';
import type { StatePermainan } from '../types/state';
import type { Kejadian } from '../types/kejadian';

export type Kebijakan = 'hati-hati' | 'serakah' | 'seimbang';

export interface HasilSimulasi {
  giliran: number;
  akhir: 'lolos' | 'bangkrut' | 'batas-giliran';
  puncakPengeluaran: number;
  puncakUtang: number;
  /**
   * Rata-rata kas masuk dari petak GAJIAN per giliran, diukur dari jalannya
   * simulasi. Dihitung kotor terhadap biaya anak: biaya anak sudah dipotong
   * di dalam arus kas bulanan, jadi kalau tidak ditambahkan kembali di sini
   * ia akan terhitung dua kali saat masuk ke `drainPerGiliran`.
   */
  pemasukanPerGiliran: number;
  /**
   * Rata-rata kas keluar acak per giliran: BIAYA_TAK_TERDUGA, AMAL, dan
   * biaya anak yang benar-benar terbayar saat gajian. Diukur dari selisih
   * saldo kas yang sungguh terjadi, bukan dari rumus peluang.
   */
  drainPerGiliran: number;
  state: StatePermainan;
}

/**
 * Tuas darurat yang dipilih pemain tiruan. Reducer memang punya tuas bawaan
 * (yang pertama tersedia), tapi memakainya di sini berarti pemain tiruan
 * selalu menjual aset produktifnya lebih dulu — persis refleks panik yang
 * game ini justru ingin ditunjukkan, dan mustahil konvergen. Pemain tiruan
 * memilih sadar: tekan pengeluaran dulu, pinjam kalau perlu, jual paling
 * akhir. Pemain sungguhan tetap memilih sendiri di layar.
 */
function pilihTuas(
  tersedia: ReadonlyArray<'jual' | 'pinjam' | 'hemat'>,
  kebijakan: Kebijakan,
): 'jual' | 'pinjam' | 'hemat' {
  // Serakah membiarkan refleks panik bekerja: jual dulu, pikir belakangan.
  const urutan =
    kebijakan === 'serakah'
      ? (['jual', 'pinjam', 'hemat'] as const)
      : (['hemat', 'pinjam', 'jual'] as const);
  return urutan.find((t) => tersedia.includes(t)) ?? tersedia[0];
}

/** Keputusan pemain tiruan terhadap kartu yang terbuka. */
function putuskan(state: StatePermainan, kebijakan: Kebijakan): 'ambil' | 'tolak' {
  const kartu = state.kartuTerbuka;
  if (!kartu) return 'tolak';
  if (kebijakan === 'hati-hati') return 'tolak';
  if (kebijakan === 'serakah') return 'ambil';
  // seimbang: ambil hanya bila arus kasnya positif dan kas tetap bersisa
  return kartu.arusKasBulanan > 0 && state.keuangan.saldoKas - kartu.uangMuka > 1_000_000
    ? 'ambil'
    : 'tolak';
}

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
    const biayaAnak = sebelum.keuangan.biayaPerAnak * sebelum.keuangan.jumlahAnak;
    const kasDariGajian = arus * gajian;

    totalPemasukan += (arus + biayaAnak) * gajian;
    totalDrain += biayaAnak * gajian;

    const petak = petakDi(sesudah.posisi);
    if (petak === 'BIAYA_TAK_TERDUGA' || petak === 'AMAL') {
      totalDrain += sebelum.keuangan.saldoKas + kasDariGajian - sesudah.keuangan.saldoKas;
    }
  };

  const rerata = () => ({
    pemasukanPerGiliran: giliranDijalani === 0 ? 0 : totalPemasukan / giliranDijalani,
    drainPerGiliran: giliranDijalani === 0 ? 0 : totalDrain / giliranDijalani,
  });

  for (let giliran = 0; giliran < opsi.maksGiliran; giliran++) {
    const sebelumDadu = state;
    kirim({ tipe: 'LEMPAR_DADU', isi: { pemainId: 'p1' } });
    ukur(sebelumDadu, state);

    if (state.kartuTerbuka) {
      kirim({
        tipe: 'PUTUSKAN',
        isi: { kartuId: state.kartuTerbuka.id, pilihan: putuskan(state, opsi.kebijakan) },
      });
    }

    // Tuas darurat, berulang sampai kas tidak minus lagi atau kehabisan pilihan.
    let putaran = 0;
    while (perluTindakanDarurat(state.keuangan) && putaran++ < 10) {
      const sebelum = state;
      const tersedia = tuasTersedia(state.keuangan);
      kirim({
        tipe: 'TINDAKAN_DARURAT',
        isi: tersedia.length === 0 ? {} : { tuas: pilihTuas(tersedia, opsi.kebijakan) },
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
