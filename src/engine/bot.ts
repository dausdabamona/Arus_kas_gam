import { putuskanKartu, putuskanPasar, urutanTuas } from './kebijakan';
import { perluTindakanDarurat, tuasTersedia } from './keuangan';
import { KETUKAN_PER_GILIRAN } from './pasar';
import { PROFIL_BOT, type ProfilBot } from '../data/bot';
import type { BotBerjalan, StatePermainan } from '../types/state';
import type { Kejadian } from '../types/kejadian';

/**
 * Ruang nomor kejadian bot: jauh dari nomor kejadian pemain mana pun.
 * Ini hanya menjaga jarak DI DALAM deret bot itu sendiri — pemisahan
 * sesungguhnya dari pemain datang dari seed yang berbeda.
 */
const PANGKAL_T_BOT = 1_000_000_000;

/** Berapa banyak nomor kejadian yang boleh dipakai satu bot per giliran. */
const RUANG_T_PER_GILIRAN = 100;

/**
 * Membuat tiga bot, masing-masing dengan dunia sendiri. Seed turunan
 * `${seed}#bot#${id}` memastikan deret acaknya tidak pernah bersinggungan
 * dengan deret pemain — itulah invarian isolasi fase ini.
 */
export function botAwal(
  seed: string,
  buatState: (seed: string, profesiId: string) => StatePermainan,
): BotBerjalan[] {
  return PROFIL_BOT.map((profil) => {
    const state = buatState(`${seed}#bot#${profil.id}`, profil.profesiId);
    return {
      id: profil.id,
      state: { ...state, bot: [] },
      hargaLalu: state.hargaPasar,
      lolosPadaGiliran: null,
      bangkrutPadaGiliran: null,
      komentar: null,
    };
  });
}

/**
 * Satu giliran penuh untuk satu bot: lempar dadu, selesaikan kartu dan
 * tawaran pasar lewat kebijakannya, tangani darurat sampai tuntas.
 * Murni — dipanggil dari dalam reduce pemain.
 */
export function majukanBot(
  bot: BotBerjalan,
  tGiliran: number,
  reduceFn: (state: StatePermainan, kejadian: Kejadian) => StatePermainan,
): BotBerjalan {
  if (bot.state.status === 'selesai') return bot;

  const profil = PROFIL_BOT.find((p) => p.id === bot.id) as ProfilBot;
  const hargaLalu = bot.state.hargaPasar;
  let t = PANGKAL_T_BOT + tGiliran * RUANG_T_PER_GILIRAN;

  let state = reduceFn(bot.state, { t: t++, tipe: 'LEMPAR_DADU', isi: { pemainId: bot.id } });

  if (state.kartuTerbuka) {
    state = reduceFn(state, {
      t: t++,
      tipe: 'PUTUSKAN',
      isi: { kartuId: state.kartuTerbuka.id, pilihan: putuskanKartu(state, profil.gayaKartu) },
    });
  }

  if (state.pasarTerbuka) {
    const { aksi, unit } = putuskanPasar(state, bot.hargaLalu, profil.gayaPasar);
    state = reduceFn(state, {
      t: t++,
      tipe: 'TRANSAKSI_PASAR',
      isi: { instrumenId: state.pasarTerbuka, aksi, unit, ketukan: KETUKAN_PER_GILIRAN },
    });
  }

  let putaran = 0;
  while (perluTindakanDarurat(state.keuangan) && state.status === 'berjalan' && putaran++ < 10) {
    const sebelum = state;
    const tersedia = tuasTersedia(state.keuangan);
    const tuas = urutanTuas(profil.gayaDarurat).find((nama) => tersedia.includes(nama));
    state = reduceFn(state, {
      t: t++,
      tipe: 'TINDAKAN_DARURAT',
      isi: tuas === undefined ? {} : { tuas },
    });
    if (state === sebelum) break;
  }

  return { ...bot, state: { ...state, bot: [] }, hargaLalu };
}
