import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, act } from '@testing-library/react';
import App from '../App';
import { usePermainan } from '../hooks/use-permainan';
import { stateAwal } from '../engine/reducer';
import { db, tambahJurnal } from '../lib/db';
import { reduce } from '../engine/reducer';
import type { Kejadian } from '../types/kejadian';
import {
  AJAKAN_BERHENTI,
  AJAKAN_NIAT_TERCAPAI,
  PENJELASAN_BERHENTI,
  JUDUL_KEKAYAAN,
  JUDUL_KEMERDEKAAN,
  JUDUL_KUADRAN,
  KETERANGAN_KUADRAN,
  KETERANGAN_AKHIR,
  BELUM_TERUJI,
  CATATAN_ALAT_LATIHAN,
  DISCLAIMER,
  JURNAL_KOSONG,
  JUDUL_SATU_PAPAN,
  KETERANGAN_SATU_PAPAN,
  CATATAN_BERHENTI_SADAR,
} from '../data/naskah-akhir';
import type { AlasanAkhir, StatePermainan } from '../types/state';

async function tunggu(syarat: () => boolean) {
  for (let i = 0; i < 50 && !syarat(); i++) {
    await act(async () => {
      await new Promise((r) => setTimeout(r, 1));
    });
  }
}

function selesai(ubah: (s: StatePermainan) => StatePermainan = (s) => s, alasan: AlasanAkhir = 'lolos') {
  usePermainan.setState({
    state: ubah({ ...stateAwal('kabut-rusa-lontar', 'asn-3b'), status: 'selesai', alasanAkhir: alasan }),
    permainanId: 'g-uji',
    nomorKejadian: 1,
    memproses: false,
    galatMuat: null,
  });
}

const kaya = (s: StatePermainan): StatePermainan => ({
  ...s,
  keuangan: {
    ...s.keuangan,
    aset: [{ id: 'kos', nama: 'Kos', nilai: 900_000_000, arusKasBulanan: 50_000_000 }],
  },
});
const teruji = (tenang: number, ujian: number) => (s: StatePermainan): StatePermainan => ({
  ...s,
  skor: { keputusanTenang: tenang, keputusanBertekanan: ujian },
});

beforeEach(async () => {
  await db.jurnal.clear();
  await db.kejadian.clear();
  await db.permainan.clear();
});
afterEach(cleanup);

describe('Layar Akhir berdiri begitu permainan selesai', () => {
  it('menggantikan papan', () => {
    selesai();
    render(<App />);
    expect(screen.queryByRole('button', { name: /^Lempar dadu/ })).toBeNull();
    expect(screen.getByText(JUDUL_KEKAYAAN)).toBeTruthy();
    expect(screen.getByText(JUDUL_KEMERDEKAAN)).toBeTruthy();
  });

  /**
   * BOBOT SETARA, dijamin bangunannya. Kedua papan dirakit komponen yang sama;
   * kalau salah satunya suatu hari ditulis tangan dengan judul lebih besar,
   * className-nya tidak akan cocok lagi dan tes ini menyala. Menjaganya dengan
   * mata saja berarti menunggu revisi tata letak berikutnya.
   */
  it('dua papan, dirakit dari cetakan yang sama persis', () => {
    selesai();
    render(<App />);
    const papan = document.querySelectorAll('[data-papan]');
    expect(papan).toHaveLength(2);
    expect(papan[0].className).toBe(papan[1].className);
    expect(papan[0].querySelector('h2')?.className).toBe(papan[1].querySelector('h2')?.className);
  });

  it('papan Kekayaan membawa dua angka, bukan satu', () => {
    selesai(kaya);
    render(<App />);
    const kotak = screen.getByText(JUDUL_KEKAYAAN).closest('[data-papan]');
    expect(kotak?.textContent).toContain('Kekayaan bersih');
    expect(kotak?.textContent).toContain('Pendapatan pasif');
  });

  it('papan Kemerdekaan menampilkan jumlah ujian, bukan skornya saja', () => {
    selesai(teruji(7, 10));
    render(<App />);
    const kotak = screen.getByText(JUDUL_KEMERDEKAAN).closest('[data-papan]');
    expect(kotak?.textContent).toContain('10');
  });

  it('papan yang belum teruji berkata menunggu, bukan menilai', () => {
    selesai(teruji(0, 0));
    render(<App />);
    expect(screen.getByText(BELUM_TERUJI)).toBeTruthy();
  });
});

