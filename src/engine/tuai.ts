import { cariKartu } from '../data/kartu-peluang';
import { cariInstrumen } from '../data/instrumen';
import type { StatePermainan } from '../types/state';

type ObjekPanen = NonNullable<StatePermainan['tanamTertunda'][number]['objek']>;

/**
 * Nilai barang itu sekarang, atau null bila memang tidak ada yang bisa dibaca.
 *
 * Untuk kartu yang DITOLAK tidak pernah ada aset yang bergerak, jadi tidak ada
 * lintasan sungguhan yang bisa dilacak — nomor aset kartu ikut nomor urut
 * kepemilikan, dan kepemilikan itu tidak pernah terjadi. Yang dipakai di situ
 * adalah nilai wajarnya: harga saat itu ditumbuhkan dengan drift kelasnya
 * (§8.3), tanpa gejolak. Itu ekspektasi, bukan lintasan — dan memang begitu
 * seharusnya dibaca: "kira-kira segini sekarang", bukan "persis segini".
 */
function nilaiSekarang(
  state: StatePermainan,
  objek: ObjekPanen,
  keputusan: 'ambil' | 'tolak',
): number | null {
  if (objek.jenis === 'instrumen') {
    if (!cariInstrumen(objek.id)) return null;
    return state.hargaPasar[objek.id] ?? null;
  }

  const dimiliki = state.keuangan.aset.find((a) => a.id.startsWith(`${objek.id}-`));
  if (dimiliki) return dimiliki.nilai;

  // Diambil tapi asetnya tidak ada lagi berarti sudah dijual sebelum panen.
  // Nilai wajar akan berpura-pura barangnya masih dipegang; lebih jujur
  // mengaku tidak terukur.
  if (keputusan === 'ambil') return null;

  const kartu = cariKartu(objek.id);
  if (!kartu) return null;

  const berlalu = state.giliran - objek.padaGiliran;
  if (berlalu <= 0) return objek.nilaiSaatItu;

  return Math.round(objek.nilaiSaatItu * Math.pow(1 + (kartu.driftBulanan ?? 0), berlalu));
}

/**
 * Hasil luar sebuah Tanam saat panen: apa yang terjadi pada objek keputusan
 * sejak saat itu. Positif = keputusan itu "untung" di dunia luar.
 *
 * Untuk keputusan MENOLAK tandanya dibalik — barang yang melonjak setelah
 * ditolak berarti hasil luar merah. Objek `guncang` selalu nol: tidak ada
 * jalur tak-terpilih yang bisa diukur, sebab guncangan tidak pernah menawarkan
 * pilihan.
 *
 * Nol juga berarti "tidak terukur", bukan "impas" — misalnya saat aset kartu
 * sudah dijual sebelum panen tiba. Layar panen menampilkan nol itu sebagai
 * tanda hubung, bukan sebagai angka.
 */
export function hitungHasilLuar(
  state: StatePermainan,
  objek: ObjekPanen,
  keputusan: 'ambil' | 'tolak',
): number {
  if (objek.jenis === 'guncang') return 0;

  const sekarang = nilaiSekarang(state, objek, keputusan);
  if (sekarang === null) return 0;

  const perubahan = sekarang - objek.nilaiSaatItu;
  // Nol dinormalkan supaya -0 tidak pernah bocor ke layar sebagai "-Rp 0".
  if (perubahan === 0) return 0;
  return keputusan === 'tolak' ? -perubahan : perubahan;
}
