import { describe, it, expect } from 'vitest';
import { stateAwal } from './reducer';
import { ringkasAkhir, KUADRAN } from './ringkasan';
import { AMBANG_SKOR_BERSIH, MINIMUM_UJIAN } from './kemerdekaan';
import type { StatePermainan } from '../types/state';

const dasar = () => stateAwal('uji-ringkas', 'asn-3b');

/** Pendapatan pasif menutup pengeluaran — definisi "kekayaan tinggi" (§5.2). */
function kaya(s: StatePermainan): StatePermainan {
  return {
    ...s,
    keuangan: {
      ...s.keuangan,
      aset: [{ id: 'kos', nama: 'Kos', nilai: 900_000_000, arusKasBulanan: 50_000_000 }],
    },
  };
}

function skor(s: StatePermainan, tenang: number, bertekanan: number): StatePermainan {
  return { ...s, skor: { keputusanTenang: tenang, keputusanBertekanan: bertekanan } };
}

describe('papan Kekayaan (§10.1)', () => {
  it('membawa DUA angka, bukan satu skor gabungan', () => {
    // Menggabungkan kekayaan bersih dan arus kas pasif menyembunyikan justru
    // pertukaran yang diajarkan permainan ini: barang mahal yang tak
    // menghasilkan apa-apa, dan barang murah yang mengalir tiap bulan.
    const r = ringkasAkhir(dasar());
    expect(typeof r.kekayaan.kekayaanBersih).toBe('number');
    expect(typeof r.kekayaan.pendapatanPasif).toBe('number');
  });

  it('tinggi berarti pendapatan pasif menutup pengeluaran — bukan ambang rupiah baru', () => {
    expect(ringkasAkhir(dasar()).kekayaan.tinggi).toBe(false);
    expect(ringkasAkhir(kaya(dasar())).kekayaan.tinggi).toBe(true);
  });

  it('kekayaan bersih besar sendirian TIDAK cukup', () => {
    // Emas satu miliar yang tidak mengalir sepeser pun: kaya di neraca,
    // terikat di arus kas. Kalau ini lolos sebagai "kekayaan tinggi", papan
    // Kekayaan mengukur tumpukan, bukan kemerdekaan.
    const s = dasar();
    const emas: StatePermainan = {
      ...s,
      keuangan: {
        ...s.keuangan,
        aset: [{ id: 'emas', nama: 'Emas', nilai: 1_000_000_000, arusKasBulanan: 0 }],
      },
    };
    expect(ringkasAkhir(emas).kekayaan.kekayaanBersih).toBeGreaterThan(500_000_000);
    expect(ringkasAkhir(emas).kekayaan.tinggi).toBe(false);
  });
});

describe('papan Kemerdekaan (§10.2) membaca DUA angka', () => {
  it('skor penuh dari nol ujian bukan kemerdekaan tinggi', () => {
    // Keputusan yang sudah dikunci di Fase 6 untuk Gerbang §7.2, dipakai ulang
    // di sini supaya "tinggi" tidak punya dua arti di dua tempat.
    const r = ringkasAkhir(skor(dasar(), 0, 0));
    expect(r.kemerdekaan.skor).toBe(100);
    expect(r.kemerdekaan.belumTeruji).toBe(true);
    expect(r.kemerdekaan.tinggi).toBe(false);
  });

  it('teruji dan bersih berarti tinggi', () => {
    const r = ringkasAkhir(skor(dasar(), MINIMUM_UJIAN, MINIMUM_UJIAN));
    expect(r.kemerdekaan.tinggi).toBe(true);
  });

  it('tepat di ambang sudah terhitung tinggi', () => {
    const r = ringkasAkhir(skor(dasar(), 7, 10));
    expect(r.kemerdekaan.skor).toBe(AMBANG_SKOR_BERSIH);
    expect(r.kemerdekaan.tinggi).toBe(true);
  });

  it('sedikit di bawah ambang berarti rendah', () => {
    expect(ringkasAkhir(skor(dasar(), 6, 10)).kemerdekaan.tinggi).toBe(false);
  });
});

