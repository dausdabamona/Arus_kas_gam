import type { ReactNode } from 'react';

interface Props {
  judul: string;
  terbuka: boolean;
  onTutup: () => void;
  children: ReactNode;
}

export function LembarBawah({ judul, terbuka, onTutup, children }: Props) {
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
          <button
            type="button"
            onClick={onTutup}
            aria-label="Tutup"
            className="rounded-lg px-3 text-2xl leading-none text-tinta/50"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
