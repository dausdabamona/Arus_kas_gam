import { rupiah } from '../../lib/format';

interface Props {
  nilai: number;
  /** Hijau untuk positif, merah untuk negatif. */
  berwarna?: boolean;
  besar?: boolean;
}

export function Uang({ nilai, berwarna = false, besar = false }: Props) {
  // Nol negatif dinormalkan di sini, bukan di pemanggil. `-0` lahir dari
  // aritmetika biasa (`-x` saat x nol) dan Intl menampilkannya sebagai
  // "-Rp 0" — pernah bocor ke layar Panen, lalu ke lembar jual. Menambalnya
  // per tempat berarti menunggu kebocoran ketiga.
  const nilaiBersih = nilai === 0 ? 0 : nilai;
  const warna = !berwarna ? '' : nilaiBersih < 0 ? 'text-rugi' : 'text-untung';
  const ukuran = besar ? 'text-[32px] font-bold tracking-tight' : 'text-base';
  return (
    <span className={`tabular-nums ${ukuran} ${warna}`}>{rupiah(nilaiBersih)}</span>
  );
}
