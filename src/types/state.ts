import type { KondisiKeuangan } from '../engine/keuangan';
import type { KartuPeluang } from './kartu';
import type { KebutuhanId } from './kejadian';



export type StatusPermainan = 'berjalan' | 'selesai';

export interface StatePermainan {
  seed: string;
  profesiId: string;
  giliran: number;
  posisi: number;
  riwayatDadu: number[];
  status: StatusPermainan;
  keuangan: KondisiKeuangan;
  /**
   * Takaran guncangan acak, DIKUNCI sekali di awal permainan dari arus kas
   * bersih awal profesi (§5.4 Invarian 3). Bukan gaji — itu menghukum profesi
   * bermargin tipis dua kali. Bukan pemasukan berjalan — guncangan yang ikut
   * tumbuh membuat pemain tak pernah bisa melampaui gejolak, dan satu-satunya
   * hadiah membangun aset lenyap.
   */
  skalaGuncangan: number;
  /** Kartu yang sedang menunggu keputusan. Null bila tidak ada. */
  kartuTerbuka: KartuPeluang | null;
  /** Harga penutup tiap instrumen pada giliran berjalan. */
  hargaPasar: Record<string, number>;
  /** Instrumen yang sedang ditawarkan, menunggu keputusan. Null bila tidak ada. */
  pasarTerbuka: string | null;
  /**
   * Kartu guncang yang sedang terbuka, teksnya sudah terisi. Null bila tidak ada.
   * Teks disimpan matang supaya {nama} bot dan {barang} yang ditolak tidak
   * perlu dicari ulang saat layar digambar.
   */
  guncangTerbuka: { kartuId: string; judul: string; teks: string } | null;
  /** Barang yang pernah ditolak/dilewati — bahan pemicu menyesal dan Tuai. */
  riwayatDitolak: RiwayatDitolak[];
  /** Keadaan emosi sesi berjalan — transient per pemicu, dikosongkan tiap keputusan. */
  emosi: KeadaanEmosi;
  /** Tanam yang menunggu panen. */
  tanamTertunda: TanamTertunda[];
  /** Panen yang sedang ditampilkan. */
  panenTerbuka: TanamTertunda | null;
  /**
   * Penghitung skor Kemerdekaan (§7.2). `keputusanBertekanan` adalah
   * penyebutnya, `keputusanTenang` pembilangnya — jadi keduanya naik bersama
   * saat sebuah keputusan tenang, dan skornya tidak pernah melampaui 100.
   * Pembagi nol dihitung sebagai skor penuh: tidak pernah diuji bukanlah kegagalan.
   */
  skor: { keputusanBertekanan: number; keputusanTenang: number };
  /** Dunia tiga bot. Kosong di dalam dunia bot itu sendiri — tidak bersarang. */
  bot: BotBerjalan[];
}

export interface RiwayatDitolak {
  jenis: 'kartu' | 'instrumen';
  id: string;
  /** Nilai/harga saat ditolak. */
  nilaiSaatItu: number;
  padaGiliran: number;
}

export interface KeadaanEmosi {
  suhuSebelum: number | null;
  suhuSesudah: number | null;
  jedaDiambil: boolean;
  /**
   * Kebutuhan yang ditemukan di Jeda. Tidak ada di rencana, tapi TANAM tiba
   * SETELAH JEDA_BATIN dan rencana menuntut `tanamTertunda[].kebutuhan` terisi —
   * jadi ia harus menumpang di suatu tempat sampai keputusan mengosongkannya.
   */
  kebutuhan: KebutuhanId | null;
}

export interface TanamTertunda {
  t: number;
  kalimat: string;
  tindakan: string;
  /** Giliran saat menanam. */
  padaGiliran: number;
  /** Giliran jatuh tempo. */
  panenPadaGiliran: number;
  objek: { jenis: 'kartu' | 'instrumen' | 'guncang'; id: string; nilaiSaatItu: number } | null;
  kebutuhan: KebutuhanId | null;
  /**
   * Sisi dalam panen, distempel saat keputusan pemicunya dihitung — suhu
   * "sesudah" baru tiba setelah TANAM, jadi ia tidak bisa ditentukan di sana.
   */
  hasilDalam: 'tenang' | 'tersulut' | null;
}

/** Satu bot beserta dunianya sendiri. */
export interface BotBerjalan {
  id: string;
  /** Dunia bot sendiri. Bidang `bot` di dalamnya selalu kosong. */
  state: StatePermainan;
  hargaLalu: Record<string, number>;
  lolosPadaGiliran: number | null;
  bangkrutPadaGiliran: number | null;
  /** Kalimat terakhir yang diucapkan bot. Null bila sedang diam. */
  komentar: string | null;
}

export const JUMLAH_PETAK = 24;
