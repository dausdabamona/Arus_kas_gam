import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react';
import { LembarDarurat } from './LembarDarurat';
import { usePermainan } from '../../hooks/use-permainan';
import { stateAwal } from '../../engine/reducer';
import { MAKS_BERHEMAT } from '../../engine/keuangan';
import type { StatePermainan } from '../../types/state';

const KOS = { id: 'kos-0', nama: 'Kamar kos', nilai: 45_000_000, arusKasBulanan: 750_000 };
const UTANG_KOS = {
  id: 'utang-kos-0',
  nama: 'Utang Kamar kos',
  sisaUtang: 36_000_000,
  cicilanBulanan: 450_000,
  pokokAwal: 36_000_000,
  asetId: 'kos-0',
};
const MOTOR = { id: 'motor-0', nama: 'Motor sewa', nilai: 4_000_000, arusKasBulanan: 500_000 };
const UTANG_MOTOR = {
  id: 'utang-motor-0',
  nama: 'Utang motor sewa',
  sisaUtang: 9_000_000,
  cicilanBulanan: 400_000,
  pokokAwal: 9_000_000,
  asetId: 'motor-0',
};

function pasang(ubah: (s: StatePermainan) => StatePermainan) {
  usePermainan.setState({
    state: ubah(stateAwal('uji-jual-ui', 'asn-3b')),
    permainanId: 'g-uji',
    nomorKejadian: 1,
    memproses: false,
  });
}

const krisis = (s: StatePermainan): StatePermainan => ({
  ...s,
  keuangan: {
    ...s.keuangan,
    saldoKas: -3_000_000,
    aset: [MOTOR, KOS],
    liabilitas: [...s.keuangan.liabilitas, UTANG_MOTOR, UTANG_KOS],
  },
});

beforeEach(() => {
  usePermainan.setState({ state: null, permainanId: null, nomorKejadian: 0, memproses: false });
});
afterEach(cleanup);

describe('pilihan jual di lembar darurat', () => {
  it('menawarkan aset yang bisa dijual', () => {
    pasang(krisis);
    render(<LembarDarurat />);
    expect(screen.getByRole('button', { name: new RegExp(KOS.nama) })).toBeTruthy();
  });

  /** Aset terbenam bukan tuas — menawarkannya berarti menawarkan tombol mati. */
  it('tidak menawarkan aset yang ekuitasnya negatif', () => {
    pasang(krisis);
    render(<LembarDarurat />);
    expect(screen.queryByRole('button', { name: new RegExp(MOTOR.nama) })).toBeNull();
  });

  it('menawarkan semua aset yang bisa dijual, bukan hanya yang pertama', () => {
    pasang((s) => ({
      ...krisis(s),
      keuangan: {
        ...krisis(s).keuangan,
        aset: [MOTOR, KOS, { id: 'emas-0', nama: 'Emas', nilai: 8_000_000, arusKasBulanan: 0 }],
      },
    }));
    render(<LembarDarurat />);
    expect(screen.getByRole('button', { name: new RegExp(KOS.nama) })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Emas/ })).toBeTruthy();
  });
});

describe('hitungan sebelum konfirmasi', () => {
  function bukaHitungan() {
    pasang(krisis);
    render(<LembarDarurat />);
    fireEvent.click(screen.getByRole('button', { name: new RegExp(KOS.nama) }));
    return screen.getByRole('region', { name: /Jual/i });
  }

  it('memecah nilai jual, utang melekat, dan kas yang diterima', () => {
    const panel = bukaHitungan();
    expect(within(panel).getByText(/45\.000\.000/)).toBeTruthy();
    expect(within(panel).getByText(/36\.000\.000/)).toBeTruthy();
    expect(within(panel).getByText(/\b9\.000\.000/)).toBeTruthy();
  });

  /**
   * DUA angka, bukan satu. Cicilan yang lenyap dan arus kas yang hilang
   * bergerak berlawanan arah; menggabungkannya jadi satu selisih menyembunyikan
   * pertukaran yang justru sedang ditimbang pemain.
   */
  it('menampilkan cicilan yang lenyap dan arus kas yang hilang sebagai dua angka terpisah', () => {
    const panel = bukaHitungan();
    expect(within(panel).getByText(/450\.000/)).toBeTruthy();
    expect(within(panel).getByText(/750\.000/)).toBeTruthy();
  });

  it('menampilkan perubahan arus kas bersihnya juga', () => {
    const panel = bukaHitungan();
    // 450.000 lenyap − 750.000 hilang = −300.000
    expect(within(panel).getByText(/300\.000/)).toBeTruthy();
  });

  it('bisa dibatalkan tanpa menjual apa pun', () => {
    pasang(krisis);
    render(<LembarDarurat />);
    fireEvent.click(screen.getByRole('button', { name: new RegExp(KOS.nama) }));
    fireEvent.click(screen.getByRole('button', { name: /Batal/ }));
    expect(screen.queryByRole('region', { name: /Jual/i })).toBeNull();
    expect(screen.getByRole('button', { name: new RegExp(KOS.nama) })).toBeTruthy();
  });

  it('tidak menjual sampai konfirmasi ditekan', () => {
    pasang(krisis);
    render(<LembarDarurat />);
    fireEvent.click(screen.getByRole('button', { name: new RegExp(KOS.nama) }));
    expect(usePermainan.getState().state!.keuangan.aset).toHaveLength(2);
  });
});

