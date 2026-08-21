import type { TumpukanKartu } from './kartu';

export type { TumpukanKartu };

export type KebutuhanId = 'keamanan' | 'kendali' | 'pengakuan' | 'pemisahan';
export type JenisTemuan = 'program' | 'emosi' | 'informasi' | 'kebiasaan';

export interface IsiJedaBatin {
  lokasiTubuh: 'dada' | 'perut' | 'tenggorokan' | 'bahu' | 'tidak-jelas';
  jenisTemuan: JenisTemuan;
  kebutuhan: KebutuhanId;
}

export type Kejadian =
  | { t: number; tipe: 'MULAI'; isi: { seed: string; profesiId: string } }
  | { t: number; tipe: 'LEMPAR_DADU'; isi: { pemainId: string } }
  | { t: number; tipe: 'PUTUSKAN'; isi: { kartuId: string; pilihan: 'ambil' | 'tolak' } }
  | {
      t: number;
      tipe: 'TRANSAKSI_PASAR';
      /**
       * `ketukan` mencatat detik ke-berapa pemain menekan, bukan harganya.
       * Harga dihitung ulang dari ketukan saat pemutaran ulang, sehingga
       * tidak ada angka yang bisa dipalsukan di dalam event log.
       */
      isi: { instrumenId: string; aksi: 'beli' | 'jual' | 'lewat'; unit: number; ketukan: number };
    }
  | { t: number; tipe: 'LUNASI'; isi: { liabilitasId: string; jumlah?: number } }
  | { t: number; tipe: 'JUAL_ASET'; isi: { asetId: string } }
  | { t: number; tipe: 'TINDAKAN_DARURAT'; isi: { tuas?: 'jual' | 'pinjam' | 'hemat'; asetId?: string } }
  | { t: number; tipe: 'TUTUP_GUNCANG'; isi: { kartuId: string } }
  | { t: number; tipe: 'SUHU_BATIN'; isi: { nilai: number; fase: 'sebelum' | 'sesudah' } }
  | { t: number; tipe: 'JEDA_BATIN'; isi: IsiJedaBatin }
  | { t: number; tipe: 'LEWATI_JEDA'; isi: { pemicuId: string } }
  /**
   * `panenPadaGiliran` di sini hanya catatan; mesin menghitung ulang jadwalnya
   * dari seed + t, seperti `ketukan` di pasar. Tidak ada angka di event log
   * yang boleh menentukan hasil.
   */
  | { t: number; tipe: 'TANAM'; isi: { kalimat: string; tindakan: string; panenPadaGiliran: number } }
  | { t: number; tipe: 'TUAI'; isi: { tanamT: number; hasilLuar: number; hasilDalam: 'tenang' | 'tersulut' } }
  | { t: number; tipe: 'GERBANG_NIAT'; isi: { niat: string } }
  | { t: number; tipe: 'AKHIR'; isi: { alasan: 'lolos' | 'menyerah' | 'bangkrut' } };

export type TipeKejadian = Kejadian['tipe'];
