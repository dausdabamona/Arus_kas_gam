import type { KondisiKeuangan } from '../engine/keuangan';
import type { KartuPeluang } from './kartu';

export type StatusPermainan = 'berjalan' | 'selesai';

export interface StatePermainan {
  seed: string;
  profesiId: string;
  giliran: number;
  posisi: number;
  riwayatDadu: number[];
  status: StatusPermainan;
  keuangan: KondisiKeuangan;
  /** Kartu yang sedang menunggu keputusan. Null bila tidak ada. */
  kartuTerbuka: KartuPeluang | null;
}

export const JUMLAH_PETAK = 24;
