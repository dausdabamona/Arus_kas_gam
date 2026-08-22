import { describe, it, expect, beforeEach } from 'vitest';
import { db, hapusPermainan, tambahJurnal, semuaJurnal, simpanKejadian, VERSI_LOG } from './db';
import { buatCadanganJurnal } from './penyimpanan';
import { usePermainan } from '../hooks/use-permainan';
import { PESAN_LOG_USANG } from '../data/naskah-sistem';
import type { EntriJurnal } from './db';

function entri(permainanId: string, kalimat: string, dibuatPada: number): EntriJurnal {
  return {
    permainanId,
    dibuatPada,
    kebutuhan: 'keamanan',
    kalimat,
    tindakan: 'Tunggu satu giliran sebelum memutuskan.',
    hasilLuar: 0,
    hasilDalam: 'tenang',
  };
}

beforeEach(async () => {
  await db.permainan.clear();
  await db.kejadian.clear();
  await db.jurnal.clear();
  usePermainan.setState({ state: null, permainanId: null, nomorKejadian: 0, galatMuat: null });
});

describe('jurnal hidup lintas permainan', () => {
  it('mengumpulkan entri dari semua permainan, terbaru dulu', async () => {
    await tambahJurnal(entri('g1', 'Kalimat lama.', 1000));
    await tambahJurnal(entri('g2', 'Kalimat baru.', 3000));
    await tambahJurnal(entri('g1', 'Kalimat tengah.', 2000));

    expect((await semuaJurnal()).map((e) => e.kalimat)).toEqual([
      'Kalimat baru.',
      'Kalimat tengah.',
      'Kalimat lama.',
    ]);
  });

  it('entri permainan yang dihapus tetap ada — termasuk milik permainan itu', async () => {
    // Bukan sekadar "jurnal tidak kosong". Yang gampang lolos adalah versi
    // yang membuang entri milik permainan terhapus dan menyisakan entri
    // permainan lain: jumlahnya turun, tesnya tetap hijau.
    await tambahJurnal(entri('g1', 'Milik permainan yang dihapus.', 1000));
    await tambahJurnal(entri('g2', 'Milik permainan lain.', 2000));
    await hapusPermainan('g1');

    const kalimat = (await semuaJurnal()).map((e) => e.kalimat);
    expect(kalimat).toContain('Milik permainan yang dihapus.');
    expect(kalimat).toContain('Milik permainan lain.');
  });
});

describe('janji yang diucapkan naskah benar-benar ditepati', () => {
  /**
   * PESAN_LOG_USANG berbunyi "Catatan jurnalmu tetap tersimpan." Kalimat itu
   * sudah ada sejak tambalan neraca dan tidak pernah sekali pun diuji. Naskah
   * yang berjanji tanpa penjaga adalah janji yang menunggu dilanggar oleh
   * pembersihan berikutnya.
   */
  it('penolakan permainan usang tidak menyentuh jurnal', async () => {
    await db.permainan.add({
      id: 'g-lama',
      seed: 'kabut-rusa-lontar',
      profesiId: 'asn-3b',
      dibuatPada: 1000,
      status: 'berjalan',
      versiLog: VERSI_LOG - 1,
    });
    await simpanKejadian('g-lama', {
      t: 0,
      tipe: 'MULAI',
      isi: { seed: 'kabut-rusa-lontar', profesiId: 'asn-3b' },
    });
    await tambahJurnal(entri('g-lama', 'Ditulis sebelum pembaruan besar.', 1000));

    await usePermainan.getState().muat('g-lama');

    expect(usePermainan.getState().galatMuat).toBe(PESAN_LOG_USANG);
    expect(usePermainan.getState().state).toBeNull();
    expect((await semuaJurnal()).map((e) => e.kalimat)).toEqual([
      'Ditulis sebelum pembaruan besar.',
    ]);
  });

  it('kalimatnya memang menjanjikan itu — kalau tidak, tes di atas menjaga janji yang bukan janjinya', () => {
    expect(PESAN_LOG_USANG.toLowerCase()).toContain('jurnal');
    expect(PESAN_LOG_USANG.toLowerCase()).toContain('tersimpan');
  });
});

describe('cadangan jurnal (§4.6.2)', () => {
  it('memuat entri dari semua permainan, bukan permainan yang sedang berjalan saja', async () => {
    await tambahJurnal(entri('g1', 'Dari permainan pertama.', 1000));
    await tambahJurnal(entri('g2', 'Dari permainan kedua.', 2000));

    const cadangan = JSON.parse(await buatCadanganJurnal());
    expect(cadangan.jurnal).toHaveLength(2);
    expect(cadangan.jurnal.map((e: EntriJurnal) => e.kalimat).sort()).toEqual([
      'Dari permainan kedua.',
      'Dari permainan pertama.',
    ]);
    expect(cadangan.versi).toBe(1);
  });

  it('teksnya benar-benar JSON yang bisa dibaca ulang', async () => {
    await tambahJurnal(entri('g1', 'Kutipan "dalam tanda kutip" dan koma, juga.', 1000));
    const cadangan = JSON.parse(await buatCadanganJurnal());
    expect(cadangan.jurnal[0].kalimat).toBe('Kutipan "dalam tanda kutip" dan koma, juga.');
  });
});
