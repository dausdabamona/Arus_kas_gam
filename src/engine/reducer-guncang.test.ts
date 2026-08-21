import { describe, it, expect } from 'vitest';
import { reduce, stateAwal } from './reducer';
import { KARTU_GUNCANG, cariKartuGuncang } from '../data/kartu-guncang';
import { cariKartu } from '../data/kartu-peluang';
import type { StatePermainan } from '../types/state';
import type { Kejadian } from '../types/kejadian';

const PETAK_GUNCANG = 5;

function statePada(posisi: number, seed = 'uji-guncang'): StatePermainan {
  return { ...stateAwal(seed, 'asn-3b'), posisi };
}

function daratDi(sebelum: StatePermainan, tujuan: number): StatePermainan {
  for (let t = 1; t < 400; t++) {
    const coba = reduce(sebelum, { t, tipe: 'LEMPAR_DADU', isi: { pemainId: 'p1' } });
    if (coba.posisi === tujuan) return coba;
  }
  throw new Error(`Tidak pernah mendarat di petak ${tujuan}`);
}

/** State dengan satu kartu guncang tertentu sudah terbuka. */
function denganGuncang(kartuId: string, ubah: Partial<StatePermainan> = {}): StatePermainan {
  const kartu = cariKartuGuncang(kartuId);
  return {
    ...stateAwal('uji-guncang', 'asn-3b'),
    guncangTerbuka: { kartuId: kartu.id, judul: kartu.judul, teks: kartu.teks },
    ...ubah,
  };
}

function jalankan(state: StatePermainan, daftar: Kejadian[]): StatePermainan {
  return daftar.reduce(reduce, state);
}

describe('petak GUNCANG membuka kartu', () => {
  it('membuka satu kartu saat mendarat', () => {
    const sesudah = daratDi(statePada(PETAK_GUNCANG - 1), PETAK_GUNCANG);
    expect(sesudah.guncangTerbuka).not.toBeNull();
    expect(KARTU_GUNCANG.some((k) => k.id === sesudah.guncangTerbuka!.kartuId)).toBe(true);
  });

  it('membuka kartu yang sama untuk seed dan t yang sama', () => {
    const a = daratDi(statePada(PETAK_GUNCANG - 1), PETAK_GUNCANG);
    const b = daratDi(statePada(PETAK_GUNCANG - 1), PETAK_GUNCANG);
    expect(a.guncangTerbuka).toEqual(b.guncangTerbuka);
  });

  it('tidak pernah memilih kartu bersyarat saat konteksnya belum ada', () => {
    const terpilih: string[] = [];
    for (let awal = 0; awal < 24; awal++) {
      for (let t = 1; t < 60; t++) {
        const dasar: StatePermainan = { ...statePada(awal, `sapu-${awal}`), bot: [] };
        const coba = reduce(dasar, { t, tipe: 'LEMPAR_DADU', isi: { pemainId: 'p1' } });
        if (coba.guncangTerbuka) terpilih.push(coba.guncangTerbuka.kartuId);
      }
    }
    expect(terpilih.length).toBeGreaterThan(20);
    const bersyarat = terpilih.filter((id) => cariKartuGuncang(id).syarat !== undefined);
    expect(bersyarat).toEqual([]);
  });

  it('mengisi {barang} dari riwayat ditolak paling akhir', () => {
    const riwayat = [
      { jenis: 'kartu' as const, id: 'kos-satu-pintu', nilaiSaatItu: 45_000_000, padaGiliran: 2 },
    ];
    // Sapu banyak titik awal sampai kartu bersyarat itu benar-benar terpilih.
    let ketemu: StatePermainan['guncangTerbuka'] = null;
    for (let awal = 0; awal < 24 && !ketemu; awal++) {
      for (let t = 1; t < 60; t++) {
        const dasar: StatePermainan = {
          ...statePada(awal, `barang-${awal}`),
          bot: [],
          riwayatDitolak: riwayat,
        };
        const coba = reduce(dasar, { t, tipe: 'LEMPAR_DADU', isi: { pemainId: 'p1' } });
        if (coba.guncangTerbuka?.kartuId === 'yang-ditolak-naik') {
          ketemu = coba.guncangTerbuka;
          break;
        }
      }
    }
    expect(ketemu, 'kartu yang-ditolak-naik tidak pernah terpilih').not.toBeNull();
    expect(ketemu!.teks).not.toContain('{barang}');
    expect(ketemu!.teks).toContain(cariKartu('kos-satu-pintu')!.judul);
  });
});

