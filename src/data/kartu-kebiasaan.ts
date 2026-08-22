import type { KartuKebiasaan } from '../types/kebiasaan';

/**
 * Tiga refleks §7.2. Nada `keterangan` menggambarkan apa yang terjadi di badan,
 * bukan menilai orangnya — "tangan bergerak sebelum kepala menimbang", bukan
 * "kamu panik". Nada `caraLepas` menyebut pekerjaan yang bisa dikerjakan,
 * bukan larangan yang harus dipatuhi.
 */
export const KARTU_KEBIASAAN: readonly KartuKebiasaan[] = [
  {
    id: 'refleks-panik',
    nama: 'Refleks lepas saat turun',
    keterangan: 'Saat harga jatuh, tangan bergerak menjual sebelum kepala sempat menimbang.',
    caraLepas: 'Ambil Jeda dua kali saat pasar sedang turun. Setelah itu refleks ini reda.',
    /**
     * 0,15 — BUKAN 0,20 seperti tertulis di §7.2. Simulator menyapu 20.000
     * giliran: penurunan satu giliran terdalam yang MUNGKIN terjadi adalah
     * 17,70% (saham individual, volatilitas 18%). Ambang 20% membuat refleks
     * ini mustahil menyala seumur permainan — label tanpa efek, persis yang
     * Fase 6 larang. 0,15 juga menyatukan angka: §11 dan `kebijakan.ts`
     * sudah memakai 15% untuk panik Pak Rudi.
     */
    efek: { jenis: 'panik', ambangTurun: 0.15 },
    syaratLepas: { jenis: 'lolos-jeda-pasar-turun', kali: 2 },
  },
  {
    id: 'refleks-kejar',
    nama: 'Refleks kejar yang besar',
    keterangan: 'Angka imbal hasil yang tinggi menarik tangan lebih cepat daripada pertimbangan.',
    caraLepas: 'Tolak satu tawaran besar dalam keadaan tenang. Sekali saja sudah cukup.',
    efek: { jenis: 'kejar', ambangImbal: 0.3 },
    syaratLepas: { jenis: 'tolak-tenang', kali: 1 },
  },
  {
    id: 'refleks-banding',
    nama: 'Refleks membandingkan',
    keterangan:
      'Saat orang lain terlihat melampaui, pengeluaran ikut naik tanpa keputusan yang diambil.',
    caraLepas: 'Ambil Jeda satu kali di kebutuhan pengakuan. Sesudah itu bandingannya melonggar.',
    efek: { jenis: 'banding', kenaikanGayaHidup: 0.1 },
    syaratLepas: { jenis: 'lolos-jeda-pengakuan', kali: 1 },
  },
];

export function cariKartuKebiasaan(id: string): KartuKebiasaan {
  const kartu = KARTU_KEBIASAAN.find((k) => k.id === id);
  if (!kartu) throw new Error(`Kartu kebiasaan tidak dikenal: ${id}`);
  return kartu;
}
