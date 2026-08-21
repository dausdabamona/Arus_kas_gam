/**
 * Mesin laporan keuangan — rumus §5 dokumen desain.
 *
 * Seluruh fungsi di sini murni: tidak mengubah masukan, tidak menyentuh
 * React, Dexie, waktu, maupun keacakan. Semua angka dalam rupiah penuh
 * (bilangan bulat), bukan pecahan.
 */

/** Satu aset yang dimiliki pemain. */
export interface Aset {
  id: string;
  nama: string;
  /** Nilai pasar sekarang. */
  nilai: number;
  /** Arus kas bersih tiap bulan. Boleh nol (hanya tumbuh) atau negatif (beban perawatan). */
  arusKasBulanan: number;
  /** Diisi hanya untuk aset yang dibeli lewat petak Pasar. */
  instrumenId?: string;
  unit?: number;
  /**
   * Diisi hanya untuk aset dari kartu Peluang (§8.3). Nilainya bergerak tiap
   * giliran; arus kasnya tidak — dua sumbu yang terpisah.
   */
  driftBulanan?: number;
  volatilitasBulanan?: number;
}

/** Satu utang yang menempel pada pemain. */
export interface Liabilitas {
  id: string;
  nama: string;
  sisaUtang: number;
  cicilanBulanan: number;
  /**
   * Bunga berjalan per bulan, bila cicilannya memang diturunkan dari sisa
   * pokok (pinjaman darurat §5.3). Utang bawaan profesi seperti KPR dan
   * kredit motor tidak punya ini: cicilannya tetap, tidak ikut sisa pokok.
   */
  bungaBulanan?: number;
  /**
   * Pokok saat utang ini pertama tercatat. Catatan sejarah, tidak pernah
   * berubah oleh pelunasan — dipakai semata untuk menampilkan kemajuan
   * pelunasan (§5.3: "sisa pokok terhadap pokok awal").
   */
  pokokAwal: number;
}

/** Seluruh keadaan keuangan pemain pada satu titik waktu. */
export interface KondisiKeuangan {
  /** Gaji bersih bulanan — satu-satunya sumber pendapatan aktif. */
  gajiBersihBulanan: number;
  pengeluaranTetap: number;
  biayaPerAnak: number;
  jumlahAnak: number;
  /** Uang tunai di tangan. Negatif berarti pemain wajib bertindak (§5.3). */
  saldoKas: number;
  aset: readonly Aset[];
  liabilitas: readonly Liabilitas[];
  /**
   * Berapa kali pemain sudah menekan pengeluaran tetap lewat tuas Berhemat.
   * Searah dan permanen — ini perubahan cara hidup, bukan sakelar (§5.3).
   */
  kaliBerhemat: number;
}

/** Laporan keuangan yang ditampilkan ke pemain. */
export interface LaporanKeuangan {
  pendapatanAktif: number;
  pendapatanPasif: number;
  totalPendapatan: number;
  totalPengeluaran: number;
  arusKasBulanan: number;
  kekayaanBersih: number;
}

/** Bunga pinjaman darurat per bulan (§5.3). */
export const BUNGA_PINJAMAN_DARURAT = 0.02;

/** Total utang darurat tidak boleh melampaui 6x gaji bulanan (§5.3). */
export const PLAFON_PINJAMAN_GAJI = 6;

/** Tuas Berhemat hanya bisa ditarik dua kali seumur permainan (§5.3). */
export const MAKS_BERHEMAT = 2;

/** Sekali berhemat menekan pengeluaran tetap 15% (§5.3). */
export const POTONGAN_BERHEMAT = 0.15;

const jumlahkan = (angka: readonly number[]): number => angka.reduce((a, b) => a + b, 0);

export function pendapatanAktif(k: KondisiKeuangan): number {
  return k.gajiBersihBulanan;
}

export function pendapatanPasif(k: KondisiKeuangan): number {
  return jumlahkan(k.aset.map((a) => a.arusKasBulanan));
}

export function totalPendapatan(k: KondisiKeuangan): number {
  return pendapatanAktif(k) + pendapatanPasif(k);
}

export function totalPengeluaran(k: KondisiKeuangan): number {
  const cicilan = jumlahkan(k.liabilitas.map((l) => l.cicilanBulanan));
  return k.pengeluaranTetap + cicilan + k.biayaPerAnak * k.jumlahAnak;
}

export function arusKasBulanan(k: KondisiKeuangan): number {
  return totalPendapatan(k) - totalPengeluaran(k);
}

/**
 * Rumus §5.1: saldo kas ikut dihitung. Tanpa itu, penjualan darurat terbaca
 * sebagai kehancuran nilai padahal uangnya utuh berpindah ke kas. Kas
 * menganggur tetap dihukum di tempat yang benar — pendapatan pasifnya nol.
 */
