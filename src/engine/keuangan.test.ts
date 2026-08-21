import { describe, it, expect } from 'vitest';
import {
  BUNGA_PINJAMAN_DARURAT,
  ambilPinjamanDarurat,
  arusKasBulanan,
  hitungLaporan,
  jualAset,
  kekayaanBersih,
  lolosTahapSatu,
  pendapatanAktif,
  pendapatanPasif,
  perluTindakanDarurat,
  totalPendapatan,
  totalPengeluaran,
  type KondisiKeuangan,
} from './keuangan';

/** ASN Gol. III/b — angka §14.1, disederhanakan. */
function kondisiContoh(ubah: Partial<KondisiKeuangan> = {}): KondisiKeuangan {
  return {
    gajiBersihBulanan: 5_900_000,
    pengeluaranTetap: 3_400_000,
    biayaPerAnak: 450_000,
    jumlahAnak: 0,
    saldoKas: 2_000_000,
    aset: [],
    liabilitas: [
      { id: 'kpr', nama: 'KPR subsidi', sisaUtang: 120_000_000, cicilanBulanan: 900_000 },
      { id: 'motor', nama: 'Motor', sisaUtang: 6_000_000, cicilanBulanan: 500_000 },
    ],
    ...ubah,
  };
}

describe('pendapatanAktif', () => {
  it('sama dengan gaji bersih bulanan', () => {
    expect(pendapatanAktif(kondisiContoh())).toBe(5_900_000);
  });
});

describe('pendapatanPasif', () => {
  it('nol bila belum punya aset', () => {
    expect(pendapatanPasif(kondisiContoh())).toBe(0);
  });

  it('menjumlahkan arus kas seluruh aset', () => {
    const k = kondisiContoh({
      aset: [
        { id: 'ruko', nama: 'Ruko dekat pasar', nilai: 340_000_000, arusKasBulanan: 2_800_000 },
        { id: 'kos', nama: 'Kamar kos', nilai: 90_000_000, arusKasBulanan: 700_000 },
      ],
    });
    expect(pendapatanPasif(k)).toBe(3_500_000);
  });

  it('memperhitungkan aset berarus kas negatif', () => {
    const k = kondisiContoh({
      aset: [
        { id: 'ruko', nama: 'Ruko', nilai: 340_000_000, arusKasBulanan: 2_800_000 },
        { id: 'tanah', nama: 'Tanah kosong', nilai: 50_000_000, arusKasBulanan: -300_000 },
      ],
    });
    expect(pendapatanPasif(k)).toBe(2_500_000);
  });

  it('nol untuk aset yang hanya tumbuh, tanpa arus kas', () => {
    const k = kondisiContoh({
      aset: [{ id: 'rdi', nama: 'Reksa dana indeks', nilai: 12_000_000, arusKasBulanan: 0 }],
    });
    expect(pendapatanPasif(k)).toBe(0);
  });
});

describe('totalPendapatan', () => {
  it('menjumlahkan pendapatan aktif dan pasif', () => {
    const k = kondisiContoh({
      aset: [{ id: 'ruko', nama: 'Ruko', nilai: 340_000_000, arusKasBulanan: 2_800_000 }],
    });
    expect(totalPendapatan(k)).toBe(8_700_000);
  });
});

describe('totalPengeluaran', () => {
  it('menjumlahkan pengeluaran tetap dan seluruh cicilan', () => {
    expect(totalPengeluaran(kondisiContoh())).toBe(4_800_000);
  });

  it('menambahkan biaya per anak dikali jumlah anak', () => {
    expect(totalPengeluaran(kondisiContoh({ jumlahAnak: 2 }))).toBe(5_700_000);
  });

  it('tidak menambah apa pun bila belum punya anak', () => {
    expect(totalPengeluaran(kondisiContoh({ jumlahAnak: 0 }))).toBe(4_800_000);
  });
});

describe('arusKasBulanan', () => {
  it('adalah total pendapatan dikurangi total pengeluaran', () => {
    expect(arusKasBulanan(kondisiContoh())).toBe(1_100_000);
  });

  it('bisa negatif', () => {
    const k = kondisiContoh({ pengeluaranTetap: 6_000_000 });
    expect(arusKasBulanan(k)).toBe(-1_500_000);
  });
});

describe('kekayaanBersih', () => {
  it('adalah nilai seluruh aset dikurangi sisa seluruh utang', () => {
    const k = kondisiContoh({
      aset: [{ id: 'ruko', nama: 'Ruko', nilai: 340_000_000, arusKasBulanan: 2_800_000 }],
    });
    expect(kekayaanBersih(k)).toBe(214_000_000);
  });

  it('negatif bila utang melampaui aset', () => {
    expect(kekayaanBersih(kondisiContoh())).toBe(-126_000_000);
  });
});

describe('hitungLaporan', () => {
  it('mengeluarkan seluruh baris laporan sekaligus', () => {
    const k = kondisiContoh({
      jumlahAnak: 1,
      aset: [{ id: 'ruko', nama: 'Ruko', nilai: 340_000_000, arusKasBulanan: 2_800_000 }],
    });
    expect(hitungLaporan(k)).toEqual({
      pendapatanAktif: 5_900_000,
      pendapatanPasif: 2_800_000,
      totalPendapatan: 8_700_000,
      totalPengeluaran: 5_250_000,
      arusKasBulanan: 3_450_000,
      kekayaanBersih: 214_000_000,
    });
  });

  it('tidak mengubah kondisi yang diberikan', () => {
    const k = kondisiContoh();
    const salinan = structuredClone(k);
    hitungLaporan(k);
    expect(k).toEqual(salinan);
  });
});

