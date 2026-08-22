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

**Invarian konsumsi PRNG (ditemukan dua kali, dikunci sebagai aturan tetap):**
jumlah angka acak yang ditarik per kejadian **tidak boleh bergantung pada
konteks**. Undian bersyarat harus selalu menarik jumlah angka yang sama, entah
cadangannya dipakai atau tidak — kalau tidak, deret bergeser dan determinisme
bocor lewat panjang deret, bukan lewat nilainya. Gejalanya tak terlihat dari
hasil; hanya ketahuan bila konsumsi PRNG dicurigai. Dua kejadian nyata:
tabrakan ruang-indeks pasar-vs-dadu, dan undian kartu guncang yang menarik
dua angka bahkan saat cadangan tak dipakai.

**Benih terlihat dan bisa diketik.** Benih berbentuk tiga kata dari alam
(`kabut-rusa-lontar`), tampil di Layar Mulai dan di kaki lembar Keuangan, dan
bisa diketik ulang oleh siapa pun. Bentuknya kata dan bukan angka karena benih
ini akan disalin manusia ke sebuah pesan lalu diketik lagi di ponsel lain —
angka punya 0/O dan 1/l, kata tidak.

Tiga aturan yang mengikat:
- **Perapian terjadi tepat sekali**, di pintu masuk, sebelum teks menjadi
  benih. Benih yang dipercantik saat DITAMPILKAN adalah benih yang salah: ia
  tidak lagi membuka dunia yang sama.
- **Benih tidak pernah tampil tanpa profesinya.** Benih menentukan dunia,
  profesi menentukan titik berangkat; benih sendirian tidak cukup mengulang
  permainan, dan antarmuka tidak boleh berpura-pura cukup.
- **Pembuat benih baru hidup di `lib/`, bukan `engine/`.** Memilih benih
  adalah satu-satunya langkah yang memang tidak boleh deterministik.

Kemurnian `engine/` kini dijaga tes (`engine/kemurnian.test.ts`), bukan
ingatan; dan "benih sama, dunia sama" diuji sebagai permainan utuh 200 giliran
dengan bot hidup (`engine/benih-dunia.test.ts`), bukan per potongan.

**Invarian isolasi bot — berlapis sejak refleks-banding (§7.2).** Dulu: bot
tidak pernah menyentuh pemain. Iri secara struktural butuh orang lain yang
terlihat, jadi refleks-banding memang harus membiarkan keadaan bot menggerakkan
pengeluaran pemain — menghapus ketergantungan itu mengebiri kartunya. Batas
baru, diuji dari dua sisi:
- **Lingkar Harian: isolasi penuh, tanpa kecuali.**
- **Lingkar Luas tanpa refleks-banding: isolasi penuh** — diuji dengan bot
  sengaja 5 miliar lebih kaya, state pemain tetap identik bit demi bit.
- **Lingkar Luas dengan refleks-banding: tepat satu kanal** — hanya
  `pengeluaranTetap` dan penanda kartunya yang boleh dipengaruhi bot. Posisi,
  dadu, harga pasar, riwayat keputusan, gaji, jumlah anak wajib sama persis.
- **Begitu refleks dilepas, kanal menutup.**

Kebocoran yang dipetakan, bernama, dan diuji dari dua sisi bukan kebocoran —
ia kanal. Yang berbahaya adalah kebocoran yang dikira tidak ada.

### 4.3 Event log (append-only)

State permainan **tidak disimpan langsung**. Yang disimpan adalah daftar
kejadian; state dihitung ulang dengan memutar ulang log.

Aturan: **`engine/` murni fungsi — tanpa React, tanpa Dexie, tanpa efek
samping.** `reduce(state, event) → state`. Ini yang membuatnya bisa diuji dan
bisa dijadikan multiplayer.

**Tidak ada angka di event log yang boleh menentukan hasil.** Harga pasar
dihitung ulang dari `ketukan`, jadwal panen dihitung ulang dari seed + t —
angka yang dikirim di dalam kejadian sengaja diabaikan mesin.

### 4.5 Skema Dexie

```typescript
db.version(1).stores({
  permainan: 'id, seed, dibuatPada, status',
  kejadian:  '++id, permainanId, t',
  jurnal:    '++id, permainanId, dibuatPada, kebutuhan',
  pengaturan:'kunci'
});
```