describe('kuadran §10.3', () => {
  it.each([
    [kaya, teruji(10, 10), 'bebas'],
    [kaya, teruji(0, 10), 'kaya-terikat'],
    [(s: StatePermainan) => s, teruji(10, 10), 'tenang-belum-berdaya'],
    [(s: StatePermainan) => s, teruji(0, 10), 'belum-jalan'],
  ] as const)('menampilkan kuadran %#: %s', (uang, skor, kuadran) => {
    selesai((s) => skor(uang(s)));
    render(<App />);
    expect(screen.getByText(JUDUL_KUADRAN[kuadran])).toBeTruthy();
    expect(screen.getByText(KETERANGAN_KUADRAN[kuadran])).toBeTruthy();
  });
});

describe('alasan akhir (§7.3)', () => {
  it.each(['lolos', 'menyerah', 'bangkrut'] as const)('menerangkan akhir "%s"', (alasan) => {
    selesai((s) => s, alasan);
    render(<App />);
    expect(screen.getByText(KETERANGAN_AKHIR[alasan])).toBeTruthy();
  });

  it('berhenti dengan sadar tidak pernah menampilkan kata "menyerah"', () => {
    selesai((s) => s, 'menyerah');
    render(<App />);
    expect(document.body.textContent?.toLowerCase()).not.toContain('menyerah');
  });
});

describe('konteks dan catatan wajib', () => {
  it('menampilkan benih dan profesi bersama-sama', () => {
    selesai();
    render(<App />);
    const kotak = screen.getByText('kabut-rusa-lontar').closest('[data-benih]');
    expect(kotak?.textContent).toContain('ASN Golongan III/b');
  });

  it('memuat kedua catatan wajib §2 dan §15.4', () => {
    selesai();
    render(<App />);
    expect(screen.getByText(DISCLAIMER)).toBeTruthy();
    expect(screen.getByText(CATATAN_ALAT_LATIHAN)).toBeTruthy();
  });
});

describe('jurnal permainan ini', () => {
  it('menampilkan kalimat yang ditanam di permainan ini saja', async () => {
    await tambahJurnal({
      permainanId: 'g-uji',
      dibuatPada: 1000,
      kebutuhan: 'keamanan',
      kalimat: 'Rezeki saya tidak ditentukan satu tawaran.',
      tindakan: 'Tunggu satu giliran.',
      hasilLuar: 0,
      hasilDalam: 'tenang',
    });
    await tambahJurnal({
      permainanId: 'g-lain',
      dibuatPada: 2000,
      kebutuhan: 'kendali',
      kalimat: 'Milik permainan lain.',
      tindakan: 'Diamkan.',
      hasilLuar: 0,
      hasilDalam: 'tenang',
    });
    selesai();
    render(<App />);
    await tunggu(() => screen.queryByText('Rezeki saya tidak ditentukan satu tawaran.') !== null);
    expect(screen.getByText('Rezeki saya tidak ditentukan satu tawaran.')).toBeTruthy();
    expect(screen.queryByText('Milik permainan lain.')).toBeNull();
  });

  it('berkata terus terang ketika tidak ada yang ditanam', async () => {
    selesai();
    render(<App />);
    await tunggu(() => screen.queryByText(JURNAL_KOSONG) !== null);
    expect(screen.getByText(JURNAL_KOSONG)).toBeTruthy();
  });
});

describe('jalan keluar', () => {
  it('mulai lagi mengembalikan pemain ke layar mulai', () => {
    selesai();
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Mulai lagi/ }));
    expect(usePermainan.getState().state).toBeNull();
    expect(screen.getByLabelText(/benih/i)).toBeTruthy();
  });
});

describe('jalan keluar yang sadar dari Lingkar Luas (§7.3)', () => {
  function diLuas() {
    usePermainan.setState({
      state: {
        ...stateAwal('kabut-rusa-lontar', 'asn-3b'),
        tahap: 'luas',
        niat: 'Berhenti mengejar.',
      },
      permainanId: 'g-uji',
      nomorKejadian: 1,
      memproses: false,
      galatMuat: null,
      kirim: async (baru) => {
        usePermainan.setState((t) => ({
          state: t.state ? reduce(t.state, { ...baru, t: 99 } as Kejadian) : null,
        }));
      },
    });
  }

  it('tidak ditawarkan di Lingkar Harian — §7.3 hanya berlaku di tahap dua', () => {
    usePermainan.setState({
      state: stateAwal('kabut-rusa-lontar', 'asn-3b'),
      permainanId: 'g-uji',
      nomorKejadian: 1,
      memproses: false,
      galatMuat: null,
    });
    render(<App />);
    expect(screen.queryByRole('button', { name: AJAKAN_BERHENTI })).toBeNull();
    expect(screen.queryByRole('button', { name: AJAKAN_NIAT_TERCAPAI })).toBeNull();
  });

  it('berhenti dengan sadar menutup permainan sebagai pilihan, bukan kejatuhan', () => {
    diLuas();
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: AJAKAN_BERHENTI }));
    expect(usePermainan.getState().state?.alasanAkhir).toBe('menyerah');
    expect(screen.getByText(KETERANGAN_AKHIR.menyerah)).toBeTruthy();
  });

  it('niat tercapai menutup permainan sebagai lolos', () => {
    diLuas();
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: AJAKAN_NIAT_TERCAPAI }));
    expect(usePermainan.getState().state?.alasanAkhir).toBe('lolos');
  });

  it('mengatakan lebih dulu bahwa berhenti dihitung sebagai kemenangan', () => {
    diLuas();
    render(<App />);
    expect(screen.getByText(PENJELASAN_BERHENTI)).toBeTruthy();
  });
});

