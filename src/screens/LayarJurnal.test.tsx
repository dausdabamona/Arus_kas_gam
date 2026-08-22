import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, act } from '@testing-library/react';
import App from '../App';
import { usePermainan } from '../hooks/use-permainan';
import { db, tambahJurnal, type EntriJurnal } from '../lib/db';
import {
  JUDUL_JURNAL,
  PENJELASAN_JURNAL,
  JURNAL_KOSONG_SEMUA,
  LABEL_EKSPOR,
  LABEL_KEMBALI,
  LABEL_SALIN_TEKS,
  NAMA_KEBUTUHAN,
} from '../data/naskah-jurnal';
import { NASKAH_TUAI } from '../data/naskah-jeda';

async function tunggu(syarat: () => boolean) {
  for (let i = 0; i < 60 && !syarat(); i++) {
    await act(async () => {
      await new Promise((r) => setTimeout(r, 1));
    });
  }
}

function entri(bagian: Partial<EntriJurnal> = {}): EntriJurnal {
  return {
    permainanId: 'g1',
    dibuatPada: 1000,
    kebutuhan: 'keamanan',
    kalimat: 'Rezeki saya tidak ditentukan satu tawaran.',
    tindakan: 'Tunggu satu giliran.',
    hasilLuar: 0,
    hasilDalam: 'tenang',
    ...bagian,
  };
}

async function buka() {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: JUDUL_JURNAL }));
  await tunggu(() => screen.queryByText(PENJELASAN_JURNAL) !== null);
}

beforeEach(async () => {
  await db.jurnal.clear();
  await db.permainan.clear();
  await db.kejadian.clear();
  usePermainan.setState({ state: null, permainanId: null, nomorKejadian: 0, galatMuat: null });
});
afterEach(cleanup);

describe('jurnal dibuka dari layar mulai', () => {
  it('jurnal milik pemain, jadi jalannya ada sebelum permainan dimulai', async () => {
    await buka();
    expect(screen.getByText(PENJELASAN_JURNAL)).toBeTruthy();
  });

  it('kembali mengembalikan ke layar mulai', async () => {
    await buka();
    fireEvent.click(screen.getByRole('button', { name: LABEL_KEMBALI }));
    expect(screen.getByLabelText(/benih/i)).toBeTruthy();
  });
});

describe('isi jurnal', () => {
  it('mengumpulkan entri dari semua permainan, terbaru dulu', async () => {
    await tambahJurnal(entri({ permainanId: 'g1', dibuatPada: 1000, kalimat: 'Kalimat lama.' }));
    await tambahJurnal(entri({ permainanId: 'g2', dibuatPada: 3000, kalimat: 'Kalimat baru.' }));
    await buka();
    await tunggu(() => screen.queryByText('Kalimat baru.') !== null);

    const teks = document.body.textContent ?? '';
    expect(teks.indexOf('Kalimat baru.')).toBeLessThan(teks.indexOf('Kalimat lama.'));
  });

  /**
   * Aturan Tuai §9.3 berlaku juga di sini: dua sisi, bobot sama. Jurnal yang
   * cuma menyimpan sisi uang membuat separuh latihannya lenyap dari ingatan
   * pemain — dan jurnal adalah satu-satunya tempat sisi dalam masih tersimpan
   * setelah permainannya lewat.
   */
  it('menampilkan kedua sisi hasil, bukan sisi uangnya saja', async () => {
    await tambahJurnal(entri({ hasilLuar: 2_500_000, hasilDalam: 'tersulut' }));
    await buka();
    await tunggu(() => screen.queryByText(NASKAH_TUAI.tersulut) !== null);
    expect(screen.getByText(NASKAH_TUAI.hasilLuar)).toBeTruthy();
    expect(screen.getByText(NASKAH_TUAI.hasilDalam)).toBeTruthy();
    expect(screen.getByText(NASKAH_TUAI.tersulut)).toBeTruthy();
  });

  it('hasil luar nol tampil sebagai tanda hubung, bukan Rp 0', async () => {
    // Nol berarti tak terukur, bukan impas — aturan yang sama dengan Layar Panen.
    await tambahJurnal(entri({ hasilLuar: 0 }));
    await buka();
    await tunggu(() => screen.queryByText(NASKAH_TUAI.takTerukur) !== null);
    expect(screen.getByText(NASKAH_TUAI.takTerukur)).toBeTruthy();
    expect(screen.queryByText('Rp 0')).toBeNull();
  });

  it('menandai kebutuhan yang sedang tersentuh', async () => {
    await tambahJurnal(entri({ kebutuhan: 'kendali' }));
    await buka();
    await tunggu(() => screen.queryByText(NAMA_KEBUTUHAN.kendali) !== null);
    expect(screen.getByText(NAMA_KEBUTUHAN.kendali)).toBeTruthy();
  });

  it('berkata terus terang ketika masih kosong', async () => {
    await buka();
    await tunggu(() => screen.queryByText(JURNAL_KOSONG_SEMUA) !== null);
    expect(screen.getByText(JURNAL_KOSONG_SEMUA)).toBeTruthy();
  });
});

