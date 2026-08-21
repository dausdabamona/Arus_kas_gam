import { reduce, stateAwal } from './reducer';
import {
  perluTindakanDarurat,
  hitungLaporan,
  lolosTahapSatu,
  tuasTersedia,
  arusKasBulanan,
} from './keuangan';
import { petakDi, hitungGajianDilewati } from './papan';
import { KETUKAN_PER_GILIRAN } from './pasar';
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

/** Instrumen yang dikejar tiap kebijakan pasar. */
const INSTRUMEN_KEBIJAKAN: Partial<Record<Kebijakan, string>> = {
  'pasar-indeks': 'reksa-indeks',
  'pasar-saham': 'saham-individu',
  'pasar-panik': 'saham-individu',
};

/**
 * Keputusan pemain tiruan terhadap tawaran pasar, sekaligus ketukan ke berapa
 * dia menekan. Kebijakan serakah sengaja menimbang sampai ketukan terakhir —
 * itulah bentuk FOMO §8.1 dalam kode: makin lama menimbang, makin lain
 * harga yang harus diterima.
 */
function putuskanPasar(
  state: StatePermainan,
  kebijakan: Kebijakan,
  hargaGiliranLalu: Record<string, number>,
): { aksi: 'beli' | 'jual' | 'lewat'; unit: number; ketukan: number } {
  const instrumenId = state.pasarTerbuka;
  if (!instrumenId) return { aksi: 'lewat', unit: 0, ketukan: 0 };

  const harga = state.hargaPasar[instrumenId];
  const dipegang = state.keuangan.aset.find((a) => a.instrumenId === instrumenId);
  const unitDipegang = dipegang?.unit ?? 0;

  const diburu = INSTRUMEN_KEBIJAKAN[kebijakan];
  if (diburu) {
    if (instrumenId !== diburu) return { aksi: 'lewat', unit: 0, ketukan: 0 };

    // Panik: lepas seluruhnya begitu harganya turun lebih dari 15% DARI
    // GILIRAN SEBELUMNYA. Membandingkannya dengan nilai aset tidak pernah
    // menyala — aset dinilai ulang tiap giliran, jadi nilai/unit selalu
    // sama dengan harga sekarang.
    if (kebijakan === 'pasar-panik' && unitDipegang > 0) {
      const lalu = hargaGiliranLalu[instrumenId];
      if (lalu !== undefined && harga < lalu * 0.85) {
        return { aksi: 'jual', unit: unitDipegang, ketukan: 0 };
      }
    }

    return state.keuangan.saldoKas > harga * 2
      ? { aksi: 'beli', unit: 1, ketukan: 0 }
      : { aksi: 'lewat', unit: 0, ketukan: 0 };
  }

  if (kebijakan === 'hati-hati') return { aksi: 'lewat', unit: 0, ketukan: 0 };
  if (kebijakan === 'serakah') {
    return state.keuangan.saldoKas > harga
      ? { aksi: 'beli', unit: 1, ketukan: KETUKAN_PER_GILIRAN }
      : { aksi: 'lewat', unit: 0, ketukan: KETUKAN_PER_GILIRAN };
  }

  // Seimbang memutuskan cepat dan hanya bila kas tetap bersisa.
  return state.keuangan.saldoKas - harga > 1_000_000
    ? { aksi: 'beli', unit: 1, ketukan: 0 }
    : { aksi: 'lewat', unit: 0, ketukan: 0 };
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
        isi: { kartuId: state.kartuTerbuka.id, pilihan: putuskan(state, opsi.kebijakan) },
      });
    }

    if (state.pasarTerbuka) {
      const { aksi, unit, ketukan } = putuskanPasar(state, opsi.kebijakan, hargaGiliranLalu);
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
