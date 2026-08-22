import { create } from 'zustand';
import { reduce, stateAwal, putarUlang } from '../engine/reducer';
import { db, simpanKejadian, muatKejadian, tambahJurnal, simpanWaktu, VERSI_LOG } from '../lib/db';
import { kosong, tambahJeda, type Pencatat } from '../lib/waktu';
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
  /**
   * Catatan waktu bermain untuk uji manusia Fase 8. Tinggal di HP pemain,
   * tidak dikirim ke mana pun (§15.3, §15.5), dan tidak menyentuh satu pun
   * angka permainan — mesin tidak pernah melihatnya.
   */
  waktu: Pencatat;
  mulai: (seed: string, profesiId: string) => Promise<void>;
  kirim: (kejadian: KejadianBaru) => Promise<void>;
  muat: (permainanId: string) => Promise<void>;
  /** Menutup permainan yang sedang dipegang dan kembali ke layar mulai. */
  tutup: () => void;
}

export const usePermainan = create<TokoPermainan>((set, get) => ({
  state: null,
  permainanId: null,
  nomorKejadian: 0,
  memproses: false,
  galatMuat: null,
  waktu: kosong(),

  tutup() {
    // Log dan jurnalnya tetap di basis data. Menutup permainan berarti
    // melepaskannya dari layar, bukan menghapusnya — catatan itu milik pemain.
    set({ state: null, permainanId: null, nomorKejadian: 0, galatMuat: null, waktu: kosong() });
  },

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

      set({
        state: stateAwal(seed, profesiId),
        permainanId,
        nomorKejadian: 1,
        galatMuat: null,
        waktu: tambahJeda(kosong(), Date.now(), 'MULAI'),
      });
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

      const baru = reduce(state, kejadian);
      const waktu = tambahJeda(get().waktu, Date.now(), kejadian.tipe);
      set({ state: baru, nomorKejadian: nomorKejadian + 1, waktu });
      // Ditulis tiap kejadian supaya angkanya selamat kalau aplikasi ditutup
      // di tengah — uji manusia tidak bisa mengandalkan orang menutup dengan
      // rapi. Satu update kecil di tabel yang sudah ada, bukan tabel baru.
      await simpanWaktu(permainanId, {
        msAktif: waktu.msAktif,
        msJeda: waktu.msJeda,
        jumlahJeda: waktu.jumlahJeda,
        jumlahLewati: waktu.jumlahLewati,
        giliran: baru.giliran,
      });
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
      set({ state: null, permainanId: null, nomorKejadian: 0, galatMuat: PESAN_LOG_USANG, waktu: kosong() });
      return;
    }

    const daftar = await muatKejadian(permainanId);
    set({
      state: putarUlang(daftar),
      permainanId,
      nomorKejadian: daftar.length,
      galatMuat: null,
      // Waktu tidak diputar ulang dari log: log tidak menyimpan jam dinding,
      // dan mengarangnya dari nomor kejadian akan melaporkan angka palsu.
      waktu: kosong(),
    });
  },
}));
