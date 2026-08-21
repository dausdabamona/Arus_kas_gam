import { KETUKAN_PER_GILIRAN } from './pasar';
import type { StatePermainan } from '../types/state';

/**
 * Satu rumah untuk seluruh keputusan tiruan — dipakai pelari simulasi
 * maupun bot. Tidak boleh ada logika kembar: bot yang perilakunya berbeda
 * dari yang sudah dibuktikan simulasi bukan lagi bot yang terbukti.
 *
 * Murni: tidak menyentuh waktu, keacakan baru, atau apa pun di luar
 * argumennya.
 */

export type GayaKartu = 'hati-hati' | 'serakah' | 'seimbang';

/**
 * Gaya pasar. Tiga yang pertama memburu satu instrumen tertentu; `kejar`
 * dan `sisakan` mengambil instrumen apa pun yang lewat, bedanya pada kapan
 * mereka menekan dan berapa kas yang mereka sisakan.
 */
export type GayaPasar = 'indeks' | 'saham' | 'panik' | 'abaikan' | 'kejar' | 'sisakan';

export type GayaDarurat = 'sadar' | 'panik';

export interface AksiPasar {
  aksi: 'beli' | 'jual' | 'lewat';
  unit: number;
  ketukan: number;
}

const LEWAT: AksiPasar = { aksi: 'lewat', unit: 0, ketukan: 0 };

/** Instrumen yang diburu tiap gaya yang memang memburu satu jenis saja. */
const INSTRUMEN_GAYA: Partial<Record<GayaPasar, string>> = {
  indeks: 'reksa-indeks',
  saham: 'saham-individu',
  panik: 'saham-individu',
};

/** Keputusan terhadap kartu peluang yang terbuka. */
export function putuskanKartu(state: StatePermainan, gaya: GayaKartu): 'ambil' | 'tolak' {
  const kartu = state.kartuTerbuka;
  if (!kartu) return 'tolak';
  if (gaya === 'hati-hati') return 'tolak';
  if (gaya === 'serakah') return 'ambil';
  // seimbang: ambil hanya bila arus kasnya positif dan kas tetap bersisa
  return kartu.arusKasBulanan > 0 && state.keuangan.saldoKas - kartu.uangMuka > 1_000_000
    ? 'ambil'
    : 'tolak';
}

/**
 * Keputusan terhadap tawaran pasar, sekaligus ketukan ke berapa ia menekan.
 * Gaya `kejar` sengaja menimbang sampai ketukan terakhir — itulah bentuk
 * FOMO §8.1 dalam kode: makin lama menimbang, makin lain harga yang harus
 * diterima.
 */
export function putuskanPasar(
  state: StatePermainan,
  hargaLalu: Record<string, number>,
  gaya: GayaPasar,
): AksiPasar {
  const instrumenId = state.pasarTerbuka;
  if (!instrumenId || gaya === 'abaikan') return LEWAT;

  const harga = state.hargaPasar[instrumenId];
  const diburu = INSTRUMEN_GAYA[gaya];

  if (diburu) {
    if (instrumenId !== diburu) return LEWAT;

    // Panik: lepas seluruhnya begitu harganya turun lebih dari 15% DARI
    // GILIRAN SEBELUMNYA. Membandingkannya dengan nilai aset tidak pernah
    // menyala — aset dinilai ulang tiap giliran, jadi nilai/unit selalu
    // sama dengan harga sekarang.
    if (gaya === 'panik') {
      const unitDipegang = state.keuangan.aset.find((a) => a.instrumenId === instrumenId)?.unit ?? 0;
      const lalu = hargaLalu[instrumenId];
      if (unitDipegang > 0 && lalu !== undefined && harga < lalu * 0.85) {
        return { aksi: 'jual', unit: unitDipegang, ketukan: 0 };
      }
    }

    return state.keuangan.saldoKas > harga * 2 ? { aksi: 'beli', unit: 1, ketukan: 0 } : LEWAT;
  }

  if (gaya === 'kejar') {
    return state.keuangan.saldoKas > harga
      ? { aksi: 'beli', unit: 1, ketukan: KETUKAN_PER_GILIRAN }
      : { aksi: 'lewat', unit: 0, ketukan: KETUKAN_PER_GILIRAN };
  }

  // sisakan: memutuskan cepat dan hanya bila kas tetap bersisa.
  return state.keuangan.saldoKas - harga > 1_000_000
    ? { aksi: 'beli', unit: 1, ketukan: 0 }
    : LEWAT;
}

/**
 * Urutan tuas darurat menurut gaya. Yang sadar menekan pengeluaran dulu dan
 * menjual paling akhir; yang panik melepas asetnya lebih dulu — persis
 * refleks yang game ini ingin ditunjukkan dari luar.
 */
export function urutanTuas(gaya: GayaDarurat): Array<'jual' | 'pinjam' | 'hemat'> {
  return gaya === 'panik' ? ['jual', 'pinjam', 'hemat'] : ['hemat', 'pinjam', 'jual'];
}
