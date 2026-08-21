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
 * Rumus §5.1 apa adanya: hanya aset dikurangi utang. Saldo kas TIDAK ikut
 * dihitung, sehingga menjual aset menurunkan angka ini walau uangnya utuh.
 * Lihat catatan di keuangan.test.ts sebelum mengubahnya.
 */
export function kekayaanBersih(k: KondisiKeuangan): number {
  return jumlahkan(k.aset.map((a) => a.nilai)) - jumlahkan(k.liabilitas.map((l) => l.sisaUtang));
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
 * Mengambil pinjaman darurat. Cicilan bulanannya adalah bunga berjalan
 * 2% dari pokok — utangnya tidak menyusut sendiri, dan cicilannya langsung
 * menambah pengeluaran bulanan.
 */
export function ambilPinjamanDarurat(k: KondisiKeuangan, jumlah: number): KondisiKeuangan {
  if (jumlah <= 0) throw new Error('Jumlah pinjaman harus lebih dari nol');
  const pinjaman: Liabilitas = {
    id: `darurat-${k.liabilitas.length + 1}`,
    nama: 'Pinjaman darurat',
    sisaUtang: jumlah,
    cicilanBulanan: Math.round(jumlah * BUNGA_PINJAMAN_DARURAT),
  };
  return {
    ...k,
    saldoKas: k.saldoKas + jumlah,
    liabilitas: [...k.liabilitas, pinjaman],
  };
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