export function kekayaanBersih(k: KondisiKeuangan): number {
  return (
    k.saldoKas +
    jumlahkan(k.aset.map((a) => a.nilai)) -
    jumlahkan(k.liabilitas.map((l) => l.sisaUtang))
  );
}

/** Seluruh baris laporan sekaligus, sekali hitung. */
export function hitungLaporan(k: KondisiKeuangan): LaporanKeuangan {
  return {
    pendapatanAktif: pendapatanAktif(k),
    pendapatanPasif: pendapatanPasif(k),
    totalPendapatan: totalPendapatan(k),
    totalPengeluaran: totalPengeluaran(k),
    arusKasBulanan: arusKasBulanan(k),
    kekayaanBersih: kekayaanBersih(k),
  };
}

/**
 * Syarat lolos tahap 1 (§5.2). Sengaja memakai "lebih besar atau sama dengan"
 * supaya momen lolos jatuh tepat di titik impas.
 */
export function lolosTahapSatu(laporan: LaporanKeuangan): boolean {
  return laporan.pendapatanPasif >= laporan.totalPengeluaran;
}

/**
 * Saldo kas negatif di akhir giliran: pemain wajib menjual aset atau
 * mengambil pinjaman darurat (§5.3). Saldo nol belum berarti habis.
 */
export function perluTindakanDarurat(k: KondisiKeuangan): boolean {
  return k.saldoKas < 0;
}

/**
 * Mengambil pinjaman darurat (§5.3). Cicilan bulanannya adalah bunga
 * berjalan 2% dari sisa pokok, dan pokoknya tidak menyusut sendiri —
 * modelnya utang konsumtif. Satu-satunya jalan keluar adalah
 * `lunasiPinjaman`, dan itu memang disengaja.
 */
export function ambilPinjamanDarurat(k: KondisiKeuangan, jumlah: number): KondisiKeuangan {
  if (jumlah <= 0) throw new Error('Jumlah pinjaman harus lebih dari nol');
  // Plafon adalah satu-satunya rem yang dirancang untuk spiral utang (§5.3).
  // Permintaan di atas sisa plafon dipotong, bukan ditolak — pemain tetap
  // dapat sebagian, dan sisanya memaksa dia memakai tuas lain.
  const pokok = Math.min(jumlah, sisaPlafonPinjaman(k));
  if (pokok <= 0) return k;

  const pinjaman: Liabilitas = {
    id: `darurat-${k.liabilitas.length + 1}`,
    nama: 'Pinjaman darurat',
    sisaUtang: pokok,
    cicilanBulanan: Math.round(pokok * BUNGA_PINJAMAN_DARURAT),
    bungaBulanan: BUNGA_PINJAMAN_DARURAT,
    pokokAwal: pokok,
  };
  return {
    ...k,
    saldoKas: k.saldoKas + pokok,
    liabilitas: [...k.liabilitas, pinjaman],
  };
}

/** Hanya utang berbunga berjalan yang dihitung sebagai utang darurat. */
function totalUtangDarurat(kondisi: KondisiKeuangan): number {
  return kondisi.liabilitas
    .filter((l) => l.bungaBulanan !== undefined)
    .reduce((jml, l) => jml + l.sisaUtang, 0);
}

export function sisaPlafonPinjaman(kondisi: KondisiKeuangan): number {
  const plafon = kondisi.gajiBersihBulanan * PLAFON_PINJAMAN_GAJI;
  return Math.max(0, plafon - totalUtangDarurat(kondisi));
}

/**
 * Penghasilan yang tersisa setelah biaya hidup tetap — sebelum cicilan dan
 * anak. Inilah takaran yang benar untuk guncangan acak (§5.4 Invarian 3):
 * menskalakannya ke gaji menghukum profesi bermargin tipis secara tidak
 * proporsional, karena gaji dan daya tahan adalah dua satuan yang berbeda.
 */
export function penghasilanBebas(kondisi: KondisiKeuangan): number {
  return Math.max(0, kondisi.gajiBersihBulanan - kondisi.pengeluaranTetap);
}

export function bisaBerhemat(kondisi: KondisiKeuangan): boolean {
  return kondisi.kaliBerhemat < MAKS_BERHEMAT;
}

/**
 * Menekan pengeluaran tetap. Permanen dan searah — ini perubahan cara hidup,
 * bukan sakelar. Hanya boleh dipanggil saat kas minus (dijaga di reducer).
 */
export function berhemat(kondisi: KondisiKeuangan): KondisiKeuangan {
  if (!bisaBerhemat(kondisi)) return kondisi;
  return {
    ...kondisi,
    pengeluaranTetap: Math.round(kondisi.pengeluaranTetap * (1 - POTONGAN_BERHEMAT)),
    kaliBerhemat: kondisi.kaliBerhemat + 1,
  };
}

