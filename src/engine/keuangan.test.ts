import { describe, it, expect } from 'vitest';
import {
  BUNGA_PINJAMAN_DARURAT,
  ambilPinjamanDarurat,
  arusKasBulanan,
  hitungLaporan,
  jualAset,
  kekayaanBersih,
  lolosTahapSatu,
  lunasiPinjaman,
  progresPelunasan,
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
      { id: 'kpr', nama: 'KPR subsidi', sisaUtang: 120_000_000, cicilanBulanan: 900_000, pokokAwal: 120_000_000 },
      { id: 'motor', nama: 'Motor', sisaUtang: 6_000_000, cicilanBulanan: 500_000, pokokAwal: 8_000_000 },
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

  it('tidak menghitung saldo kas — kas menganggur tetap nol pendapatan pasif', () => {
    expect(pendapatanPasif(kondisiContoh({ saldoKas: 500_000_000 }))).toBe(0);
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
  it('adalah saldo kas ditambah nilai aset dikurangi sisa utang', () => {
    const k = kondisiContoh({
      aset: [{ id: 'ruko', nama: 'Ruko', nilai: 340_000_000, arusKasBulanan: 2_800_000 }],
    });
    expect(kekayaanBersih(k)).toBe(216_000_000);
  });

  it('negatif bila utang melampaui kas dan aset', () => {
    expect(kekayaanBersih(kondisiContoh())).toBe(-124_000_000);
  });

  it('ikut turun saat saldo kas minus', () => {
    expect(kekayaanBersih(kondisiContoh({ saldoKas: -1_000_000 }))).toBe(-127_000_000);
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
      kekayaanBersih: 216_000_000,
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

  it('tidak peduli pada tumpukan kas — kas besar tidak meloloskan siapa pun', () => {
    const k = kondisiContoh({ saldoKas: 900_000_000 });
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

  it('mencatat utang baru dengan cicilan dua persen dari pokok', () => {
    expect(BUNGA_PINJAMAN_DARURAT).toBe(0.02);
    const k = ambilPinjamanDarurat(kondisiContoh(), 5_000_000);
    const pinjaman = k.liabilitas[k.liabilitas.length - 1];
    expect(pinjaman.sisaUtang).toBe(5_000_000);
    expect(pinjaman.cicilanBulanan).toBe(100_000);
    expect(pinjaman.bungaBulanan).toBe(0.02);
    expect(pinjaman.pokokAwal).toBe(5_000_000);
  });

  it('menaikkan total pengeluaran sebesar cicilan baru', () => {
    const awal = kondisiContoh();
    const sesudah = ambilPinjamanDarurat(awal, 5_000_000);
    expect(totalPengeluaran(sesudah) - totalPengeluaran(awal)).toBe(100_000);
  });

  it('tidak mengubah kekayaan bersih — uangnya masuk, utangnya ikut', () => {
    const awal = kondisiContoh();
    expect(kekayaanBersih(ambilPinjamanDarurat(awal, 5_000_000))).toBe(kekayaanBersih(awal));
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

describe('lunasiPinjaman', () => {
  /** Kondisi dengan satu pinjaman darurat Rp 5 juta; kas jadi Rp 7 juta. */
  const berpinjaman = () => ambilPinjamanDarurat(kondisiContoh(), 5_000_000);
  const idDarurat = 'darurat-3';

  it('mengurangi saldo kas dan sisa utang sebesar pembayaran', () => {
    const k = lunasiPinjaman(berpinjaman(), idDarurat, 2_000_000);
    expect(k.saldoKas).toBe(5_000_000);
    expect(k.liabilitas.find((l) => l.id === idDarurat)?.sisaUtang).toBe(3_000_000);
  });

  it('menurunkan cicilan mengikuti sisa pokok', () => {
    const k = lunasiPinjaman(berpinjaman(), idDarurat, 2_000_000);
    expect(k.liabilitas.find((l) => l.id === idDarurat)?.cicilanBulanan).toBe(60_000);
  });

  it('tidak mengubah pokok awal — itu catatan sejarah, bukan sisa saat ini', () => {
    const k = lunasiPinjaman(berpinjaman(), idDarurat, 2_000_000);
    expect(k.liabilitas.find((l) => l.id === idDarurat)?.pokokAwal).toBe(5_000_000);
  });

  it('membiarkan pokok awal utang bawaan tetap, walau cicilannya juga tetap', () => {
    const k = lunasiPinjaman(kondisiContoh({ saldoKas: 10_000_000 }), 'motor', 1_000_000);
    expect(k.liabilitas.find((l) => l.id === 'motor')?.pokokAwal).toBe(8_000_000);
  });

  it('melunasi penuh bila jumlah tidak disebut, dan utangnya hilang dari daftar', () => {
    const k = lunasiPinjaman(berpinjaman(), idDarurat);
    expect(k.liabilitas.map((l) => l.id)).toEqual(['kpr', 'motor']);
    expect(k.saldoKas).toBe(2_000_000);
  });

  it('menghapus cicilannya dari total pengeluaran setelah lunas', () => {
    const awal = berpinjaman();
    const sesudah = lunasiPinjaman(awal, idDarurat);
    expect(totalPengeluaran(awal) - totalPengeluaran(sesudah)).toBe(100_000);
  });

  it('tidak mengubah kekayaan bersih — kas turun, utang turun sama besar', () => {
    const awal = berpinjaman();
    expect(kekayaanBersih(lunasiPinjaman(awal, idDarurat, 2_000_000))).toBe(kekayaanBersih(awal));
  });

  it('tidak mengenakan denda apa pun', () => {
    const awal = berpinjaman();
    const sesudah = lunasiPinjaman(awal, idDarurat);
    expect(awal.saldoKas - sesudah.saldoKas).toBe(5_000_000);
  });

  it('membiarkan cicilan tetap pada utang tanpa bunga berjalan', () => {
    const k = lunasiPinjaman(kondisiContoh({ saldoKas: 10_000_000 }), 'motor', 1_000_000);
    const motor = k.liabilitas.find((l) => l.id === 'motor');
    expect(motor?.sisaUtang).toBe(5_000_000);
    expect(motor?.cicilanBulanan).toBe(500_000);
  });

  it('tidak mengubah kondisi lama', () => {
    const awal = berpinjaman();
    const salinan = structuredClone(awal);
    lunasiPinjaman(awal, idDarurat, 2_000_000);
    expect(awal).toEqual(salinan);
  });

  it('melempar galat bila saldo kas tidak cukup', () => {
    const k = kondisiContoh({ saldoKas: 100_000 });
    expect(() => lunasiPinjaman(k, 'motor', 1_000_000)).toThrow('Saldo kas tidak cukup');
  });

  it('melempar galat bila pembayaran melebihi sisa utang', () => {
    expect(() => lunasiPinjaman(berpinjaman(), idDarurat, 6_000_000))
      .toThrow('Pembayaran melebihi sisa utang');
  });

  it('melempar galat bila jumlah tidak positif', () => {
    expect(() => lunasiPinjaman(berpinjaman(), idDarurat, 0)).toThrow('Jumlah pelunasan harus lebih dari nol');
  });

  it('melempar galat bila utang tidak ada', () => {
    expect(() => lunasiPinjaman(berpinjaman(), 'tidak-ada')).toThrow('Utang tidak ditemukan');
  });
});

describe('progresPelunasan', () => {
  it('nol sebelum pembayaran apa pun', () => {
    const k = kondisiContoh();
    const motor = k.liabilitas.find((l) => l.id === 'motor')!;
    expect(progresPelunasan(motor)).toBe(0.25); // sudah dicicil 2 juta dari pokok 8 juta
  });

  it('naik seiring pelunasan sebagian', () => {
    const sesudah = lunasiPinjaman(kondisiContoh({ saldoKas: 10_000_000 }), 'motor', 4_000_000);
    const motor = sesudah.liabilitas.find((l) => l.id === 'motor')!;
    expect(progresPelunasan(motor)).toBe(0.75); // sisa 2 juta dari pokok 8 juta
  });

  it('nol persis saat utang baru dibuat — belum ada yang dibayar', () => {
    const k = ambilPinjamanDarurat(kondisiContoh(), 5_000_000);
    const pinjaman = k.liabilitas[k.liabilitas.length - 1];
    expect(progresPelunasan(pinjaman)).toBe(0);
  });

  it('satu persis saat lunas penuh', () => {
    const berpinjaman = ambilPinjamanDarurat(kondisiContoh(), 5_000_000);
    const pinjaman = berpinjaman.liabilitas[berpinjaman.liabilitas.length - 1];
    lunasiPinjaman(berpinjaman, pinjaman.id); // hasilnya: utang dibuang dari daftar
    // progres dihitung dari objek sebelum dibuang, dengan sisaUtang nol
    expect(progresPelunasan({ ...pinjaman, sisaUtang: 0 })).toBe(1);
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

  // Invarian wajib §5.1: penjualan darurat memindahkan nilai, tidak
  // menghancurkannya. Kalau tes ini merah, papan skor Kekayaan berbohong
  // tepat di momen pemain paling tersulut.
  it('tidak mengubah kekayaan bersih bila dijual seharga nilainya', () => {
    const awal = dengan2Aset();
    expect(kekayaanBersih(jualAset(awal, 'ruko'))).toBe(kekayaanBersih(awal));
  });

  it('menurunkan kekayaan bersih hanya sebesar selisih harga jual di bawah nilai', () => {
    const awal = dengan2Aset();
    const sesudah = jualAset(awal, 'rdi', 9_000_000);
    expect(kekayaanBersih(awal) - kekayaanBersih(sesudah)).toBe(3_000_000);
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
