# Dokumen Desain Game — "Arus" (nama kerja)

**Game latihan arus kas & pengelolaan emosi terhadap uang**
Versi 1.0 · Status: DRAFT · Disusun untuk dieksekusi dengan Claude Code

---

## 0. Ringkasan Satu Paragraf

Game papan digital satu pemain (melawan bot) di HP, offline penuh, yang memakai
mekanik arus kas untuk **memancing emosi terhadap uang secara sengaja**, lalu
memandu pemain melewatinya dengan protokol 4T (Tenang – Temu – Tanam – Tuai).
Uangnya palsu, emosinya asli. Yang dilatih bukan pengetahuan finansial, tapi
**jeda antara pemicu dan reaksi**. Kemenangan diukur di dua papan skor yang
sengaja tidak selalu searah: Kekayaan dan Kemerdekaan.

---

## 1. Tujuan & Sasaran

### 1.1 Tujuan utama
Pemain mampu mengenali, menamai, dan melepas reaksi emosional terhadap uang
(takut kurang, serakah, iri, menyesal) sampai keputusan finansial bisa diambil
dalam keadaan tenang.

### 1.2 Tujuan sekunder
- Memahami perbedaan aset dan liabilitas lewat pengalaman, bukan definisi.
- Merasakan cara kerja arus kas pasif secara aritmetis.
- Memendekkan jarak sebab–akibat keputusan keuangan dari tahunan menjadi menit.

### 1.3 Yang BUKAN tujuan
- Bukan simulator investasi. Tidak memberi saran investasi.
- Bukan pengganti sesi batin yang sebenarnya (Sedona / 3T penuh).
- Bukan game kompetitif. Tidak ada papan peringkat sosial.

### 1.4 Pengguna sasaran
Dewasa, pegawai berpenghasilan tetap (ASN/swasta), HP Android kelas bawah,
koneksi tidak stabil. Sekali main: 20–35 menit. Bisa dijeda kapan saja.

---

## 2. Batas Hukum & Kekayaan Intelektual

**WAJIB dipatuhi selama pembuatan:**

| Boleh | Tidak boleh |
|---|---|
| Mekanik arus kas, lingkaran dalam/luar, laporan keuangan pemain | Nama merek "CASHFLOW®", "Rich Dad", "Rat Race" sebagai merek |
| Konsep "keluar dari perlombaan" dengan istilah sendiri | Menyalin desain papan, tata warna, atau artwork asli |
| Profesi, kartu, angka, dan teks yang ditulis sendiri | Menyalin teks kartu atau daftar profesi dari game asli |

**Istilah yang dipakai di produk:** *Lingkar Harian* (tahap 1) dan *Lingkar Luas*
(tahap 2). Di dokumen ini keduanya kadang disebut "tahap 1 / tahap 2".
Nama produk final ditentukan belakangan; nama kerja: **Arus**.

**Disclaimer wajib** di layar pembuka dan layar hasil akhir:
> Simulasi untuk latihan. Angka disederhanakan dan bukan saran investasi.

---

## 3. Lima Prinsip Desain (mengikat semua keputusan turunan)

1. **Emosi dulu, aritmetika belakangan.** Setiap mekanik harus bisa menjawab:
   "reaksi apa yang ini pancing?" Kalau tidak memancing apa pun, mekaniknya
   dipotong.
2. **Tenang tidak selalu untung.** Harus ada kasus di mana pemain memutuskan
   dengan sangat jernih dan tetap rugi. Kalau tenang selalu dibayar cuan, yang
   terlatih adalah ketergantungan baru berkemasan spiritual.
3. **Selalu ada tombol Lewati.** Sesi batin yang dipaksa berubah jadi basa-basi
   dan merusak kepercayaan pemain pada alatnya.
4. **Pemain menyimpulkan sendiri.** Game menunjukkan, tidak menceramahi. Tidak
   ada layar "Pelajaran hari ini adalah...".
5. **Offline-first, low-end-first.** Jalan tanpa sinyal, di RAM 2 GB, tanpa
   akun. YAGNI: tidak ada fitur yang belum dibutuhkan.

---

## 4. Arsitektur Teknis

### 4.1 Stack

| Lapis | Pilihan | Alasan |
|---|---|---|
| UI | React 19 + Vite + TypeScript | Sudah dikuasai; build ringan |
| State | Zustand | Ringan, tanpa boilerplate |
| Data lokal | Dexie.js (IndexedDB) | Offline penuh, jurnal persisten |
| Styling | Tailwind CSS | Tema teal–ivory, mobile-first |
| Distribusi | PWA (installable) | Tanpa Play Store, update instan |
| Uji | Vitest | Mesin game wajib bertes |