/**
 * Tuas yang masih bisa ditarik saat kas minus. Daftar kosong berarti
 * bangkrut — dan itu satu-satunya syarat bangkrut yang sah (§5.3).
 */
export function tuasTersedia(kondisi: KondisiKeuangan): Array<'jual' | 'pinjam' | 'hemat'> {
  const tuas: Array<'jual' | 'pinjam' | 'hemat'> = [];
  if (kondisi.aset.length > 0) tuas.push('jual');
  if (sisaPlafonPinjaman(kondisi) > 0) tuas.push('pinjam');
  if (bisaBerhemat(kondisi)) tuas.push('hemat');
  return tuas;
}

/**
 * Pelunasan sukarela dari saldo kas (§5.3) — sebagian atau penuh, kapan saja,
 * tanpa denda. Tanpa jumlah, utangnya dilunasi penuh. Pokok berkurang; untuk
 * utang berbunga berjalan, cicilannya ikut turun mengikuti sisa pokok.
 */
export function lunasiPinjaman(
  k: KondisiKeuangan,
  liabilitasId: string,
  jumlah?: number,
): KondisiKeuangan {
  const utang = k.liabilitas.find((l) => l.id === liabilitasId);
  if (!utang) throw new Error(`Utang tidak ditemukan: ${liabilitasId}`);

  const bayar = jumlah ?? utang.sisaUtang;
  if (bayar <= 0) throw new Error('Jumlah pelunasan harus lebih dari nol');
  if (bayar > utang.sisaUtang) throw new Error('Pembayaran melebihi sisa utang');
  if (bayar > k.saldoKas) throw new Error('Saldo kas tidak cukup');

  const sisaUtang = utang.sisaUtang - bayar;
  const liabilitas =
    sisaUtang === 0
      ? k.liabilitas.filter((l) => l.id !== liabilitasId)
      : k.liabilitas.map((l) =>
          l.id === liabilitasId
            ? {
                ...l,
                sisaUtang,
                cicilanBulanan:
                  l.bungaBulanan === undefined
                    ? l.cicilanBulanan
                    : Math.round(sisaUtang * l.bungaBulanan),
              }
            : l,
        );

  return { ...k, saldoKas: k.saldoKas - bayar, liabilitas };
}

/**
 * Menjual satu aset. Tanpa harga jual, aset dilepas seharga nilainya
 * sekarang; dengan harga jual, pasar yang menentukan.
 */
export function jualAset(k: KondisiKeuangan, asetId: string, hargaJual?: number): KondisiKeuangan {
  const aset = k.aset.find((a) => a.id === asetId);
  if (!aset) throw new Error(`Aset tidak ditemukan: ${asetId}`);
  return {
    ...k,
    saldoKas: k.saldoKas + (hargaJual ?? aset.nilai),
    aset: k.aset.filter((a) => a.id !== asetId),
  };
}

/**
 * Kemajuan pelunasan, 0..1. Nol saat utang baru tercatat (belum ada yang
 * dibayar), satu persis saat lunas penuh. Murni untuk tampilan (§5.3) —
 * tidak pernah dipakai untuk mengubah aritmetika lain.
 */
export function progresPelunasan(l: Liabilitas): number {
  if (l.pokokAwal === 0) return 1;
  return (l.pokokAwal - l.sisaUtang) / l.pokokAwal;
}

/**
 * Menyegarkan nilai aset pasar mengikuti harga terbaru. Arus kas bulanannya
 * ikut disegarkan karena imbal hasil dihitung dari nilai, bukan dari harga
 * beli — bunga deposito naik saat saldonya naik.
 */
export function nilaiUlangAsetPasar(
  kondisi: KondisiKeuangan,
  harga: Record<string, number>,
  imbal: (instrumenId: string) => number,
): KondisiKeuangan {
  return {
    ...kondisi,
    aset: kondisi.aset.map((a) => {
      if (!a.instrumenId || a.unit === undefined) return a;
      const nilai = harga[a.instrumenId] * a.unit;
      return { ...a, nilai, arusKasBulanan: Math.round(nilai * imbal(a.instrumenId)) };
    }),
  };
}

/**
 * Menyegarkan nilai aset kartu (§8.3). Berbeda dari aset pasar, arus kas
 * bulanannya sengaja dibiarkan tetap: sewa tidak ikut naik-turun mengikuti
 * harga jual.
 */
export function nilaiUlangAsetKartu(
  kondisi: KondisiKeuangan,
  gerak: (aset: Aset) => number,
): KondisiKeuangan {
  return {
    ...kondisi,
    aset: kondisi.aset.map((a) =>
      a.driftBulanan === undefined ? a : { ...a, nilai: gerak(a) },
    ),
  };
}
