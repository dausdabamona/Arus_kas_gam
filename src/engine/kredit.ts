import type { KartuPeluang } from '../types/kartu';

export interface RingkasKredit {
  cicilan: number;
  /** Arus kas dikurangi cicilan: yang benar-benar tersisa tiap bulan. */
  selisih: number;
  /** Tahun sampai uang muka kembali. Null bila memang tidak pernah kembali. */
  balikModal: number | null;
}

/**
 * Tiga angka yang menentukan apakah sebuah kredit masuk akal, dihitung dari
 * kartunya sendiri.
 *
 * Tanpa ini pemain membandingkan "arus kas Rp 1 juta" dengan "harga Rp 100
 * juta" dan menyimpulkan dari besar angkanya — padahal yang menentukan adalah
 * SELISIH terhadap cicilan, dan itu tidak tertulis di mana pun.
 *
 * Selisih nol atau minus berarti kredit ini menguras kas tiap bulan; tidak ada
 * yang "balik", dan angka balik modal di situ akan tak hingga atau negatif —
 * dua-duanya omong kosong yang terlihat seperti data. Yang tumbuh di kasus itu
 * ekuitasnya, bukan kasnya, dan itu memang pertukaran yang sah (§8.3) —
 * bukan kekeliruan yang perlu ditandai.
 */
export function ringkasKredit(kartu: KartuPeluang): RingkasKredit | null {
  if (kartu.sisaUtang <= 0) return null;

  const cicilan = kartu.cicilanBulanan;
  const selisih = kartu.arusKasBulanan - cicilan;

  return {
    cicilan,
    selisih,
    balikModal: selisih > 0 ? Math.round((kartu.uangMuka / selisih / 12) * 10) / 10 : null,
  };
}