### 4.2 Keputusan arsitektur kunci — mesin deterministik

**Semua keacakan lewat satu PRNG ber-seed.** Tidak ada `Math.random()` di
mana pun dalam folder `engine/`.

```
seed (string) → mulberry32 → semua lempar dadu, tarik kartu, gerak pasar
```

Konsekuensi yang didapat gratis:
- Permainan bisa diulang persis (untuk debugging dan berbagi kasus).
- Bug bisa dilaporkan cukup dengan seed + event log.
- **Multiplayer online nanti tidak perlu tulis ulang** — cukup sinkronkan
  event log, bukan state.

### 4.3 Event log (append-only)

State permainan **tidak disimpan langsung**. Yang disimpan adalah daftar
kejadian; state dihitung ulang dengan memutar ulang log.

```typescript
type GameEvent =
  | { t: number; type: 'MULAI';        payload: { seed: string; profesiId: string } }
  | { t: number; type: 'LEMPAR_DADU';  payload: { pemainId: string } }
  | { t: number; type: 'AMBIL_KARTU';  payload: { tumpukan: TumpukanId } }
  | { t: number; type: 'PUTUSKAN';     payload: { kartuId: string; pilihan: 'ambil' | 'tolak' } }
  | { t: number; type: 'SUHU_BATIN';   payload: { nilai: number; fase: 'sebelum' | 'sesudah' } }
  | { t: number; type: 'JEDA_BATIN';   payload: JedaBatinPayload }
  | { t: number; type: 'LEWATI_JEDA';  payload: { pemicuId: string } }
  | { t: number; type: 'TANAM';        payload: { kalimat: string; tindakan: string; panenPadaGiliran: number } }
  | { t: number; type: 'TUAI';         payload: { tanamId: string; hasilLuar: number; hasilDalam: 'tenang' | 'tersulut' } }
  | { t: number; type: 'GERBANG_NIAT'; payload: { niat: string } }
  | { t: number; type: 'AKHIR';        payload: { alasan: 'lolos' | 'menyerah' | 'bangkrut' } }
```

Aturan: **`engine/` murni fungsi — tanpa React, tanpa Dexie, tanpa efek
samping.** `reduce(state, event) → state`. Ini yang membuatnya bisa diuji dan
bisa dijadikan multiplayer.

### 4.4 Struktur folder

```
src/
├── engine/                   # MURNI, tanpa dependensi UI
│   ├── prng.ts               # mulberry32 ber-seed
│   ├── keuangan.ts           # rumus laporan keuangan
│   ├── reducer.ts            # reduce(state, event) → state
│   ├── papan.ts              # definisi petak & pergerakan
│   ├── pasar.ts              # gerak harga instrumen
│   ├── bot.ts                # keputusan bot rule-based
│   └── skor.ts               # Kekayaan & Kemerdekaan
├── data/                     # konten (JSON/TS), bukan logika
│   ├── profesi.ts
│   ├── kartu-peluang.ts
│   ├── kartu-guncang.ts
│   ├── kartu-pasar.ts
│   ├── kartu-kebiasaan.ts
│   └── naskah-jeda.ts        # kalimat pemandu 4T
├── components/
│   ├── ui/                   # Tombol, Kartu, Lencana, Modal
│   ├── papan/                # Papan, Bidak, Petak
│   ├── keuangan/             # LaporanKeuangan, BarisArus
│   └── jeda/                 # JedaBatin, SuhuBatin, LayarPanen
├── hooks/                    # use-permainan, use-jurnal
├── lib/
│   ├── db.ts                 # Dexie
│   └── utils.ts
├── types/
└── screens/
```

### 4.5 Skema Dexie

```typescript
// lib/db.ts
db.version(1).stores({
  permainan: 'id, seed, dibuatPada, status',      // metadata sesi
  kejadian:  '++id, permainanId, t',              // event log
  jurnal:    '++id, permainanId, dibuatPada, kebutuhan', // hasil Tanam & Tuai
  pengaturan:'kunci'                              // preferensi pemain
});
```

Jurnal **sengaja tidak dihapus** saat permainan dihapus — itu milik pemain,
bukan milik sesi.

### 4.6 Ketahanan penyimpanan