describe('TUTUP_GUNCANG menerapkan efeknya', () => {
  it('memotong kas dalam rentang pengali x skala guncangan', () => {
    const sebelum = denganGuncang('orang-tua-sakit');
    const sesudah = reduce(sebelum, {
      t: 9,
      tipe: 'TUTUP_GUNCANG',
      isi: { kartuId: 'orang-tua-sakit' },
    });
    // Rentangnya dibaca dari datanya, bukan disalin — pengali disetel simulator
    // di Tugas 5, dan angka yang disalin di sini akan menyala setiap kali
    // keseimbangan digeser, tanpa ada yang benar-benar rusak.
    const efek = cariKartuGuncang('orang-tua-sakit').efek;
    if (efek.jenis !== 'kas') throw new Error('kartu ini seharusnya berjenis kas');
    const [bawah, atas] = efek.pengali;
    const potongan = sebelum.keuangan.saldoKas - sesudah.keuangan.saldoKas;
    expect(potongan).toBeGreaterThanOrEqual(bawah * sebelum.skalaGuncangan);
    expect(potongan).toBeLessThanOrEqual(atas * sebelum.skalaGuncangan);
    expect(sesudah.guncangTerbuka).toBeNull();
  });

  it('memotong jumlah yang sama untuk seed dan t yang sama', () => {
    const sebelum = denganGuncang('orang-tua-sakit');
    const kejadian: Kejadian = {
      t: 9,
      tipe: 'TUTUP_GUNCANG',
      isi: { kartuId: 'orang-tua-sakit' },
    };
    expect(reduce(sebelum, kejadian).keuangan.saldoKas).toBe(
      reduce(sebelum, kejadian).keuangan.saldoKas,
    );
  });

  it('menaikkan pengeluaran tetap persis 8% pada kartu inflasi', () => {
    const sebelum = denganGuncang('harga-naik');
    const sesudah = reduce(sebelum, {
      t: 3,
      tipe: 'TUTUP_GUNCANG',
      isi: { kartuId: 'harga-naik' },
    });
    expect(sesudah.keuangan.pengeluaranTetap).toBe(
      Math.round(sebelum.keuangan.pengeluaranTetap * 1.08),
    );
  });

  it('tidak mengembalikan kenaikan itu di giliran berikutnya', () => {
    const sesudah = reduce(denganGuncang('harga-naik'), {
      t: 3,
      tipe: 'TUTUP_GUNCANG',
      isi: { kartuId: 'harga-naik' },
    });
    const berikutnya = reduce(sesudah, { t: 4, tipe: 'LEMPAR_DADU', isi: { pemainId: 'p1' } });
    expect(berikutnya.keuangan.pengeluaranTetap).toBe(sesudah.keuangan.pengeluaranTetap);
  });

  it('tidak menyentuh sepeser pun pada kartu tanpa efek', () => {
    const sebelum = denganGuncang('reuni');
    const sesudah = reduce(sebelum, { t: 5, tipe: 'TUTUP_GUNCANG', isi: { kartuId: 'reuni' } });
    expect(sesudah.keuangan).toEqual(sebelum.keuangan);
    expect(sesudah.guncangTerbuka).toBeNull();
  });
});

describe('riwayat ditolak', () => {
  it('mencatat kartu peluang yang ditolak beserta nilainya saat itu', () => {
    const kartu = cariKartu('kos-satu-pintu')!;
    const sebelum: StatePermainan = { ...stateAwal('uji-tolak', 'asn-3b'), kartuTerbuka: kartu };
    const sesudah = reduce(sebelum, {
      t: 2,
      tipe: 'PUTUSKAN',
      isi: { kartuId: kartu.id, pilihan: 'tolak' },
    });
    expect(sesudah.riwayatDitolak).toHaveLength(1);
    expect(sesudah.riwayatDitolak[0]).toMatchObject({
      jenis: 'kartu',
      id: kartu.id,
      nilaiSaatItu: kartu.harga,
    });
  });

  it('tidak mencatat kartu yang diambil', () => {
    const kartu = cariKartu('kos-satu-pintu')!;
    const sebelum: StatePermainan = { ...stateAwal('uji-ambil', 'asn-3b'), kartuTerbuka: kartu };
    const sesudah = reduce(sebelum, {
      t: 2,
      tipe: 'PUTUSKAN',
      isi: { kartuId: kartu.id, pilihan: 'ambil' },
    });
    expect(sesudah.riwayatDitolak).toEqual([]);
  });

  it('mencatat tawaran pasar yang dilewati dengan harga saat itu', () => {
    const sebelum: StatePermainan = {
      ...stateAwal('uji-lewat', 'asn-3b'),
      pasarTerbuka: 'saham-individu',
    };
    const sesudah = reduce(sebelum, {
      t: 4,
      tipe: 'TRANSAKSI_PASAR',
      isi: { instrumenId: 'saham-individu', aksi: 'lewat', unit: 0, ketukan: 2 },
    });
    expect(sesudah.riwayatDitolak).toHaveLength(1);
    expect(sesudah.riwayatDitolak[0].jenis).toBe('instrumen');
    expect(sesudah.riwayatDitolak[0].nilaiSaatItu).toBeGreaterThan(0);
  });
});

