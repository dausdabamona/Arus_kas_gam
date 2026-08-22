import { describe, it, expect } from 'vitest';
import { reduce, stateAwal } from './reducer';
import { cariKartu } from '../data/kartu-peluang';
import type { StatePermainan, KebiasaanBerjalan } from '../types/state';
import type { Kejadian } from '../types/kejadian';

const aktif = (id: string): KebiasaanBerjalan => ({
  id,
  kemajuan: 0,
  lepas: false,
  lawanUnggul: false,
});

/** Kartu berimbal hasil paling tinggi — satu-satunya yang melampaui 30% setahun. */
const KARTU_MENGGIURKAN = cariKartu('gerobak-minuman')!;

function diLuas(ubah: Partial<StatePermainan> = {}): StatePermainan {
  const dasar = stateAwal('uji-refleks', 'asn-3b');
  return { ...dasar, tahap: 'luas', bot: [], ...ubah };
}

describe('refleks kejar mengambil alih keputusan kartu', () => {
  const sebelum = () =>
    diLuas({
      kartuTerbuka: KARTU_MENGGIURKAN,
      kebiasaan: [aktif('refleks-kejar')],
      keuangan: { ...stateAwal('uji-refleks', 'asn-3b').keuangan, saldoKas: 200_000_000 },
    });

  const tolak: Kejadian = {
    t: 3,
    tipe: 'PUTUSKAN',
    isi: { kartuId: KARTU_MENGGIURKAN.id, pilihan: 'tolak' },
  };

  it('mengabaikan penolakan pemain dan tetap mengambilnya', () => {
    const sesudah = reduce(sebelum(), tolak);
    expect(sesudah.keuangan.aset.some((a) => a.nama === KARTU_MENGGIURKAN.judul)).toBe(true);
  });

  it('menyalakan penanda agar layar bisa menjelaskan apa yang terjadi', () => {
    expect(reduce(sebelum(), tolak).refleksMengambilAlih).toBe('refleks-kejar');
  });

  it('tidak mencatatnya sebagai barang yang ditolak — pemain tidak menolaknya', () => {
    expect(reduce(sebelum(), tolak).riwayatDitolak).toEqual([]);
  });

  it('membiarkan keputusan yang searah refleks berjalan normal', () => {
    const ambil = reduce(sebelum(), {
      t: 3,
      tipe: 'PUTUSKAN',
      isi: { kartuId: KARTU_MENGGIURKAN.id, pilihan: 'ambil' },
    });
    expect(ambil.refleksMengambilAlih).toBeNull();
    expect(ambil.keuangan.aset).toHaveLength(1);
  });

  it('tidak mengambil alih di Lingkar Harian', () => {
    const harian: StatePermainan = { ...sebelum(), tahap: 'harian' };
    const sesudah = reduce(harian, tolak);
    expect(sesudah.keuangan.aset).toEqual([]);
    expect(sesudah.refleksMengambilAlih).toBeNull();
  });

  it('tidak mengambil alih setelah refleksnya lepas', () => {
    const lepas: StatePermainan = {
      ...sebelum(),
      kebiasaan: [{ ...aktif('refleks-kejar'), lepas: true }],
    };
    expect(reduce(lepas, tolak).keuangan.aset).toEqual([]);
  });

  it('tidak mengambil alih untuk kartu berimbal hasil rendah', () => {
    const kartuKecil = cariKartu('ruko-pasar')!;
    const sesudah = reduce({ ...sebelum(), kartuTerbuka: kartuKecil }, {
      t: 3,
      tipe: 'PUTUSKAN',
      isi: { kartuId: kartuKecil.id, pilihan: 'tolak' },
    });
    expect(sesudah.keuangan.aset).toEqual([]);
    expect(sesudah.riwayatDitolak).toHaveLength(1);
  });
});

describe('refleks panik mengambil alih keputusan pasar', () => {
  function pasarJatuh(kebiasaan: KebiasaanBerjalan[]): StatePermainan {
    const dasar = stateAwal('uji-panik', 'asn-3b');
    return {
      ...dasar,
      tahap: 'luas',
      bot: [],
      kebiasaan,
      pasarTerbuka: 'saham-individu',
      // Harga giliran lalu jauh di atas harga sekarang: turun ~50%.
      hargaPasarLalu: { ...dasar.hargaPasar, 'saham-individu': 2_000_000 },
      hargaPasar: { ...dasar.hargaPasar, 'saham-individu': 1_000_000 },
      keuangan: {
        ...dasar.keuangan,
        aset: [
          {
            id: 'pasar-saham-individu',
            nama: 'Saham satu perusahaan',
            nilai: 5_000_000,
            arusKasBulanan: 0,
            instrumenId: 'saham-individu',
            unit: 5,
          },
        ],
      },
    };
  }

  const beli: Kejadian = {
    t: 4,
    tipe: 'TRANSAKSI_PASAR',
    isi: { instrumenId: 'saham-individu', aksi: 'beli', unit: 1, ketukan: 0 },
  };

  it('memaksa jual seluruh unit meski pemain menekan beli', () => {
    const sesudah = reduce(pasarJatuh([aktif('refleks-panik')]), beli);
    expect(sesudah.keuangan.aset).toEqual([]);
    expect(sesudah.refleksMengambilAlih).toBe('refleks-panik');
  });

  it('membiarkan pemain membeli saat tidak membawa refleksnya', () => {
    const sesudah = reduce(pasarJatuh([]), beli);
    expect(sesudah.keuangan.aset).toHaveLength(1);
    expect(sesudah.refleksMengambilAlih).toBeNull();
  });

  it('tidak memaksa saat turunnya belum melampaui ambang', () => {
    const dasar = pasarJatuh([aktif('refleks-panik')]);
    const landai: StatePermainan = {
      ...dasar,
      hargaPasarLalu: { ...dasar.hargaPasarLalu, 'saham-individu': 1_050_000 },
    };
    expect(reduce(landai, beli).keuangan.aset).toHaveLength(1);
  });
});