Basis data yang dipakai adalah **IndexedDB — mesin bawaan HP**, sudah tersedia
di browser Android/iOS tanpa pemasangan, tanpa izin, tanpa server. Dexie hanya
pembungkus tipis di atasnya.

Risikonya: data browser bisa hilang. Pengguna menekan "hapus data aplikasi",
atau Android membersihkannya sendiri saat penyimpanan menipis. Yang paling
mahal kalau hilang adalah **jurnal** — dan bersamanya, kepercayaan pemain pada
alat ini. Tiga pengaman, wajib masuk Fase 0:

1. **`navigator.storage.persist()`** dipanggil saat pertama dibuka, meminta
   sistem menandai data ini agar tidak dibersihkan otomatis. Tidak dijamin
   dikabulkan, tapi tingkat keberhasilannya tinggi untuk PWA yang sudah
   dipasang ke layar utama. Status ditampilkan apa adanya di Pengaturan.
2. **Ekspor cadangan** — berkas `.json` tersimpan ke folder Unduhan tiap
   10 sesi, plus tombol ekspor manual di layar Jurnal.
3. **Pemisahan tabel** — jurnal terpisah dari data permainan, sehingga
   menghapus permainan tidak pernah menyentuh jurnal.

**Yang sengaja tidak dipakai:** SQLite WASM di atas OPFS. Itu SQLite
sungguhan di dalam browser, tapi menambah ±1 MB unduhan dan kerumitan untuk
skala data yang Dexie sudah tangani. Melanggar Prinsip 5.

Jika nanti dibungkus jadi APK (Capacitor), kode yang sama jalan tanpa ditulis
ulang dan Dexie tetap berfungsi di dalamnya.

---

## 5. Mesin Laporan Keuangan

### 5.1 Rumus inti

```
Pendapatan Aktif    = gaji bersih bulanan
Pendapatan Pasif    = Σ (arus kas tiap aset)
Total Pendapatan    = Pendapatan Aktif + Pendapatan Pasif

Total Pengeluaran   = pengeluaran tetap
                    + Σ cicilan liabilitas
                    + (biaya per anak × jumlah anak)

Arus Kas Bulanan    = Total Pendapatan − Total Pengeluaran

Kekayaan Bersih     = saldo kas + Σ nilai aset − Σ sisa utang
```

**Kas ikut dihitung.** Tanpa itu, penjualan darurat (§5.3) terbaca sebagai
kehancuran nilai padahal uangnya utuh berpindah ke kas — tepat di momen
pemain paling tersulut, dan mengajarkan hal yang salah. Kas menganggur tetap
dihukum di tempat yang benar: `Pendapatan Pasif` tetap nol.

Invarian yang wajib dijaga tes: **menjual aset tidak mengubah kekayaan bersih.**

### 5.2 Syarat lolos tahap 1

```
Pendapatan Pasif ≥ Total Pengeluaran
```

Catatan desain: memakai `≥ Total Pengeluaran` (bukan `>`) supaya momen lolos
terasa tepat di titik impas — lebih dramatis dan lebih benar secara konsep.

### 5.3 Aturan uang habis

Jika saldo kas < 0 di akhir giliran, pemain wajib memilih salah satu dari
**tiga tuas**. Ini pemicu emosi paling kuat di seluruh game — jangan
dihaluskan, tapi jangan pula sampai tak bersisa satu pun langkah sah.

| Tuas | Efek | Yang dikorbankan |
|---|---|---|
| **Jual aset** | Nilai aset masuk kas, arus kas pasifnya hilang | Masa depan |
| **Pinjam darurat** | Kas bertambah, cicilan bunga menempel | Arus kas masa depan |
| **Berhemat** | Pengeluaran tetap turun 15%, maksimal dua kali | Kenyamanan, permanen |

**Berhemat hanya tersedia saat kas minus.** Tanpa batas itu, tuas ini akan
dipakai di giliran pertama tanpa biaya apa pun dan kehilangan seluruh
maknanya.

**Plafon pinjaman darurat:** total sisa utang darurat maksimal 6 × gaji
bulanan. Utang tak terbatas menghapus satu-satunya rem yang sudah dirancang.

**Bangkrut** terjadi bila kas minus dan ketiga tuas habis: tidak ada aset,
plafon penuh, penghematan mentok. Bukan kekalahan mendadak — ini akhir yang
sah. Jurnal tetap tersimpan, permainan bisa diulang.

