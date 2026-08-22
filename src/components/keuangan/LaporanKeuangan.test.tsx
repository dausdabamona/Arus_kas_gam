import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';
import { LaporanKeuangan } from './LaporanKeuangan';
import { stateAwal } from '../../engine/reducer';
import type { KondisiKeuangan } from '../../engine/keuangan';

const dasar = () => stateAwal('uji-laporan', 'asn-3b').keuangan;

const EMAS = { id: 'pasar-emas', nama: 'Emas', nilai: 12_000_000, arusKasBulanan: 0, instrumenId: 'emas', unit: 3 };
const KOS = { id: 'kos-satu-pintu-0', nama: 'Kamar kos satu pintu', nilai: 45_000_000, arusKasBulanan: 750_000 };
const UTANG_KOS = {
  id: 'utang-kos-satu-pintu-0',
  nama: 'Utang Kamar kos satu pintu',
  sisaUtang: 36_000_000,
  cicilanBulanan: 450_000,
  pokokAwal: 36_000_000,
  asetId: 'kos-satu-pintu-0',
};

function lengkap(): KondisiKeuangan {
  const k = dasar();
  return { ...k, aset: [EMAS, KOS], liabilitas: [...k.liabilitas, UTANG_KOS] };
}

function gambar(keuangan: KondisiKeuangan = lengkap()) {
  return render(<LaporanKeuangan keuangan={keuangan} onPilihLiabilitas={() => {}} />);
}

afterEach(cleanup);

describe('urutan dua laporan', () => {
  /** Game ini melatih menaikkan arus kas — laporan itu yang dibuka lebih dulu. */
  it('menempatkan Arus Kas sebelum Neraca', () => {
    const { container } = gambar();
    const teks = container.textContent ?? '';
    expect(teks.indexOf('Arus kas')).toBeGreaterThanOrEqual(0);
    expect(teks.indexOf('Neraca')).toBeGreaterThan(teks.indexOf('Arus kas'));
  });
});

describe('bagian arus kas', () => {
  it('memecah pemasukan per sumber, bukan satu angka pasif', () => {
    gambar();
    const bagian = screen.getByRole('region', { name: /Arus kas/i });
    expect(within(bagian).getByText('Gaji')).toBeTruthy();
    expect(within(bagian).getByText(KOS.nama)).toBeTruthy();
  });

  it('tidak mencantumkan aset tanpa arus kas di sisi pemasukan', () => {
    const bagian = gambar().container.querySelector('[aria-label*="Arus kas"]')!;
    expect(within(bagian as HTMLElement).queryByText(EMAS.nama)).toBeNull();
  });

  it('memecah pengeluaran per beban, termasuk tiap cicilan bernama', () => {
    gambar();
    const bagian = screen.getByRole('region', { name: /Arus kas/i });
    expect(within(bagian).getByText(/Hidup tetap/)).toBeTruthy();
    expect(within(bagian).getByText(/Biaya anak/)).toBeTruthy();
    expect(within(bagian).getByText(UTANG_KOS.nama)).toBeTruthy();
  });

  it('menandai cicilan yang melekat aset dengan nama asetnya', () => {
    gambar();
    const bagian = screen.getByRole('region', { name: /Arus kas/i });
    expect(within(bagian).getAllByText(new RegExp(KOS.nama)).length).toBeGreaterThan(1);
  });
});

describe('bagian neraca', () => {
  /** Bug yang memicu seluruh tambalan ini: aset tanpa arus kas tidak pernah terlihat. */
  it('menampilkan aset yang arus kasnya nol', () => {
    gambar();
    const bagian = screen.getByRole('region', { name: /Neraca/i });
    expect(within(bagian).getByText(EMAS.nama)).toBeTruthy();
  });

  it('menampilkan setiap aset beserta ekuitasnya', () => {
    gambar();
    // Dicari di dalam kelompok asetnya sendiri: angka 9.000.000 juga muncul
    // sebagai sisa utang motor di tempat lain, dan pencarian selebar layar
    // akan cocok dengan yang salah.
    const baris = screen.getByRole('group', { name: KOS.nama });
    expect(within(baris).getByText(/45\.000\.000/)).toBeTruthy();
    expect(within(baris).getByText(/36\.000\.000/)).toBeTruthy();
    // Ekuitas kos = 45jt − 36jt = 9jt
    expect(within(baris).getByText(/\b9\.000\.000/)).toBeTruthy();
  });

  it('menampilkan unit x harga untuk aset pasar', () => {
    gambar();
    const bagian = screen.getByRole('region', { name: /Neraca/i });
    expect(within(bagian).getByText(/3 unit/)).toBeTruthy();
  });

  it('memisahkan utang murni dari utang yang melekat aset', () => {
    gambar();
    const bagian = screen.getByRole('region', { name: /Neraca/i });
    // KPR subsidi adalah beban murni bawaan profesi.
    expect(within(bagian).getByText('KPR subsidi')).toBeTruthy();
    // Utang kos melekat pada asetnya, jadi tidak diulang sebagai utang murni.
    expect(within(bagian).queryByText(UTANG_KOS.nama)).toBeNull();
  });

  it('menampilkan kas dan kekayaan bersih', () => {
    gambar();
    const bagian = screen.getByRole('region', { name: /Neraca/i });
    expect(within(bagian).getByText(/Kas/)).toBeTruthy();
    expect(within(bagian).getByText(/Kekayaan bersih/)).toBeTruthy();
  });

  it('menampilkan ekuitas negatif apa adanya, tidak disembunyikan', () => {
    const k = dasar();
    const terbenam = {
      ...k,
      aset: [{ id: 'motor-0', nama: 'Motor sewa', nilai: 4_000_000, arusKasBulanan: 500_000 }],
      liabilitas: [
        ...k.liabilitas,
        {
          id: 'utang-motor-0',
          nama: 'Utang motor sewa',
          sisaUtang: 9_000_000,
          cicilanBulanan: 400_000,
          pokokAwal: 9_000_000,
          asetId: 'motor-0',
        },
      ],
    };
    gambar(terbenam);
    const baris = screen.getByRole('group', { name: 'Motor sewa' });
    expect(within(baris).getByText(/-Rp\s?5\.000\.000/)).toBeTruthy();
  });
});

describe('baris utang tetap bisa ditekan', () => {
  it('memanggil onPilihLiabilitas dengan id utangnya', () => {
    const dipilih: string[] = [];
    render(<LaporanKeuangan keuangan={lengkap()} onPilihLiabilitas={(id) => dipilih.push(id)} />);
    const tombol = screen.getAllByRole('button');
    expect(tombol.length).toBeGreaterThan(0);
    tombol[0].click();
    expect(dipilih.length).toBe(1);
  });
});
