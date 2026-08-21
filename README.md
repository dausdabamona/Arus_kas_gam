# Arus

Latihan arus kas dan pengelolaan emosi terhadap uang. Aplikasi web yang bisa
dipasang di HP (PWA), berjalan penuh secara luring, tanpa akun dan tanpa
telemetri.

## Status

**Fase 0 — fondasi.** Mesin permainan deterministik, penyimpanan lokal, dan
kerangka PWA sudah berdiri. Belum ada permainan yang bisa dimainkan.

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

## Prinsip

- **State tidak disimpan.** Yang disimpan adalah daftar kejadian (event log);
  state dihitung ulang dengan memutar ulang daftar itu.
- **Keacakan diturunkan dari `seed + indeks kejadian`**, sehingga pemutaran
  ulang tidak perlu menyimpan keadaan PRNG. Seed sama → hasil sama persis.
- **Jurnal milik pemain, bukan milik sesi.** Menghapus permainan tidak pernah
  menghapus jurnal.
- Seluruh teks antarmuka dalam Bahasa Indonesia. Tema terang saja.

## Catatan

Simulasi untuk latihan. Angka disederhanakan dan bukan saran investasi.
