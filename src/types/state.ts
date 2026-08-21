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
  /**
   * Takaran guncangan acak, DIKUNCI sekali di awal permainan dari arus kas
   * bersih awal profesi (§5.4 Invarian 3). Bukan gaji — itu menghukum profesi
   * bermargin tipis dua kali. Bukan pemasukan berjalan — guncangan yang ikut
   * tumbuh membuat pemain tak pernah bisa melampaui gejolak, dan satu-satunya
   * hadiah membangun aset lenyap.
   */
  skalaGuncangan: number;
  /** Kartu yang sedang menunggu keputusan. Null bila tidak ada. */
  kartuTerbuka: KartuPeluang | null;
  /** Harga penutup tiap instrumen pada giliran berjalan. */
  hargaPasar: Record<string, number>;
  /** Instrumen yang sedang ditawarkan, menunggu keputusan. Null bila tidak ada. */
  pasarTerbuka: string | null;
}

export const JUMLAH_PETAK = 24;