Jurnal **sengaja tidak dihapus** saat permainan dihapus — itu milik pemain,
bukan milik sesi.

### 4.6 Ketahanan penyimpanan

Basis data yang dipakai adalah **IndexedDB — mesin bawaan HP**. Tiga pengaman,
wajib masuk Fase 0:

1. **`navigator.storage.persist()`** dipanggil saat pertama dibuka.
2. **Ekspor cadangan** — berkas `.json` ke folder Unduhan tiap 10 sesi, plus
   tombol ekspor manual di layar Jurnal.
3. **Pemisahan tabel** — jurnal terpisah dari data permainan.

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

### 5.3 Aturan uang habis

Jika saldo kas < 0 di akhir giliran, pemain wajib memilih salah satu dari
**tiga tuas**.

| Tuas | Efek | Yang dikorbankan |
|---|---|---|
| **Jual aset** | Nilai aset masuk kas, arus kas pasifnya hilang | Masa depan |
| **Pinjam darurat** | Kas bertambah, cicilan bunga menempel | Arus kas masa depan |
| **Berhemat** | Pengeluaran tetap turun 15%, maksimal dua kali | Kenyamanan, permanen |

**Berhemat hanya tersedia saat kas minus.** **Plafon pinjaman darurat:** total
sisa utang darurat maksimal 6 × gaji bulanan. **Bangkrut** terjadi bila kas
minus dan ketiga tuas habis.

**Aturan pinjaman darurat:**
- Cicilan bulanan = 2% × sisa pokok.
- **Pokok tidak menyusut sendiri.**
- **Pelunasan sukarela** kapan saja, tanpa denda.
- **Tanpa tenor.**

**Utang berbunga berjalan vs utang bawaan profesi.** Hanya liabilitas
ber-`bungaBulanan` yang cicilannya menyusut saat dilunasi sebagian. Utang
bawaan seperti KPR: pokok turun, **cicilan tetap sampai lunas penuh.**

**Syarat tampilan:** kemajuan pelunasan sebagian wajib terlihat, dan lembar
konfirmasi menyatakan apa adanya bahwa cicilan tidak berubah sampai lunas.

### 5.4 Invarian keseimbangan

**Invarian 1 — sistem harus konvergen.**
> Penghematan maksimum harus melebihi beban bunga saat plafon pinjaman penuh.

**Invarian 3 — guncangan harus sebanding dengan pemasukan per giliran.**
> Pemasukan Gajian yang diharapkan per giliran ≥ **1,5 ×** total drain acak
> yang diharapkan per giliran (Biaya Tak Terduga + Amal).

**Biaya anak bukan drain.** Efeknya sudah terhitung penuh di sisi pemasukan.

**Skala guncangan dikunci sekali di awal permainan**, diturunkan dari arus kas
bersih awal profesi (`skalaGuncangan`), bukan dari gaji dan bukan dari
pemasukan yang berjalan.

Batas pelengkap: **maksimal 3 anak.**

**Invarian 4 — profesi tidak boleh mati oleh dadu saja.**
> Beban anak penuh (3 × biaya per anak) ≤ **60%** arus kas bersih awal.

**Invarian 5 — jenjang imbal hasil pasar harus jujur.**
> Ekspektasi jangka panjang: reksa dana indeks ≥ saham individual > deposito.
> Sebaran diukur **relatif terhadap median per unit**, bukan nilai portofolio
> akhir.

**Peringatan yang dibayar mahal:** tes lama mengukur sebaran nilai portofolio
akhir. Setelah GUNCANG masuk, angka itu berhenti mengukur gejolak instrumen
dan diam-diam mulai mengukur berapa unit yang sempat dibeli — indeks tampak
lebih menyebar daripada saham hanya karena kebijakannya memborong lebih
banyak unit. **Tes yang lulus sambil mengukur hal yang salah lebih berbahaya
daripada tes yang merah.** Pola umum: setiap invarian yang ditulis sebelum
sebuah fitur bisa berhenti mengukur klaimnya setelah fitur itu masuk —
tinjau ulang apa yang diukurnya, bukan cuma apakah masih hijau.

**Invarian 6 — krisis pertama harus tiba selagi pemain masih telanjang.**
> Dengan kebijakan seimbang, kas minus pertama terpicu selambatnya giliran
> **40**, dan mayoritas permainan memakai tuas darurat minimal sekali.

