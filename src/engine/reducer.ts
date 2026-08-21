import { prngUntuk } from './prng';
import { lemparDadu } from './acak';
import type { Kejadian } from '../types/kejadian';
import { JUMLAH_PETAK, type StatePermainan } from '../types/state';

/** State kosong sebelum kejadian apa pun dijalankan. */
export function stateAwal(seed: string, profesiId: string): StatePermainan {
  return {
    seed,
    profesiId,
    giliran: 0,
    posisi: 0,
    riwayatDadu: [],
    status: 'berjalan',
  };
}

/**
 * Fungsi murni: satu kejadian menghasilkan state baru.
 * Keacakan diturunkan dari seed + kejadian.t sehingga tidak ada keadaan
 * PRNG yang perlu disimpan atau dipulihkan.
 */
export function reduce(state: StatePermainan, kejadian: Kejadian): StatePermainan {
  switch (kejadian.tipe) {
    case 'MULAI':
      return stateAwal(kejadian.isi.seed, kejadian.isi.profesiId);

    case 'LEMPAR_DADU': {
      const mata = lemparDadu(prngUntuk(state.seed, kejadian.t));
      return {
        ...state,
        giliran: state.giliran + 1,
        posisi: (state.posisi + mata) % JUMLAH_PETAK,
        riwayatDadu: [...state.riwayatDadu, mata],
      };
    }

    case 'AKHIR':
      return { ...state, status: 'selesai' };

    default:
      // Kejadian Fase 2+ belum mengubah state; sengaja dibiarkan lewat.
      return state;
  }
}

/** Menghitung ulang state dari nol dengan memutar seluruh event log. */
export function putarUlang(kejadian: readonly Kejadian[]): StatePermainan {
  if (kejadian.length === 0 || kejadian[0].tipe !== 'MULAI') {
    throw new Error('Kejadian pertama harus MULAI');
  }
  return kejadian.reduce(reduce, stateAwal('', ''));
}
