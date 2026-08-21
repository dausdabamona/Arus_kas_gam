import type { Instrumen } from '../types/instrumen';

/**
 * Angka di sini WAJIB menjaga Invarian 5 §5.4: ekspektasi reksa indeks tidak
 * boleh kalah dari saham individual. Yang membedakan keduanya adalah sebaran,
 * bukan imbal hasil harapan.
 */
export const INSTRUMEN: readonly Instrumen[] = [
  {
    id: 'deposito',
    nama: 'Deposito',
    keterangan: 'Bunga tetap tiap bulan. Harganya tidak pernah bergerak.',
    hargaAwal: 1_000_000,
    volatilitasBulanan: 0,
    driftBulanan: 0,
    imbalBulanan: 0.003,
  },
  {
    id: 'reksa-indeks',
    nama: 'Reksa dana indeks',
    keterangan: 'Mengikuti pasar secara keseluruhan. Naik pelan, jarang menarik perhatian.',
    hargaAwal: 1_000_000,
    volatilitasBulanan: 0.04,
    driftBulanan: 0.008,
    imbalBulanan: 0,
  },
  {
    id: 'saham-individu',
    nama: 'Saham satu perusahaan',
    keterangan: 'Bisa melonjak, bisa terjun. Dividen kecil dan tidak menentu.',
    hargaAwal: 1_000_000,
    volatilitasBulanan: 0.18,
    driftBulanan: 0.004,
    imbalBulanan: 0.002,
  },
  {
    id: 'emas',
    nama: 'Emas',
    keterangan: 'Tidak menghasilkan apa pun setiap bulan. Ramai dicari saat orang takut.',
    hargaAwal: 1_000_000,
    volatilitasBulanan: 0.06,
    driftBulanan: 0.003,
    imbalBulanan: 0,
  },
];

export function cariInstrumen(id: string): Instrumen | undefined {
  return INSTRUMEN.find((i) => i.id === id);
}
