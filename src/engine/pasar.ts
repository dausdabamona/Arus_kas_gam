import { prngUntuk } from './prng';
import { INSTRUMEN, cariInstrumen } from '../data/instrumen';

/** Empat ketukan selama 20 detik — satu tiap 5 detik (§8.1). */
export const KETUKAN_PER_GILIRAN = 4;

/** Harga tidak boleh jatuh di bawah sepersepuluh harga awalnya. */
const LANTAI_HARGA = 0.1;

export function hargaAwalSemua(): Record<string, number> {
  return Object.fromEntries(INSTRUMEN.map((i) => [i.id, i.hargaAwal]));
}

/** Harga penutup satu giliran. Dipanggil sekali per LEMPAR_DADU. */
export function gerakkanHarga(
  seed: string,
  t: number,
  harga: Record<string, number>,
): Record<string, number> {
  const hasil: Record<string, number> = {};

  for (const instrumen of INSTRUMEN) {
    const sekarang = harga[instrumen.id] ?? instrumen.hargaAwal;

    if (instrumen.volatilitasBulanan === 0 && instrumen.driftBulanan === 0) {
      hasil[instrumen.id] = sekarang;
      continue;
    }

    const prng = prngUntuk(seed, t * 1000 + instrumen.id.length);
    const guncang = instrumen.volatilitasBulanan * (2 * prng() - 1);
    const berikut = sekarang * (1 + instrumen.driftBulanan + guncang);

    hasil[instrumen.id] = Math.max(instrumen.hargaAwal * LANTAI_HARGA, Math.round(berikut));
  }

  return hasil;
}

/**
 * Harga di dalam satu giliran. Ketukan 0 adalah harga dasar; ketukan
 * berikutnya bergoyang secara acak-tapi-deterministik. Sengaja tidak
 * berarah — menunggu tidak boleh punya jawaban yang selalu benar, kalau
 * tidak, tekanan waktunya jadi teka-teki yang bisa dipecahkan.
 */
export function hargaPadaKetukan(
  seed: string,
  t: number,
  instrumenId: string,
  hargaDasar: number,
  ketukan: number,
): number {
  if (ketukan === 0) return hargaDasar;

  const instrumen = cariInstrumen(instrumenId);
  if (!instrumen || instrumen.volatilitasBulanan === 0) return hargaDasar;

  const prng = prngUntuk(seed, t * 1000 + ketukan * 7 + instrumenId.length);
  const goyang = instrumen.volatilitasBulanan * (2 * prng() - 1);

  return Math.max(1, Math.round(hargaDasar * (1 + goyang)));
}

/**
 * Satu langkah nilai untuk aset kartu (§8.3). Deterministik dari seed + id
 * aset + nomor kejadian, jadi pemutaran ulang menghasilkan nilai yang sama
 * persis tanpa menyimpan apa pun.
 *
 * Arus kas aset sengaja TIDAK ikut berubah: sewa kos tetap sewa kos meski
 * nilainya bergerak. Itulah yang membuat arus kas dan apresiasi jadi dua
 * sumbu yang benar-benar terpisah.
 */
export function nilaiKartuBerikutnya(
  seed: string,
  t: number,
  asetId: string,
  nilai: number,
  driftBulanan: number,
  volatilitasBulanan: number,
): number {
  const prng = prngUntuk(`${seed}#aset#${asetId}`, t);
  const guncang = volatilitasBulanan * (2 * prng() - 1);
  return Math.max(1, Math.round(nilai * (1 + driftBulanan + guncang)));
}