**Aturan pinjaman darurat:**
- Cicilan bulanan = 2% × sisa pokok, masuk ke Total Pengeluaran.
- **Pokok tidak menyusut sendiri.** Ini disengaja: modelnya utang konsumtif
  — cicilan minimum kartu kredit, paylater, pinjaman harian. Kebocoran yang
  tidak berhenti sampai pemain sengaja menghentikannya (§8.2).
- **Pelunasan sukarela** kapan saja dari saldo kas, sebagian atau penuh.
  Tanpa denda. Pokok berkurang, cicilan ikut turun. Tanpa jalan keluar ini,
  pinjaman berubah dari pelajaran menjadi hukuman dan melanggar Prinsip 4.
- **Tanpa tenor.** Bunga majemuk muncul sendiri lewat jalur yang benar: bunga
  membebani arus kas, kas minus lagi memaksa pinjaman berikutnya.

**Utang berbunga berjalan vs utang bawaan profesi.** Hanya liabilitas
ber-`bungaBulanan` (pinjaman darurat) yang cicilannya menyusut saat dilunasi
sebagian. Utang bawaan seperti KPR dan kendaraan: pokok turun, **cicilan tetap
sampai lunas penuh.** Ini disengaja — mencicil setengah-setengah tidak
membebaskan arus kas; kebocoran baru berhenti saat utangnya benar-benar
selesai.

**Syarat tampilan:** kemajuan pelunasan sebagian wajib terlihat (sisa pokok
terhadap pokok awal), dan lembar konfirmasi menyatakan apa adanya bahwa
cicilan tidak berubah sampai lunas. Tanpa itu pemain merasa uangnya lenyap
tanpa jejak.

### 5.4 Invarian keseimbangan

**Invarian 1 — sistem harus konvergen.**

> Penghematan maksimum harus melebihi beban bunga saat plafon pinjaman penuh.

Contoh guru honorer: penghematan 28% × Rp 1.800.000 = Rp 504.000/bulan,
melawan bunga maksimum 2% × (6 × Rp 2.200.000) = Rp 264.000/bulan. Ada jarak,
jadi sistemnya punya titik seimbang.

Tanpa invarian ini, petak Gajian yang membayar arus kas **bersih** (dan itu
benar secara akuntansi) menciptakan umpan balik yang tak pernah pulih: makin
banyak utang → gajian makin kecil → butuh pinjaman baru. Cacat ini ditemukan
lewat simulasi mesin, bukan lewat pembacaan angka, dan wajib dijaga oleh
`simulasi.test.ts` selamanya.

**Invarian 3 — guncangan harus sebanding dengan pemasukan per giliran.**

> Pemasukan Gajian yang diharapkan per giliran ≥ **1,5 ×** total drain acak
> yang diharapkan per giliran (Biaya Tak Terduga + Amal + biaya anak).

Patokan yang benar adalah pemasukan **per giliran**, bukan gaji bulanan —
dua satuan yang berbeda, dan menyamakannya pernah membuat setiap profesi
net-negatif sebelum pemain memutuskan apa pun. Kunci **rasionya**, bukan
nominalnya, dan biarkan `simulasi.test.ts` yang mengukur: dengan begitu
petak atau kartu baru di fase mana pun akan menyalakan tes yang tepat.

Batas pelengkap: **maksimal 3 anak.** Tanpa batas, pengeluaran naik permanen
setiap putaran papan dan kebangkrutan menjadi pasti terlepas dari keterampilan
pemain.

**Invarian 2 — gradien prioritas utang.**

Penyetelan angka di Fase 8 **tidak boleh merusak urutan imbal hasil ini**:

| Tindakan | Nilai per tahun bagi pemain |
|---|---|
| Lunasi pinjaman darurat (2%/bln) | ~27% |
| Beli aset produktif (mis. properti sewa) | ~10% |
| Lunasi KPR bersubsidi | ~4,4% |

Urutannya adalah urutan yang benar di kehidupan nyata: bereskan utang mahal
dulu, baru bangun aset, dan jangan buru-buru melunasi KPR bersubsidi. Pemain
yang memburu pelunasan KPR karena "utang itu menakutkan" akan tertinggal dari
yang berhitung — takut-kurang yang menyamar jadi kehati-hatian. Pelajaran ini
harus muncul sendiri dari angka, tanpa satu kalimat nasihat pun.

Tidak ada "kalah" mendadak. Bangkrut = mengulang, dengan jurnal tetap tersimpan.

---

## 6. Tahap 1 — Lingkar Harian

