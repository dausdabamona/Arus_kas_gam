# Rencana Implementasi — Fase 6: Gerbang Niat dan Lingkar Luas

Tujuan: Tahap kedua. Saat pemain lolos Lingkar Harian, ia menuliskan niat, lalu
masuk Lingkar Luas membawa Kartu Kebiasaan Lama yang jumlahnya ditentukan skor
Kemerdekaan **dan** jumlah ujiannya. Di sinilah skor Fase 5 pertama kali
berkonsekuensi: uang berubah, refleks belum.

## Fondasi yang tak bisa ditawar (§7.2)

Kartu Kebiasaan Lama **bukan hukuman**. Ia keadaan awal yang jujur dengan
pekerjaan yang jelas. Kalau layar mana pun di fase ini membingkainya sebagai
denda, Aturan Naskah 6 runtuh dan seluruh sistem Lewati Fase 5 ikut beracun.
Bingkai wajib: "refleks ini belum terlatih, ini cara mematikannya."

## Dua angka belum teruji (ditandai di kode, disetel di Fase 8)

- `MINIMUM_UJIAN` — batas "belum teruji". Pagar: tiap permainan lolos
  menghadapi ≥31 pemicu, jadi nilai mana pun 3–10 memisahkan "menolak diukur"
  dari "ikut diukur" tanpa menyentuh pemain normal. Rencana pakai 5.
- `AMBANG_REDA` (dari Fase 5) berpasangan dengannya. Uji sebagai satu paket:
  pemain tekun yang suhunya tak turun 3 poin lolos minimum lalu jatuh di tabel.

Keduanya dilarang disetel dari tebakan.

## Tugas 1: Skor Kemerdekaan sebagai fungsi murni

`src/engine/kemerdekaan.ts` + tes. `ringkasKemerdekaan(skor)` mengembalikan
`{ skor, ujian, belumTeruji, kartuKebiasaan }`.

## Tugas 2: Data Kartu Kebiasaan Lama

`src/types/kebiasaan.ts`, `src/data/kartu-kebiasaan.ts` + tes. Tiga kartu §7.2,
setiap kartu wajib punya `caraLepas` tak kosong.

## Tugas 3: Tahap, niat, dan kebiasaan di state

`StatePermainan` bertambah `tahap`, `niat`, `kebiasaan`. Kejadian baru:
`MASUK_LINGKAR_LUAS`. Kartu dikocok dari `${seed}#kebiasaan`.

## Tugas 4: Efek dan pelepasan kebiasaan

Berkas:
- Buat: `src/engine/kebiasaan.ts`
- Ubah: `src/engine/reducer.ts`
- Uji: `src/engine/kebiasaan.test.ts`

Kartu kebiasaan harus benar-benar memaksa refleks, lalu bisa dilepas — kalau
efeknya tidak terasa, ia cuma label; kalau tak bisa dilepas, ia hukuman.

```ts
export function refleksMemaksa(
  kebiasaan: StatePermainan['kebiasaan'],
  konteks: { jenis: 'pasar'; turunPersen: number } | { jenis: 'kartu'; imbalPersen: number },
): { dipaksa: boolean; kartuId?: string };

export function majukanPelepasan(
  kebiasaan: StatePermainan['kebiasaan'],
  peristiwa: 'jeda-pasar-turun' | 'tolak-tenang' | 'jeda-pengakuan',
): StatePermainan['kebiasaan'];
```

Tes wajib:

1. `refleks-panik` memaksa jual saat `turunPersen > ambangTurun`; tidak memaksa
   di bawah ambang; tidak memaksa bila sudah `lepas`.
2. `refleks-kejar` memaksa ambil saat `imbalPersen > ambangImbal`.
3. `majukanPelepasan` menaikkan kemajuan hanya untuk kebiasaan yang syaratnya
   cocok dengan peristiwa; menandai `lepas: true` saat kemajuan mencapai
   `kali`; kebiasaan yang sudah lepas tidak berubah lagi.
4. `refleks-banding` menaikkan pengeluaran gaya hidup saat bot melampaui
   kekayaan pemain — dan **hanya sekali per pelampauan**, bukan tiap giliran.

Sambungan di reducer:
- Pada `PUTUSKAN`/`TRANSAKSI_PASAR` (hanya tahap `'luas'`): cek
  `refleksMemaksa`. Bila dipaksa, keputusan pemain yang berlawanan diabaikan
  dan aksi refleks dijalankan, dengan penanda agar UI bisa menjelaskan.
- **Refleks yang mengambil alih tetap membuka jalur Jeda.**
- Pada `JEDA_BATIN` di konteks cocok: panggil `majukanPelepasan`.

## Tugas 5: Simulasi Lingkar Luas

Pelari otomatis masuk Lingkar Luas saat lolos, mencatat `masukLuasPadaGiliran`,
`kartuKebiasaanDibawa`, `kebiasaanTerlepas`.

## Tugas 6: Layar Gerbang Niat

`src/data/naskah-gerbang.ts`, `src/screens/LayarGerbang.tsx`. Teks penjelasan
kebiasaan wajib bebas kata "denda/hukuman/gagal/kalah".

## Tugas 7: Lingkar Luas di layar

`src/components/papan/PitaKebiasaan.tsx`, penanda tahap dan niat di header,
penanda refleks mengambil alih.

## Definisi Selesai Fase 6

- `npm test`, `npm run lint`, `npm run build` bersih
- Invarian 1–6 tetap hijau setelah tahap dua masuk
- Isolasi bot lulus dengan bidang state baru
- Pemain tak teruji (0/0) membawa dua kartu, bukan nol
- Setiap kartu kebiasaan punya jalan keluar; refleks yang memaksa tetap
  membuka Jeda
- `MINIMUM_UJIAN` ditandai belum teruji, berpasangan dengan `AMBANG_REDA`
- Naskah gerbang tidak ada di komponen