describe('suhu dan jeda tercatat di emosi', () => {
  it('mencatat suhu sebelum dan sesudah pada fasenya masing-masing', () => {
    const sesudah = jalankan(stateAwal('uji-suhu', 'asn-3b'), [
      { t: 1, tipe: 'SUHU_BATIN', isi: { nilai: 8, fase: 'sebelum' } },
      { t: 2, tipe: 'SUHU_BATIN', isi: { nilai: 3, fase: 'sesudah' } },
    ]);
    expect(sesudah.emosi.suhuSebelum).toBe(8);
    expect(sesudah.emosi.suhuSesudah).toBe(3);
  });

  it('menandai jeda diambil pada JEDA_BATIN', () => {
    const sesudah = reduce(stateAwal('uji-jeda', 'asn-3b'), {
      t: 1,
      tipe: 'JEDA_BATIN',
      isi: { lokasiTubuh: 'dada', jenisTemuan: 'emosi', kebutuhan: 'keamanan' },
    });
    expect(sesudah.emosi.jedaDiambil).toBe(true);
    expect(sesudah.emosi.kebutuhan).toBe('keamanan');
  });

  it('tidak menandai jeda diambil pada LEWATI_JEDA', () => {
    const sesudah = reduce(stateAwal('uji-lewati', 'asn-3b'), {
      t: 1,
      tipe: 'LEWATI_JEDA',
      isi: { pemicuId: 'orang-tua-sakit' },
    });
    expect(sesudah.emosi.jedaDiambil).toBe(false);
  });
});

describe('TANAM menjadwalkan panen', () => {
  const menanam: Kejadian = {
    t: 7,
    tipe: 'TANAM',
    isi: { kalimat: 'Saya takut kurang.', tindakan: 'Cek saldo sekali saja.', panenPadaGiliran: 0 },
  };

  it('menjadwalkan panen antara 4 dan 10 giliran ke depan', () => {
    const sebelum: StatePermainan = { ...stateAwal('uji-tanam', 'asn-3b'), giliran: 12 };
    const sesudah = reduce(sebelum, menanam);
    expect(sesudah.tanamTertunda).toHaveLength(1);
    const jarak = sesudah.tanamTertunda[0].panenPadaGiliran - 12;
    expect(jarak).toBeGreaterThanOrEqual(4);
    expect(jarak).toBeLessThanOrEqual(10);
  });

  it('mengabaikan jadwal yang dikirim di dalam kejadian — mesin yang menghitung', () => {
    const sebelum: StatePermainan = { ...stateAwal('uji-tanam', 'asn-3b'), giliran: 12 };
    const palsu: Kejadian = {
      ...menanam,
      isi: { ...menanam.isi, panenPadaGiliran: 9999 },
    } as Kejadian;
    expect(reduce(sebelum, palsu).tanamTertunda[0].panenPadaGiliran).toBe(
      reduce(sebelum, menanam).tanamTertunda[0].panenPadaGiliran,
    );
  });

  it('mencatat objek dan kebutuhan dari pemicu yang sedang terbuka', () => {
    const sebelum = denganGuncang('orang-tua-sakit', { giliran: 5 });
    const sesudah = jalankan(sebelum, [
      { t: 6, tipe: 'JEDA_BATIN', isi: { lokasiTubuh: 'dada', jenisTemuan: 'emosi', kebutuhan: 'keamanan' } },
      menanam,
    ]);
    expect(sesudah.tanamTertunda[0].objek).toMatchObject({
      jenis: 'guncang',
      id: 'orang-tua-sakit',
    });
    expect(sesudah.tanamTertunda[0].kebutuhan).toBe('keamanan');
  });

  it('menjadwalkan panen yang sama untuk seed dan t yang sama', () => {
    const sebelum: StatePermainan = { ...stateAwal('uji-tanam', 'asn-3b'), giliran: 3 };
    expect(reduce(sebelum, menanam).tanamTertunda[0].panenPadaGiliran).toBe(
      reduce(sebelum, menanam).tanamTertunda[0].panenPadaGiliran,
    );
  });
});