describe('ekspor manual (§4.6.2)', () => {
  it('tombolnya ada dan benar-benar memanggil pengunduhnya', async () => {
    await tambahJurnal(entri());
    const klik = vi.fn();
    const asli = document.createElement.bind(document);
    const mata = vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = asli(tag) as HTMLElement;
      if (tag === 'a') el.click = klik;
      return el;
    });
    // jsdom belum punya createObjectURL.
    URL.createObjectURL = vi.fn(() => 'blob:uji');
    URL.revokeObjectURL = vi.fn();

    await buka();
    fireEvent.click(screen.getByRole('button', { name: LABEL_EKSPOR }));
    await tunggu(() => klik.mock.calls.length > 0);

    expect(klik).toHaveBeenCalled();
    mata.mockRestore();
  });
});

describe('pola kebutuhan di layar jurnal (§12)', () => {
  const tigaEntri = async () => {
    await tambahJurnal(entri({ permainanId: 'g1', dibuatPada: 1000, kebutuhan: 'keamanan' }));
    await tambahJurnal(entri({ permainanId: 'g1', dibuatPada: 2000, kebutuhan: 'keamanan' }));
    await tambahJurnal(entri({ permainanId: 'g2', dibuatPada: 3000, kebutuhan: 'kendali' }));
  };

  it('menyatakan satu pola dengan dua angka dan satu nama', async () => {
    await tigaEntri();
    await buka();
    await tunggu(() => screen.queryByText(/momen bertekanan/) !== null);
    expect(screen.getByText('Dari 3 momen bertekanan, 2 berhenti di keamanan.')).toBeTruthy();
  });

  it('menghitung lintas permainan, bukan permainan terakhir saja', async () => {
    await tigaEntri();
    await buka();
    await tunggu(() => screen.queryByText(/momen bertekanan/) !== null);
    // g1 punya 2 entri, g2 punya 1. Totalnya harus 3.
    expect(screen.getByText(/Dari 3 momen/)).toBeTruthy();
  });

  it('diam saat tidak ada satu pola yang bisa dinyatakan', async () => {
    await tambahJurnal(entri({ dibuatPada: 1000, kebutuhan: 'keamanan' }));
    await tambahJurnal(entri({ dibuatPada: 2000, kebutuhan: 'kendali' }));
    await buka();
    await tunggu(() => screen.queryAllByText(/Tunggu satu giliran/).length > 0);
    expect(screen.queryByText(/momen bertekanan/)).toBeNull();
  });

  it('diam pada jurnal kosong', async () => {
    await buka();
    await tunggu(() => screen.queryByText(JURNAL_KOSONG_SEMUA) !== null);
    expect(screen.queryByText(/momen bertekanan/)).toBeNull();
  });

  /**
   * Prinsip 4: game menunjukkan, tidak menceramahi. Kalimat pola hanya boleh
   * memuat hitungan — begitu ia memakai kata sambung yang menyimpulkan, ia
   * berhenti menjadi pola dan menjadi diagnosis.
   */
  it('tidak menempelkan kesimpulan pada polanya', async () => {
    await tigaEntri();
    await buka();
    await tunggu(() => screen.queryByText(/momen bertekanan/) !== null);
    const teks = screen.getByText(/momen bertekanan/).textContent?.toLowerCase() ?? '';
    for (const kata of ['berarti', 'karena', 'cenderung', 'sebaiknya', 'kamu']) {
      expect(teks).not.toContain(kata);
    }
  });
});

describe('ekspor markdown (§12)', () => {
  it('tombolnya ada dan benar-benar memanggil pengunduhnya', async () => {
    await tambahJurnal(entri());
    const klik = vi.fn();
    const asli = document.createElement.bind(document);
    const mata = vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = asli(tag) as HTMLElement;
      if (tag === 'a') el.click = klik;
      return el;
    });
    URL.createObjectURL = vi.fn(() => 'blob:uji');
    URL.revokeObjectURL = vi.fn();

    await buka();
    fireEvent.click(screen.getByRole('button', { name: LABEL_SALIN_TEKS }));
    await tunggu(() => klik.mock.calls.length > 0);

    expect(klik).toHaveBeenCalled();
    mata.mockRestore();
  });

  it('berdampingan dengan cadangan .json — dua tugas, dua tombol', async () => {
    await buka();
    expect(screen.getByRole('button', { name: LABEL_SALIN_TEKS })).toBeTruthy();
    expect(screen.getByRole('button', { name: LABEL_EKSPOR })).toBeTruthy();
  });
});
