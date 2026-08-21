import type { GayaKartu, GayaPasar, GayaDarurat } from '../engine/kebijakan';

export interface ProfilBot {
  id: 'pak-rudi' | 'bu-sinta' | 'pak-umar';
  nama: string;
  profesiId: string;
  gayaKartu: GayaKartu;
  gayaPasar: GayaPasar;
  gayaDarurat: GayaDarurat;
}

/**
 * Tiga kepribadian §11. Otaknya adalah kebijakan yang sama persis dengan
 * yang dipakai simulasi — perilakunya sudah terbukti secara angka sebelum
 * satu baris kode bot ditulis.
 *
 * Pak Umar sengaja diberi profesi bermargin paling tipis. Kalau ia tetap
 * sering menang, pesannya tidak perlu diucapkan.
 */
export const PROFIL_BOT: readonly ProfilBot[] = [
  {
    id: 'pak-rudi',
    nama: 'Pak Rudi',
    profesiId: 'pegawai-bank',
    gayaKartu: 'seimbang',
    gayaPasar: 'panik', // beli saat sudah naik, jual saat turun — §11
    gayaDarurat: 'panik', // jual aset dulu
  },
  {
    id: 'bu-sinta',
    nama: 'Bu Sinta',
    profesiId: 'asn-3b',
    gayaKartu: 'serakah', // ambil semua, abaikan dana darurat — §11
    gayaPasar: 'saham',
    gayaDarurat: 'panik',
  },
  {
    id: 'pak-umar',
    nama: 'Pak Umar',
    profesiId: 'guru-honorer',
    // §11: "menolak tawaran besar" — bukan menolak semuanya. Gaya
    // 'hati-hati' menolak setiap kartu, dan karena reksa indeks tidak
    // memberi arus kas sama sekali, pendapatan pasif Umar mustahil naik
    // dari nol lewat jalur mana pun: ia tidak akan pernah lolos.
    gayaKartu: 'seimbang',
    gayaPasar: 'indeks',
    gayaDarurat: 'sadar', // hemat dulu
  },
];
