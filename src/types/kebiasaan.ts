/**
 * Kartu Kebiasaan Lama (§7.2) — jembatan antar tahap.
 *
 * Yang terbawa ke Lingkar Luas bukan uangnya, tapi refleksnya. Kartu ini BUKAN
 * hukuman: ia keadaan awal yang jujur, dan setiap kartu wajib membawa cara
 * mematikannya. Kartu tanpa `caraLepas` adalah denda, dan §7.2 melarangnya.
 */
export interface KartuKebiasaan {
  id: 'refleks-panik' | 'refleks-kejar' | 'refleks-banding';
  nama: string;
  /** Refleks yang masih menyala otomatis. Bukan tuduhan. */
  keterangan: string;
  /** Cara mematikannya — pekerjaan yang jelas, bukan hukuman. */
  caraLepas: string;
  efek:
    | { jenis: 'panik'; ambangTurun: number }
    | { jenis: 'kejar'; ambangImbal: number }
    | { jenis: 'banding'; kenaikanGayaHidup: number };
  syaratLepas:
    | { jenis: 'lolos-jeda-pasar-turun'; kali: number }
    | { jenis: 'tolak-tenang'; kali: number }
    | { jenis: 'lolos-jeda-pengakuan'; kali: number };
}
