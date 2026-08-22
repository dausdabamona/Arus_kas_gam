import { create } from 'zustand';
import { reduce, stateAwal, putarUlang } from '../engine/reducer';
import { db, simpanKejadian, muatKejadian, tambahJurnal, VERSI_LOG } from '../lib/db';
import { PESAN_LOG_USANG } from '../data/naskah-sistem';
import type { Kejadian } from '../types/kejadian';
import type { StatePermainan } from '../types/state';

/** Kejadian tanpa nomor urut — nomornya diisi store. */
type KejadianBaru = Omit<Kejadian, 't'> extends infer U
  ? U extends { tipe: Kejadian['tipe'] }
    ? U
    : never
  : never;

interface TokoPermainan {
  state: StatePermainan | null;
  permainanId: string | null;
  nomorKejadian: number;
  /** Benar selagi satu kejadian sedang ditulis. Menjaga dari ketukan ganda. */
  memproses: boolean;
  /** Pesan tenang saat sebuah permainan tidak bisa dimuat. Null bila tidak ada. */
  galatMuat: string | null;
  mulai: (seed: string, profesiId: string) => Promise<void>;
  kirim: (kejadian: KejadianBaru) => Promise<void>;
  muat: (permainanId: string) => Promise<void>;
}

export const usePermainan = create<TokoPermainan>((set, get) => ({
  state: null,
  permainanId: null,
  nomorKejadian: 0,
  memproses: false,
  galatMuat: null,

  async mulai(seed, profesiId) {
    if (get().memproses) return;
    set({ memproses: true });
    try {
      const permainanId = `g-${Date.now()}`;
      const awal: Kejadian = { t: 0, tipe: 'MULAI', isi: { seed, profesiId } };

      await db.permainan.add({
        id: permainanId,
        seed,
        profesiId,
        dibuatPada: Date.now(),
        status: 'berjalan',
        versiLog: VERSI_LOG,
      });
      await simpanKejadian(permainanId, awal);

      set({ state: stateAwal(seed, profesiId), permainanId, nomorKejadian: 1, galatMuat: null });
    } finally {
      set({ memproses: false });
    }
  },

  async kirim(kejadianBaru) {
    const { state, permainanId, nomorKejadian, memproses } = get();
    if (!state || !permainanId) throw new Error('Permainan belum dimulai');
    // Ketukan ganda pada tombol yang sama bisa memicu dua kirim() sebelum
    // tombolnya sempat nonaktif. Kejadian kedua diabaikan di sini — bukan
    // di komponen — supaya penjagaan ini tidak bisa dilewati dari UI mana pun.
    if (memproses) return;

    set({ memproses: true });
    try {
      const kejadian = { ...kejadianBaru, t: nomorKejadian } as Kejadian;
      await simpanKejadian(permainanId, kejadian);

      // Jurnal ditulis dari panen yang sedang terbuka, SEBELUM reduce
      // menutupnya. Ia hidup di tabel terpisah sejak Fase 0: menghapus
      // permainan tidak menyentuhnya, karena catatan itu milik pemain,
      // bukan milik sesi.
      if (kejadian.tipe === 'TUAI') {
        const panen = state.panenTerbuka;
        // Kebutuhan dan hasil dalam selalu terisi lewat alur Jeda; kalau
        // salah satunya kosong, entri sengaja tidak ditulis daripada
        // mengarang isi jurnal orang.
        if (panen && panen.kebutuhan !== null && panen.hasilDalam !== null) {
          await tambahJurnal({
            permainanId,
            dibuatPada: Date.now(),
            kebutuhan: panen.kebutuhan,
            kalimat: panen.kalimat,
            tindakan: panen.tindakan,
            hasilLuar: kejadian.isi.hasilLuar,
            hasilDalam: panen.hasilDalam,
          });
        }
      }

      set({ state: reduce(state, kejadian), nomorKejadian: nomorKejadian + 1 });
    } finally {
      set({ memproses: false });
    }
  },

  async muat(permainanId) {
    // Aturan mesin yang berubah membuat log lama tidak setara: log yang sama
    // memberi state yang berbeda. Memuatnya dan diam-diam menampilkan angka
    // yang salah jauh lebih buruk daripada menolak dengan terang.
    const baris = await db.permainan.get(permainanId);
    if (!baris || (baris.versiLog ?? 1) !== VERSI_LOG) {
      set({ state: null, permainanId: null, nomorKejadian: 0, galatMuat: PESAN_LOG_USANG });
      return;
    }

    const daftar = await muatKejadian(permainanId);
    set({
      state: putarUlang(daftar),
      permainanId,
      nomorKejadian: daftar.length,
      galatMuat: null,
    });
  },
}));