describe('lolosTahapSatu', () => {
  it('lolos tepat di titik impas — memakai lebih besar atau sama dengan', () => {
    const k = kondisiContoh({
      aset: [{ id: 'a', nama: 'Aset', nilai: 0, arusKasBulanan: 4_800_000 }],
    });
    const laporan = hitungLaporan(k);
    expect(laporan.pendapatanPasif).toBe(laporan.totalPengeluaran);
    expect(lolosTahapSatu(laporan)).toBe(true);
  });

  it('belum lolos bila pendapatan pasif kurang seribu rupiah pun', () => {
    const k = kondisiContoh({
      aset: [{ id: 'a', nama: 'Aset', nilai: 0, arusKasBulanan: 4_799_000 }],
    });
    expect(lolosTahapSatu(hitungLaporan(k))).toBe(false);
  });

  it('tidak peduli pada gaji — hanya pendapatan pasif yang dihitung', () => {
    const k = kondisiContoh({ gajiBersihBulanan: 99_000_000 });
    expect(lolosTahapSatu(hitungLaporan(k))).toBe(false);
  });
});

describe('perluTindakanDarurat', () => {
  it('benar bila saldo kas kurang dari nol', () => {
    expect(perluTindakanDarurat(kondisiContoh({ saldoKas: -1 }))).toBe(true);
  });

  it('salah bila saldo kas nol — nol belum berarti habis', () => {
    expect(perluTindakanDarurat(kondisiContoh({ saldoKas: 0 }))).toBe(false);
  });
});

describe('ambilPinjamanDarurat', () => {
  it('menambah saldo kas sebesar pinjaman', () => {
    const k = ambilPinjamanDarurat(kondisiContoh({ saldoKas: -3_000_000 }), 5_000_000);
    expect(k.saldoKas).toBe(2_000_000);
  });

  it('mencatat utang baru dengan cicilan dua persen per bulan', () => {
    expect(BUNGA_PINJAMAN_DARURAT).toBe(0.02);
    const k = ambilPinjamanDarurat(kondisiContoh(), 5_000_000);
    const pinjaman = k.liabilitas[k.liabilitas.length - 1];
    expect(pinjaman.sisaUtang).toBe(5_000_000);
    expect(pinjaman.cicilanBulanan).toBe(100_000);
  });

  it('menaikkan total pengeluaran sebesar cicilan baru', () => {
    const awal = kondisiContoh();
    const sesudah = ambilPinjamanDarurat(awal, 5_000_000);
    expect(totalPengeluaran(sesudah) - totalPengeluaran(awal)).toBe(100_000);
  });

  it('menurunkan kekayaan bersih sebesar pokok pinjaman', () => {
    const awal = kondisiContoh();
    const sesudah = ambilPinjamanDarurat(awal, 5_000_000);
    expect(kekayaanBersih(awal) - kekayaanBersih(sesudah)).toBe(5_000_000);
  });

  it('tidak mengubah kondisi lama', () => {
    const awal = kondisiContoh();
    const salinan = structuredClone(awal);
    ambilPinjamanDarurat(awal, 5_000_000);
    expect(awal).toEqual(salinan);
  });

  it('melempar galat bila jumlah tidak positif', () => {
    expect(() => ambilPinjamanDarurat(kondisiContoh(), 0)).toThrow('Jumlah pinjaman harus lebih dari nol');
  });
});

describe('jualAset', () => {
  const dengan2Aset = () =>
    kondisiContoh({
      saldoKas: -2_000_000,
      aset: [
        { id: 'ruko', nama: 'Ruko', nilai: 340_000_000, arusKasBulanan: 2_800_000 },
        { id: 'rdi', nama: 'Reksa dana indeks', nilai: 12_000_000, arusKasBulanan: 0 },
      ],
    });

  it('membuang aset dari daftar dan menambah saldo kas sebesar nilainya', () => {
    const k = jualAset(dengan2Aset(), 'rdi');
    expect(k.aset.map((a) => a.id)).toEqual(['ruko']);
    expect(k.saldoKas).toBe(10_000_000);
  });

  it('memakai harga jual bila diberikan — pasar tidak selalu sepakat', () => {
    const k = jualAset(dengan2Aset(), 'rdi', 9_000_000);
    expect(k.saldoKas).toBe(7_000_000);
  });

  it('menurunkan pendapatan pasif sebesar arus kas aset yang dijual', () => {
    const awal = dengan2Aset();
    const sesudah = jualAset(awal, 'ruko');
    expect(pendapatanPasif(awal) - pendapatanPasif(sesudah)).toBe(2_800_000);
  });

  // Rumus §5.1 sengaja tidak menghitung saldo kas sebagai bagian kekayaan
  // bersih. Akibatnya menjual aset menurunkan kekayaan bersih sebesar nilai
  // aset itu, walau uangnya utuh berpindah ke kas. Perilaku ini dikunci di
  // sini supaya kalau rumusnya diubah saat balancing, tes ini yang menyala.
  it('menurunkan kekayaan bersih sebesar nilai aset — saldo kas tidak dihitung', () => {
    const awal = dengan2Aset();
    const sesudah = jualAset(awal, 'ruko');
    expect(kekayaanBersih(awal) - kekayaanBersih(sesudah)).toBe(340_000_000);
  });

  it('tidak mengubah kondisi lama', () => {
    const awal = dengan2Aset();
    const salinan = structuredClone(awal);
    jualAset(awal, 'ruko');
    expect(awal).toEqual(salinan);
  });

  it('melempar galat bila aset tidak ada', () => {
    expect(() => jualAset(dengan2Aset(), 'tidak-ada')).toThrow('Aset tidak ditemukan');
  });
});
