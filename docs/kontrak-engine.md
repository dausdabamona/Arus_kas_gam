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
  pernah berubah oleh pelunasan), `asetId?: string` (tambalan neraca —
  **tautan eksplisit**, kosong berarti beban murni; jangan pernah disimpulkan
  dari pola nama id)
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
- `utangMelekat(kondisi: KondisiKeuangan, asetId: string): Liabilitas[]` —
  utang yang melekat pada satu aset; kosong untuk aset bebas utang.
- `ekuitasAset(kondisi: KondisiKeuangan, asetId: string): number` — nilai
  aset dikurangi Σ sisa utang melekatnya. **Bisa negatif** (aset depresiasi
  §8.3). Mengembalikan 0 untuk aset yang tidak ada.
- `jualAset(kondisi: KondisiKeuangan, asetId: string, hargaJual?: number): KondisiKeuangan`
  — **DISELESAIKAN NETO sejak tambalan neraca.** Kas bertambah
  `(hargaJual ?? nilai) − Σ utang melekat`; aset dan seluruh utang melekatnya
  dibuang bersama. Bila hasil netonya **≤ 0, kondisi dikembalikan tak
  berubah** — menjual rugi bukan tuas, dan "berhasil" di situ membuat pemain
  menggantung. Melempar bila asetnya tidak ada.
  **`hargaJual` juga dikurangi utang melekat.** Pemanggil yang mengira ia
  menerima harga penuh akan salah diam-diam; ada tesnya di `neraca.test.ts`.
- `tuasTersedia(kondisi: KondisiKeuangan): Array<'jual' | 'pinjam' | 'hemat'>`
  — `'jual'` hanya bila **ada aset ber-ekuitas positif**, bukan sekadar
  `aset.length > 0`. Reducer yang memilih aset bawaan wajib memakai syarat
  yang sama; kalau tidak, tuas terlihat tersedia tapi penjualannya ditolak
  dan pemain menggantung di krisis (terbukti sebagai kemacetan 1000 giliran).
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
