import { progresPelunasan } from '../../engine/keuangan';
import { usePermainan } from '../../hooks/use-permainan';
import { rupiah } from '../../lib/format';
import { LembarBawah } from '../ui/LembarBawah';
import { Tombol } from '../ui/Tombol';
import { Uang } from '../ui/Uang';

interface Props {
  liabilitasId: string | null;
  onTutup: () => void;
}

export function LembarPelunasan({ liabilitasId, onTutup }: Props) {
  const state = usePermainan((t) => t.state);
  const kirim = usePermainan((t) => t.kirim);
  const memproses = usePermainan((t) => t.memproses);
  if (!state || !liabilitasId) return null;

  const utang = state.keuangan.liabilitas.find((l) => l.id === liabilitasId);
  if (!utang) return null;

  const kas = state.keuangan.saldoKas;
  const cicilanIkutTurun = utang.bungaBulanan !== undefined;
  const bisaLunasPenuh = kas >= utang.sisaUtang;
  const jumlahSebagian = Math.min(kas, Math.round(utang.sisaUtang / 2));
  const progres = Math.round(progresPelunasan(utang) * 100);

  const lunasi = async (jumlah?: number) => {
    await kirim({ tipe: 'LUNASI', isi: { liabilitasId, jumlah } });
    onTutup();
  };

  return (
    <LembarBawah judul={utang.nama} terbuka onTutup={onTutup}>
      <div className="space-y-4">
        <div>
          <div className="flex items-baseline justify-between text-xs uppercase tracking-wide text-tinta/70">
            <span>Sisa pokok</span>
            <span>Pokok awal</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-teal-muda">
            <div
              className="h-full bg-teal transition-[width] duration-300 motion-reduce:transition-none"
              style={{ width: `${progres}%` }}
            />
          </div>
          <div className="mt-2 flex items-baseline justify-between text-sm tabular-nums">
            <span>{rupiah(utang.sisaUtang)}</span>
            <span className="text-tinta/70">{rupiah(utang.pokokAwal)}</span>
          </div>
          <p className="mt-1 text-xs tabular-nums text-tinta/70">{progres}% terlunasi</p>
        </div>

        <div className="flex items-baseline justify-between">
          <span className="text-sm text-tinta/70">Cicilan bulanan</span>
          <Uang nilai={utang.cicilanBulanan} />
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-tinta/70">Saldo kas</span>
          <Uang nilai={kas} berwarna />
        </div>

        <p className="rounded-lg bg-teal-muda/50 px-3 py-2 text-sm text-teal-tua">
          {cicilanIkutTurun
            ? 'Utang ini berbunga berjalan. Melunasi sebagian menurunkan cicilan bulanannya.'
            : `Cicilan tetap ${rupiah(utang.cicilanBulanan)} per bulan sampai utang ini lunas penuh.`}
        </p>

        <div className="flex flex-col gap-2">
          <Tombol onClick={() => lunasi()} disabled={!bisaLunasPenuh || memproses} lebarPenuh>
            Lunasi penuh — {rupiah(utang.sisaUtang)}
          </Tombol>
          <Tombol
            jenis="kedua"
            onClick={() => lunasi(jumlahSebagian)}
            disabled={jumlahSebagian <= 0 || memproses}
            lebarPenuh
          >
            Bayar sebagian — {rupiah(jumlahSebagian)}
          </Tombol>
        </div>
      </div>
    </LembarBawah>
  );
}
