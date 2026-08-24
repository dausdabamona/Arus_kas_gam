# Arus

Latihan arus kas dan pengelolaan emosi terhadap uang. Aplikasi web yang bisa
dipasang di HP (PWA), berjalan penuh secara luring, tanpa akun dan tanpa
telemetri.

## Status

**Fase 8 — penyetelan dan uji manusia.** Permainan sudah utuh dan bisa
dimainkan dari awal sampai akhir: dua tahap, protokol 4T, pasar, bot, dua papan
skor, jurnal lintas sesi, dan ekspor. Tersedia sebagai PWA maupun APK Android.

Yang menahan Fase 8 selesai: tiga angka yang harus ditera dari orang sungguhan,
bukan ditebak. Rinciannya di `CLAUDE.md` dan `docs/UJI-MANUSIA-fase-8.md`.

## Menjalankan

```bash
npm install
npm run dev       # server pengembangan
npm test          # seluruh uji (Vitest)
npm run lint      # ESLint, termasuk larangan Math.random() di src/engine/
npm run build     # keluaran produksi ke dist/
npm run preview -- --host   # coba dari HP di jaringan yang sama
```

## Susunan

| Folder | Isi |
| --- | --- |
| `src/engine/` | Mesin murni dan deterministik. Tanpa React, tanpa Dexie, tanpa `Math.random()`. |
| `src/types/` | Tipe kejadian dan state permainan. |
| `src/lib/` | Basis data Dexie, ketahanan penyimpanan, ekspor cadangan jurnal. |
| `src/uji/` | Penyiapan lingkungan uji. |
| `src/data/` | Angka, kartu, profesi, dan seluruh naskah (`naskah-*.ts`). |
| `src/components/`, `src/screens/` | Antarmuka. Tanpa kalimat penuntun di dalamnya. |
| `android/` | Proyek Capacitor untuk APK. Dibangun di GitHub Actions. |
| `docs/` | GDD, rencana per fase, prosedur uji manusia, panduan APK. |

## Prinsip

- **State tidak disimpan.** Yang disimpan adalah daftar kejadian (event log);
  state dihitung ulang dengan memutar ulang daftar itu.
- **Keacakan diturunkan dari `seed + indeks kejadian`**, sehingga pemutaran
  ulang tidak perlu menyimpan keadaan PRNG. Seed sama → hasil sama persis.
- **Jurnal milik pemain, bukan milik sesi.** Menghapus permainan tidak pernah
  menghapus jurnal.
- Seluruh teks antarmuka dalam Bahasa Indonesia. Tema terang saja.

## Ikut mengerjakan

Aturan kerja proyek ini — empat peran, gerbang komit, aturan kemurnian mesin,
dan cara memeriksa yang tidak menipu — ada di **`CLAUDE.md`**. Baca itu dulu.
Sumber kebenaran desainnya `docs/GDD-arus-kas-4t.md`.

## Catatan

Simulasi untuk latihan. Angka disederhanakan dan bukan saran investasi.
