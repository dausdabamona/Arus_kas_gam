import { useMemo, useState } from 'react';
import { usePermainan } from '../../hooks/use-permainan';
import { useTimerPasar } from '../../hooks/use-timer-pasar';
import { hargaPadaKetukan } from '../../engine/pasar';
import { cariInstrumen } from '../../data/instrumen';
import { rupiah } from '../../lib/format';
import { LembarBawah } from '../ui/LembarBawah';
import { LaporanKeuangan } from '../keuangan/LaporanKeuangan';
import { Tombol } from '../ui/Tombol';

interface Props {
  /** Waktu berhenti total selagi Jeda Batin terbuka (§8.1). */
  beku?: boolean;
}

export function KartuPasar({ beku = false }: Props) {
  const state = usePermainan((t) => t.state);
  const kirim = usePermainan((t) => t.kirim);
  const memproses = usePermainan((t) => t.memproses);
  const nomorKejadian = usePermainan((t) => t.nomorKejadian);
  const [laporanTerbuka, setLaporanTerbuka] = useState(false);

  const instrumenId = state?.pasarTerbuka ?? null;

  const lewat = () => {
    if (!instrumenId) return;
    void kirim({
      tipe: 'TRANSAKSI_PASAR',
      isi: { instrumenId, aksi: 'lewat', unit: 0, ketukan },
    });
  };

  // §8.1: membuka laporan MEMBEKUKAN waktu, kail yang sama dengan Jeda Batin.
  // Timer yang tetap jalan menghukum orang yang memeriksa angka — dan
  // mengajarkan persis kebalikan dari yang dilatih permainan ini. Ketukannya
  // tidak diulang: melanjutkan dari angka yang sama menutup celah "buka
  // laporan untuk memperpanjang waktu".
  const { ketukan, detikTersisa } = useTimerPasar({
    beku: beku || laporanTerbuka,
    onHabis: lewat,
  });

  const instrumen = instrumenId ? cariInstrumen(instrumenId) : undefined;

  const harga = useMemo(() => {
    if (!state || !instrumenId) return 0;
    return hargaPadaKetukan(
      state.seed, nomorKejadian, instrumenId, state.hargaPasar[instrumenId], ketukan,
    );
  }, [state, instrumenId, nomorKejadian, ketukan]);

  if (!state || !instrumenId || !instrumen) return null;

  const dimiliki = state.keuangan.aset.find((a) => a.instrumenId === instrumenId)?.unit ?? 0;
  const hargaDasar = state.hargaPasar[instrumenId];
  const selisih = hargaDasar === 0 ? 0 : ((harga - hargaDasar) / hargaDasar) * 100;
  const mampu = state.keuangan.saldoKas >= harga;

  const transaksi = (aksi: 'beli' | 'jual', unit: number) =>
    void kirim({ tipe: 'TRANSAKSI_PASAR', isi: { instrumenId, aksi, unit, ketukan } });

  return (
    <LembarBawah judul={instrumen.nama} terbuka onTutup={lewat}>
      <div className="space-y-4">
        <p className="text-sm text-tinta/70">{instrumen.keterangan}</p>

        <div>
          <p className="text-xs uppercase tracking-wide text-tinta/50">Harga per unit</p>
          <p className="text-[32px] font-bold tabular-nums tracking-tight">{rupiah(harga)}</p>
          {selisih !== 0 && (
            <p className={`text-sm tabular-nums ${selisih > 0 ? 'text-untung' : 'text-rugi'}`}>
              {selisih > 0 ? '+' : ''}{selisih.toFixed(1)}% sejak tawaran dibuka
            </p>
          )}
        </div>

        <p aria-live="polite" className="text-sm tabular-nums text-tinta/60">
          Tawaran menutup dalam {detikTersisa} detik. Harganya terus bergerak.
        </p>

        {dimiliki > 0 && (
          <p className="text-sm text-tinta/60">
            Dimiliki: <span className="tabular-nums">{dimiliki}</span> unit
          </p>
        )}

        <div className="flex flex-col gap-2">
          {/* Barisnya sendiri, sejajar tombol lain — sama seperti kartu peluang. */}
          <Tombol jenis="kedua" lebarPenuh onClick={() => setLaporanTerbuka(true)}>
            Keuangan
          </Tombol>
          <Tombol onClick={() => transaksi('beli', 1)} disabled={!mampu || memproses} lebarPenuh>
            Beli 1 unit — {rupiah(harga)}
          </Tombol>
          {dimiliki > 0 && (
            <Tombol
              jenis="kedua"
              onClick={() => transaksi('jual', dimiliki)}
              disabled={memproses}
              lebarPenuh
            >
              Jual semua — {rupiah(harga * dimiliki)}
            </Tombol>
          )}
          <Tombol jenis="kedua" onClick={lewat} disabled={memproses} lebarPenuh>
            Lewati
          </Tombol>
        </div>
      </div>

      {/* Membaca saja: baris utang tidak membuka lembar pelunasan di sini. */}
      <LembarBawah
        judul="Laporan keuangan"
        terbuka={laporanTerbuka}
        onTutup={() => setLaporanTerbuka(false)}
      >
        <LaporanKeuangan keuangan={state.keuangan} onPilihLiabilitas={() => undefined} />
      </LembarBawah>
    </LembarBawah>
  );
}
