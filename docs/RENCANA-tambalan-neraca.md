# Rencana Tambalan — Struktur Neraca yang Benar

Gerbang commit: `tsc -b && npm test` sebagai satu perintah.

Tujuan: struktur keuangan sesuai laporan yang benar — setiap rupiah
tertelusuri, utang yang melekat aset tertaut eksplisit, penjualan aset
diselesaikan neto — lalu ditampilkan sebagai dua laporan dengan **Arus Kas
sebagai laporan utama**, karena game ini melatih menaikkan arus kas dan
mengelola rasa yang dibawanya.

Kenapa sekarang: Fase 7 membangun Ringkasan Akhir di atas neraca. Membangun di
atas struktur yang tautannya cuma kebetulan string berarti membangun dua kali.

Urutan peran: Peran 1 (Tugas 1–4) → Peran 2 (Tugas 4 verifikasi) → Peran 3
(Tugas 5–6). Laporan jujur tidak bisa dibangun di atas data yang tautannya bohong.

## Struktur yang dituju

```
LAPORAN ARUS KAS (utama — yang bergerak tiap bulan)
  Masuk:  Gaji [aktif] · tiap aset berarus kas [pasif, tertaut aset]
  Keluar: Hidup tetap · Biaya anak · tiap cicilan
          (cicilan yang melekat aset diberi keterangan nama asetnya)
  = Arus kas bersih

NERACA (kedua — potret kekayaan)
  Kas · Aset (nilai kini, utang melekat, ekuitas = nilai − utang)
  − Utang murni (tak melekat aset) = Kekayaan bersih
```

Aturan penjualan neto: hasil jual melunasi utang melekat lebih dulu; pemain
menerima ekuitas. Ekuitas negatif berarti aset itu **bukan tuas darurat**.

## Tugas 1 — Tautan aset–utang dan integritas referensial
`Liabilitas.asetId?`; `utangMelekat`; `ekuitasAset`; tes integritas lewat
simulasi. Tautan yatim = tes merah.

## Tugas 2 — Penjualan neto dan tuas darurat berbasis ekuitas
`jualAset` neto; ekuitas ≤ 0 ditolak; `tuasTersedia` menuntut ekuitas positif;
invarian kekayaan bersih tak berubah oleh penjualan.

## Tugas 3 — Potong bersih riwayat lama
`VERSI_LOG`; `muat()` menolak versi lama dengan pesan tenang; jurnal tak tersentuh.

## Tugas 4 — Jalankan ulang seluruh invarian (gerbang Peran 2)
Laporkan pergeseran angka per invarian. Untuk tiap tes yang masih hijau:
masih mengukur klaimnya? Tes tuas darurat yang memakai "punya aset" sebagai
syarat jual kini salah ukur. Bila Invarian 6 bergeser, setel pengali guncang,
bukan tesnya.

## Tugas 5 — Laporan dua bagian di layar
Arus Kas pertama, Neraca kedua. Aset tanpa arus kas (emas, tanah) wajib tampil
di neraca — itulah bug yang memicu tambalan ini.

## Tugas 6 — Konsekuensi penuh di lembar jual
Sebelum konfirmasi: nilai jual − utang melekat = kas diterima; lalu dampak
bulanan sebagai DUA angka (cicilan yang lenyap, arus kas yang hilang).
Aset ber-ekuitas negatif tidak muncul sebagai pilihan jual.

## Definisi Selesai
- `tsc -b && npm test`, lint, build bersih; Invarian 1–6 hijau, pergeseran dilaporkan
- Tidak ada liabilitas yatim — diuji lewat simulasi
- Jual aset berutang: cicilan ikut lenyap; kekayaan bersih tak berubah
- Aset ekuitas-negatif bukan tuas; bangkrut tetap tercapai tanpa menggantung
- Emas (arus kas nol) tampil di neraca — ada tesnya
- Permainan lama tertolak dengan tenang; jurnal selamat
- Laporan terbuka langsung ke Arus Kas, bukan neraca