### 6.1 Papan

24 petak melingkar. Komposisi:

| Petak | Jumlah | Fungsi emosional |
|---|---|---|
| Gajian | 4 | Kelegaan sesaat — lalu sadar tidak berubah apa-apa |
| Peluang Kecil | 5 | Godaan kecil, sering diremehkan |
| Peluang Besar | 3 | Serakah & takut ketinggalan |
| Pasar | 4 | Harga bergerak sendiri; FOMO & panik |
| Biaya Tak Terduga | 3 | Takut kurang |
| Guncang | 3 | Pemicu berat (PHK, sakit, musibah) |
| Amal | 1 | Uji kelekatan saat sedang sempit |
| Tambah Anak | 1 | Pengeluaran naik permanen |

### 6.2 Alur giliran

```
1. Lempar dadu (1d6)
2. Gerak, jalankan efek petak
3. Jika kartu bertekanan muncul → catat SUHU BATIN (sebelum)
4. Tawarkan JEDA BATIN  [bisa Lewati]
5. Keputusan pemain
6. Catat SUHU BATIN (sesudah), jika sesi diambil
7. Hitung ulang laporan keuangan
8. Giliran bot
9. Cek panen tertunda (TUAI) yang jatuh tempo
10. Cek syarat lolos
```

---

## 7. Tahap 2 — Lingkar Luas

Diperlakukan sebagai **ujian kedua, bukan hadiah.** Emosinya berganti, tidak
hilang: dari *takut kurang* menjadi *ingin lebih*, *ingin diakui*, dan hampa.

### 7.1 Gerbang Niat

Saat lolos, sebelum masuk tahap 2, pemain **wajib mengetik satu kalimat**:
kebebasan ini untuk apa. Disimpan sebagai `GERBANG_NIAT`.

Kalimat itu dimunculkan kembali — utuh, tanpa komentar — pada momen pemain
sedang tergoda mengejar angka besar di tahap 2. Konfrontasi datang dari diri
sendiri, bukan dari game.

### 7.2 Kartu Kebiasaan Lama (jembatan antar tahap)

Yang terbawa ke tahap 2 bukan uangnya, tapi refleksnya. Skor Kemerdekaan
tahap 1 menentukan berapa kartu kebiasaan yang dibawa:

| Skor Kemerdekaan T1 | Kartu kebiasaan dibawa |
|---|---|
| ≥ 70 | 0 |
| 40–69 | 1 |
| < 40 | 2 |

| Kartu | Efek | Cara lepas |
|---|---|---|
| **Refleks Panik** | Wajib jual saat instrumen turun >20% | Lolos Jeda Batin 2× saat pasar turun |
| **Refleks Kejar** | Wajib ambil peluang berimbal hasil >30% | Menolak 1× dalam keadaan tenang |
| **Refleks Banding** | Pengeluaran gaya hidup +10% tiap kali bot melampaui kekayaan pemain | Lolos Jeda Batin di kebutuhan "pengakuan" |

Pesan yang tidak perlu dijelaskan: uangnya berubah, orangnya belum.

### 7.3 Syarat menang tahap 2

Tercapainya **niat yang ditulis di Gerbang Niat** (dikonversi jadi target
arus kas oleh game), **atau** pemain memilih berhenti — dan berhenti dengan
sadar dicatat sebagai kemenangan di papan Kemerdekaan, bukan kekalahan.

---

## 8. Pasar & Instrumen

Pemicu emosi paling efisien di game, karena bergerak tanpa diminta.

| Instrumen | Volatilitas/bulan | Arus kas | Peran emosional |
|---|---|---|---|
| Deposito | 0% | +0,3%/bln | Aman, membosankan — uji kesabaran |
| Reksa dana indeks | ±4% | 0 (tumbuh) | Menang pelan; sering diremehkan |
| Saham individual | ±18% | dividen acak | FOMO, panik, menyesal |
| Emas | ±6% | 0 | Pelarian saat takut |
| Properti sewa | ±2% | sewa tetap | Beban perawatan mendadak |
| Usaha kecil | ±25% | tinggi bila bertahan | Serakah & keterikatan ego |

### 8.1 Mekanik kunci: **harga bergerak selama pemain menimbang**

Saat kartu Pasar terbuka, timer 20 detik berjalan dan harga berubah tiap
5 detik di depan mata pemain. Ini FOMO dalam bentuk kode.

