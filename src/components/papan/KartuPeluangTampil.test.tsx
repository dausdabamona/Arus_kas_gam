import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { KartuPeluangTampil } from './KartuPeluangTampil';
import { cariProfesi } from '../../data/profesi';
import { rupiah } from '../../lib/format';
import type { KartuPeluang } from '../../types/kartu';

const KARTU: KartuPeluang = {
  id: 'motor-sewa',
  tumpukan: 'PELUANG_KECIL',
  judul: 'Motor untuk disewakan',
  keterangan: 'Motor bekas yang bisa disewakan harian.',
  harga: 14_000_000,
  uangMuka: 3_000_000,
  arusKasBulanan: 350_000,
  sisaUtang: 11_000_000,
  cicilanBulanan: 300_000,
  kelas: 'depresiasi',
  driftBulanan: -0.01,
  volatilitasBulanan: 0.02,
};

const KEUANGAN = { ...cariProfesi('asn-3b').kondisiAwal, saldoKas: 20_000_000 };

function pasang(onPutuskan = vi.fn()) {
  render(<KartuPeluangTampil kartu={KARTU} keuangan={KEUANGAN} onPutuskan={onPutuskan} />);
  return onPutuskan;
}

const bukaLaporan = () => fireEvent.click(screen.getByRole('button', { name: 'Keuangan' }));
const tutupLaporan = () =>
  fireEvent.click(
    screen.getByRole('dialog', { name: 'Laporan keuangan' }).querySelector('button[aria-label="Tutup"]')!,
  );

afterEach(cleanup);

