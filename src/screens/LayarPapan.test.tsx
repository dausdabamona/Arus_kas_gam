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