describe('panen jatuh tempo', () => {
  function denganDuaTanam(): StatePermainan {
    const dasar = stateAwal('uji-panen', 'asn-3b');
    return {
      ...dasar,
      giliran: 9,
      tanamTertunda: [
        {
          t: 1,
          kalimat: 'Yang pertama.',
          tindakan: 'Langkah kecil.',
          padaGiliran: 2,
          panenPadaGiliran: 8,
          objek: null,
          kebutuhan: null,
          hasilDalam: 'tenang',
        },
        {
          t: 2,
          kalimat: 'Yang kedua.',
          tindakan: 'Langkah kecil lain.',
          padaGiliran: 3,
          panenPadaGiliran: 9,
          objek: null,
          kebutuhan: null,
          hasilDalam: 'tersulut',
        },
      ],
    };
  }

  it('membuka satu panen saat giliran melewati jatuh temponya', () => {
    const sesudah = reduce(denganDuaTanam(), {
      t: 10,
      tipe: 'LEMPAR_DADU',
      isi: { pemainId: 'p1' },
    });
    expect(sesudah.panenTerbuka).not.toBeNull();
    expect(sesudah.panenTerbuka!.kalimat).toBe('Yang pertama.');
  });

  it('menyisakan panen lain menunggu — satu per giliran', () => {
    const sesudah = reduce(denganDuaTanam(), {
      t: 10,
      tipe: 'LEMPAR_DADU',
      isi: { pemainId: 'p1' },
    });
    expect(sesudah.tanamTertunda).toHaveLength(1);
    expect(sesudah.tanamTertunda[0].kalimat).toBe('Yang kedua.');
  });

  it('tidak membuka apa pun sebelum jatuh tempo', () => {
    const dasar = stateAwal('uji-belum', 'asn-3b');
    const sesudah = reduce(
      {
        ...dasar,
        giliran: 1,
        tanamTertunda: [
          {
            t: 1,
            kalimat: 'Nanti.',
            tindakan: 'Nanti juga.',
            padaGiliran: 1,
            panenPadaGiliran: 8,
            objek: null,
            kebutuhan: null,
            hasilDalam: null,
          },
        ],
      },
      { t: 2, tipe: 'LEMPAR_DADU', isi: { pemainId: 'p1' } },
    );
    expect(sesudah.panenTerbuka).toBeNull();
    expect(sesudah.tanamTertunda).toHaveLength(1);
  });

  it('menutup panen setelah TUAI', () => {
    const terbuka = reduce(denganDuaTanam(), {
      t: 10,
      tipe: 'LEMPAR_DADU',
      isi: { pemainId: 'p1' },
    });
    const sesudah = reduce(terbuka, {
      t: 11,
      tipe: 'TUAI',
      isi: { tanamT: 1, hasilLuar: 0, hasilDalam: 'tenang' },
    });
    expect(sesudah.panenTerbuka).toBeNull();
  });
});