describe('laporan keuangan bisa dibuka saat kartu tawaran terbuka', () => {
  it('menawarkan tombol Keuangan berdampingan dengan keputusan', () => {
    pasang();
    expect(screen.getByRole('button', { name: 'Keuangan' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Ambil' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Lewati' })).toBeTruthy();
  });

  it('membuka laporan lengkap dengan aset dan rincian arus kas', () => {
    pasang();
    bukaLaporan();
    const laporan = screen.getByRole('dialog', { name: 'Laporan keuangan' });
    // Arus kas lebih dulu, lalu neraca — urutan yang dikunci di tambalan neraca.
    expect(laporan.textContent).toContain('Masuk');
    expect(laporan.textContent).toContain('Keluar');
    expect(laporan.textContent).toContain('Neraca');
    expect(laporan.textContent).toContain('Aset');
    expect(laporan.textContent).toContain('Kekayaan bersih');
  });

  /**
   * Kartu tetap di belakang. Membuka laporan BUKAN keputusan; pemain yang
   * kehilangan tawarannya karena memeriksa angka akan belajar untuk tidak
   * memeriksa angka — persis kebalikan dari yang dilatih permainan ini.
   */
  it('kartu masih utuh setelah laporan ditutup', () => {
    const onPutuskan = pasang();
    bukaLaporan();
    tutupLaporan();

    expect(screen.getByRole('button', { name: 'Ambil' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Lewati' })).toBeTruthy();
    expect(screen.getByText(KARTU.judul)).toBeTruthy();
    expect(onPutuskan).not.toHaveBeenCalled();
  });

  it('keputusan masih berjalan setelah laporan pernah dibuka', () => {
    const onPutuskan = pasang();
    bukaLaporan();
    tutupLaporan();
    fireEvent.click(screen.getByRole('button', { name: 'Ambil' }));
    expect(onPutuskan).toHaveBeenCalledWith('ambil');
  });

  /**
   * Laporan di sini hanya MEMBACA. Baris utang di laporan biasanya membuka
   * lembar pelunasan — melunasi utang di tengah keputusan yang belum diambil
   * adalah kejadian permainan yang lahir dari layar yang sedang menunggu.
   */
  it('mengetuk baris utang di dalam kartu tidak melakukan apa-apa', () => {
    const onPutuskan = pasang();
    bukaLaporan();
    const laporan = screen.getByRole('dialog', { name: 'Laporan keuangan' });
    const barisUtang = laporan.querySelectorAll('button');
    for (const b of Array.from(barisUtang)) {
      if (b.getAttribute('aria-label') !== 'Tutup') fireEvent.click(b);
    }

    expect(onPutuskan).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog', { name: /Pelunasan/i })).toBeNull();
  });

  it('tidak membuka laporan sebelum diminta', () => {
    pasang();
    expect(screen.queryByRole('dialog', { name: 'Laporan keuangan' })).toBeNull();
  });
});

describe('ringkasan kredit di kartu tawaran', () => {
  const ringkasan = () => screen.getByRole('group', { name: 'Ringkasan kredit' });

  function pasangKartu(bagian: Partial<KartuPeluang>) {
    render(
      <KartuPeluangTampil
        kartu={{ ...KARTU, ...bagian }}
        keuangan={KEUANGAN}
        onPutuskan={vi.fn()}
      />,
    );
  }

  it('menampilkan tiga angka untuk kartu berutang', () => {
    pasangKartu({ sisaUtang: 88_000_000, cicilanBulanan: 500_000, arusKasBulanan: 1_000_000, uangMuka: 12_000_000 });
    // rupiah() memakai spasi tak-putus setelah "Rp"; menulis literalnya di tes
    // berarti menguji spasi, bukan angka.
    const teks = ringkasan().textContent ?? '';
    expect(teks).toContain(`Cicilan ${rupiah(500_000)}`);
    expect(teks).toContain(`Selisih +${rupiah(500_000)}`);
    expect(teks).toContain('Balik modal ~2 th');
  });

  it('balik modal pecahan memakai koma, bukan titik', () => {
    // 80.000.000 / 2.100.000 / 12 = 3,17 -> 3,2
    pasangKartu({ sisaUtang: 180_000_000, cicilanBulanan: 3_400_000, arusKasBulanan: 5_500_000, uangMuka: 80_000_000 });
    expect(ringkasan().textContent).toContain('~3,2 th');
  });

  it('tidak ada ringkasan untuk kartu tanpa utang', () => {
    pasangKartu({ sisaUtang: 0, cicilanBulanan: 0 });
    expect(screen.queryByRole('group', { name: 'Ringkasan kredit' })).toBeNull();
  });

  /**
   * Selisih minus bukan kartu buruk — itu pertukaran yang sah (§8.3): kas
   * berkurang, ekuitas tumbuh. Yang dilarang adalah menempelkan penilaian.
   */
  it('selisih minus tampil tanpa balik modal', () => {
    pasangKartu({ sisaUtang: 88_000_000, cicilanBulanan: 900_000, arusKasBulanan: 350_000 });
    const teks = ringkasan().textContent ?? '';
    expect(teks).not.toContain('Balik modal');
  });

  /**
   * Arah nilai mengikuti KELAS, bukan selisihnya. Mengucapkan "nilai naik" pada
   * motor sewa yang menyusut adalah permainan yang menyatakan hal yang tidak
   * terjadi (§8.2), dan itulah yang terjadi sebelum §19 dibaca ulang.
   */
  it.each([
    ['apresiasi', 'Nilai naik'],
    ['stagnan', 'Nilai nyaris diam'],
    ['depresiasi', 'Nilai turun'],
  ] as const)('kelas %s berkata "%s"', (kelas, kalimat) => {
    pasangKartu({ sisaUtang: 88_000_000, cicilanBulanan: 900_000, arusKasBulanan: 350_000, kelas });
    expect(ringkasan().textContent).toContain(kalimat);
  });

  it('arah nilai tetap tampil meski selisihnya positif — dua sumbu, bukan satu', () => {
    // Kapal: arus kas terbesar, nilai paling cepat turun (§8.3). Angka balik
    // modal sendirian menceritakan separuh.
    pasangKartu({
      sisaUtang: 180_000_000, cicilanBulanan: 3_400_000,
      arusKasBulanan: 5_500_000, uangMuka: 80_000_000, kelas: 'depresiasi',
    });
    const teks = ringkasan().textContent ?? '';
    expect(teks).toContain('Balik modal');
    expect(teks).toContain('Nilai turun');
  });

  it('selisih positif hijau, selisih minus merah', () => {
    pasangKartu({ sisaUtang: 88_000_000, cicilanBulanan: 500_000, arusKasBulanan: 1_000_000 });
    expect(ringkasan().querySelector('[data-selisih]')?.className).toContain('text-untung');
    cleanup();
    pasangKartu({ sisaUtang: 88_000_000, cicilanBulanan: 900_000, arusKasBulanan: 350_000 });
    expect(ringkasan().querySelector('[data-selisih]')?.className).toContain('text-rugi');
  });

  it('tidak menempelkan penilaian pada angkanya', () => {
    pasangKartu({ sisaUtang: 88_000_000, cicilanBulanan: 900_000, arusKasBulanan: 350_000 });
    const teks = (ringkasan().textContent ?? '').toLowerCase();
    for (const kata of ['bagus', 'buruk', 'rugi', 'jangan', 'sebaiknya', 'hati-hati']) {
      expect(teks).not.toContain(kata);
    }
  });
});
