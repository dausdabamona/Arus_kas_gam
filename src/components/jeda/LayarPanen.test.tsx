import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, act } from '@testing-library/react';
import { LayarPanen } from './LayarPanen';
import { usePermainan } from '../../hooks/use-permainan';
import { stateAwal } from '../../engine/reducer';
import { cariKartu } from '../../data/kartu-peluang';
import { NASKAH_TUAI } from '../../data/naskah-jeda';
import type { StatePermainan, TanamTertunda } from '../../types/state';
import type { Kejadian } from '../../types/kejadian';

const terkirim: Kejadian[] = [];

const TANAM_DASAR: TanamTertunda = {
  t: 4,
  kalimat: 'Saya takut kurang.',
  tindakan: 'Cek saldo sekali saja.',
  padaGiliran: 5,
  panenPadaGiliran: 11,
  objek: null,
  kebutuhan: 'keamanan',
  hasilDalam: 'tenang',
};

function pasang(panen: TanamTertunda, ubah: (s: StatePermainan) => StatePermainan = (s) => s) {
  const dasar = ubah({ ...stateAwal('uji-panen-ui', 'asn-3b'), giliran: 12 });
  usePermainan.setState({
    state: { ...dasar, panenTerbuka: panen },
    permainanId: 'g-uji',
    nomorKejadian: 1,
    memproses: false,
    kirim: async (baru) => {
      terkirim.push({ ...baru, t: 99 } as Kejadian);
    },
  });
}

beforeEach(() => {
  terkirim.length = 0;
  vi.useFakeTimers();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('layar panen', () => {
  it('menampilkan kalimat pemain sebagai kutipan, sekali ini saja', () => {
    pasang(TANAM_DASAR);
    render(<LayarPanen />);
    expect(screen.getAllByText(TANAM_DASAR.kalimat)).toHaveLength(1);
  });

  it('menghitung jarak giliran dari saat menanam', () => {
    pasang(TANAM_DASAR);
    render(<LayarPanen />);
    expect(screen.getByText(NASKAH_TUAI.pembuka(7))).toBeTruthy();
  });

  it('menahan tombol Lanjut selama tiga detik pertama', () => {
    pasang(TANAM_DASAR);
    render(<LayarPanen />);
    const tombol = () => screen.getByRole('button', { name: 'Lanjut' }) as HTMLButtonElement;
    expect(tombol().disabled).toBe(true);
    act(() => { vi.advanceTimersByTime(3000); });
    expect(tombol().disabled).toBe(false);
  });

  it('mengirim TUAI beserta hasil luarnya', () => {
    pasang(TANAM_DASAR);
    render(<LayarPanen />);
    act(() => { vi.advanceTimersByTime(3000); });
    fireEvent.click(screen.getByRole('button', { name: 'Lanjut' }));
    expect(terkirim).toHaveLength(1);
    expect(terkirim[0].tipe).toBe('TUAI');
  });

  it('menulis tanda hubung, bukan Rp 0, untuk guncangan yang tak terukur', () => {
    pasang({
      ...TANAM_DASAR,
      objek: { jenis: 'guncang', id: 'orang-tua-sakit', nilaiSaatItu: 0, padaGiliran: 5 },
    });
    render(<LayarPanen />);
    expect(screen.getAllByText(NASKAH_TUAI.takTerukur).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Rp\s*0/)).toBeNull();
  });

  it('menandai hasil dalam yang belum terukur tanpa memvonisnya tersulut', () => {
    pasang({ ...TANAM_DASAR, hasilDalam: null });
    render(<LayarPanen />);
    expect(screen.queryByText(NASKAH_TUAI.tersulut)).toBeNull();
  });

  /**
   * §9.3 secara utuh: keputusan yang diambil dengan tenang bisa merugi di
   * dunia luar, dan itu justru pelajarannya. Dua warna berlawanan dibangun
   * di sini secara sengaja, bukan ditunggu muncul sendiri.
   */
  it('bisa menampilkan hasil luar merah berdampingan dengan hasil dalam hijau', () => {
    const kartu = cariKartu('tanah-kavling')!;
    pasang(
      {
        ...TANAM_DASAR,
        hasilDalam: 'tenang',
        objek: { jenis: 'kartu', id: kartu.id, nilaiSaatItu: kartu.harga, padaGiliran: 5 },
      },
    );
    render(<LayarPanen />);

    const luar = screen.getByText(NASKAH_TUAI.hasilLuar).parentElement!;
    const dalam = screen.getByText(NASKAH_TUAI.hasilDalam).parentElement!;

    // Kartu apresiasi yang ditolak lalu naik: hasil luar merah.
    expect(luar.querySelector('.text-rugi'), 'hasil luar tidak merah').toBeTruthy();
    expect(dalam.querySelector('.text-untung'), 'hasil dalam tidak hijau').toBeTruthy();
  });

  it('tidak memasang tombol tutup yang tidak melakukan apa pun', () => {
    pasang(TANAM_DASAR);
    render(<LayarPanen />);
    expect(screen.queryByRole('button', { name: 'Tutup' })).toBeNull();
  });

  it('memberi kedua sisi bobot yang sama, tidak ada yang lebih besar', () => {
    pasang(TANAM_DASAR);
    render(<LayarPanen />);
    const luar = screen.getByText(NASKAH_TUAI.hasilLuar).parentElement!;
    const dalam = screen.getByText(NASKAH_TUAI.hasilDalam).parentElement!;
    expect(luar.className).toBe(dalam.className);
  });
});
