import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { LayarPapan } from '../../screens/LayarPapan';
import { PitaKebiasaan } from './PitaKebiasaan';
import { usePermainan } from '../../hooks/use-permainan';
import { stateAwal } from '../../engine/reducer';
import { cariKartuKebiasaan } from '../../data/kartu-kebiasaan';
import {
  LABEL_TAHAP,
  LABEL_SUDAH_LEPAS,
  PESAN_REFLEKS_AMBIL_ALIH,
  labelKemajuan,
} from '../../data/naskah-gerbang';
import type { StatePermainan, KebiasaanBerjalan } from '../../types/state';

const aktif = (id: string, kemajuan = 0, lepas = false): KebiasaanBerjalan => ({
  id,
  kemajuan,
  lepas,
  lawanUnggul: false,
});

function pasang(ubah: (s: StatePermainan) => StatePermainan) {
  usePermainan.setState({
    state: ubah(stateAwal('uji-pita', 'asn-3b')),
    permainanId: 'g-uji',
    nomorKejadian: 1,
    memproses: false,
  });
}

const diLuas = (s: StatePermainan): StatePermainan => ({
  ...s,
  tahap: 'luas',
  niat: 'Supaya ibu tidak perlu menahan mau apa-apa.',
  kebiasaan: [aktif('refleks-panik')],
});

afterEach(cleanup);
beforeEach(() => {
  usePermainan.setState({ state: null, permainanId: null, nomorKejadian: 0, memproses: false });
});

describe('penanda tahap dan niat', () => {
  it('menyebut Lingkar Harian di tahap satu', () => {
    pasang((s) => s);
    render(<LayarPapan />);
    expect(screen.getByText(LABEL_TAHAP.harian)).toBeTruthy();
  });

  it('berganti menjadi Lingkar Luas di tahap dua', () => {
    pasang(diLuas);
    render(<LayarPapan />);
    expect(screen.getByText(LABEL_TAHAP.luas)).toBeTruthy();
    expect(screen.queryByText(LABEL_TAHAP.harian)).toBeNull();
  });

  it('menampilkan niat pemain persis seperti yang ia tulis', () => {
    pasang(diLuas);
    render(<LayarPapan />);
    expect(screen.getByText('Supaya ibu tidak perlu menahan mau apa-apa.')).toBeTruthy();
  });

  it('tidak menampilkan niat di Lingkar Harian', () => {
    pasang((s) => ({ ...s, niat: 'Belum masuk.' }));
    render(<LayarPapan />);
    expect(screen.queryByText('Belum masuk.')).toBeNull();
  });
});

describe('pita kebiasaan', () => {
  it('menampilkan kemajuan pelepasan sebagai hitungan, bukan persen', () => {
    render(<PitaKebiasaan kebiasaan={[aktif('refleks-panik', 1)]} />);
    const kali = cariKartuKebiasaan('refleks-panik').syaratLepas.kali;
    expect(screen.getByText(labelKemajuan(1, kali))).toBeTruthy();
  });

  it('menyertakan cara lepas selama kartunya belum lepas', () => {
    render(<PitaKebiasaan kebiasaan={[aktif('refleks-panik')]} />);
    expect(screen.getByText(cariKartuKebiasaan('refleks-panik').caraLepas)).toBeTruthy();
  });

  /** Kerja yang berhasil harus meninggalkan jejak, bukan menghilang tanpa bekas. */
  it('menandai kartu yang sudah lepas, tidak menghapusnya', () => {
    render(<PitaKebiasaan kebiasaan={[aktif('refleks-kejar', 1, true)]} />);
    expect(screen.getByText(cariKartuKebiasaan('refleks-kejar').nama)).toBeTruthy();
    expect(screen.getByText(LABEL_SUDAH_LEPAS)).toBeTruthy();
  });

  it('tidak menggambar apa pun saat tidak ada kebiasaan', () => {
    const { container } = render(<PitaKebiasaan kebiasaan={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('tidak muncul di Lingkar Harian karena kebiasaan memang belum ada', () => {
    pasang((s) => s);
    render(<LayarPapan />);
    expect(screen.queryByText(cariKartuKebiasaan('refleks-panik').nama)).toBeNull();
  });
});

describe('penanda refleks mengambil alih', () => {
  it('menjelaskan apa yang terjadi dan menunjuk jalan keluarnya', () => {
    pasang((s) => ({ ...diLuas(s), refleksMengambilAlih: 'refleks-panik' }));
    render(<LayarPapan />);
    expect(screen.getByText(PESAN_REFLEKS_AMBIL_ALIH)).toBeTruthy();
  });

  it('diam saat keputusan terakhir memang milik pemain', () => {
    pasang(diLuas);
    render(<LayarPapan />);
    expect(screen.queryByText(PESAN_REFLEKS_AMBIL_ALIH)).toBeNull();
  });
});
