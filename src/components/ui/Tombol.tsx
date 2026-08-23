import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  onClick: () => void;
  jenis?: 'utama' | 'kedua' | 'bahaya';
  disabled?: boolean;
  lebarPenuh?: boolean;
  /**
   * Menolak menyusut di dalam baris flex. Dipakai pada tombol berlabel satu
   * kata yang berdampingan dengan tombol `lebarPenuh`: `w-full` meminta
   * seluruh baris dan tetangganya yang menanggung, sementara label satu kata
   * tidak bisa membungkus ke baris kedua — ia hanya terpotong.
   */
  takMenyusut?: boolean;
}

const GAYA = {
  utama: 'bg-teal text-ivory active:bg-teal-tua',
  kedua: 'bg-teal-muda text-teal-tua active:bg-teal-muda/70',
  bahaya: 'bg-rugi text-ivory active:opacity-90',
} as const;

export function Tombol({
  children,
  onClick,
  jenis = 'utama',
  disabled = false,
  lebarPenuh = false,
  takMenyusut = false,
}: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        'rounded-xl px-5 py-3 text-base font-semibold',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-tua',
        'disabled:opacity-40',
        GAYA[jenis],
        lebarPenuh ? 'w-full' : '',
        takMenyusut ? 'shrink-0' : '',
      ].join(' ')}
    >
      {children}
    </button>
  );
}