describe('skor kemerdekaan', () => {
  const tutup: Kejadian = { t: 20, tipe: 'TUTUP_GUNCANG', isi: { kartuId: 'reuni' } };

  it('menghitung keputusan bertekanan saat suhu sempat tercatat', () => {
    const sesudah = jalankan(denganGuncang('reuni'), [
      { t: 18, tipe: 'SUHU_BATIN', isi: { nilai: 9, fase: 'sebelum' } },
      tutup,
    ]);
    expect(sesudah.skor.keputusanBertekanan).toBe(1);
    expect(sesudah.skor.keputusanTenang).toBe(0);
  });

  it('menghitung keputusan tenang saat jeda diambil dan suhu turun tiga poin', () => {
    const sesudah = jalankan(denganGuncang('reuni'), [
      { t: 17, tipe: 'SUHU_BATIN', isi: { nilai: 9, fase: 'sebelum' } },
      { t: 18, tipe: 'JEDA_BATIN', isi: { lokasiTubuh: 'dada', jenisTemuan: 'emosi', kebutuhan: 'keamanan' } },
      { t: 19, tipe: 'SUHU_BATIN', isi: { nilai: 6, fase: 'sesudah' } },
      tutup,
    ]);
    expect(sesudah.skor.keputusanBertekanan).toBe(1);
    expect(sesudah.skor.keputusanTenang).toBe(1);
  });

  it('tidak menghitung tenang bila suhu turun kurang dari tiga poin', () => {
    const sesudah = jalankan(denganGuncang('reuni'), [
      { t: 17, tipe: 'SUHU_BATIN', isi: { nilai: 9, fase: 'sebelum' } },
      { t: 18, tipe: 'JEDA_BATIN', isi: { lokasiTubuh: 'dada', jenisTemuan: 'emosi', kebutuhan: 'keamanan' } },
      { t: 19, tipe: 'SUHU_BATIN', isi: { nilai: 7, fase: 'sesudah' } },
      tutup,
    ]);
    expect(sesudah.skor.keputusanTenang).toBe(0);
  });

  it('tidak menghitung tenang bila suhu turun tanpa jeda', () => {
    const sesudah = jalankan(denganGuncang('reuni'), [
      { t: 17, tipe: 'SUHU_BATIN', isi: { nilai: 9, fase: 'sebelum' } },
      { t: 19, tipe: 'SUHU_BATIN', isi: { nilai: 2, fase: 'sesudah' } },
      tutup,
    ]);
    expect(sesudah.skor.keputusanTenang).toBe(0);
  });

  it('tidak menghitung apa pun bila suhu tidak pernah tercatat', () => {
    const sesudah = reduce(denganGuncang('reuni'), tutup);
    expect(sesudah.skor).toEqual({ keputusanBertekanan: 0, keputusanTenang: 0 });
  });

  it('LEWATI_JEDA tidak mengurangi satu pun penghitung', () => {
    const sebelum: StatePermainan = {
      ...denganGuncang('reuni'),
      skor: { keputusanBertekanan: 4, keputusanTenang: 3 },
    };
    const sesudah = reduce(sebelum, {
      t: 18,
      tipe: 'LEWATI_JEDA',
      isi: { pemicuId: 'reuni' },
    });
    expect(sesudah.skor.keputusanTenang).toBe(3);
    expect(sesudah.skor.keputusanBertekanan).toBe(4);
  });

  it('menghitung keputusan kartu dan pasar dengan aturan yang sama', () => {
    const kartu = cariKartu('kos-satu-pintu')!;
    const lewatKartu = jalankan({ ...stateAwal('skor-kartu', 'asn-3b'), kartuTerbuka: kartu }, [
      { t: 1, tipe: 'SUHU_BATIN', isi: { nilai: 7, fase: 'sebelum' } },
      { t: 2, tipe: 'PUTUSKAN', isi: { kartuId: kartu.id, pilihan: 'tolak' } },
    ]);
    expect(lewatKartu.skor.keputusanBertekanan).toBe(1);

    const lewatPasar = jalankan(
      { ...stateAwal('skor-pasar', 'asn-3b'), pasarTerbuka: 'emas' },
      [
        { t: 1, tipe: 'SUHU_BATIN', isi: { nilai: 7, fase: 'sebelum' } },
        {
          t: 2,
          tipe: 'TRANSAKSI_PASAR',
          isi: { instrumenId: 'emas', aksi: 'lewat', unit: 0, ketukan: 1 },
        },
      ],
    );
    expect(lewatPasar.skor.keputusanBertekanan).toBe(1);
  });

  it('mengosongkan emosi setelah keputusan dihitung', () => {
    const sesudah = jalankan(denganGuncang('reuni'), [
      { t: 17, tipe: 'SUHU_BATIN', isi: { nilai: 9, fase: 'sebelum' } },
      { t: 18, tipe: 'JEDA_BATIN', isi: { lokasiTubuh: 'dada', jenisTemuan: 'emosi', kebutuhan: 'keamanan' } },
      { t: 19, tipe: 'SUHU_BATIN', isi: { nilai: 4, fase: 'sesudah' } },
      tutup,
    ]);
    expect(sesudah.emosi).toEqual({
      suhuSebelum: null,
      suhuSesudah: null,
      jedaDiambil: false,
      kebutuhan: null,
    });
  });

  it('menandai hasil dalam pada tanam yang menunggu, sesuai keputusan itu', () => {
    const sesudah = jalankan(denganGuncang('reuni', { giliran: 4 }), [
      { t: 17, tipe: 'SUHU_BATIN', isi: { nilai: 9, fase: 'sebelum' } },
      { t: 18, tipe: 'JEDA_BATIN', isi: { lokasiTubuh: 'dada', jenisTemuan: 'emosi', kebutuhan: 'keamanan' } },
      {
        t: 19,
        tipe: 'TANAM',
        isi: { kalimat: 'Cukup.', tindakan: 'Diamkan semalam.', panenPadaGiliran: 0 },
      },
      { t: 20, tipe: 'SUHU_BATIN', isi: { nilai: 3, fase: 'sesudah' } },
      { t: 21, tipe: 'TUTUP_GUNCANG', isi: { kartuId: 'reuni' } },
    ]);
    expect(sesudah.tanamTertunda[0].hasilDalam).toBe('tenang');
  });
});
