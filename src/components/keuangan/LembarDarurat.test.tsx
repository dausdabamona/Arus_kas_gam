import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { LembarDarurat } from './LembarDarurat';
import { usePermainan } from '../../hooks/use-permainan';
import { stateAwal } from '../../engine/reducer';
import { berhemat, MAKS_BERHEMAT, PLAFON_PINJAMAN_GAJI } from '../../engine/keuangan';
import type { StatePermainan } from '../../types/state';

function pasangState(ubah: (s: StatePermainan) => StatePermainan) {
  usePermainan.setState({
    state: ubah(stateAwal('uji-ui', 'asn-3b')),
    permainanId: 'g-uji',
    nomorKejadian: 1,
    memproses: false,
  });
}

const kasMinusPenuhPilihan = (s: StatePermainan): StatePermainan => ({
  ...s,
  keuangan: {
    ...s.keuangan,
    saldoKas: -1_200_000,
    aset: [{ id: 'kos-0', nama: 'Kamar kos', nilai: 45_000_000, arusKasBulanan: 750_000 }],
  },
});

beforeEach(() => {
  usePermainan.setState({ state: null, permainanId: null, nomorKejadian: 0, memproses: false });
});
afterEach(cleanup);

describe('LembarDarurat', () => {
  it('menampilkan ketiga tuas berdampingan saat semuanya tersedia', () => {
    pasangState(kasMinusPenuhPilihan);
    render(<LembarDarurat />);

    expect(screen.getByRole('button', { name: /Jual Kamar kos/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Pinjam darurat/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Berhemat/ })).toBeTruthy();
  });

  it('tidak memasang satu pilihan pun di muka — pemain yang memilih', () => {
    pasangState(kasMinusPenuhPilihan);
    render(<LembarDarurat />);

    const tuas = ['Jual Kamar kos', 'Pinjam darurat', 'Berhemat'].map((n) =>
      screen.getByRole('button', { name: new RegExp(n) }),
    );
    // Tidak ada yang autofocus, tertandai terpilih, atau dibedakan gayanya.
    for (const t of tuas) {
      expect(document.activeElement).not.toBe(t);
      expect(t.getAttribute('aria-pressed')).toBeNull();
      expect(t.getAttribute('data-terpilih')).toBeNull();
    }
    const gaya = tuas.map((t) => t.className);
    expect(new Set(gaya).size).toBe(1); // bobot visual sama persis
  });

  it('menyebutkan apa yang dikorbankan tiap tuas, bukan cuma namanya', () => {
    pasangState(kasMinusPenuhPilihan);
    render(<LembarDarurat />);

    expect(screen.getByRole('button', { name: /Berhemat/ }).textContent).toContain('permanen');
    expect(screen.getByRole('button', { name: /Pinjam darurat/ }).textContent).toContain('sisa plafon');
  });

  it('menyembunyikan tuas yang sudah habis', () => {
    pasangState((s) => {
      let k = kasMinusPenuhPilihan(s).keuangan;
      for (let i = 0; i < MAKS_BERHEMAT; i++) k = berhemat(k);
      return { ...s, keuangan: { ...k, saldoKas: -1_200_000, aset: [] } };
    });
    render(<LembarDarurat />);

    expect(screen.queryByRole('button', { name: /Berhemat/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /^Jual/ })).toBeNull();
    expect(screen.getByRole('button', { name: /Pinjam darurat/ })).toBeTruthy();
  });

  it('menawarkan akhir permainan hanya saat ketiga tuas habis', () => {
    pasangState((s) => {
      let k = kasMinusPenuhPilihan(s).keuangan;
      for (let i = 0; i < MAKS_BERHEMAT; i++) k = berhemat(k);
      return {
        ...s,
        keuangan: {
          ...k,
          saldoKas: -1_200_000,
          aset: [],
          liabilitas: [{
            id: 'darurat-1', nama: 'Pinjaman darurat',
            sisaUtang: k.gajiBersihBulanan * PLAFON_PINJAMAN_GAJI,
            cicilanBulanan: 1, bungaBulanan: 0.02,
            pokokAwal: k.gajiBersihBulanan * PLAFON_PINJAMAN_GAJI,
          }],
        },
      };
    });
    render(<LembarDarurat />);

    expect(screen.getByRole('button', { name: /Akhiri permainan/ })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Pinjam darurat/ })).toBeNull();
  });
});

describe('LayarPapan saat kas minus', () => {
  it('mematikan tombol lempar dadu dan memunculkan lembar darurat', async () => {
    const { LayarPapan } = await import('../../screens/LayarPapan');
    pasangState(kasMinusPenuhPilihan);
    render(<LayarPapan />);

    expect(screen.getByRole('dialog', { name: 'Saldo kas minus' })).toBeTruthy();
    const lempar = screen.getByRole('button', { name: /Lempar dadu/ }) as HTMLButtonElement;
    expect(lempar.disabled).toBe(true);
  });

  it('membiarkan tombol lempar dadu hidup saat kas tidak minus', async () => {
    const { LayarPapan } = await import('../../screens/LayarPapan');
    pasangState((s) => s);
    render(<LayarPapan />);

    expect(screen.queryByRole('dialog', { name: 'Saldo kas minus' })).toBeNull();
    const lempar = screen.getByRole('button', { name: /Lempar dadu/ }) as HTMLButtonElement;
    expect(lempar.disabled).toBe(false);
  });
});
