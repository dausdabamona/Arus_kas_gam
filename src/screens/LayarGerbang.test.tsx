import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, act } from '@testing-library/react';
import App from '../App';
import { usePermainan } from '../hooks/use-permainan';
import { reduce, stateAwal } from '../engine/reducer';
import { kebiasaanTerbawa } from '../engine/kebiasaan';
import { cariKartuKebiasaan } from '../data/kartu-kebiasaan';
import { PENJELASAN_KEBIASAAN, TANPA_KEBIASAAN, UCAPAN_LOLOS } from '../data/naskah-gerbang';
import type { StatePermainan } from '../types/state';
import type { Kejadian } from '../types/kejadian';

const terkirim: Kejadian[] = [];

function pasang(ubah: (s: StatePermainan) => StatePermainan) {
  usePermainan.setState({
    state: ubah(stateAwal('uji-gerbang', 'asn-3b')),
    permainanId: 'g-uji',
    nomorKejadian: 1,
    memproses: false,
    kirim: async (baru) => {
      const kejadian = { ...baru, t: terkirim.length + 1 } as Kejadian;
      terkirim.push(kejadian);
      usePermainan.setState((t) => ({ state: t.state ? reduce(t.state, kejadian) : null }));
    },
  });
}

/** Pendapatan pasif menutup pengeluaran — syarat lolos §5.2. */
const lolos = (s: StatePermainan): StatePermainan => ({
  ...s,
  keuangan: {
    ...s.keuangan,
    aset: [{ id: 'kos-besar-0', nama: 'Kos besar', nilai: 900_000_000, arusKasBulanan: 20_000_000 }],
  },
});

beforeEach(() => {
  terkirim.length = 0;
});
afterEach(cleanup);

describe('Gerbang Niat berdiri di antara dua tahap', () => {
  it('menggantikan papan begitu syarat lolos terpenuhi', () => {
    pasang(lolos);
    render(<App />);
    expect(screen.getByText(UCAPAN_LOLOS)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Lempar dadu/ })).toBeNull();
  });

  it('tidak muncul sebelum lolos', () => {
    pasang((s) => s);
    render(<App />);
    expect(screen.queryByText(UCAPAN_LOLOS)).toBeNull();
  });

  it('mengunci tombol simpan selama niat masih kosong', () => {
    pasang(lolos);
    render(<App />);
    const tombol = () => screen.getByRole('button', { name: 'Simpan' }) as HTMLButtonElement;
    expect(tombol().disabled).toBe(true);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '   ' } });
    expect(tombol().disabled).toBe(true);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Menemani anak tumbuh.' } });
    expect(tombol().disabled).toBe(false);
  });

  it('menampilkan kartu yang benar-benar akan dibawa, bukan tebakan', async () => {
    const dasar = lolos({ ...stateAwal('uji-gerbang', 'asn-3b'), skor: { keputusanTenang: 0, keputusanBertekanan: 0 } });
    pasang(() => dasar);
    render(<App />);

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Berhenti takut.' } });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Simpan' })); });

    const diramalkan = kebiasaanTerbawa(dasar.seed, dasar.skor);
    expect(diramalkan.length).toBeGreaterThan(0);
    for (const k of diramalkan) {
      expect(screen.getByText(cariKartuKebiasaan(k.id).nama)).toBeTruthy();
    }

    // Yang dijanjikan layar harus sama persis dengan yang dipasang mesin.
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Masuk' })); });
    expect(usePermainan.getState().state!.kebiasaan.map((k) => k.id)).toEqual(
      diramalkan.map((k) => k.id),
    );
  });

  it('menyertakan cara lepas tiap kartu, bukan cuma namanya', async () => {
    pasang(lolos);
    render(<App />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Berhenti takut.' } });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Simpan' })); });

    for (const k of kebiasaanTerbawa('uji-gerbang', { keputusanTenang: 0, keputusanBertekanan: 0 })) {
      expect(screen.getByText(cariKartuKebiasaan(k.id).caraLepas)).toBeTruthy();
    }
  });

  it('membingkainya sebagai refleks yang belum terlatih, bukan sebagai beban', async () => {
    pasang(lolos);
    render(<App />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Berhenti takut.' } });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Simpan' })); });
    expect(screen.getByText(PENJELASAN_KEBIASAAN)).toBeTruthy();
  });

  it('tidak menyebut kebiasaan sama sekali untuk pemain tanpa kartu', async () => {
    pasang((s) => ({ ...lolos(s), skor: { keputusanTenang: 20, keputusanBertekanan: 20 } }));
    render(<App />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Berhenti takut.' } });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Simpan' })); });

    expect(screen.getByText(TANPA_KEBIASAAN)).toBeTruthy();
    expect(screen.queryByText(PENJELASAN_KEBIASAAN)).toBeNull();
    for (const kartu of ['refleks-panik', 'refleks-kejar', 'refleks-banding']) {
      expect(screen.queryByText(cariKartuKebiasaan(kartu).nama)).toBeNull();
    }
  });

  it('menyerahkan pemain ke papan Lingkar Luas setelah Masuk', async () => {
    pasang(lolos);
    render(<App />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Berhenti takut.' } });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Simpan' })); });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Masuk' })); });

    expect(usePermainan.getState().state!.tahap).toBe('luas');
    expect(screen.getByRole('button', { name: /Lempar dadu/ })).toBeTruthy();
  });
});
