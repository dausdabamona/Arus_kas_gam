# Kontrak Mesin (per Fase 1, dengan lanjutan pokok awal)

Dokumen ini disalin apa adanya dari `src/engine/keuangan.ts`. Fase 2 dan
seterusnya memakai nama-nama ini — bukan nama yang mungkin diasumsikan di
dokumen rencana.

## Tipe

- `Aset` — bidang: `id: string`, `nama: string`, `nilai: number`,
  `arusKasBulanan: number`
- `Liabilitas` — bidang: `id: string`, `nama: string`, `sisaUtang: number`,
  `cicilanBulanan: number`, `bungaBulanan?: number`, `pokokAwal: number`
  (**wajib** — catatan sejarah untuk tampilan kemajuan pelunasan, tidak
  pernah berubah oleh pelunasan)
- `KondisiKeuangan` — bidang: `gajiBersihBulanan: number` (**bukan**
  `gajiBulanan`), `pengeluaranTetap: number`, `biayaPerAnak: number`,
  `jumlahAnak: number`, `saldoKas: number`, `aset: readonly Aset[]`,
  `liabilitas: readonly Liabilitas[]`
- `LaporanKeuangan` — bidang: `pendapatanAktif: number`,
  `pendapatanPasif: number`, `totalPendapatan: number`,
  `totalPengeluaran: number`, `arusKasBulanan: number`,
  `kekayaanBersih: number`

## Fungsi

- `hitungLaporan(kondisi: KondisiKeuangan): LaporanKeuangan`
- `pendapatanAktif(kondisi: KondisiKeuangan): number`
- `pendapatanPasif(kondisi: KondisiKeuangan): number`
- `totalPendapatan(kondisi: KondisiKeuangan): number`
- `totalPengeluaran(kondisi: KondisiKeuangan): number`
- `arusKasBulanan(kondisi: KondisiKeuangan): number`
- `kekayaanBersih(kondisi: KondisiKeuangan): number`
- `lolosTahapSatu(laporan: LaporanKeuangan): boolean` — **menerima
  `LaporanKeuangan`, bukan `KondisiKeuangan`.** Pemanggil di UI/reducer wajib
  menulis `lolosTahapSatu(hitungLaporan(kondisi))`.
- `perluTindakanDarurat(kondisi: KondisiKeuangan): boolean`
- `ambilPinjamanDarurat(kondisi: KondisiKeuangan, jumlah: number): KondisiKeuangan`
- `jualAset(kondisi: KondisiKeuangan, asetId: string, hargaJual?: number): KondisiKeuangan`
- `lunasiPinjaman(kondisi: KondisiKeuangan, liabilitasId: string, jumlah?: number): KondisiKeuangan`
- `progresPelunasan(liabilitas: Liabilitas): number` — 0..1, murni untuk
  tampilan kemajuan pelunasan (§5.3)

## Konstanta

- `BUNGA_PINJAMAN_DARURAT = 0.02`

## Penyimpangan dari rencana Fase 2 (dicatat di sini, disesuaikan di kode)

1. `gajiBulanan` → tulis `gajiBersihBulanan` di seluruh data profesi dan UI.
2. `lolosTahapSatu` dipanggil dengan `hitungLaporan(kondisi)`, bukan
   `kondisi` langsung.
3. Setiap `Liabilitas` baru yang dibuat manual (data profesi, efek kartu di
   reducer) wajib mengisi `pokokAwal`.
