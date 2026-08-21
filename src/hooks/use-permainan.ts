import { create } from 'zustand';
import { reduce, stateAwal, putarUlang } from '../engine/reducer';
import { db, simpanKejadian, muatKejadian } from '../lib/db';
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
  mulai: (seed: string, profesiId: string) => Promise<void>;
  kirim: (kejadian: KejadianBaru) => Promise<void>;
  muat: (permainanId: string) => Promise<void>;
}

export const usePermainan = create<TokoPermainan>((set, get) => ({
  state: null,
  permainanId: null,
  nomorKejadian: 0,
  memproses: false,

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
      });
      await simpanKejadian(permainanId, awal);

      set({ state: stateAwal(seed, profesiId), permainanId, nomorKejadian: 1 });
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
      set({ state: reduce(state, kejadian), nomorKejadian: nomorKejadian + 1 });
    } finally {
      set({ memproses: false });
    }
  },

  async muat(permainanId) {
    const daftar = await muatKejadian(permainanId);
    set({
      state: putarUlang(daftar),
      permainanId,
      nomorKejadian: daftar.length,
    });
  },
}));
