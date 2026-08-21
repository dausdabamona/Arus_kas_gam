# Rencana Tambalan Fase 2 — Menutup Spiral Utang

**Tujuan:** Menghapus keadaan permainan yang tidak punya langkah sah, dan
membuat sistem konvergen — dibuktikan oleh simulasi yang dijalankan sebagai
tes, bukan sekali jalan.

Kendala Global dan Arah Desain mengikuti `RENCANA-fase-2.md`.

Urutannya penting: Tugas 1 memasang jaring pengaman lebih dulu, supaya tiga
tugas berikutnya bisa dibuktikan benar-benar menyelesaikan masalahnya.

---

## Tugas 1: Jadikan simulasi sebagai tes permanen

**Berkas:**
- Buat: `src/engine/simulasi.ts`, `src/engine/simulasi.test.ts`

**Antarmuka:**
- Memakai: `reduce`, `stateAwal` dari `./reducer`; `perluTindakanDarurat`,
  `arusKasBulanan` dari `./keuangan`
- Menghasilkan:
  - `type Kebijakan = 'hati-hati' | 'serakah' | 'seimbang'`
  - `jalankanSimulasi(opsi): HasilSimulasi`
  - `HasilSimulasi` — `{ giliran, akhir, puncakPengeluaran, puncakUtang, state }`

Pelari simulasi memakai reducer yang sama dengan permainan sungguhan — tidak
boleh ada logika tandingan di sana.

---

## Tugas 2: Biaya Tak Terduga proporsional

**Berkas:**
- Ubah: `src/engine/reducer.ts`
- Uji: `src/engine/reducer-petak.test.ts`

Rp 5.000.000 terhadap kas Rp 800.000 bukan guncangan, itu eksekusi. Skalakan
ke gaji supaya adil untuk semua profesi tanpa penyetelan per profesi.

---

## Tugas 3: Tiga tuas darurat, plafon, dan bangkrut

**Berkas:**
- Ubah: `src/engine/keuangan.ts`, `src/types/kejadian.ts`, `src/engine/reducer.ts`
- Uji: `src/engine/darurat.test.ts`

**Menghasilkan di `keuangan.ts`:**
- `PLAFON_PINJAMAN_GAJI = 6`
- `MAKS_BERHEMAT = 2`
- `POTONGAN_BERHEMAT = 0.15`
- `sisaPlafonPinjaman(kondisi)`, `bisaBerhemat(kondisi)`, `berhemat(kondisi)`,
  `tuasTersedia(kondisi)`

**Kejadian baru:** `TINDAKAN_DARURAT` dengan `{ tuas?, asetId? }`.

`KondisiKeuangan` bertambah satu bidang: `kaliBerhemat: number`.

Bangkrut terjadi hanya bila ketiga tuas habis.

---

## Tugas 4: Lembar darurat di layar

**Berkas:**
- Buat: `src/components/keuangan/LembarDarurat.tsx`
- Ubah: `src/screens/LayarPapan.tsx`

Momen ini adalah simpul keputusan paling penting di seluruh permainan, dan
Fase 5 akan memasang Jeda Batin tepat di sini. Bangun sekarang supaya ketiga
pilihan terlihat berdampingan dengan bobot yang sama.

Syarat: ketiga tuas tampil berdampingan dengan bobot visual sama, tidak ada
pilihan yang terpasang di muka, dan tombol lempar dadu mati selama kas minus.

---

## Definisi Selesai

- [x] `simulasi.test.ts` hijau untuk seluruh profesi, tiga kebijakan, lima seed
- [x] Invarian 1 §5.4 punya tesnya sendiri di `darurat.test.ts`
- [x] Invarian 3 §5.4 diukur dari jalannya simulasi, bukan dari rumus, dan
      dijaga tes untuk ketiga profesi
- [x] Kebijakan `serakah` selalu berakhir — tidak ada permainan tanpa ujung
- [x] Kebijakan `hati-hati` **mandek di `batas-giliran`, bukan bangkrut.**
      Pemain yang menolak setiap peluang tidak meledak dan tidak mati; dia
      hanya tidak pernah maju. Itu justru bunyi §6.1 tentang petak Gajian —
      "kelegaan sesaat, lalu sadar tidak berubah apa-apa" — jadi kemandekan
      di sini adalah perilaku yang benar, bukan cacat, dan dituntut oleh tes.
- [x] Tidak pernah ada keadaan kas minus tanpa satu pun tombol yang bisa
      ditekan
- [x] Tuas bawaan reducer tidak pernah berujung panik: saat pemain tidak
      memilih, urutannya `hemat` → `pinjam` → `jual`
- [x] `npm test`, `npm run lint`, `npm run build` bersih

---

*Akhir rencana tambalan.*
