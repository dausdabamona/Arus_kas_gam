import { describe, it, expect } from 'vitest';
import { reduce, stateAwal } from './reducer';
import type { StatePermainan } from '../types/state';
import type { Kejadian } from '../types/kejadian';

const awal = () => stateAwal('uji-akhir', 'asn-3b');

function kirim(state: StatePermainan, kejadian: Omit<Kejadian, 't'>): StatePermainan {
  return reduce(state, { ...kejadian, t: state.giliran + 1 } as Kejadian);
}

describe('permainan yang selesai menyimpan ALASANNYA', () => {
  it('belum ada alasan selagi permainan berjalan', () => {
    expect(awal().alasanAkhir).toBeNull();
    expect(awal().status).toBe('berjalan');
  });

  it.each(['lolos', 'menyerah', 'bangkrut'] as const)(
    'mencatat alasan "%s" apa adanya dari kejadian AKHIR',
    (alasan) => {
      const s = kirim(awal(), { tipe: 'AKHIR', isi: { alasan } });
      expect(s.status).toBe('selesai');
      expect(s.alasanAkhir).toBe(alasan);
    },
  );

  /**
   * §7.3: berhenti dengan sadar adalah KEMENANGAN di papan Kemerdekaan, bukan
   * kekalahan. Perbedaan itu hanya bisa dipertahankan kalau alasannya
   * tersimpan; sebelum ini reducer membuangnya, dan Ringkasan Akhir tidak akan
   * pernah bisa membedakan orang yang berhenti dari orang yang jatuh.
   */
  it('membedakan berhenti dengan sadar dari bangkrut', () => {
    const berhenti = kirim(awal(), { tipe: 'AKHIR', isi: { alasan: 'menyerah' } });
    const jatuh = kirim(awal(), { tipe: 'AKHIR', isi: { alasan: 'bangkrut' } });
    expect(berhenti.alasanAkhir).not.toBe(jatuh.alasanAkhir);
  });

  it('jalur bangkrut §5.3 menyetel alasannya sendiri, tanpa kejadian AKHIR', () => {
    // Kas minus, tanpa aset, tanpa plafon, penghematan mentok: tidak ada tuas.
    const terjepit: StatePermainan = {
      ...awal(),
      keuangan: {
        ...awal().keuangan,
        saldoKas: -1_000_000,
        aset: [],
        liabilitas: [],
        gajiBersihBulanan: 0,
        pengeluaranTetap: 0,
        kaliBerhemat: 99,
      },
    };
    const s = kirim(terjepit, { tipe: 'TINDAKAN_DARURAT', isi: {} });
    expect(s.status).toBe('selesai');
    expect(s.alasanAkhir).toBe('bangkrut');
  });

  it('permainan yang sudah selesai tidak berganti alasan', () => {
    // Log yang diputar ulang bisa memuat kejadian sesudah akhir; yang pertama
    // menutup permainan, bukan yang terakhir.
    const s = kirim(awal(), { tipe: 'AKHIR', isi: { alasan: 'lolos' } });
    const lagi = kirim(s, { tipe: 'AKHIR', isi: { alasan: 'bangkrut' } });
    expect(lagi.alasanAkhir).toBe('lolos');
  });
});