describe('PERAN 4 — papan yang belum terbaca tidak dihakimi', () => {
  /**
   * 72 dari 288 permainan simulasi (25%) ditaruh di petak §10.3 padahal papan
   * Kemerdekaannya tidak punya satu pun keputusan untuk dibaca. Seluruhnya
   * mendarat di kolom "rendah" — bukan karena diukur rendah, tapi karena tidak
   * diukur. Semuanya pemain yang melewati setiap Jeda.
   */
  it('tanpa judul kuadran saat kemerdekaan belum teruji', () => {
    selesai(teruji(0, 0));
    render(<App />);
    for (const judul of Object.values(JUDUL_KUADRAN)) {
      expect(screen.queryByText(judul)).toBeNull();
    }
    expect(screen.getByText(JUDUL_SATU_PAPAN)).toBeTruthy();
  });

  it('menerangkan sisi yang MEMANG terbaca, bukan diam soal keduanya', () => {
    selesai((s) => teruji(0, 0)(kaya(s)));
    render(<App />);
    expect(screen.getByText(KETERANGAN_SATU_PAPAN.kaya)).toBeTruthy();
  });

  it('dan sisi yang belum, tanpa menyebutnya rendah', () => {
    selesai(teruji(0, 0));
    render(<App />);
    expect(screen.getByText(KETERANGAN_SATU_PAPAN.belum)).toBeTruthy();
  });

  /**
   * §15.1 dan Prinsip 3: Lewati tanpa penalti. Judul yang menghakimi adalah
   * penalti dalam satu-satunya mata uang yang dimiliki layar akhir.
   */
  it('pemain yang melewati setiap Jeda tidak menerima satu pun kata vonis', () => {
    selesai(teruji(0, 0));
    render(<App />);
    const teks = (document.body.textContent ?? '').toLowerCase();
    for (const kata of ['belum jalan', 'terikat']) expect(teks).not.toContain(kata);
  });

  it('judul kuadran kembali begitu ada cukup ujian', () => {
    selesai(teruji(0, 10));
    render(<App />);
    expect(screen.getByText(JUDUL_KUADRAN['belum-jalan'])).toBeTruthy();
    expect(screen.queryByText(JUDUL_SATU_PAPAN)).toBeNull();
  });
});

describe('PERAN 4 — §7.3 tercatat di papan yang disebutnya', () => {
  /**
   * Pasal itu menyebut papan Kemerdekaan dengan namanya. Sampai sekarang
   * berhenti dengan sadar tidak tercatat di papan itu sama sekali — hanya
   * sebagai satu baris alasan di bawah judul, dan judul yang sama bisa
   * berbunyi "Belum jalan".
   */
  it('catatan berdiri di dalam papan Kemerdekaan, bukan di tempat lain', () => {
    selesai(teruji(0, 10), 'menyerah');
    render(<App />);
    const papan = screen.getByText(JUDUL_KEMERDEKAAN).closest('[data-papan]');
    expect(papan?.textContent).toContain(CATATAN_BERHENTI_SADAR);
  });

  it('tidak muncul pada akhir yang lain', () => {
    for (const alasan of ['lolos', 'bangkrut'] as const) {
      cleanup();
      selesai(teruji(0, 10), alasan);
      render(<App />);
      expect(screen.queryByText(CATATAN_BERHENTI_SADAR)).toBeNull();
    }
  });

  /**
   * Skornya TIDAK digeser. Menambah angka yang tidak diukur ke rasio yang
   * diukur akan mengarang pengukuran — dan papan ini satu-satunya tempat di
   * permainan yang angkanya berasal dari laporan diri pemain.
   */
  it('tanpa menggeser skor yang diukur', () => {
    selesai(teruji(0, 10), 'menyerah');
    render(<App />);
    const papan = screen.getByText(JUDUL_KEMERDEKAAN).closest('[data-papan]');
    expect(papan?.textContent).toContain('0%');
  });
});
