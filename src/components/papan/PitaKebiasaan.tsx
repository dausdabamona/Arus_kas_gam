import { cariKartuKebiasaan } from '../../data/kartu-kebiasaan';
import { JUDUL_PITA, labelKemajuan, LABEL_SUDAH_LEPAS } from '../../data/naskah-gerbang';
import type { KebiasaanBerjalan } from '../../types/state';

interface Props {
  kebiasaan: readonly KebiasaanBerjalan[];
}

/**
 * Kartu kebiasaan yang sedang dibawa, beserta kemajuan pelepasannya.
 *
 * Kartu yang sudah lepas DITANDAI SELESAI, bukan dihapus: pemain perlu melihat
 * bahwa ia berhasil melatihnya. Menghilangkannya membuat kerja itu tak
 * meninggalkan jejak, dan §7.2 menempatkan kartu ini sebagai pekerjaan, bukan
 * beban yang cuma perlu hilang.
 *
 * HIERARKI TINTA — NADA, BUKAN SEKADAR WARNA. Sama seperti di layar Gerbang:
 * `caraLepas` bertinta lebih penuh daripada label kemajuan di sebelahnya, sebab
 * mata membaca yang paling gelap lebih dulu — jalan keluar sebelum hitungannya.
 * Membalik kepekatannya membalik nada dari "ini pekerjaannya" menjadi "ini
 * sisa hutangmu", tanpa satu kata pun berubah dan tanpa satu tes kata menyala.
 */
export function PitaKebiasaan({ kebiasaan }: Props) {
  if (kebiasaan.length === 0) return null;

  return (
    <section aria-label={JUDUL_PITA}>
      <h2 className="text-xs uppercase tracking-wide text-tinta/70">{JUDUL_PITA}</h2>
      <ul className="mt-2 space-y-2">
        {kebiasaan.map((berjalan) => {
          const kartu = cariKartuKebiasaan(berjalan.id);
          return (
            <li
              key={berjalan.id}
              className={`rounded-xl p-3 ${berjalan.lepas ? 'bg-teal-muda/30' : 'bg-teal-muda/60'}`}
            >
              <div className="flex items-baseline justify-between gap-3">
                {/*
                  Kartu yang sudah lepas tetap BERTINTA PENUH, hanya latarnya
                  yang meredup. Memudarkan namanya memberi tata bahasa buku
                  utang — yang lunas menghilang, yang tersisa menonjol — dan
                  membuat kerja yang selesai terasa seperti kewajiban yang
                  akhirnya gugur, bukan sesuatu yang dilatih sampai bisa.
                */}
                <p
                  className={`font-semibold ${berjalan.lepas ? 'text-tinta' : 'text-teal-tua'}`}
                >
                  {kartu.nama}
                </p>
                <p className="shrink-0 text-xs tabular-nums text-tinta/70">
                  {berjalan.lepas
                    ? LABEL_SUDAH_LEPAS
                    : labelKemajuan(berjalan.kemajuan, kartu.syaratLepas.kali)}
                </p>
              </div>
              {!berjalan.lepas && (
                <p className="mt-1 text-sm text-tinta/70">{kartu.caraLepas}</p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
