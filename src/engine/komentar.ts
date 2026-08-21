import { buatPrng } from './prng';
import { ambilSatu } from './acak';
import { KOMENTAR_BOT } from '../data/komentar-bot';
import type { BotBerjalan } from '../types/state';

export type JenisMomen =
  | 'beli-saham'
  | 'jual-panik'
  | 'ambil-kartu'
  | 'tolak-kartu'
  | 'pinjam'
  | 'berhemat'
  | 'lolos'
  | 'bangkrut'
  | 'diam';

const unitPasar = (bot: BotBerjalan): number =>
  bot.state.keuangan.aset
    .filter((a) => a.instrumenId !== undefined)
    .reduce((jml, a) => jml + (a.unit ?? 0), 0);

const jumlahUtangDarurat = (bot: BotBerjalan): number =>
  bot.state.keuangan.liabilitas.filter((l) => l.bungaBulanan !== undefined).length;

/**
 * Momen paling menonjol dari satu giliran bot. Urutannya menentukan apa yang
 * terucap saat beberapa hal terjadi sekaligus: akhir permainan mengalahkan
 * segalanya, lalu yang paling emosional.
 */
export function momenDari(sebelum: BotBerjalan, sesudah: BotBerjalan): JenisMomen {
  if (sebelum.bangkrutPadaGiliran === null && sesudah.bangkrutPadaGiliran !== null) {
    return 'bangkrut';
  }
  if (sebelum.lolosPadaGiliran === null && sesudah.lolosPadaGiliran !== null) return 'lolos';

  const unitSebelum = unitPasar(sebelum);
  const unitSesudah = unitPasar(sesudah);
  if (unitSesudah < unitSebelum) return 'jual-panik';
  if (unitSesudah > unitSebelum) return 'beli-saham';

  if (sesudah.state.keuangan.kaliBerhemat > sebelum.state.keuangan.kaliBerhemat) return 'berhemat';
  if (jumlahUtangDarurat(sesudah) > jumlahUtangDarurat(sebelum)) return 'pinjam';

  const asetSebelum = sebelum.state.keuangan.aset.length;
  const asetSesudah = sesudah.state.keuangan.aset.length;
  if (asetSesudah > asetSebelum) return 'ambil-kartu';
  if (sebelum.state.kartuTerbuka !== null && sesudah.state.kartuTerbuka === null) {
    return 'tolak-kartu';
  }

  return 'diam';
}

/**
 * Kalimat untuk satu momen. Deterministik: seed dan t yang sama selalu
 * menghasilkan kalimat yang sama, sehingga pemutaran ulang event log
 * mereproduksi suara bot persis seperti saat dimainkan.
 */
export function komentarUntuk(
  seed: string,
  t: number,
  botId: string,
  momen: JenisMomen,
): string | null {
  if (momen === 'diam') return null;
  const varian = KOMENTAR_BOT[botId]?.[momen];
  if (!varian || varian.length === 0) return null;
  return ambilSatu(buatPrng(`${seed}#komentar#${t}#${botId}`), varian);
}