**Pengecualian penting:** membuka Jeda Batin **membekukan** timer. Pemain
belajar langsung bahwa berhenti sejenak tidak benar-benar merugikan — persis
kebalikan dari yang dirasakan tubuh saat panik.

### 8.2 Batas kejujuran isi

Isi kartu wajib benar secara literasi finansial: dana darurat didahulukan,
diversifikasi berguna, indeks mengalahkan tebak-tebakan dalam jangka panjang,
utang konsumtif berbunga tinggi adalah kebocoran. Game yang memancing emosi
di atas data keliru hanya melatih judi.

---

## 9. Sistem Emosi (inti produk)

### 9.1 Empat pemicu yang dirancang

| Pemicu | Contoh kejadian | Kebutuhan yang tersentuh |
|---|---|---|
| Takut kehilangan | Dana darurat ludes biaya rumah sakit | Keamanan |
| Serakah | Tawaran imbal hasil 45% yang "sayang dilewatkan" | Keamanan / Kendali |
| Iri | Bot lolos duluan dan menyombong | Pengakuan |
| Menyesal | Instrumen yang ditolak melonjak 3× | Kendali |

### 9.2 Suhu Batin

Setelah kartu bertekanan, pemain menilai sendiri 0–10 lewat slider.
**Game tidak pernah menebak perasaan pemain.** Nilai ini murni laporan diri
dan tidak pernah dipakai untuk menghukum.

### 9.3 Jeda Batin — protokol 4T

**Tenang** — tiga napas dipandu (animasi lingkaran, 4 detik masuk, 6 detik
keluar). Satu pertanyaan: *"Di bagian tubuh mana rasanya paling terasa?"*
Pilihan tap: dada / perut / tenggorokan / bahu / tidak jelas.

**Temu** — pertanyaan terbuka, tanpa kesimpulan:
*"Kalau tawaran ini lewat begitu saja, apa yang sebenarnya terancam?"*
Lalu pemain memilah sendiri: **program / emosi / informasi / kebiasaan**.

- Jika **emosi pekat** → alihkan ke tiga pertanyaan pelepasan:
  *Bisakah perasaan ini dibiarkan ada? Bisakah dilepas? Maukah? Kapan?*
  Melepas dulu; mengosongkan lahan sebelum menanam.
- Jika **informasi** → game menunjukkan data yang relevan (mis. rasio utang).
  Ini bukan masalah batin, jangan diperlakukan begitu.

**Tanam** — pemain mengetik satu kalimat pembalik yang jujur (bukan afirmasi
diulang-ulang) + satu tindakan terkecil. Disimpan, diberi `panenPadaGiliran =
giliranSekarang + acak(4..10)`.

**Tuai** — inilah yang tidak bisa dilatih di hidup nyata karena jaraknya
bertahun-tahun. Di sini dipendekkan jadi menit.

Beberapa giliran kemudian, layar panen muncul:

> Delapan giliran lalu, dalam keadaan tenang, Anda menulis:
> *"Rezeki saya tidak ditentukan oleh satu tawaran."*
> Lalu Anda menolaknya.
> **Hasil luar:** −Rp 0 (tawaran itu ternyata gagal total)
> **Hasil dalam:** tenang

Panen **wajib punya dua sisi terpisah dan sengaja tidak selalu searah.**
Sebagian kasus harus berbunyi: hasil luar merah, hasil dalam hijau. Di situ
pelajarannya masuk sendiri — yang bisa dikendalikan adalah kualitas ikhtiar,
bukan hasilnya.

Layar panen berhenti sejenak (tombol lanjut baru aktif setelah 3 detik)
sebelum giliran berikutnya. Tanpa jeda ini, Tuai hanya jadi papan skor.

### 9.4 Naskah

Semua kalimat pemandu disimpan terpisah di `data/naskah-jeda.ts`, memakai
pertanyaan terbuka tanpa kesimpulan. Nada: tenang, pendek, tidak menggurui,
tidak memuji. Tidak pernah memakai kata "seharusnya".

---

## 10. Dua Papan Skor

### 10.1 Kekayaan
Kekayaan bersih + arus kas pasif. Angka biasa.

### 10.2 Kemerdekaan

```
Keputusan Tenang   = keputusan bertekanan yang diambil setelah Jeda Batin
                     dengan penurunan Suhu Batin ≥ 3 poin
Skor Kemerdekaan   = (Keputusan Tenang / Total Keputusan Bertekanan) × 100
```