describe('refleks yang mengambil alih tetap membuka jalur Jeda', () => {
  /**
   * Fondasi §7.2. Refleks yang memaksa lalu mengunci tanpa jalan keluar adalah
   * hukuman murni — dan justru di keputusan inilah pemain melatih pelepasannya.
   */
  it('menyisakan jalur suhu dan jeda setelah refleks mengambil alih', () => {
    const sesudah = reduce(
      diLuas({
        kartuTerbuka: KARTU_MENGGIURKAN,
        kebiasaan: [aktif('refleks-kejar')],
        keuangan: { ...stateAwal('uji-refleks', 'asn-3b').keuangan, saldoKas: 200_000_000 },
      }),
      { t: 3, tipe: 'PUTUSKAN', isi: { kartuId: KARTU_MENGGIURKAN.id, pilihan: 'tolak' } },
    );

    const langkah: Kejadian[] = [
      { t: 4, tipe: 'SUHU_BATIN', isi: { nilai: 9, fase: 'sebelum' } },
      {
        t: 5,
        tipe: 'JEDA_BATIN',
        isi: { lokasiTubuh: 'dada', jenisTemuan: 'emosi', kebutuhan: 'pengakuan' },
      },
    ];
    const berjeda = langkah.reduce(reduce, sesudah);

    expect(berjeda.emosi.jedaDiambil).toBe(true);
    expect(berjeda.emosi.kebutuhan).toBe('pengakuan');
  });
});

describe('JEDA_BATIN memajukan pelepasan yang cocok', () => {
  it('memajukan refleks-banding lewat kebutuhan pengakuan', () => {
    const sesudah = reduce(diLuas({ kebiasaan: [aktif('refleks-banding')] }), {
      t: 2,
      tipe: 'JEDA_BATIN',
      isi: { lokasiTubuh: 'dada', jenisTemuan: 'emosi', kebutuhan: 'pengakuan' },
    });
    expect(sesudah.kebiasaan[0].lepas).toBe(true);
  });

  it('tidak memajukan refleks-banding lewat kebutuhan lain', () => {
    const sesudah = reduce(diLuas({ kebiasaan: [aktif('refleks-banding')] }), {
      t: 2,
      tipe: 'JEDA_BATIN',
      isi: { lokasiTubuh: 'dada', jenisTemuan: 'emosi', kebutuhan: 'keamanan' },
    });
    expect(sesudah.kebiasaan[0].kemajuan).toBe(0);
  });

  it('memajukan refleks-panik saat jeda diambil di tawaran pasar yang sedang turun', () => {
    const dasar = stateAwal('uji-lepas-panik', 'asn-3b');
    const sesudah = reduce(
      {
        ...dasar,
        tahap: 'luas',
        bot: [],
        kebiasaan: [aktif('refleks-panik')],
        pasarTerbuka: 'saham-individu',
        hargaPasarLalu: { ...dasar.hargaPasar, 'saham-individu': 2_000_000 },
        hargaPasar: { ...dasar.hargaPasar, 'saham-individu': 1_000_000 },
      },
      {
        t: 2,
        tipe: 'JEDA_BATIN',
        isi: { lokasiTubuh: 'dada', jenisTemuan: 'emosi', kebutuhan: 'kendali' },
      },
    );
    expect(sesudah.kebiasaan[0].kemajuan).toBe(1);
  });

  it('memajukan refleks-kejar saat pemain menolak dalam keadaan tenang', () => {
    const kartuKecil = cariKartu('ruko-pasar')!;
    const langkah: Kejadian[] = [
      { t: 1, tipe: 'SUHU_BATIN', isi: { nilai: 9, fase: 'sebelum' } },
      {
        t: 2,
        tipe: 'JEDA_BATIN',
        isi: { lokasiTubuh: 'dada', jenisTemuan: 'emosi', kebutuhan: 'keamanan' },
      },
      { t: 3, tipe: 'SUHU_BATIN', isi: { nilai: 2, fase: 'sesudah' } },
      { t: 4, tipe: 'PUTUSKAN', isi: { kartuId: kartuKecil.id, pilihan: 'tolak' } },
    ];
    const sesudah = langkah.reduce(
      reduce,
      diLuas({ kartuTerbuka: kartuKecil, kebiasaan: [aktif('refleks-kejar')] }),
    );

    expect(sesudah.kebiasaan[0].lepas).toBe(true);
  });

  it('tidak memajukan refleks-kejar saat penolakan diambil sambil tersulut', () => {
    const kartuKecil = cariKartu('ruko-pasar')!;
    const langkah: Kejadian[] = [
      { t: 1, tipe: 'SUHU_BATIN', isi: { nilai: 9, fase: 'sebelum' } },
      { t: 4, tipe: 'PUTUSKAN', isi: { kartuId: kartuKecil.id, pilihan: 'tolak' } },
    ];
    const sesudah = langkah.reduce(
      reduce,
      diLuas({ kartuTerbuka: kartuKecil, kebiasaan: [aktif('refleks-kejar')] }),
    );

    expect(sesudah.kebiasaan[0].kemajuan).toBe(0);
  });
});
