# Arus — aturan kerja

Permainan papan luring untuk melatih arus kas **dan** cara memperlakukan emosi
soal uang. Ia sengaja memancing emosi, lalu menuntun lewat protokol 4T
(Tenang–Temu–Tanam–Tuai).

**Sumber kebenaran desain: `docs/GDD-arus-kas-4t.md`.** Baca pasal yang relevan
sebelum mengubah apa pun. Kalau kode dan GDD berselisih, tanyakan — jangan
diam-diam pilih salah satu.

## Bahasa

Seluruhnya **Bahasa Indonesia**: teks antarmuka, nama variabel dan fungsi,
komentar kode, pesan komit, nama tes, dan percakapan. Bukan gaya, melainkan
aturan: produk ini untuk orang Indonesia, dan istilah asing yang menyelinap ke
dalam kode akhirnya menyelinap ke layar.

## Empat peran

Satu agen, empat topi, **bergiliran — tidak pernah bersamaan**. Sebelum
menyentuh berkas, sadari sedang memakai topi yang mana.

| Peran | Wilayah | Yang khas |
|---|---|---|
| **1 — Arsitek Mesin** | `src/engine/`, `src/data/` | Satu-satunya yang boleh mengubah angka invarian, dan hanya sesudah simulator membuktikannya. Tiap perubahan angka membawa angka simulator sebelum/sesudah di pesan komitnya. |
| **2 — Penjaga Invarian** | seluruh `*.test.ts` | Tugasnya **mencurigai tes yang hijau**. Alat wajib: mutation testing — rusakkan kodenya, pastikan tesnya menyala. |
| **3 — Perajin Antarmuka** | `src/components/`, `src/screens/`, `src/hooks/` | Larangan mutlak: **tidak boleh ada kalimat penuntun di dalam komponen** — semua naskah tinggal di `src/data/naskah-*.ts`. Tiap layar wajib dimainkan di peramban sungguhan. |
| **4 — Penjaga Nada & Kesetiaan** | `src/data/naskah-*.ts` | Putusan akhir atas nada kalimat dan atas tiga angka yang ditera manusia. |

## Aturan tetap

1. **Simulator yang menang.** Angka apa pun di rencana adalah dugaan awal;
   `src/engine/simulasi.ts` adalah alat ukurnya. Kalau keduanya berselisih,
   simulator yang benar.
2. **Rencana menyesuaikan kode, bukan sebaliknya.**
3. **Jangan pernah melonggarkan tes supaya hijau.** Kalau tes menyala, angkanya
   yang disetel, bukan tesnya. Tidak ada `skip`, tidak ada `only`, tidak ada
   ambang yang dilebarkan.
4. **Jangan sentuh gaji dan pengeluaran tetap profesi** (§14.1 GDD).
5. **Mesin tetap murni.** Tidak ada `Math.random()`, `Date.now()`, `new Date()`,
   `setTimeout`, `fetch`, penyimpanan, maupun global peramban di mana pun dalam
   `src/engine/`. Kalau muncul usul menambah bidang pencatatan ke dalam
   `reduce` — tolak. Yang perlu dicatat diturunkan lewat pemutaran ulang, di
   luar mesin. Dijaga oleh `src/engine/kemurnian.test.ts`.
6. **Jangan pernah memakai merek "CASHFLOW", "Rich Dad", atau "Rat Race"**
   (§2 GDD).
7. **Jangan pernah mengomit kunci penanda tangan.** `.gitignore` menolak
   `*.keystore` dan `*.jks`; itu jaring pengaman, bukan izin.

## Gerbang komit

Satu perintah, sebelum tiap komit:

```bash
npx tsc -b && npm test
```

**Build merah = tidak ada komit, sekalipun tesnya hijau.** Periksa **kode
keluar**, jangan baris yang di-`grep` — berkas tes yang gagal dimuat tidak
memunculkan satu pun tanda silang, dan `| tail` menyembunyikan baris
`Test Files`. Kesalahan ini pernah terjadi dan mendorong build merah ke remote.

`npm run lint` juga hijau sebelum push. Alur kerja APK menjalankan gerbang yang
sama; build merah = tidak ada APK.

## Cara kerja

- **TDD sungguhan**: tulis tesnya, **jalankan dan lihat merah**, baru
  implementasikan. Tes yang tidak pernah terlihat merah tidak membuktikan apa
  pun.
- **Satu komit per tugas.** Pesan komit menjelaskan *sebab*, bukan daftar
  berkas — dan membawa angka kalau ada angka.
- **Hijau di terminal syarat perlu, bukan cukup.** Lihat bagian pengukuran.

## Mesin — yang gampang dirusak tanpa sadar

