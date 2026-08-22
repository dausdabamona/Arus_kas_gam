# APK Android — cara membangun dan membagikannya

GDD §4.6 sudah menyebut jalan ini sejak awal: *"Jika nanti dibungkus jadi APK
(Capacitor), kode yang sama jalan tanpa ditulis ulang dan Dexie tetap berfungsi
di dalamnya."* Yang berubah cuma cara sampainya ke HP, bukan isinya. §2 tetap
berlaku — tanpa Play Store; berkasnya diambil langsung dari halaman Rilis
GitHub.

## Cara membuat rilis

```
npm version 0.8.1        # menaikkan nomor versi di package.json
git push --follow-tags   # tag v0.8.1 memicu alur kerja APK
```

Alur kerja `.github/workflows/apk.yml` menjalankan gerbang mutu yang sama
dengan gerbang komit (`tsc -b`, `npm test`, lint) sebelum membangun apa pun.
**Build merah = tidak ada APK.** APK dari kode yang tesnya gagal lebih buruk
daripada tidak ada APK.

Hasilnya menempel di halaman Rilis sebagai `arus-0.8.1.apk`. Untuk mencoba
tanpa membuat rilis, jalankan alur kerjanya dari tab Actions — berkasnya
tinggal sebagai artefak, tidak jadi rilis.

`versionCode` diturunkan dari nomor versi, tidak diketik sendiri:

| versi | versionCode |
|---|---|
| 0.8.0 | 8000 |
| 0.8.1 | 8001 |
| 0.9.0 | 9000 |
| 1.0.0 | 1000000 |

Android menolak memasang APK dengan `versionCode` lebih rendah dari yang
terpasang, jadi angka ini wajib naik — dan karena diturunkan dari `package.json`,
ia tidak bisa berselisih dengan nomor versi yang tertulis di tempat lain.

## Menandatangani (opsional, tapi lakukan sebelum dibagikan luas)

Tanpa kunci, alur kerjanya membangun **APK debug**. Ia bisa dipasang dan
berjalan penuh — cukup untuk uji manusia Fase 8 bersama orang yang sudah
dikenal — tapi ia menyandang `debuggable`, dan Play Protect lebih cerewet
terhadapnya. Untuk dibagikan lebih luas, buat kunci sekali:

```
keytool -genkey -v -keystore arus.keystore -alias arus \
  -keyalg RSA -keysize 2048 -validity 10000
base64 -w0 arus.keystore
```

Simpan empat rahasia di Settings → Secrets and variables → Actions:

| Nama rahasia | Isi |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | keluaran `base64 -w0` di atas |
| `ANDROID_KEYSTORE_PASSWORD` | sandi keystore |
| `ANDROID_KEY_ALIAS` | `arus` |
| `ANDROID_KEY_PASSWORD` | sandi kunci |

**Simpan berkas `arus.keystore` baik-baik dan jangan pernah dikomit.** Kalau
kuncinya hilang, semua orang yang sudah memasang harus mencopot dulu sebelum
bisa memasang versi berikutnya: Android menolak pembaruan yang ditandatangani
kunci berbeda.

## Cara memasang di HP

1. Buka halaman Rilis dari HP, ketuk berkas `.apk`.
2. Android bertanya sekali soal "pasang dari sumber tidak dikenal" — izinkan
   untuk peramban yang dipakai mengunduh.
3. Pasang, buka.

Tidak perlu jaringan sesudah terpasang.

## Yang berbeda di dalam APK, dan kenapa

**Menyimpan berkas.** Di peramban, `<a download>` bekerja seperti biasa. Di
dalam APK ia **diam-diam tidak melakukan apa pun** — WebView Android tidak
memasang DownloadListener, jadi ketukan pemain tidak menghasilkan berkas dan
tidak menghasilkan pesan galat. Itu bukan cacat kecil di sini: seluruh protokol
uji manusia Fase 8 bergantung pada pemain yang menekan "Simpan salinan". Di HP,
berkasnya ditulis ke Documents lalu ditawarkan lewat lembar Bagikan; berkasnya
tetap tersimpan meski lembar Bagikan ditutup.

**Tombol Kembali.** Bawaannya menutup activity. Pemain yang menekannya di
tengah Jeda Batin kehilangan layarnya — dan karena Layar Mulai belum punya
"Lanjutkan permainan", ia kembali ke pemilihan profesi seolah permainannya tak
pernah ada. Di sini Kembali tidak pernah menutup aplikasi: ia menutup lembar
teratas kalau ada, kalau tidak, aplikasi diperkecil. Lembar Darurat (§5.3)
sengaja tidak ikut — keputusan itu wajib diambil, dan tombol perangkat keras
bukan jalan pintas keluar darinya.

**Service worker dicabut.** Seluruh aset sudah lokal di dalam APK, jadi
cache-nya tidak menambah apa pun — tapi bisa mengurangi: cache versi lama tetap
hidup sesudah APK diperbarui, dan pemain menjalankan aplikasi lama di dalam
pembungkus baru tanpa satu tanda pun. Di peramban ia tetap bekerja; di sanalah
gunanya.

**Potret dikunci** (§13.1: satu kolom).

## Yang belum diperiksa di perangkat sungguhan

Lingkungan pengembangan ini tidak bisa mengunduh Android SDK — `dl.google.com`
ditutup kebijakan jaringannya — jadi APK-nya **belum pernah dibangun maupun
dijalankan di sini.** Yang sudah diperiksa: proyek Android tercipta, aset web
tersalin ke dalamnya, rumus `versionCode` dijalankan di Gradle sungguhan, dan
seluruh perubahan kodenya bertes. Yang belum: berkas APK itu sendiri.

Periksa ini pada pemasangan pertama, sebelum membagikannya ke penguji:

- [ ] Aplikasi terbuka dan menampilkan Layar Mulai
- [ ] Ikonnya huruf A ivory di atas teal, bukan logo bawaan Capacitor
- [ ] "Simpan salinan" di layar Jurnal benar-benar menghasilkan berkas
- [ ] Tombol Kembali menutup lembar, bukan aplikasi
- [ ] Permainan bertahan sesudah aplikasi ditutup lalu dibuka lagi
- [ ] Izin `INTERNET` masih tercantum di manifest. Aplikasi ini tidak butuh
      jaringan sama sekali (§15.3: tanpa telemetri), jadi izin itu semestinya
      bisa dicabut — tapi saya tidak bisa membuktikannya tanpa menjalankannya,
      dan APK yang layarnya kosong akan membuang satu putaran uji. Cabut
      setelah pemasangan pertama terbukti jalan, lalu pasang ulang untuk
      memastikan.

## Yang tidak berubah

Tidak ada iklan, tidak ada pembelian, tidak ada telemetri, tidak ada akun
(§15). Tidak ada data yang keluar dari HP kecuali pemain sendiri menekan
"Simpan salinan".
