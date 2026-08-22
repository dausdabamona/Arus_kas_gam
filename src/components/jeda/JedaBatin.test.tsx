import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, act } from '@testing-library/react';
import { LayarPapan } from '../../screens/LayarPapan';
import { usePermainan } from '../../hooks/use-permainan';
import { stateAwal } from '../../engine/reducer';
import { cariKartuGuncang } from '../../data/kartu-guncang';
import {
  NASKAH_TENANG,
  TAWARAN_JEDA,
  LABEL_TOMBOL,
  TANYA_TEMU,
  NASKAH_TANAM,
} from '../../data/naskah-jeda';
import type { StatePermainan } from '../../types/state';
import type { Kejadian } from '../../types/kejadian';

const terkirim: Kejadian[] = [];

function pasangState(ubah: (s: StatePermainan) => StatePermainan) {
  const awal = ubah(stateAwal('uji-jeda-ui', 'asn-3b'));
  usePermainan.setState({
    state: awal,
    permainanId: 'g-uji',
    nomorKejadian: 1,
    memproses: false,
    // Jalur Dexie dilewati: yang diuji di sini alur layar, bukan penyimpanan.
    kirim: async (baru) => {
      const kejadian = { ...baru, t: terkirim.length + 1 } as Kejadian;
      terkirim.push(kejadian);
      const { reduce } = await import('../../engine/reducer');
      usePermainan.setState((t) => ({ state: t.state ? reduce(t.state, kejadian) : null }));
    },
  });
}

const denganGuncang = (s: StatePermainan): StatePermainan => {
  const kartu = cariKartuGuncang('orang-tua-sakit');
  return { ...s, guncangTerbuka: { kartuId: kartu.id, judul: kartu.judul, teks: kartu.teks } };
};

beforeEach(() => {
  terkirim.length = 0;
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('Jeda Batin muncul di puncak reaksi', () => {
  it('menawarkan suhu lebih dulu, bukan kartunya', () => {
    pasangState(denganGuncang);
    render(<LayarPapan />);
    expect(screen.getByRole('slider')).toBeTruthy();
    expect(screen.queryByText(cariKartuGuncang('orang-tua-sakit').teks)).toBeNull();
  });

  it('tidak menawarkan jeda untuk peluang kecil', () => {
    pasangState((s) => ({
      ...s,
      kartuTerbuka: {
        id: 'kos-satu-pintu', tumpukan: 'PELUANG_KECIL', judul: 'Kamar kos',
        keterangan: '-', harga: 1, uangMuka: 1, arusKasBulanan: 1, sisaUtang: 0,
        cicilanBulanan: 0, kelas: 'stagnan', driftBulanan: 0, volatilitasBulanan: 0,
      },
    }));
    render(<LayarPapan />);
    expect(screen.queryByRole('slider')).toBeNull();
  });

  it('menurunkan pemain ke badan, bukan ke hitungan napas', async () => {
    pasangState(denganGuncang);
    render(<LayarPapan />);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: LABEL_TOMBOL.catat })); });
    fireEvent.click(screen.getByRole('button', { name: TAWARAN_JEDA.jeda }));
    expect(screen.getByText(NASKAH_TENANG[0])).toBeTruthy();
  });

  it('memakai pertanyaan Temu yang cocok dengan pemicu kartunya', async () => {
    pasangState(denganGuncang);
    render(<LayarPapan />);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: LABEL_TOMBOL.catat })); });
    fireEvent.click(screen.getByRole('button', { name: TAWARAN_JEDA.jeda }));
    for (let i = 0; i < NASKAH_TENANG.length; i++) {
      fireEvent.click(screen.getByText(NASKAH_TENANG[Math.min(i, NASKAH_TENANG.length - 1)]));
    }
    fireEvent.click(screen.getByRole('button', { name: 'Dada' }));
    expect(screen.getByText(TANYA_TEMU.keamanan)).toBeTruthy();
  });

  /**
   * Petunjuk Tanam pernah hanya hidup sebagai placeholder: ia terpotong di
   * kolom dua baris, lalu lenyap sama sekali begitu pemain mengetik huruf
   * pertama. Petunjuk yang tidak terbaca sama saja dengan yang tidak ada,
   * jadi ia dituntut tampil sebagai teks — `getByText` tidak melihat placeholder.
   */
  it('menampilkan petunjuk Tanam sebagai teks, bukan sekadar placeholder', async () => {
    pasangState(denganGuncang);
    render(<LayarPapan />);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: LABEL_TOMBOL.catat })); });
    fireEvent.click(screen.getByRole('button', { name: TAWARAN_JEDA.jeda }));
    for (let i = 0; i < NASKAH_TENANG.length; i++) {
      fireEvent.click(screen.getByText(NASKAH_TENANG[Math.min(i, NASKAH_TENANG.length - 1)]));
    }
    fireEvent.click(screen.getByRole('button', { name: 'Dada' }));
    fireEvent.click(screen.getByRole('button', { name: LABEL_TOMBOL.lanjut }));
    await act(async () => { fireEvent.click(screen.getByText('Kalimat di kepala')); });

    expect(screen.getByText(NASKAH_TANAM.kalimat)).toBeTruthy();
    expect(screen.getByText(NASKAH_TANAM.tindakan)).toBeTruthy();
  });

  it('mengirim LEWATI_JEDA tanpa menyentuh skor saat dilewati', async () => {
    pasangState(denganGuncang);
    render(<LayarPapan />);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: LABEL_TOMBOL.catat })); });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: TAWARAN_JEDA.langsung }));
    });
    expect(terkirim.map((k) => k.tipe)).toEqual(['SUHU_BATIN', 'LEWATI_JEDA']);
    expect(usePermainan.getState().state!.skor).toEqual({
      keputusanBertekanan: 0, keputusanTenang: 0,
    });
  });

  it('menampilkan kartunya setelah jeda selesai atau dilewati', async () => {
    pasangState(denganGuncang);
    render(<LayarPapan />);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: LABEL_TOMBOL.catat })); });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: TAWARAN_JEDA.langsung }));
    });
    expect(screen.getByText(cariKartuGuncang('orang-tua-sakit').teks)).toBeTruthy();
  });
});

describe('timer pasar membeku selama jeda terbuka', () => {
  it('detik tidak berkurang selagi jeda masih di layar', () => {
    vi.useFakeTimers();
    pasangState((s) => ({ ...s, pasarTerbuka: 'emas' }));
    render(<LayarPapan />);
    const sebelum = screen.getByText(/20/).textContent;
    act(() => { vi.advanceTimersByTime(15_000); });
    expect(screen.getByText(/detik/).textContent).toBe(sebelum);
  });

  it('detik kembali berjalan setelah jeda dilewati', async () => {
    vi.useFakeTimers();
    pasangState((s) => ({ ...s, pasarTerbuka: 'emas' }));
    render(<LayarPapan />);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: LABEL_TOMBOL.catat })); });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: TAWARAN_JEDA.langsung }));
    });
    const sebelum = screen.getByText(/detik/).textContent;
    act(() => { vi.advanceTimersByTime(10_000); });
    expect(screen.getByText(/detik/).textContent).not.toBe(sebelum);
  });
});
