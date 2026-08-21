import { hitungLaporan, type KondisiKeuangan } from '../../engine/keuangan';
import { rupiah } from '../../lib/format';

interface Props {
  keuangan: KondisiKeuangan;
}

export function GarisArus({ keuangan }: Props) {
  const laporan = hitungLaporan(keuangan);
  const pasif = Math.max(0, laporan.pendapatanPasif);
  const keluar = Math.max(1, laporan.totalPengeluaran);
  const rasio = Math.min(1, pasif / keluar);
  const lolos = pasif >= laporan.totalPengeluaran;

  return (
    <section aria-label="Perbandingan pendapatan pasif dan pengeluaran">
      <div className="flex items-baseline justify-between text-xs uppercase tracking-wide text-tinta/50">
        <span>Pendapatan pasif</span>
        <span>Pengeluaran</span>
      </div>

      <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-amber">
        <div
          className="h-full bg-teal transition-[width] duration-300 motion-reduce:transition-none"
          style={{ width: `${rasio * 100}%` }}
        />
      </div>

      <div className="mt-2 flex items-baseline justify-between text-sm tabular-nums">
        <span className="text-teal-tua">{rupiah(laporan.pendapatanPasif)}</span>
        <span className="text-amber">{rupiah(laporan.totalPengeluaran)}</span>
      </div>

      {lolos && (
        <p className="mt-3 rounded-lg bg-teal-muda px-3 py-2 text-sm font-semibold text-teal-tua">
          Pendapatan pasif sudah menutup seluruh pengeluaran.
        </p>
      )}
    </section>
  );
}
