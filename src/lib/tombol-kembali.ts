/**
 * Tumpukan penutup lembar, untuk tombol Kembali perangkat keras Android.
 *
 * Di dalam APK, bawaan tombol Kembali adalah MENUTUP ACTIVITY. Pemain yang
 * menekannya di tengah Jeda Batin kehilangan layarnya — dan karena Layar Mulai
 * belum punya "Lanjutkan permainan", ia kembali ke pemilihan profesi seolah
 * permainannya tidak pernah ada. Event log-nya utuh di basis data; yang tidak
 * ada cuma jalan kembali ke sana.
 *
 * Karena itu Kembali TIDAK PERNAH menutup aplikasi di sini. Ia menutup lembar
 * teratas kalau ada, dan kalau tidak ada, aplikasi diperkecil seperti kebiasaan
 * Android — permainannya tetap hidup di tempatnya.
 *
 * Lembar yang memang tidak boleh ditutup begitu saja (Lembar Darurat, §5.3)
 * tidak ikut mendaftar: keputusan itu wajib diambil, dan tombol perangkat keras
 * bukan jalan pintas keluar darinya.
 */
type Penutup = () => void;

const tumpukan: Penutup[] = [];

export function daftarkanPenutup(tutup: Penutup): () => void {
  tumpukan.push(tutup);
  return () => {
    const i = tumpukan.lastIndexOf(tutup);
    if (i >= 0) tumpukan.splice(i, 1);
  };
}

/** Menutup lembar teratas. Mengembalikan false bila tidak ada yang bisa ditutup. */
export function tutupTeratas(): boolean {
  const tutup = tumpukan.pop();
  if (!tutup) return false;
  tutup();
  return true;
}

export function jumlahPenutup(): number {
  return tumpukan.length;
}
