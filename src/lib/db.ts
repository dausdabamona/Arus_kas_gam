import Dexie, { type EntityTable } from 'dexie';
import type { Kejadian, KebutuhanId } from '../types/kejadian';

export interface BarisPermainan {
  id: string;
  seed: string;
  profesiId: string;
  dibuatPada: number;
  status: 'berjalan' | 'selesai';
}

export interface BarisKejadian {
  id?: number;
  permainanId: string;
  t: number;
  data: Kejadian;
}

export interface EntriJurnal {
  id?: number;
  permainanId: string;
  dibuatPada: number;
  kebutuhan: KebutuhanId;
  kalimat: string;
  tindakan: string;
  hasilLuar: number;
  hasilDalam: 'tenang' | 'tersulut';
}

export interface BarisPengaturan {
  kunci: string;
  nilai: unknown;
}

export const db = new Dexie('arus') as Dexie & {
  permainan: EntityTable<BarisPermainan, 'id'>;
  kejadian: EntityTable<BarisKejadian, 'id'>;
  jurnal: EntityTable<EntriJurnal, 'id'>;
  pengaturan: EntityTable<BarisPengaturan, 'kunci'>;
};

db.version(1).stores({
  permainan: 'id, dibuatPada, status',
  kejadian: '++id, permainanId, [permainanId+t]',
  jurnal: '++id, permainanId, dibuatPada, kebutuhan',
  pengaturan: 'kunci',
});

export async function simpanKejadian(permainanId: string, kejadian: Kejadian): Promise<void> {
  await db.kejadian.add({ permainanId, t: kejadian.t, data: kejadian });
}

export async function muatKejadian(permainanId: string): Promise<Kejadian[]> {
  const baris = await db.kejadian.where('permainanId').equals(permainanId).toArray();
  return baris.sort((a, b) => a.t - b.t).map((b) => b.data);
}

/** Menghapus permainan dan kejadiannya. Jurnal sengaja TIDAK disentuh. */
export async function hapusPermainan(permainanId: string): Promise<void> {
  await db.transaction('rw', db.permainan, db.kejadian, async () => {
    await db.kejadian.where('permainanId').equals(permainanId).delete();
    await db.permainan.delete(permainanId);
  });
}

export async function tambahJurnal(entri: EntriJurnal): Promise<void> {
  await db.jurnal.add(entri);
}

export async function semuaJurnal(): Promise<EntriJurnal[]> {
  return db.jurnal.orderBy('dibuatPada').reverse().toArray();
}