describe('saat semua tuas habis', () => {
  it('menyebut aset yang tersisa tidak bisa dijual, bukan tidak ada', () => {
    pasang((s) => ({
      ...s,
      keuangan: {
        ...s.keuangan,
        saldoKas: -3_000_000,
        kaliBerhemat: MAKS_BERHEMAT,
        aset: [MOTOR],
        liabilitas: [
          ...s.keuangan.liabilitas,
          UTANG_MOTOR,
          {
            id: 'darurat-penuh',
            nama: 'Pinjaman darurat',
            sisaUtang: s.keuangan.gajiBersihBulanan * 6,
            cicilanBulanan: 0,
            pokokAwal: s.keuangan.gajiBersihBulanan * 6,
            bungaBulanan: 0.02,
          },
        ],
      },
    }));
    render(<LembarDarurat />);
    expect(screen.getByRole('button', { name: /Akhiri permainan/ })).toBeTruthy();
    // Pemain PUNYA aset; yang benar adalah tak satu pun bisa dijual.
    expect(screen.queryByText(/Tidak ada aset untuk dijual/)).toBeNull();
  });
});

describe('aset bebas utang tanpa arus kas', () => {
  const EMAS = { id: 'emas-0', nama: 'Emas', nilai: 8_000_000, arusKasBulanan: 0 };

  function bukaEmas() {
    pasang((s) => ({
      ...s,
      keuangan: { ...s.keuangan, saldoKas: -1_000_000, aset: [EMAS] },
    }));
    render(<LembarDarurat />);
    fireEvent.click(screen.getByRole('button', { name: /Emas/ }));
    return screen.getByRole('region', { name: /Jual/i });
  }

  /** Nol negatif pernah bocor ke layar Panen, lalu ke sini. Kelasnya ditutup di `Uang`. */
  it('tidak pernah menampilkan nol negatif', () => {
    expect(bukaEmas().textContent ?? '').not.toMatch(/-Rp\s?0\b/);
  });

  it('tidak mengulang angka yang sama sebagai dua baris', () => {
    const panel = bukaEmas();
    expect(within(panel).queryByText('Nilai jual')).toBeNull();
    expect(within(panel).getByText('Kas yang diterima')).toBeTruthy();
  });

  it('menyatakan tidak ada yang berubah, bukan menumpuk tiga baris nol', () => {
    const panel = bukaEmas();
    expect(within(panel).getByText('Tidak ada yang berubah.')).toBeTruthy();
    expect(within(panel).queryByText('Perubahan arus kas')).toBeNull();
  });

  it('tetap memecah dua angka saat memang ada pertukarannya', () => {
    pasang(krisis);
    render(<LembarDarurat />);
    fireEvent.click(screen.getByRole('button', { name: new RegExp(KOS.nama) }));
    const panel = screen.getByRole('region', { name: /Jual/i });
    expect(within(panel).getByText('Cicilan yang lenyap')).toBeTruthy();
    expect(within(panel).getByText('Arus kas yang hilang')).toBeTruthy();
    expect(within(panel).getByText('Nilai jual')).toBeTruthy();
  });
});
