import type { KebutuhanId } from './kejadian';

export type EfekGuncang =
  /** × skalaGuncangan, acak di rentang. Angkanya diikat Invarian 6, bukan selera. */
  | { jenis: 'kas'; pengali: [number, number] }
  /** pengeluaranTetap × (1 + kenaikan), permanen. Satu-satunya inflasi di game (§8.3). */
  | { jenis: 'inflasi'; kenaikan: number }
  /** Pukulan murni emosional: saldo tidak bergerak sepeser pun. */
  | { jenis: 'tanpa-efek' };

export interface KartuGuncang {
  id: string;
  judul: string;
  /** Teks bisa memuat {nama} (bot) atau {barang} (yang pernah ditolak). */
  teks: string;
  pemicu: KebutuhanId;
  efek: EfekGuncang;
  /** Syarat konteks; kartu dilewati bila tak terpenuhi. */
  syarat?: 'ada-bot-lolos' | 'ada-riwayat-ditolak';
}