Melewati Jeda Batin **tidak dihukum**, hanya tidak dihitung sebagai Keputusan
Tenang. Perbedaannya besar dan harus dijaga di implementasi.

### 10.3 Layar akhir

Kedua skor ditampilkan **berdampingan, dengan bobot visual sama.** Empat
kemungkinan hasil ditampilkan apa adanya, tanpa penilaian moral:

| | Kemerdekaan tinggi | Kemerdekaan rendah |
|---|---|---|
| **Kekayaan tinggi** | Bebas | Kaya tapi terikat |
| **Kekayaan rendah** | Tenang tapi belum berdaya | Belum jalan |

Kotak "Kaya tapi terikat" adalah pesan utama seluruh game, dan jauh lebih
tajam disampaikan lewat skor daripada lewat ceramah.

---

## 11. Bot

Tiga bot, **rule-based, tanpa AI.** Di game ini pemain lain hampir tidak
mempengaruhi keuangan pemain — masing-masing berlomba di papannya sendiri —
jadi kecerdasan bot tidak dibutuhkan. Yang dibutuhkan adalah **kepribadian
emosional yang terlihat.**

| Bot | Perilaku | Fungsi |
|---|---|---|
| **Pak Rudi** | Panik jual saat turun >15%, beli saat sudah naik tinggi | Pemain melihat panik dari luar |
| **Bu Sinta** | Kejar imbal hasil tertinggi, abaikan dana darurat | Serakah yang terlihat masuk akal |
| **Pak Umar** | Konsisten, sederhana, cukup, menolak tawaran besar | Menang pelan-pelan; sering bikin pemain kesal |

Bot **mengomentari** keputusannya dalam 1 kalimat pendek. Pemain mengenali
polanya di luar dulu, sebelum mengenalinya di dirinya sendiri.

Pak Umar sering menang di papan Kemerdekaan. Itu disengaja.

---

## 12. Jurnal

Semua kalimat Tanam + hasil Tuai + kebutuhan yang paling sering tersentuh
tersimpan lintas sesi. Bisa diekspor ke teks/markdown untuk disalin ke jurnal
30 hari yang sesungguhnya.

Layar jurnal menampilkan satu pola tanpa menafsirkan:
> Dari 14 momen bertekanan, 9 berhenti di **keamanan**.

Ini yang menyambungkan game ke hidup nyata. Tanpanya, produk ini hanya hiburan.

---

## 13. Alur Layar

```
Pembuka (disclaimer)
  └→ Beranda ─┬→ Lanjutkan permainan
              ├→ Permainan baru → Pilih Profesi → Papan
              ├→ Jurnal
              └→ Pengaturan

Papan ─┬→ Laporan Keuangan (sheet dari bawah)
       ├→ Kartu → [Jeda Batin] → Keputusan
       ├→ Layar Panen (muncul sendiri)
       ├→ Gerbang Niat (sekali, saat lolos)
       └→ Lingkar Luas → Ringkasan Akhir
```

### 13.1 Tema visual
- Latar ivory `#FDFBF7`, teks `#1C1917`
- Primer teal `#0F766E`, aksen amber `#B45309`
- Untung `#15803D`, rugi `#B91C1C`
- **Tidak ada tema gelap.**
- Target sentuh minimal 44×44 px; angka besar dan tebal; satu kolom.

---

## 14. Konten Awal (contoh; angka masih perlu ditera ulang saat balancing)

### 14.1 Profesi

| Profesi | Gaji bersih/bln | Pengeluaran tetap | Liabilitas awal |
|---|---|---|---|
| ASN Gol. III/b | 5.900.000 | 3.400.000 | KPR subsidi, motor |
| Guru honorer | 2.200.000 | 1.800.000 | Utang koperasi |
| Perawat RSUD | 6.500.000 | 4.100.000 | KPR, paylater |
| Pedagang pasar | 7.000.000 (fluktuatif) | 4.500.000 | Utang modal harian |
| Pegawai bank | 11.000.000 | 8.900.000 | KPR besar, mobil, kartu kredit |
| Kontraktor kecil | 15.000.000 (tak tentu) | 9.000.000 | Utang bank, mobil pickup |

Catatan: gaji sudah termasuk tunjangan, disederhanakan. Angka ini **perlu
diverifikasi dan disetel ulang saat fase balancing** — fungsinya keseimbangan
permainan, bukan akurasi regulasi.

Desain: pegawai bank bergaji dua kali lipat ASN tapi **lebih sulit lolos**.
Ini pelajaran pertama, dan tidak perlu dijelaskan sedikit pun.