Bentuk lama ("kas minus sekali per ±40 giliran sepanjang permainan") **secara
struktural mustahil**: skala guncangan dikunci di arus kas awal (§5.4), tapi
kekayaan pemain tumbuh tanpa batas — median kas saat guncang tiba 7–12× skala,
persentil 90 mencapai 40–60×. Pukulan berskala tetap tidak bisa menembus
tembok itu, jadi laju krisis selalu melandai di paruh kedua.

Tes penjaga sebab: **kas pemain yang lolos harus > 20× skala guncangan.**
Kalau tes itu suatu hari menyala, tembok kekayaan sudah runtuh dan bentuk
Invarian 6 layak ditinjau ulang — alasannya menjaga dirinya sendiri.

**Batas kartu inflasi:** kenaikan per kartu tetap 0,08 (§8.3), tetapi
akumulasi kenaikan pengeluaran seumur permainan **tidak melebihi 0,5 × skala
guncangan**. Tanpa plafon ini, 8% majemuk 20–30 kali berubah dari guncangan
menjadi inflasi berjalan — persis yang §8.3 tolak, masuk lewat pintu belakang.

**Invarian 2 — gradien prioritas utang.** Penyetelan angka di Fase 8 **tidak
boleh merusak urutan imbal hasil ini**:

| Tindakan | Nilai per tahun bagi pemain |
|---|---|
| Lunasi pinjaman darurat (2%/bln) | ~27% |
| Beli aset produktif | ~10% |
| Lunasi KPR bersubsidi | ~4,4% |

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

**Kemandekan bukan kegagalan.** Pemain yang menolak setiap peluang tidak
bangkrut dan tidak maju — ia berputar. Pendapatan pasifnya tetap nol.
Dijaga sepanjang 200 giliran (jauh di atas sesi 20–35 menit §1.4) untuk ketiga
profesi.

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
sedang tergoda mengejar angka besar di tahap 2.

### 7.2 Kartu Kebiasaan Lama (jembatan antar tahap)

Yang terbawa ke tahap 2 bukan uangnya, tapi refleksnya.

**Kartu ini BUKAN hukuman — ia keadaan awal yang jujur.** Bingkainya wajib:
"refleks ini belum kamu latih, jadi ia masih menyala otomatis; berikut cara
mematikannya." Bukan "kamu gagal, ini bebanmu". Kalau layar Gerbang salah
membingkainya, ia terasa denda — dan Aturan Naskah 6 ("Lewati tanpa penalti")
runtuh diam-diam, karena melewati jeda berujung kartu yang dirasakan sebagai
biaya. Setiap kartu datang bersama syarat lepasnya; membawanya adalah titik
mulai dengan pekerjaan yang jelas, bukan kekalahan.

**Gerbang membaca skor DAN jumlah ujian, tidak boleh skor mentah.** Skor
Kemerdekaan adalah `keputusanTenang / keputusanBertekanan`. Pemain yang lolos
tanpa pernah tertekan berskor `0/0` = penuh — tapi kalau itu berarti nol
kartu, pemain yang tak pernah diuji masuk paling bersih sementara yang
bergulat sepuluh kali dan menang tujuh justru membawa beban. Itu terbalik:
yang terbawa adalah refleks yang belum terlatih, dan orang yang tak pernah
diuji justru paling belum terlatih. Aman dan terlatih adalah dua hal berbeda.

**Kartu dipilih acak murni, bukan menurut kelemahan pemain.** Memilih kartu
dari skor pemain adalah mesin mendiagnosis orang dari angka — dan §7.2
menempatkan kartu ini sebagai keadaan awal jujur, bukan diagnosis. Kocokan
murni bukan pilihan termudah; ia satu-satunya yang setia pada bingkai
bukan-hukuman.

| Kondisi | Kartu kebiasaan dibawa |
|---|---|
| Ujian ≥ minimum, skor ≥ 70 | 0 |
| Ujian ≥ minimum, skor 40–69 | 1 |
| Ujian ≥ minimum, skor < 40 | 2 |
| Ujian < minimum (belum teruji) | 2 |

`MINIMUM_UJIAN` menebak perilaku manusia; simulator tidak bisa menjawabnya
(pelari tak menyentuh suhu/jeda). Ditandai di kode sebagai angka belum teruji,
disetel di Fase 8 dari orang sungguhan — kerabat `AMBANG_REDA`, dan **diuji
sebagai satu paket dengannya**.

