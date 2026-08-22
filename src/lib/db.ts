import Dexie, { type EntityTable } from 'dexie';
import type { Kejadian, KebutuhanId } from '../types/kejadian';

/**
 * Versi skema event log. Dinaikkan setiap kali aturan mesin berubah sedemikian
 * rupa sehingga log yang sama menghasilkan state yang berbeda — bukan setiap
 * kali ada bidang baru.
 *
 * 1 -> 2: penjualan aset diselesaikan neto (utang melekat lunas lebih dulu,
 * ekuitas <= 0 ditolak). Log lama yang diputar ulang di mesin baru memberi kas
 * lebih kecil, cicilan yang lenyap, dan aset terbenam yang tak lagi terjual.
 *
 * Potong bersih dilakukan sekarang justru karena belum ada pengguna nyata;
 * setelah Fase 8, harganya migrasi sungguhan.
 */
export const VERSI_LOG = 2;

export interface BarisPermainan {
  id: string;
  seed: string;
  profesiId: string;
  dibuatPada: number;
  status: 'berjalan' | 'selesai';
  /** Kosong pada baris yang direkam sebelum kolom ini ada — setara versi 1. */
  versiLog?: number;
  /**
   * Catatan waktu untuk uji manusia Fase 8 (§1.4). Tidak diindeks, tidak
   * dikirim ke mana pun, dan tidak menentukan apa pun di dalam permainan —
   * hanya ikut saat pemain sendiri menyimpan salinan jurnalnya.
   */
  msAktif?: number;
  msJeda?: number;
  jumlahJeda?: number;
  jumlahLewati?: number;
  giliran?: number;
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

/** Menyimpan catatan waktu permainan. Ditimpa, bukan ditumpuk. */
export async function simpanWaktu(
  permainanId: string,
  waktu: Pick<BarisPermainan, 'msAktif' | 'msJeda' | 'jumlahJeda' | 'jumlahLewati' | 'giliran'>,
): Promise<void> {
  await db.permainan.update(permainanId, waktu);
}

/** Ringkasan tiap permainan untuk berkas cadangan — tanpa apa pun tentang orangnya. */
export async function ringkasanPermainan(): Promise<BarisPermainan[]> {
  return db.permainan.orderBy('dibuatPada').toArray();
}

export async function tambahJurnal(entri: EntriJurnal): Promise<void> {
  await db.jurnal.add(entri);
}

/** Entri jurnal satu permainan, terlama dulu — urutan ia ditanam. */
export async function jurnalPermainan(permainanId: string): Promise<EntriJurnal[]> {
  const baris = await db.jurnal.where('permainanId').equals(permainanId).toArray();
  return baris.sort((a, b) => a.dibuatPada - b.dibuatPada);
}

export async function semuaJurnal(): Promise<EntriJurnal[]> {
  return db.jurnal.orderBy('dibuatPada').reverse().toArray();
}