### 14.2 Contoh kartu

**Peluang Kecil**
> **Reksa dana indeks** — setoran Rp 500.000/bulan. Tidak ada arus kas
> bulanan. Tumbuh pelan. Tidak ada yang menarik dari kartu ini.

**Peluang Besar**
> **Ruko dekat pasar** — Rp 340 juta, DP Rp 70 juta, sewa bersih
> Rp 2,8 juta/bulan. Perlu perbaikan atap tahun ketiga.

**Guncang**
> **Orang tua masuk rumah sakit.** Rp 18 juta, sekarang. Tidak ada pilihan
> menolak. *(Pemicu: keamanan)*

**Guncang**
> **Bu Sinta lolos duluan.** "Saya bilang juga apa, harusnya ambil yang
> kemarin." *(Pemicu: pengakuan)*

**Pasar**
> **Saham yang Anda tolak 6 giliran lalu naik 210%.** *(Pemicu: kendali)*

---

## 15. Keselamatan & Etika

1. Tombol **Lewati** ada di setiap Jeda Batin, tanpa penalti.
2. Tidak ada notifikasi yang menarik pemain kembali. Tidak ada mekanik
   pembentuk kebiasaan (streak, energi, pengingat harian).
3. Tidak ada pembelian dalam aplikasi. Tidak ada iklan. Tidak ada telemetri.
4. Layar akhir mencantumkan: game ini alat latihan, bukan pengganti kerja
   batin yang sebenarnya; kalau ada yang berat muncul, tempatnya bukan di sini.
5. Tidak mengumpulkan data pribadi apa pun. Semua tinggal di HP pemain.

---

## 16. Rencana Fase Build (untuk Claude Code)

Tiap fase berakhir pada perangkat lunak yang jalan dan bisa diuji. TDD untuk
seluruh isi `engine/`.

| Fase | Isi | Selesai bila |
|---|---|---|
| **0** | Vite + TS + Tailwind + Dexie + PWA + PRNG ber-seed + kerangka event log + tiga pengaman penyimpanan §4.6 | `npm run build` sukses, terpasang di HP, seed sama → keluaran sama, jurnal selamat setelah permainan dihapus |
| **1** | `engine/keuangan.ts` + tes | Semua rumus §5 lulus tes |
| **2** | Papan, giliran, kartu dasar, laporan keuangan di layar | Satu permainan bisa diselesaikan tanpa emosi/pasar |
| **3** | Pasar, instrumen, timer bergerak | Harga bergerak saat menimbang; membeku saat Jeda dibuka |
| **4** | Tiga bot + komentar | Bot main sendiri sampai selesai |
| **5** | **Sistem 4T**: Suhu Batin, Jeda Batin, Tanam, Tuai tertunda | Panen muncul otomatis dengan dua sisi hasil |
| **6** | Gerbang Niat, Lingkar Luas, Kartu Kebiasaan Lama | Skor T1 benar-benar mempengaruhi kondisi awal T2 |
| **7** | Jurnal lintas sesi + ekspor + Ringkasan Akhir dua papan | Jurnal bertahan setelah permainan dihapus |
| **8** | Balancing angka, aksesibilitas, uji di Android RAM 2 GB | Bisa dimainkan orang lain tanpa dijelaskan |

**Gerbang:** tiap fase berhenti untuk konfirmasi sebelum lanjut.

---

## 17. Yang Sengaja TIDAK Dibuat (YAGNI)

- Data pasar sungguhan / IHSG langsung — merusak offline-first dan
  keterulangan, dan membawa implikasi yang tidak dibutuhkan.
- Multiplayer online — **arsitekturnya sudah disiapkan** (deterministik +
  event log), tapi tidak dibangun sekarang.
- Akun, login, cloud sync, papan peringkat.
- Animasi 3D, model dadu fisika, musik latar.
- Sistem pencapaian/lencana — bertabrakan dengan Prinsip 2.

---

## 18. Yang Masih Terbuka

1. Nama produk final.
2. Angka profesi §14.1 perlu ditera ulang saat balancing.
3. Perlukah mode "cepat" 10 menit untuk pemakaian di kelas/pelatihan?
4. Perlukah ekspor jurnal ke .docx berkop, kalau game ini dipakai untuk
   pelatihan resmi?

---

*Akhir dokumen. Rencana implementasi terperinci disusun terpisah setelah
dokumen ini disetujui.*
