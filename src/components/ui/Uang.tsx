import { rupiah } from '../../lib/format';

interface Props {
  nilai: number;
  /** Hijau untuk positif, merah untuk negatif. */
  berwarna?: boolean;
  besar?: boolean;
}

export function Uang({ nilai, berwarna = false, besar = false }: Props) {
  const warna = !berwarna ? '' : nilai < 0 ? 'text-rugi' : 'text-untung';
  const ukuran = besar ? 'text-[32px] font-bold tracking-tight' : 'text-base';
  return (
    <span className={`tabular-nums ${ukuran} ${warna}`}>{rupiah(nilai)}</span>
  );
}
