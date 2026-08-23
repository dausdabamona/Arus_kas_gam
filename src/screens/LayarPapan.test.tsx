import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { LayarPapan } from './LayarPapan';
import { usePermainan } from '../hooks/use-permainan';
import { stateAwal } from '../engine/reducer';
import { cariKartuGuncang } from '../data/kartu-guncang';
import type { StatePermainan } from '../types/state';

function pasangState(ubah: (s: StatePermainan) => StatePermainan) {
  usePermainan.setState({
    state: ubah(stateAwal('uji-layar', 'asn-3b')),
    permainanId: 'g-uji',
    nomorKejadian: 1,
    memproses: false,
  });
}

beforeEach(() => {
  usePermainan.setState({ state: null, permainanId: null, nomorKejadian: 0, memproses: false });
});
afterEach(cleanup);

function tombolDadu(): HTMLButtonElement {
  return screen.getByRole('button', { name: /Lempar dadu/ }) as HTMLButtonElement;
}

describe('tombol lempar dadu', () => {
  it('terbuka saat tidak ada apa pun yang menunggu keputusan', () => {
    pasangState((s) => s);
    render(<LayarPapan />);
    expect(tombolDadu().disabled).toBe(false);
  });

  /**
   * Guncangan yang bisa dilewati dengan melempar dadu adalah guncangan gratis,
   * dan guncangan gratis membatalkan Invarian 6 tanpa satu tes pun menyala.
   */
  it('terkunci selama kartu guncang masih terbuka', () => {
    const kartu = cariKartuGuncang('orang-tua-sakit');
    pasangState((s) => ({
      ...s,
      guncangTerbuka: { kartuId: kartu.id, judul: kartu.judul, teks: kartu.teks },
    }));
    render(<LayarPapan />);
    expect(tombolDadu().disabled).toBe(true);
  });

  it('terkunci selama panen belum ditutup', () => {
    pasangState((s) => ({
      ...s,
      panenTerbuka: {
        t: 1,
        kalimat: 'Cukup.',
        tindakan: 'Diamkan semalam.',
        padaGiliran: 2,
        panenPadaGiliran: 8,
        objek: null,
        kebutuhan: null,
        hasilDalam: 'tenang',
      },
    }));
    render(<LayarPapan />);
    expect(tombolDadu().disabled).toBe(true);
  });
});

/**
 * Diukur di peramban pada empat lebar ponsel: kotak tombol "Keuangan" hanya
 * 93-101px sementara labelnya butuh 110px. Labelnya terpotong di SEMUA lebar,
 * dan memang terlihat terpotong di tangkapan layar HP.
 *
 * Sebabnya `lebarPenuh` pada tombol dadu: `w-full` meminta seluruh baris, dan
 * tetangganya yang menanggung. "Keuangan" satu kata, jadi ia tidak bisa
 * membungkus ke baris kedua — ia hanya terpotong.
 */
describe('bilah bawah muat di layar ponsel', () => {
  it('tombol Keuangan tidak menyusut di bawah lebar labelnya', () => {
    pasangState((s) => s);
    render(<LayarPapan />);
    const keuangan = screen.getByRole('button', { name: 'Keuangan' });
    expect(keuangan.className).toContain('shrink-0');
  });

  it('tombol dadu yang meminta seluruh baris tidak ikut kaku', () => {
    pasangState((s) => s);
    render(<LayarPapan />);
    expect(tombolDadu().className).not.toContain('shrink-0');
  });
});
