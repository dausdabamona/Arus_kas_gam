# Uji Manusia Fase 8 — Empat Pertanyaan, Satu Putaran

Fase 8 punya empat hal yang **tidak bisa dijawab simulator**. Semuanya tentang
manusia, dan semuanya sudah ditandai di kode sebagai angka belum teruji.
Dokumen ini menyatukannya jadi satu putaran uji supaya orang yang sama tidak
diminta bermain empat kali.

## Kenapa harus manusia

| Yang diuji | Di mana | Kenapa simulator tidak bisa |
|---|---|---|
| `AMBANG_REDA = 3` | `engine/reducer.ts` | Pelari tidak punya suhu batin untuk turun |
| `MINIMUM_UJIAN = 5` | `engine/kemerdekaan.ts` | Sama; dan §7.2 mengikat keduanya jadi satu paket |
| Kalimat Gerbang | `data/naskah-gerbang.ts` | Nadanya cuma terasa oleh yang membacanya saat terdesak |
| Durasi sekali main | §1.4 | Biaya tiap ketukan cuma bisa ditaksir, tidak dihitung |

§7.2 sudah menyatakan ketiganya **satu paket bertiga**: pemain tekun yang
suhunya tak turun tiga poin lolos gerbang minimum lalu jatuh di tabel kartu
kebiasaan, dan kalimat Gerbang terdengar seperti tidak dilihat, bukan tangan di
bahu. Menyetel satu tanpa dua lainnya memindahkan cacatnya, bukan
membetulkannya.

## Apa yang sudah dicatat sendiri oleh aplikasi

Tidak ada telemetri (§15.3) dan tidak ada data pribadi (§15.5). Semua angka di
bawah tinggal di HP pemain, dan hanya keluar kalau **pemain sendiri** menekan
"Simpan salinan" di layar Jurnal.

Per permainan, tersimpan di berkas `.json` itu:

- `giliran` — berapa giliran dijalani
- `msAktif` — waktu yang benar-benar dipakai bermain, jeda antar ketukan
  dipotong di 60 detik supaya HP yang ditaruh tidak ikut terhitung
- `msJeda` — bagian dari `msAktif` yang dihabiskan di dalam Jeda Batin
- `jumlahJeda` dan `jumlahLewati` — berapa jeda dimasuki, berapa dilewati
- `seed` dan `profesiId` — supaya permainannya bisa dibuka lagi persis

Yang **tidak** dicatat: apa pun tentang orangnya.

## Jalannya uji

**Berapa orang.** Enam sampai delapan. Bukan angka statistik; itu jumlah yang
biasanya cukup untuk melihat pola dan masih mungkin ditemani satu per satu.

**Siapa.** Sesuai §1.4: dewasa berpenghasilan tetap, HP Android kelas bawah.
Setidaknya dua orang yang **belum pernah** diberi tahu apa pun tentang game ini
— merekalah alat ukur "bisa dimainkan orang lain tanpa dijelaskan".

**Aturan pendamping.** Jangan menjelaskan apa pun sebelum ditanya. Setiap kali
pemain bertanya, catat pertanyaannya **apa adanya** lalu jawab sependek
mungkin. Daftar pertanyaan itu jawaban Definisi Selesai fase ini.

### Yang diamati, bukan ditanyakan

1. **Berapa lama sebelum ia berhenti sendiri.** Jangan diminta bermain sampai
   selesai. Titik ia berhenti adalah datanya.
2. **Jeda pertama.** Apakah ia mengambilnya atau melewatinya? Kalau melewati,
   apakah ia melewati semuanya sesudah itu?
3. **Layar mana yang bikin diam.** Diam lama = layar itu menuntut penjelasan.
4. **Di mana ia mengetuk sesuatu yang bukan tombol.** Itu peta target sentuh
   yang salah tempat.

### Yang ditanyakan, sesudah ia berhenti

Ketiganya menyasar satu angka masing-masing. Tanyakan persis begini:

**Untuk `AMBANG_REDA`:**
> "Waktu kamu isi angka suhu yang kedua, itu benar-benar turun, atau kamu
> merasa sudah lebih tenang tapi angkanya tetap?"

Yang dicari: orang yang **merasa** reda tapi menggeser slider kurang dari tiga
poin. Kalau itu sering terjadi, ambang 3 terlalu ketat dan menghukum orang yang
justru mengerjakannya.

**Untuk `MINIMUM_UJIAN`:**
> "Di layar Gerbang tadi kamu dapat kartu kebiasaan. Menurutmu itu karena kamu
> kurang bagus mainnya, atau karena permainan belum sempat lihat kamu?"

Yang dicari: apakah bingkai "belum terlatih" sampai, atau terbaca sebagai denda.
Kalau terbaca denda, yang salah bisa angkanya, bisa kalimatnya — lihat berikut.

**Untuk kalimat Gerbang:**
> Tunjuk kalimat *"Refleks berubah lewat latihan, bukan lewat penghasilan."*
> "Kalimat ini terasa seperti apa? Seperti dijelaskan, atau seperti disindir?"

Tanyakan ini **khusus** kepada orang yang tadi mengambil jeda tapi suhunya tidak
turun tiga poin. Bagi dia kalimat itu paling mungkin terdengar seperti tidak
dilihat, dan dialah yang §7.2 sebut "paling serius".

**Untuk durasi:**
Tidak perlu ditanya. Angkanya sudah ada di berkas `.json`. Yang ditanya cuma:
> "Kalau lain kali, kamu mau main selama apa sekali duduk?"

## Cara membaca hasilnya

Kumpulkan berkas `.json` dari tiap HP, lalu:

- **Durasi.** Bandingkan `msAktif` dengan §1.4 (20–35 menit). Bandingkan juga
  `msJeda / msAktif`: kalau lebih dari separuh waktu habis di dalam Jeda,
  levernya jumlah pemicu (§9.1), bukan ekonomi permainan.
- **`AMBANG_REDA`.** Untuk tiap Jeda yang diambil, selisih suhu sebelum dan
  sesudah ada di event log permainan itu — buka dengan benihnya. Kalau
  median selisih pada orang yang **mengaku** lebih tenang jatuh di bawah 3,
  turunkan ambangnya ke median itu, bukan ke angka bulat yang enak dilihat.
- **`MINIMUM_UJIAN`.** Lihat `jumlahJeda` pada orang yang lolos tahap 1. Kalau
  banyak yang berada di bawah 5 padahal mereka bergulat sungguhan, angkanya
  terlalu tinggi.
- **Kalimatnya.** Tidak ada angka. Kalau dua orang atau lebih menyebut kata
  "disindir", "dihakimi", atau semacamnya, kalimat itu diganti — dan §7.2
  mewajibkan kedua angka ditinjau bersamanya.

## Yang TIDAK boleh dilakukan sesudahnya

Menyetel satu angka lalu menyatakan Fase 8 selesai. Ketiganya satu paket, dan
paketnya baru boleh dibuka sekali — dengan data di tangan.