| Kartu | Efek | Cara lepas |
|---|---|---|
| **Refleks Panik** | Wajib jual saat instrumen turun >20% | Lolos Jeda Batin 2× saat pasar turun |
| **Refleks Kejar** | Wajib ambil peluang berimbal hasil >30% | Menolak 1× dalam keadaan tenang |
| **Refleks Banding** | Pengeluaran gaya hidup +10% tiap kali bot melampaui kekayaan pemain | Lolos Jeda Batin di kebutuhan "pengakuan" |

**Refleks yang memaksa WAJIB tetap membuka jalur Jeda pada keputusan yang
sama** — di situlah pemain melatih pelepasannya. Refleks yang memaksa lalu
mengunci tanpa jalan keluar adalah hukuman murni.

**Refleks Banding menyala SEKALI per pelampauan**, bukan tiap giliran selama
bot unggul. Efek berulang tanpa pemicu diskrit meledak — kerabat cacat
Amal-tanpa-batas dan spiral utang.

Pesan yang tidak perlu dijelaskan: uangnya berubah, orangnya belum.

### 7.3 Syarat menang tahap 2

Tercapainya **niat yang ditulis di Gerbang Niat**, **atau** pemain memilih
berhenti — dan berhenti dengan sadar dicatat sebagai kemenangan di papan
Kemerdekaan, bukan kekalahan.

---

## 8. Pasar & Instrumen

| Instrumen | Volatilitas/bulan | Arus kas | Peran emosional |
|---|---|---|---|
| Deposito | 0% | +0,3%/bln | Aman, membosankan — uji kesabaran |
| Reksa dana indeks | ±4% | 0 (tumbuh) | Menang pelan; sering diremehkan |
| Saham individual | ±18% | dividen acak | FOMO, panik, menyesal |
| Emas | ±6% | 0 | Pelarian saat takut |

### 8.1 Mekanik kunci: **harga bergerak selama pemain menimbang**

Timer 20 detik berjalan dan harga berubah tiap 5 detik.

**Pengecualian penting:** membuka Jeda Batin **membekukan** timer.

### 8.2 Batas kejujuran isi

Isi kartu wajib benar secara literasi finansial. Game yang memancing emosi
di atas data keliru hanya melatih judi.

### 8.3 Kelas nilai aset — dua sumbu, bukan satu

| Kelas | Contoh | Arus kas | Nilai |
|---|---|---|---|
| Apresiasi | Tanah kavling, ruko | Minus/kecil | Naik pelan, kadang melonjak |
| Stagnan | Kos, kontrakan | Positif stabil | Nyaris diam |
| Depresiasi | Motor sewa, gerobak, kapal | Positif tinggi | Turun terus |

Aturan isi: **tidak boleh ada kelas yang unggul di semua sumbu.**

**Keputusan: inflasi kontinu TIDAK dimodelkan.** Beban emosional inflasi
disampaikan lewat **kartu Guncang diskrit**: "Harga-harga naik. Pengeluaran
tetap naik 8%, permanen."

---

## 9. Sistem Emosi (inti produk)

### 9.1 Empat pemicu yang dirancang

| Pemicu | Contoh kejadian | Kebutuhan yang tersentuh |
|---|---|---|
| Takut kehilangan | Dana darurat ludes biaya rumah sakit | Keamanan |
| Serakah | Tawaran imbal hasil 45% yang "sayang dilewatkan" | Keamanan / Kendali |
| Iri | Bot lolos duluan dan menyombong | Pengakuan |
| Menyesal | Instrumen yang ditolak melonjak 3× | Kendali |

Kartu Guncang membawa `pemicu` sendiri. Pemicu non-guncang dipetakan tetap
(hidup sebagai konstanta di `LayarPapan`, bertaut ke bagian ini): **peluang
besar → keamanan**, **pasar → kendali**. Peluang kecil tidak menawarkan jeda
sama sekali (§9.3).

### 9.2 Suhu Batin

Setelah kartu bertekanan, pemain menilai sendiri 0–10 lewat slider.
**Game tidak pernah menebak perasaan pemain.**

### 9.3 Jeda Batin — protokol 4T

**Tenang** — turun dari kepala ke badan: rasakan telapak kaki menempel lantai,
lalu berat badan di tempat duduk, lalu napas biasa 3–4 kali **tanpa diatur**.
(Setia ke sumber 3T: bukan teknik pernapasan berhitung.)