- **Deterministik penuh.** Seluruh keacakan lewat mulberry32 berbenih; benih
  diberi ruang nama per teks.
- **Invarian konsumsi PRNG**: jumlah tarikan per kejadian **tidak boleh
  bergantung konteks**. Tarikan yang hanya terjadi "kalau begini" merusak
  seluruh determinisme benih. Tarik tanpa syarat, buang hasilnya bila tak
  terpakai.
- **Tiga tarikan berkunci pada `kejadian.t`** — dadu `prngUntuk(seed, t)`,
  guncang `${seed}#guncang#${t}`, panen `${seed}#panen#${t}`. Menyisipkan
  kejadian menggeser seluruh tarikan sesudahnya.
- **Log kejadian hanya-tambah**; state dihitung ulang dengan pemutaran ulang.
  Tidak ada waktu jam dinding di dalam log.
- **Invarian keseimbangan 1–6** (§5.4 GDD), semuanya dijaga tes.
- **Invarian isolasi bot** dengan tepat satu pengecualian yang dinyatakan:
  `refleks-banding`.

## Tiga angka yang menunggu manusia

Terlarang ditebak. Ditetapkan **sebagai satu paket** dari orang sungguhan
(§7.2, prosedurnya di `docs/UJI-MANUSIA-fase-8.md`):

| Apa | Di mana | Nilai sementara |
|---|---|---|
| `AMBANG_REDA` | `src/engine/reducer.ts` | 3 |
| `MINIMUM_UJIAN` | `src/engine/kemerdekaan.ts` | 5 |
| Kalimat Gerbang | `src/data/naskah-gerbang.ts` | "Refleks berubah lewat latihan, bukan lewat penghasilan. Tiap kartu di bawah membawa cara melatihnya." |

Fase 8 tertahan di sini. Jangan diselesaikan dengan tebakan.

## Mengukur, bukan membaca

Dua kelas cacat pernah lolos berulang kali karena diperiksa dengan cara yang
menyembunyikannya:

- `innerText` mengembalikan teks yang terpotong **persis sama** dengan yang
  utuh. Tangkapan layar `fullPage` merentang halaman sehingga tidak ada yang
  pernah terlihat terpotong.
- Nama kelas Tailwind yang benar tidak membuktikan jarak yang dihasilkan.
  `env(safe-area-inset-bottom)` bernilai nol di WebView Android; tesnya hijau,
  bantalannya nol.

Jadi: ukur. `scrollHeight` vs `clientHeight`, `getBoundingClientRect()`,
`scrollWidth` vs lebar kotak, rasio kontras yang dihitung. Dan sesudah alat
ukurnya hijau, **jalankan alat yang sama pada kode sebelum perbaikan** — kalau
ia tidak menyala di sana, ia tidak mengukur apa pun.

Uji layar di **360×740**, bukan jendela desktop. Lebar ponsel yang dipakai:
320, 360, 390, 412.

## Git

Kembangkan dan dorong ke cabang `claude/new-session-acne19`; `main` mengikuti.

```bash
git push -u origin claude/new-session-acne19
```

Kegagalan jaringan diulang dengan jeda menaik (2s, 4s, 8s, 16s).

## Yang masih menganga

- `muat()` belum punya pemanggil — Layar Mulai tidak punya "Lanjutkan
  permainan" (§13.1 menyebutkannya). Terasa tajam di dalam APK.
- Durasi: 33–46 menit bila Jeda dilewati, 121–173 menit bila tiap Jeda diambil,
  melawan §1.4 yang meminta 20–35 menit. Tuas terbesarnya 84 pemicu Jeda per
  permainan (§9.1). Menunggu data manusia.
- Izin `INTERNET` masih tercantum di manifest Android; bisa dicabut sesudah
  pemasangan pertama terbukti jalan.
- APK debug tidak punya kunci tetap — tiap jalan alur kerja menandatangani
  dengan kunci berbeda, jadi tiap pembaruan menuntut copot-pasang, dan mencopot
  menghapus jurnal. Lihat `docs/APK-android.md`.

## Peta berkas

| Tempat | Isi |
|---|---|
| `src/engine/` | Mesin murni dan deterministik. Tanpa React, tanpa Dexie. |
| `src/data/` | Angka, kartu, profesi, dan seluruh naskah (`naskah-*.ts`). |
| `src/components/`, `src/screens/` | Antarmuka. Tanpa kalimat penuntun. |
| `src/lib/` | Dexie, ketahanan penyimpanan, ekspor, jembatan Capacitor. |
| `android/` | Proyek Capacitor. Dibangun di GitHub Actions. |
| `docs/` | GDD, rencana per fase, prosedur uji manusia, panduan APK. |
