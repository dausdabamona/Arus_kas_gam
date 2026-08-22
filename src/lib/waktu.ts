/**
 * Pencatat waktu bermain, untuk uji manusia Fase 8 (§1.4: sekali main 20-35
 * menit). Simulator hanya bisa MENAKSIR biaya tiap ketukan; angka sungguhannya
 * cuma bisa datang dari orang yang benar-benar mengetuk.
 *
 * Tidak ada telemetri (§15.3) dan tidak ada data pribadi (§15.5): seluruh angka
 * di sini tinggal di HP pemain, dan hanya keluar kalau pemain sendiri menekan
 * "Simpan salinan" di layar Jurnal.
 *
 * Hidup di `lib/`, bukan `engine/`. Waktu jam dinding tidak boleh masuk mesin,
 * dan tidak satu angka pun di sini menentukan hasil permainan.
 */

/**
 * Jarak antar ketukan yang lebih panjang dari ini dipotong. HP yang ditaruh
 * bukan waktu bermain — tanpa batas ini, satu orang yang meninggalkan permainan
 * semalaman melaporkan sesi delapan jam, dan seluruh pengukuran durasi jadi
 * omong kosong. Satu menit cukup longgar untuk satu ketukan yang benar-benar
 * lama (membaca kartu Guncang, menimbang tawaran pasar) dan cukup ketat untuk
 * menolak ponsel yang dikantongi.
 */
export const BATAS_JEDA_MS = 60_000;

export interface Pencatat {
  msAktif: number;
  msJeda: number;
  jumlahJeda: number;
  jumlahLewati: number;
  terakhirPada: number | null;
  jedaMulai: number | null;
}

export function kosong(): Pencatat {
  return { msAktif: 0, msJeda: 0, jumlahJeda: 0, jumlahLewati: 0, terakhirPada: null, jedaMulai: null };
}

/**
 * Mencatat satu ketukan. `sekarang` datang dari pemanggil, bukan dari dalam —
 * supaya fungsinya bisa diuji tanpa menunggu jam berjalan.
 */
export function tambahJeda(p: Pencatat, sekarang: number, tipe: string): Pencatat {
  // Jam sistem bisa mundur (pemain menggeser waktu, atau zona berubah). Jarak
  // negatif dianggap nol, bukan dikurangkan.
  const jarak =
    p.terakhirPada === null ? 0 : Math.min(Math.max(0, sekarang - p.terakhirPada), BATAS_JEDA_MS);

  let { msJeda, jumlahJeda, jumlahLewati, jedaMulai } = p;

  if (tipe === 'SUHU_BATIN') {
    if (jedaMulai === null) {
      jedaMulai = sekarang;
    } else {
      // Suhu kedua menutup jeda: yang dihitung selisih keduanya, dipotong batas
      // yang sama supaya layar yang ditinggalkan tidak jadi "jeda dua jam".
      msJeda += Math.min(Math.max(0, sekarang - jedaMulai), BATAS_JEDA_MS);
      jumlahJeda += 1;
      jedaMulai = null;
    }
  } else if (tipe === 'LEWATI_JEDA') {
    if (jedaMulai !== null) {
      msJeda += Math.min(Math.max(0, sekarang - jedaMulai), BATAS_JEDA_MS);
      jedaMulai = null;
    }
    jumlahLewati += 1;
  }

  return {
    ...p,
    msAktif: p.msAktif + jarak,
    msJeda,
    jumlahJeda,
    jumlahLewati,
    jedaMulai,
    terakhirPada: sekarang,
  };
}