**Temu** — pertanyaan terbuka, tanpa kesimpulan. Lalu pemain memilah sendiri:
**program / emosi / informasi / kebiasaan**.

- Jika **emosi pekat** → tiga pertanyaan pelepasan.
- Jika **informasi** → game menunjukkan data yang relevan. Ini bukan masalah
  batin — tapi **tetap diukur suhunya**: pemain yang tenang karena datanya
  jelas layak dapat kredit Kemerdekaan yang sama. "Jangan diproses sebagai
  emosi" bukan berarti "jangan diukur".

**Tanam** — satu kalimat pembalik yang jujur + satu tindakan terkecil.
`panenPadaGiliran = giliranSekarang + acak(4..10)`.

**Tuai** — panen **wajib punya dua sisi terpisah dan sengaja tidak selalu
searah.**

**Nol bukan impas — nol berarti tak terukur.** Layar Tuai menampilkan yang tak
terukur sebagai tanda hubung, bukan "Rp 0", dan -0 dinormalkan.

Layar panen berhenti sejenak (tombol lanjut baru aktif setelah 3 detik).

### 9.4 Naskah

Semua kalimat pemandu disimpan terpisah di `data/naskah-jeda.ts`.

**Batas dua suara.** Aturan nada mengikat suara **pemandu** saja. Suara bot dan
teks kartu Guncang justru boleh menusuk — merekalah pemicunya. Penjaga nada
otomatis hanya menjangkau berkas naskah pemandu, dan itu disengaja.

---

## 10. Dua Papan Skor

### 10.1 Kekayaan
Kekayaan bersih + arus kas pasif.

### 10.2 Kemerdekaan
```
Skor Kemerdekaan = (Keputusan Tenang / Total Keputusan Bertekanan) × 100
```
Melewati Jeda Batin **tidak dihukum**, hanya tidak dihitung sebagai Keputusan
Tenang.

### 10.3 Layar akhir

| | Kemerdekaan tinggi | Kemerdekaan rendah |
|---|---|---|
| **Kekayaan tinggi** | Bebas | Kaya tapi terikat |
| **Kekayaan rendah** | Tenang tapi belum berdaya | Belum jalan |

---

## 11. Bot

| Bot | Perilaku | Fungsi |
|---|---|---|
| **Pak Rudi** | Panik jual saat turun, beli saat sudah naik | Pemain melihat panik dari luar |
| **Bu Sinta** | Kejar imbal hasil tertinggi | Serakah yang terlihat masuk akal |
| **Pak Umar** | Konsisten, sederhana, cukup | Menang pelan-pelan |

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

### 13.1 Tema visual
- Latar ivory `#FDFBF7`, teks `#1C1917`
- Primer teal `#0F766E`, aksen amber `#B45309`
- Untung `#15803D`, rugi `#B91C1C`
- **Tidak ada tema gelap.**
- Target sentuh minimal 44×44 px.

---

## 14. Konten Awal

### 14.1 Profesi

| Profesi | Gaji bersih/bln | Pengeluaran tetap | Liabilitas awal |
|---|---|---|---|
| ASN Gol. III/b | 5.900.000 | 3.400.000 | KPR subsidi, motor |
| Guru honorer | 2.200.000 | 1.800.000 | Utang koperasi |
| Pegawai bank | 11.000.000 | 8.900.000 | KPR besar, mobil, kartu kredit |

Desain: pegawai bank bergaji dua kali lipat ASN tapi **lebih sulit lolos**.

---

## 15. Keselamatan & Etika

1. Tombol **Lewati** ada di setiap Jeda Batin, tanpa penalti.
2. Tidak ada mekanik pembentuk kebiasaan.
3. Tidak ada pembelian dalam aplikasi, iklan, atau telemetri.
4. Layar akhir mencantumkan: ini alat latihan, bukan pengganti kerja batin.
5. Tidak mengumpulkan data pribadi apa pun.

---

## 16. Rencana Fase Build

