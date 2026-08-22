# Rencana Fase 7 — Jurnal Lintas Sesi + Ringkasan Akhir Dua Papan

Sumber: GDD §10 (Dua Papan Skor), §7.3 (syarat menang tahap 2), §12 (Jurnal),
§4.6 (ketahanan penyimpanan), §15 (keselamatan), §16 (tabel fase).

Selesai bila: **jurnal bertahan setelah permainan dihapus.**

## Tiga lubang yang ditemukan sebelum menulis rencana

1. **`AKHIR` membuang alasannya.** Kejadian membawa
   `alasan: 'lolos' | 'menyerah' | 'bangkrut'`, tapi reducer cuma menyetel
   `status: 'selesai'`. Padahal §7.3 justru bergantung pada alasan itu:
   *"berhenti dengan sadar dicatat sebagai kemenangan di papan Kemerdekaan,
   bukan kekalahan"*. Tanpa alasan yang tersimpan, Ringkasan Akhir tidak bisa
   membedakan orang yang berhenti dengan sadar dari orang yang bangkrut.
2. **Tidak ada layar apa pun untuk permainan yang selesai.** `status` menjadi
   `'selesai'` dan papan tetap berdiri seolah tidak terjadi apa-apa.
3. **Tidak ada jalan keluar yang sadar.** §7.3 memberi dua syarat menang tahap
   2 — niat tercapai, atau pemain memilih berhenti. Keduanya belum ada
   tombolnya.

## Dua angka yang TIDAK boleh ditebak

§10.3 memberi tabel empat kuadran tapi tidak memberi ambang untuk "tinggi".
Keduanya diambil dari yang sudah ada, bukan dikarang:

- **Kekayaan tinggi = `lolosTahapSatu`.** Pendapatan pasif menutup pengeluaran
  — itu definisi kemerdekaan finansial yang sudah dipakai seluruh permainan
  (§5.2). Mengarang ambang rupiah baru berarti punya dua definisi "cukup" yang
  berselisih diam-diam.
- **Kemerdekaan tinggi = `!belumTeruji && skor >= AMBANG_SKOR_BERSIH`.** Dua
  angka dibaca, bukan satu — keputusan yang sudah dikunci di Fase 6 untuk
  Gerbang §7.2. Skor 100 dari nol ujian bukan kemerdekaan tinggi; ia belum
  terukur.

## Tugas

### Tugas 1 — Peran 1: alasan akhir tersimpan (`engine/`)
- `state.alasanAkhir: 'lolos' | 'menyerah' | 'bangkrut' | null`
- `AKHIR` mengambil alasan dari kejadian; jalur bangkrut §5.3 menyetel
  `'bangkrut'` sendiri.
- Tes isolasi bot ikut menyala — bidang baru, alasan tertulis di tes.

### Tugas 2 — Peran 1: `engine/ringkasan.ts`
- `ringkasAkhir(state)` murni: dua papan + kuadran + alasan.
- Kekayaan membawa DUA angka (§10.1): kekayaan bersih dan arus kas pasif.
  Menggabungkannya jadi satu skor menyembunyikan pertukaran yang justru
  diajarkan permainan ini.
- Kemerdekaan memakai `ringkasKemerdekaan` yang sudah ada — tidak menghitung
  ulang rasio di tempat kedua.

### Tugas 3 — Peran 2: curigai kuadran
- **Keempat kuadran harus terbukti bisa dicapai lewat simulasi.** Kuadran yang
  mustahil adalah Invarian 5 versi baru: tabel yang rapi di dokumen dan tidak
  pernah menyala di dunia.
- Uji mutasi atas kedua ambang.
- Jurnal bertahan setelah permainan dihapus — diuji, bukan diingat.

### Tugas 4 — Peran 1: jalan keluar yang sadar (`engine/` + kejadian)
- Berhenti dengan sadar di Lingkar Luas mengirim `AKHIR` beralasan
  `'menyerah'`; niat tercapai mengirim `'lolos'`.
- Kata "menyerah" hidup di kode sebagai id, TIDAK pernah muncul di layar —
  §7.3 menyebutnya kemenangan.

### Tugas 5 — Peran 3: Layar Akhir dua papan
- Dua papan bersebelahan, bobot visual setara. Tidak ada yang lebih besar.
- Kuadran, alasan akhir, benih + profesi (dari tambalan sebelumnya), dan
  jurnal permainan ini.
- Disclaimer §2 dan §15.4 — keduanya wajib di layar hasil akhir.
- Dimainkan di peramban sungguhan.

### Tugas 6 — Peran 3: Layar Jurnal lintas sesi
- Semua entri dari semua permainan, terbaru dulu.
- Tombol ekspor manual (§4.6.2) — `unduhCadanganJurnal` sudah ada dan belum
  pernah punya pemanggil.
- Terbuka dari Layar Mulai: jurnal milik pemain, bukan milik sesi.

### Tugas 7 — Peran 4: nada empat kuadran
- Empat label §10.3 adalah teks paling berbahaya di seluruh permainan.
  "Belum jalan" adalah vonis atas seorang manusia, dibaca tepat saat ia
  paling terbuka. Naskah sendiri, penjaga sendiri.
- Alasan akhir 'menyerah' tidak pernah dibingkai sebagai kekalahan (§7.3).

## Definisi Selesai
- `tsc -b && npm test`, lint, build bersih
- Jurnal bertahan setelah permainan dihapus — ada tesnya
- Keempat kuadran terbukti bisa dicapai lewat simulasi
- Dua papan berbobot setara; tak satu pun lebih besar dari yang lain
- Berhenti dengan sadar tidak pernah terbaca sebagai kalah
- Ekspor jurnal punya pemanggil dan benar-benar diketuk saat dimainkan
