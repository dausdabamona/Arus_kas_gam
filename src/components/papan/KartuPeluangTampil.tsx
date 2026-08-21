import type { KartuPeluang } from '../../types/kartu';
import { rupiah } from '../../lib/format';
import { LembarBawah } from '../ui/LembarBawah';
import { Tombol } from '../ui/Tombol';

interface Props {
  kartu: KartuPeluang;
  saldoKas: number;
  onPutuskan: (pilihan: 'ambil' | 'tolak') => void;
  /** Benar selagi keputusan sebelumnya masih ditulis — mencegah ketukan ganda. */
  memproses?: boolean;
}

export function KartuPeluangTampil({ kartu, saldoKas, onPutuskan, memproses = false }: Props) {
  const mampu = saldoKas >= kartu.uangMuka;

  return (
    <LembarBawah judul={kartu.judul} terbuka onTutup={() => onPutuskan('tolak')}>
      <div className="space-y-4">
        <p className="text-sm text-tinta/70">{kartu.keterangan}</p>

        <dl className="space-y-1.5 text-sm tabular-nums">
          <div className="flex justify-between">
            <dt className="text-tinta/60">Harga</dt>
            <dd>{rupiah(kartu.harga)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-tinta/60">Uang muka</dt>
            <dd>{rupiah(kartu.uangMuka)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-tinta/60">Arus kas per bulan</dt>
            <dd className={kartu.arusKasBulanan > 0 ? 'text-untung' : 'text-tinta/60'}>
              {rupiah(kartu.arusKasBulanan)}
            </dd>
          </div>
          {kartu.sisaUtang > 0 && (
            <div className="flex justify-between">
              <dt className="text-tinta/60">Utang menempel</dt>
              <dd>{rupiah(kartu.sisaUtang)}</dd>
            </div>
          )}
        </dl>

        {!mampu && (
          <p className="rounded-lg bg-rugi/10 px-3 py-2 text-sm text-rugi">
            Saldo kas belum cukup untuk uang mukanya.
          </p>
        )}

        <div className="flex gap-2">
          <Tombol onClick={() => onPutuskan('ambil')} disabled={!mampu || memproses} lebarPenuh>
            Ambil
          </Tombol>
          <Tombol jenis="kedua" onClick={() => onPutuskan('tolak')} disabled={memproses} lebarPenuh>
            Lewati
          </Tombol>
        </div>
      </div>
    </LembarBawah>
  );
}
