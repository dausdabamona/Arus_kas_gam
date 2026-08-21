import type { KondisiKeuangan } from '../engine/keuangan';

export interface Profesi {
  id: string;
  nama: string;
  kondisiAwal: KondisiKeuangan;
}

export const PROFESI: readonly Profesi[] = [
  {
    id: 'asn-3b',
    nama: 'ASN Golongan III/b',
    kondisiAwal: {
      saldoKas: 10_000_000,
      gajiBersihBulanan: 5_900_000,
      pengeluaranTetap: 3_400_000,
      biayaPerAnak: 250_000,
      jumlahAnak: 1,
      kaliBerhemat: 0,
      aset: [],
      liabilitas: [
        {
          id: 'kpr-subsidi',
          nama: 'KPR subsidi',
          sisaUtang: 140_000_000,
          cicilanBulanan: 600_000,
          pokokAwal: 140_000_000,
        },
        {
          id: 'motor',
          nama: 'Cicilan motor',
          sisaUtang: 9_000_000,
          cicilanBulanan: 300_000,
          pokokAwal: 9_000_000,
        },
      ],
    },
  },
  {
    id: 'guru-honorer',
    nama: 'Guru honorer',
    kondisiAwal: {
      saldoKas: 800_000,
      gajiBersihBulanan: 2_200_000,
      pengeluaranTetap: 1_800_000,
      biayaPerAnak: 60_000,
      jumlahAnak: 0,
      kaliBerhemat: 0,
      aset: [],
      liabilitas: [
        {
          id: 'koperasi',
          nama: 'Utang koperasi',
          sisaUtang: 6_000_000,
          cicilanBulanan: 60_000,
          pokokAwal: 6_000_000,
        },
      ],
    },
  },
  {
    id: 'pegawai-bank',
    nama: 'Pegawai bank',
    kondisiAwal: {
      saldoKas: 9_000_000,
      gajiBersihBulanan: 11_000_000,
      pengeluaranTetap: 8_900_000,
      biayaPerAnak: 200_000,
      jumlahAnak: 1,
      kaliBerhemat: 0,
      aset: [],
      liabilitas: [
        {
          id: 'kpr-besar',
          nama: 'KPR',
          sisaUtang: 520_000_000,
          cicilanBulanan: 400_000,
          pokokAwal: 520_000_000,
        },
        {
          id: 'mobil',
          nama: 'Cicilan mobil',
          sisaUtang: 180_000_000,
          cicilanBulanan: 250_000,
          pokokAwal: 180_000_000,
        },
        {
          id: 'kartu-kredit',
          nama: 'Kartu kredit',
          sisaUtang: 22_000_000,
          cicilanBulanan: 150_000,
          bungaBulanan: 0.02,
          pokokAwal: 22_000_000,
        },
      ],
    },
  },
];

export function cariProfesi(id: string): Profesi {
  const profesi = PROFESI.find((p) => p.id === id);
  if (!profesi) throw new Error(`Profesi tidak dikenal: ${id}`);
  return profesi;
}
