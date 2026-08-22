import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, act } from '@testing-library/react';
import { KartuPasar } from './KartuPasar';
import { usePermainan } from '../../hooks/use-permainan';
import { stateAwal } from '../../engine/reducer';
import type { Kejadian } from '../../types/kejadian';

const terkirim: Kejadian[] = [];

function pasang() {
  const dasar = stateAwal('kabut-rusa-lontar', 'asn-3b');
  usePermainan.setState({
    state: { ...dasar, pasarTerbuka: 'saham-individu' },
    permainanId: 'g-uji',
    nomorKejadian: 3,
    memproses: false,
    kirim: async (baru) => {
      terkirim.push({ ...baru, t: terkirim.length + 1 } as Kejadian);
    },
  });
  render(<KartuPasar />);
}

const detik = () => screen.getByText(/Tawaran menutup dalam/).textContent ?? '';
const majukan = (ms: number) => act(() => void vi.advanceTimersByTime(ms));
const bukaLaporan = () => fireEvent.click(screen.getByRole('button', { name: 'Keuangan' }));
const tutupLaporan = () =>
  fireEvent.click(
    screen.getByRole('dialog', { name: 'Laporan keuangan' }).querySelector('button[aria-label="Tutup"]')!,
  );

beforeEach(() => {
  vi.useFakeTimers();
  terkirim.length = 0;
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('laporan keuangan bisa dibuka saat kartu pasar terbuka', () => {
  it('menawarkan tombol Keuangan berdampingan dengan keputusan', () => {
    pasang();
    expect(screen.getByRole('button', { name: 'Keuangan' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /^Beli 1 unit/ })).toBeTruthy();
  });

  /**
   * §8.1: membuka Jeda MEMBEKUKAN timer, supaya pemain belajar bahwa berhenti
   * sejenak tidak benar-benar merugikan. Membuka laporan adalah bentuk lain
   * dari berhenti sejenak — timer yang tetap jalan menghukum orang yang
   * memeriksa angka, dan mengajarkan persis kebalikannya.
   */
  it('waktu berhenti total selagi laporan terbuka', () => {
    pasang();
    majukan(5000);
    const sebelum = detik();

    bukaLaporan();
    majukan(30_000);
    expect(detik()).toBe(sebelum);
  });

  it('dan tidak menutup tawaran meski dibiarkan lama terbuka', () => {
    pasang();
    bukaLaporan();
    majukan(60_000);
    expect(terkirim).toEqual([]);
  });

  /**
   * Lanjut dari ketukan yang SAMA, bukan mengulang dari nol. Timer yang
   * mengulang membuat membuka laporan jadi cara memperpanjang waktu — celah
   * yang mengubah alat baca jadi alat tawar.
   */
  it('lanjut dari ketukan yang sama setelah laporan ditutup', () => {
    pasang();
    majukan(10_000);
    const sebelum = detik();

    bukaLaporan();
    majukan(30_000);
    tutupLaporan();
    expect(detik()).toBe(sebelum);

    majukan(5000);
    expect(detik()).not.toBe(sebelum);
  });

  it('kartu masih utuh dan keputusan masih berjalan setelah laporan ditutup', () => {
    pasang();
    bukaLaporan();
    tutupLaporan();
    expect(screen.getByRole('button', { name: /^Beli 1 unit/ })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Lewati' }));
    expect(terkirim.map((k) => k.tipe)).toEqual(['TRANSAKSI_PASAR']);
  });

  it('membuka dan menutup laporan tidak mengirim kejadian apa pun', () => {
    pasang();
    bukaLaporan();
    tutupLaporan();
    expect(terkirim).toEqual([]);
  });
});
