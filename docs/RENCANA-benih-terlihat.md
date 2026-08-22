# Rencana Tambalan — Benih Terlihat

Status: dikerjakan sebelum Fase 7.

## Kenapa sekarang

Benih permainan saat ini `arus-${Date.now()}`: tujuh belas karakter mesin yang
tidak pernah ditampilkan ke siapa pun. Akibatnya **tidak satu pun sesi bermain
bisa diulang**. Selama Fase 0–6 itu cuma merepotkan; di Fase 7 ia jadi mahal,
karena Ringkasan Akhir dirancang untuk dibaca sebagai bukti. Keluhan pemain
("giliran 23 angkanya aneh") hanya bisa ditelusuri kalau dunianya bisa dibuka
lagi.

GDD §4.2 sudah menjanjikan ini sejak awal — *"Bug bisa dilaporkan cukup dengan
seed + event log"* — tapi janjinya tak pernah dipasang ke antarmuka.

## Keputusan desain

**Bentuk benih: tiga kata, dipisah tanda hubung.** `kabut-rusa-lontar`.
Bukan angka, bukan kode base32. Alasannya satu: benih ini akan ditulis ulang
oleh manusia — disalin ke pesan, lalu diketik kembali di ponsel lain. Angka
punya 0/O dan 1/l; kata tidak. Bahasa Indonesia ditulis seperti dibunyikan,
jadi benih yang bisa diucapkan otomatis bisa dieja.

**Profesi TIDAK dimasukkan ke dalam benih.** Benih menentukan dunia; profesi
menentukan titik berangkat. Menggabungkannya jadi satu kode membuat kodenya
panjang dan menyembunyikan bahwa keduanya memang dua pilihan berbeda. Sebagai
gantinya keduanya **selalu ditampilkan berdampingan** — benih sendirian tidak
cukup untuk mengulang permainan, dan antarmuka tidak boleh berpura-pura cukup.

**Yang ditampilkan adalah benih yang tersimpan, apa adanya.** Tidak pernah
dirapikan saat ditampilkan. Benih yang dipercantik di layar adalah benih yang
salah: ia tidak lagi membuka dunia yang sama. Perapian hanya terjadi **sekali**,
di pintu masuk, sebelum teks itu menjadi benih.

**Pembuat benih baru hidup di luar mesin.** Memilih benih adalah satu-satunya
langkah yang memang tidak boleh deterministik. `engine/` tetap murni.

## Tugas

### Tugas 1 — Peran 1: bentuk benih (`engine/benih.ts`, `data/kata-benih.ts`)
- `normalkanBenih(teks)` — huruf kecil, pemisah apa pun jadi satu tanda hubung,
  sisanya dibuang. **Wajib idempoten.**
- `benihSah(teks)` — kosong sesudah dirapikan berarti tidak sah.
- `rakitBenih(prng)` — murni; tiga kata dari tiga daftar.
- Daftar kata sementara (nada ditinjau Peran 4 di Tugas 4).
- Tes: idempoten; ragam ketikan bertemu di satu benih; benih rakitan adalah
  titik tetap normalisasi; daftar tidak beririsan, tanpa kembar, hanya a–z.

### Tugas 2 — Peran 2: curigai yang hijau
- Uji mutasi atas normalisasi — tiap aturan harus punya tes yang menyalak.
- Invarian pulang-pergi **atas pemutaran penuh**, bukan `stateAwal` saja:
  benih yang ditampilkan, diketik ulang, memberi permainan yang sama sampai
  giliran ke-N. Dengan penjaga tak-hampa.
- **Penjaga kemurnian mesin.** Aturan GDD §4.2 (tanpa `Math.random`, tanpa
  `Date.now`, tanpa React/Dexie di `engine/`) selama enam fase hijau karena
  ingatan, bukan karena tes. Tambalan ini justru menggoda melanggarnya —
  tempat paling wajar untuk menaruh pembuat benih adalah `engine/benih.ts`.

### Tugas 3 — Peran 3: layar mulai menerima ketikan
- `lib/benih-baru.ts` — pembuat tak-murni, di luar `engine/`.
- Kolom benih di Layar Mulai: terisi benih terbaca, bisa diganti, bisa
  diacak ulang; perapian saat kolom ditinggalkan dan saat mulai.
- Benih tampak selagi bermain, di lembar Keuangan — tempat orang membuka
  ketika ada yang terasa keliru.
- Dimainkan di peramban sungguhan.

### Tugas 4 — Peran 4: nada
- Tinjau daftar kata. Benih muncul di layar mulai **dan** di ringkasan akhir;
  kata bernada muram akan terbaca seperti komentar permainan atas pemainnya.
- Kalimat kolom benih hidup di `data/naskah-sistem.ts`, bukan di komponen.

## Definisi Selesai
- `tsc -b && npm test`, lint, build bersih
- Benih rakitan selalu titik tetap normalisasi — ada tesnya
- Benih tersimpan ditampilkan apa adanya, termasuk benih format lama
- Diketik ulang → permainan sama sampai giliran ke-N, diuji lewat pemutaran
- `engine/` terbukti murni oleh tes, bukan oleh ingatan
- Benih dan profesi tak pernah tampil terpisah