| Fase | Isi | Selesai bila |
|---|---|---|
| **0** | Scaffold + PRNG + event log + pengaman penyimpanan | Build sukses, seed sama → keluaran sama |
| **1** | `engine/keuangan.ts` + tes | Semua rumus §5 lulus tes |
| **2** | Papan, giliran, kartu dasar, laporan keuangan | Satu permainan bisa diselesaikan |
| **3** | Pasar, instrumen, timer bergerak | Harga membeku saat Jeda dibuka |
| **4** | Tiga bot + komentar | Bot main sendiri sampai selesai |
| **5** | **Sistem 4T** | Panen muncul otomatis dengan dua sisi hasil |
| **6** | Gerbang Niat, Lingkar Luas, Kartu Kebiasaan Lama | Skor T1 mempengaruhi kondisi awal T2 |
| **7** | Jurnal lintas sesi + ekspor + Ringkasan Akhir dua papan | Jurnal bertahan setelah permainan dihapus |
| **8** | Balancing, aksesibilitas, uji di Android RAM 2 GB | Bisa dimainkan orang lain tanpa dijelaskan |

**Gerbang:** tiap fase berhenti untuk konfirmasi sebelum lanjut.

---

## 17. Yang Sengaja TIDAK Dibuat (YAGNI)

- Data pasar sungguhan, multiplayer online, akun/login/cloud sync,
  animasi 3D, sistem pencapaian/lencana.

---

## 18. Yang Masih Terbuka

1. Nama produk final.
2. Angka profesi §14.1 perlu ditera ulang saat balancing.
3. Perlukah mode "cepat" 10 menit untuk pemakaian di kelas/pelatihan?
4. Perlukah ekspor jurnal ke .docx berkop, kalau game ini dipakai untuk
   pelatihan resmi?

---

## 19. Ide Pengembangan — Ditahan (bukan tugas fase)

Dicatat agar tidak hilang, sengaja tidak dijadwalkan agar tidak menyelinap
sebelum Fase 6–8 tuntas.

**"Laporan keuangan bisa dibuka saat kartu tawaran terbuka."** — SUDAH
DIKERJAKAN. Pemain membaca tawaran kartu atau tawaran pasar sambil perlu
membandingkannya dengan kondisi keuangannya sendiri: punya cukup uang muka?
Cicilan tambahan masih sanggup? Arus kas sudah berapa? Tanpa bisa membuka
laporan, ia memutuskan dari ingatan.

Tombol "Keuangan" ada di kartu peluang dan kartu pasar. Lembar laporan terbuka
di atas kartu; kartu tetap menunggu di belakang, keputusan belum diambil. Untuk
kartu pasar, timer dibekukan selagi laporan terbuka — kail `beku` dari Fase 3,
mekanisme yang sama dengan Jeda Batin. Laporan di sini MEMBACA saja: baris
utangnya tidak membuka lembar pelunasan.

**"Ringkasan kredit tiga angka di kartu tawaran."** — SUDAH DIKERJAKAN. Untuk
kartu berutang: cicilan per bulan, selisih terhadap arus kasnya, dan lama balik
modal. Selisih nol atau minus tidak ditandai sebagai kartu buruk — itu
pertukaran yang sah (§8.3): kas berkurang, ekuitas tumbuh. Balik modal tidak
ditampilkan di situ, sebab angkanya akan tak hingga atau negatif. Tanpa satu
pun kata penilaian; angkanya yang berbicara (Prinsip 4).

**Memecah `pengeluaranTetap` jadi beberapa pos.** Saat ini satu angka
gelondongan, dan Berhemat cuma menurunkannya 15% — pemain tidak pernah melihat
apa yang ia korbankan. §5.3 menyebut Berhemat sebagai "kehilangan kenyamanan
sekarang, permanen", tapi tanpa melihat kenyamanan apa yang hilang, permanennya
cuma angka.

**Maksudnya (ini yang membedakannya dari sekadar rincian):** memecah pengeluaran
jadi beberapa pos BUKAN untuk ditampilkan statis di menu Keuangan — itu rincian
yang tidak mengubah keputusan mana pun dan melanggar YAGNI (§3, Prinsip 5).
Maksudnya adalah menampilkan pos mana yang tergerus tepat saat Berhemat dipilih,
mengubah keputusan darurat dari "angka turun" jadi "aku melepaskan sesuatu".
Rincian yang punya pekerjaan, bukan rincian yang memuaskan rasa ingin tahu.

Uji kelayakannya saat diambil nanti: apakah melihat pos yang hilang mengubah
cara pemain memutuskan di lembar darurat? Kalau tidak, ia tetap YAGNI dan tidak
dikerjakan.

---

*Akhir dokumen.*
