import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { daftarkanPenutup } from '../../lib/tombol-kembali';

interface Props {
  judul: string;
  terbuka: boolean;
  onTutup: () => void;
  /**
   * Tombol silang disembunyikan saat lembarnya memang tidak boleh ditutup
   * begitu saja. Silang yang ada tapi tidak melakukan apa-apa lebih buruk
   * daripada tidak ada silang sama sekali: pemain mengetuknya, tidak terjadi
   * apa pun, dan ia berhenti percaya pada tombol di layar ini.
   */
  bisaDitutup?: boolean;
  children: ReactNode;
}

export function LembarBawah({ judul, terbuka, onTutup, bisaDitutup = true, children }: Props) {
  /*
    Selama terbuka, lembar ini mendaftar sebagai sasaran tombol Kembali
    Android. Lembar yang memang tidak boleh ditutup begitu saja (Lembar
    Darurat, §5.3) sengaja tidak mendaftar: keputusan itu wajib diambil, dan
    tombol perangkat keras bukan jalan pintas keluar darinya.
  */
  useEffect(() => {
    if (!terbuka || !bisaDitutup) return;
    return daftarkanPenutup(onTutup);
  }, [terbuka, bisaDitutup, onTutup]);

  if (!terbuka) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-tinta/40 pt-[var(--aman-atas)]">
      {/*
        `max-h-full` mengikat panel ke tinggi layar — induknya `fixed inset-0`,
        jadi "full" di sini persis setinggi viewport, tanpa perlu vh maupun dvh
        yang perilakunya berbeda antara peramban ponsel dan WebView.

        Tanpa ikatan ini panel tumbuh melewati layar dan sisanya TIDAK BISA
        DIJANGKAU: `items-end` menambatkan tepi bawahnya, jadi kelebihannya
        keluar ke atas dan menghilang begitu saja. Ditemukan di HP sungguhan
        pada laporan keuangan — barisnya terpotong di atas dan di bawah, dan
        tidak ada cara menggulirnya.

        Ini menyentuh SEMUA lembar, bukan cuma laporan: kartu, Jeda, panen,
        darurat. Di layar lebar tidak pernah terlihat karena isinya selalu
        muat.

        Bantalan atas di induknya memotong "full" tepat di bawah bilah status:
        tanpa itu, lembar yang setinggi layar menaruh judul dan tombol tutupnya
        di balik jam dan ikon baterai.
      */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={judul}
        className="flex max-h-full w-full max-w-md flex-col rounded-t-2xl bg-ivory shadow-lg"
      >
        <div className="flex shrink-0 items-start justify-between gap-4 p-5 pb-4">
          <h2 className="text-xl font-bold text-teal-tua">{judul}</h2>
          {bisaDitutup && (
            <button
              type="button"
              onClick={onTutup}
              aria-label="Tutup"
              className="rounded-lg px-3 text-2xl leading-none text-tinta/70"
            >
              ×
            </button>
          )}
        </div>
        {/*
          Judul tetap diam, isinya yang bergulir — pada lembar sepanjang
          laporan keuangan, judul yang ikut hanyut membuat pemain kehilangan
          tombol tutupnya.

          `overscroll-contain` menahan gulirannya di dalam lembar. Bantalan
          bawah menambahkan area aman perangkat, sebab bilah navigasi Android
          menutupi baris terakhir — itulah yang memotong "Kekayaan bersih".

          Dipakai lewat `--aman-bawah`, bukan `env()` langsung: di WebView
          Android lama env() bernilai nol, jadi bantalan yang ditulis di 0.8.2
          sebenarnya tidak pernah menambah apa pun di perangkat.
        */}
        <div
          data-isi-lembar
          className="overflow-y-auto overscroll-contain px-5 pb-[calc(2rem+var(--aman-bawah))]"
        >
          {children}
        </div>
      </div>
    </div>
  );
}
