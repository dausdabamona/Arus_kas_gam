import type { ReactNode } from 'react';

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
  if (!terbuka) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-tinta/40">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={judul}
        className="w-full max-w-md rounded-t-2xl bg-ivory p-5 pb-8 shadow-lg"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
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
        {children}
      </div>
    </div>
  );
}
