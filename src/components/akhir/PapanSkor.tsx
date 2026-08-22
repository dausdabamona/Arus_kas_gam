import type { ReactNode } from 'react';

/**
 * SATU cetakan untuk dua papan.
 *
 * §0 menyebut keduanya sebagai ukuran kemenangan yang sengaja tidak selalu
 * searah. Papan yang tampil lebih kecil akan terbaca sebagai papan yang lebih
 * kecil artinya, dan salah satu dari dua tujuan permainan ini pelan-pelan
 * berubah jadi hiasan.
 *
 * CETAKAN YANG SAMA TIDAK MENJAMIN LEBAR YANG SAMA — dan itu terbukti saat
 * dimainkan, bukan di terminal. Dengan `flex-1` kedua papan memakai kelas yang
 * sama persis, lolos tesnya, lalu terukur 252 px berbanding 142 px di peramban:
 * `min-width: auto` bawaan flex menahan papan Kekayaan pada lebar minimum
 * isinya ("Rp 221.282.585"), dan papan Kemerdekaan mengalah.
 *
 * Grid dua kolom sama besar membetulkan lebarnya — dan melahirkan cacat kedua,
 * juga hanya terlihat saat dimainkan: di kolom 169 px, "Rp 221.282.585" melipat
 * dan menyisakan angka "5" sendirian di baris berikut. Angka yang terpotong
 * dibaca keliru, dan §5 melarang rupiah dipendekkan, jadi tidak ada jalan
 * memperpendeknya.
 *
 * Maka keduanya DITUMPUK selebar layar. Dua papan yang sama lebarnya penuh
 * lebih setara daripada dua kolom sempit yang salah satunya harus mengalah,
 * dan angkanya kembali muat dalam satu baris. Urutan atas-bawah memang
 * menyiratkan sedikit urutan; angka yang terbelah menyiratkan hal yang keliru.
 */
export function PapanSkor({ judul, children }: { judul: string; children: ReactNode }) {
  return (
    <section data-papan className="min-w-0 rounded-xl border border-teal-muda bg-white p-4">
      <h2 className="text-xs uppercase tracking-wide text-tinta/70">{judul}</h2>
      <div className="mt-2 space-y-1">{children}</div>
    </section>
  );
}

export function BarisPapan({ label, nilai }: { label: string; nilai: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-sm text-tinta/70">{label}</span>
      <span className="whitespace-nowrap text-sm font-semibold tabular-nums">{nilai}</span>
    </div>
  );
}
