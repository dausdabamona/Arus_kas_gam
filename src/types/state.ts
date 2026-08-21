export type StatusPermainan = 'berjalan' | 'selesai';

export interface StatePermainan {
  seed: string;
  profesiId: string;
  giliran: number;
  posisi: number;
  riwayatDadu: number[];
  status: StatusPermainan;
}

export const JUMLAH_PETAK = 24;