describe('empat kuadran §10.3', () => {
  const teruji = (s: StatePermainan, bersih: boolean) =>
    skor(s, bersih ? 10 : 0, 10);

  it.each([
    [true, true, 'bebas'],
    [true, false, 'kaya-terikat'],
    [false, true, 'tenang-belum-berdaya'],
    [false, false, 'belum-jalan'],
  ] as const)('kekayaan=%s kemerdekaan=%s -> %s', (kayaTinggi, merdekaTinggi, kuadran) => {
    const s = teruji(kayaTinggi ? kaya(dasar()) : dasar(), merdekaTinggi);
    expect(ringkasAkhir(s).kuadran).toBe(kuadran);
  });

  it('keempat kuadran punya nama, dan tidak ada yang kelima', () => {
    expect(Object.keys(KUADRAN)).toHaveLength(4);
  });
});

describe('ringkasan membawa konteks yang membuatnya bisa dibaca ulang', () => {
  it('menyertakan benih, profesi, dan alasan akhir', () => {
    const s: StatePermainan = { ...dasar(), alasanAkhir: 'menyerah', niat: 'Cukup dulu.' };
    const r = ringkasAkhir(s);
    expect(r.seed).toBe('uji-ringkas');
    expect(r.profesiId).toBe('asn-3b');
    expect(r.alasanAkhir).toBe('menyerah');
    expect(r.niat).toBe('Cukup dulu.');
  });

  it('murni — tidak menyentuh state yang diberikan', () => {
    const s = dasar();
    const salinan = JSON.parse(JSON.stringify(s));
    ringkasAkhir(s);
    expect(s).toEqual(salinan);
  });
});

describe('papan yang belum terbaca tidak bisa ditaruh di kuadran', () => {
  /**
   * TEMUAN PERAN 4, terukur: 72 dari 288 permainan (25%) ditaruh di petak
   * §10.3 padahal papan Kemerdekaannya belum punya satu pun keputusan untuk
   * dibaca. Seluruh 72 mendarat di kolom "rendah" — bukan karena diukur
   * rendah, tapi karena tidak diukur sama sekali.
   *
   * Dua hal patah sekaligus:
   *
   * 1. Papan Kemerdekaan berkata "menunggu, bukan menilai" satu baris di bawah
   *    judul yang sudah menilai.
   * 2. §15.1 dan Prinsip 3 menjanjikan Lewati TANPA PENALTI. Pemain yang
   *    melewati setiap Jeda tidak kehilangan apa pun secara mekanik, tapi
   *    dijamin mendarat di kolom rendah dan dihakimi di sana — penalti dalam
   *    satu-satunya mata uang yang dimiliki layar akhir.
   *
   * Kuncinya sudah ada sejak Fase 6: §7.2 melarang membaca skor mentah tanpa
   * jumlah ujian. §10.3 ditulis sebelum kunci itu dipasang; ini memasangnya.
   */
  it('tanpa kuadran saat kemerdekaan belum teruji', () => {
    const r = ringkasAkhir(skor(dasar(), 0, 0));
    expect(r.kemerdekaan.belumTeruji).toBe(true);
    expect(r.kuadran).toBeNull();
  });

  it('juga saat kekayaannya tinggi — bukan soal uangnya', () => {
    expect(ringkasAkhir(skor(kaya(dasar()), 0, 0)).kuadran).toBeNull();
  });

  it('kuadran kembali begitu ada cukup ujian, berapa pun skornya', () => {
    expect(ringkasAkhir(skor(dasar(), 0, MINIMUM_UJIAN)).kuadran).toBe('belum-jalan');
    expect(ringkasAkhir(skor(kaya(dasar()), 0, MINIMUM_UJIAN)).kuadran).toBe('kaya-terikat');
  });

  it('papan kekayaan tetap terbaca — yang hilang cuma silangnya', () => {
    const r = ringkasAkhir(skor(kaya(dasar()), 0, 0));
    expect(r.kekayaan.tinggi).toBe(true);
    expect(r.kuadran).toBeNull();
  });
});
