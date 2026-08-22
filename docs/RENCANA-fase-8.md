# Rencana Fase 8 — Balancing, Aksesibilitas, HP Kelas Bawah

Sumber: GDD §16 (Fase 8), §13.1 (tema visual), §1.4 (pengguna sasaran),
§3 Prinsip 5 (offline-first, low-end-first), §5.4 (invarian), §7.2 (paket tiga).

Selesai bila: **bisa dimainkan orang lain tanpa dijelaskan.**

## Yang TIDAK bisa saya kerjakan, dan kenapa itu bukan alasan menunda sisanya

Tiga hal di fase ini disetel dari **orang sungguhan**, bukan dari simulator:

- `AMBANG_REDA = 3` (reducer.ts)
- `MINIMUM_UJIAN = 5` (kemerdekaan.ts)
- Kalimat Gerbang "refleks berubah lewat latihan, bukan lewat penghasilan"

§7.2 mengikat ketiganya sebagai **satu paket**: pemain tekun yang suhunya tak
turun tiga poin lolos gerbang minimum lalu jatuh di tabel, jadi dua angka yang
salah bersama menghukum persis orang yang paling serius — dan kalimat itu
terdengar seperti tidak dilihat, bukan tangan di bahu.

Simulator tidak bisa menjawabnya: pelari tidak punya suhu batin untuk turun.
Yang bisa diukur cuma pagarnya. **Menyetelnya dari tebakan melanggar aturan
tetap proyek ini**, jadi ketiganya tetap seperti sekarang sampai ada data dari
manusia. Sisanya jalan terus.

Definisi Selesai fase ini — "bisa dimainkan orang lain tanpa dijelaskan" —
juga hanya bisa dibuktikan oleh orang lain yang memainkannya. Yang bisa
dikerjakan sekarang adalah membuang hal-hal yang jelas butuh dijelaskan.

## Tugas

### Tugas 1 — Peran 2: ukur dulu, jangan setel dulu
Jalankan ulang Invarian 1–6 dan laporkan ANGKANYA, bukan "masih hijau".
Fase ini bernama balancing; menyetel sebelum mengukur adalah menebak dengan
langkah tambahan.

### Tugas 2 — Peran 3: target sentuh §13.1
`minHeight.sentuh = 44px` dan `minWidth.sentuh = 44px` ada di
tailwind.config sejak Fase 0 dan **tidak pernah dipakai satu kali pun**.
Aturan 44×44 selama delapan fase dijaga oleh kebetulan padding. Diukur di
peramban pada 360 px, lalu dipasang beserta penjaganya.

### Tugas 3 — Peran 3: yang terbaca dan yang terjangkau
- Kontras teks terhadap latar, diukur, bukan dikira.
- Tiap kolom isian punya label yang benar-benar tertaut.
- Urutan fokus papan tombol dan cincin fokus yang terlihat.
- Daerah langsung (`aria-live`) untuk angka yang berubah sendiri.

### Tugas 4 — Peran 3: HP kelas bawah, sejauh yang bisa diuji di sini
Perangkat Android RAM 2 GB tidak ada di lingkungan ini. Yang BISA diukur, dan
akan dilaporkan apa adanya sebagai pengganti, bukan sebagai penggantinya:
- besar unduhan pertama dan jumlah berkas;
- waktu sampai layar pertama pada CPU diperlambat 6×;
- pemakaian memori sesudah 200 giliran;
- benar-benar jalan tanpa jaringan setelah dipasang.

### Tugas 5 — Peran 4: yang butuh dijelaskan
Menelusuri satu permainan penuh sebagai orang yang belum pernah diberi tahu
apa pun, dan mencatat tiap titik yang menuntut penjelasan dari luar layar.

## Definisi Selesai
- `tsc -b && npm test`, lint, build bersih — diperiksa lewat kode keluar
- Invarian 1–6 dilaporkan dengan angka, sebelum dan sesudah
- Tidak ada target sentuh di bawah 44×44 — ada tesnya
- Tidak ada kontras di bawah 4.5:1 pada teks biasa — diukur
- Angka low-end dilaporkan apa adanya, dengan batasnya disebut
- Tiga angka manusia TIDAK disentuh; daftar pertanyaan untuk uji manusia siap
