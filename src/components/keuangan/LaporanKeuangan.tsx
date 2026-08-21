import { hitungLaporan, kekayaanBersih, type KondisiKeuangan } from '../../engine/keuangan';
import { Uang } from '../ui/Uang';

interface Props {
  keuangan: KondisiKeuangan;
  onPilihLiabilitas: (id: string) => void;
}

function Baris({ label, nilai }: { label: string; nilai: number }) {
  return (
    <div className="flex items-baseline justify-between py-1.5">
      <span className="text-sm text-tinta/70">{label}</span>
      <Uang nilai={nilai} />
    </div>
  );
}

export function LaporanKeuangan({ keuangan, onPilihLiabilitas }: Props) {
  const laporan = hitungLaporan(keuangan);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs uppercase tracking-wide text-tinta/50">Arus kas bulanan</p>
        <Uang nilai={laporan.arusKasBulanan} besar berwarna />
      </div>

      <div className="border-t border-teal-muda pt-3">
        <h3 className="text-xs uppercase tracking-wide text-tinta/50">Pendapatan</h3>
        <Baris label="Gaji" nilai={laporan.pendapatanAktif} />
        <Baris label="Pasif dari aset" nilai={laporan.pendapatanPasif} />
      </div>

      <div className="border-t border-teal-muda pt-3">
        <h3 className="text-xs uppercase tracking-wide text-tinta/50">Pengeluaran</h3>
        <Baris label="Pengeluaran tetap" nilai={keuangan.pengeluaranTetap} />
        <Baris label={`Biaya anak (${keuangan.jumlahAnak})`} nilai={keuangan.biayaPerAnak * keuangan.jumlahAnak} />
      </div>

      <div className="border-t border-teal-muda pt-3">
        <h3 className="text-xs uppercase tracking-wide text-tinta/50">Utang</h3>
        {keuangan.liabilitas.length === 0 && (
          <p className="py-2 text-sm text-tinta/50">Tidak ada utang.</p>
        )}
        {keuangan.liabilitas.map((l) => (
          <button
            key={l.id}
            type="button"
            onClick={() => onPilihLiabilitas(l.id)}
            className="flex w-full items-baseline justify-between rounded-lg py-2 text-left active:bg-teal-muda/40"
          >
            <span className="text-sm">
              {l.nama}
              <span className="block text-xs text-tinta/50">
                Sisa <span className="tabular-nums">{l.sisaUtang.toLocaleString('id-ID')}</span>
              </span>
            </span>
            <Uang nilai={-l.cicilanBulanan} />
          </button>
        ))}
      </div>

      <div className="border-t border-teal-muda pt-3">
        <Baris label="Saldo kas" nilai={keuangan.saldoKas} />
        <Baris label="Kekayaan bersih" nilai={kekayaanBersih(keuangan)} />
      </div>
    </div>
  );
}
