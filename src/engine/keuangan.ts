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
  const pinjaman: Liabilitas = {
    id: `darurat-${k.liabilitas.length + 1}`,
    nama: 'Pinjaman darurat',
    sisaUtang: jumlah,
    cicilanBulanan: Math.round(jumlah * BUNGA_PINJAMAN_DARURAT),
    bungaBulanan: BUNGA_PINJAMAN_DARURAT,
  };
  return {
    ...k,
    saldoKas: k.saldoKas + jumlah,
    liabilitas: [...k.liabilitas, pinjaman],
  };
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
