import { useState } from 'react';
import { usePermainan } from '../hooks/use-permainan';
import { hitungLaporan, lolosTahapSatu, perluTindakanDarurat } from '../engine/keuangan';
import { Papan } from '../components/papan/Papan';
import { KartuPeluangTampil } from '../components/papan/KartuPeluangTampil';
import { GarisArus } from '../components/keuangan/GarisArus';
import { LaporanKeuangan } from '../components/keuangan/LaporanKeuangan';
import { BarisBot } from '../components/papan/BarisBot';
import { KartuPasar } from '../components/pasar/KartuPasar';
import { LembarDarurat } from '../components/keuangan/LembarDarurat';
import { LembarPelunasan } from '../components/keuangan/LembarPelunasan';
import { LembarBawah } from '../components/ui/LembarBawah';
import { Tombol } from '../components/ui/Tombol';
import { Uang } from '../components/ui/Uang';

export function LayarPapan() {
  const state = usePermainan((t) => t.state);
  const kirim = usePermainan((t) => t.kirim);
  const memproses = usePermainan((t) => t.memproses);
  const [laporanTerbuka, setLaporanTerbuka] = useState(false);
  const [utangDipilih, setUtangDipilih] = useState<string | null>(null);

  if (!state) return null;

  const lolos = lolosTahapSatu(hitungLaporan(state.keuangan));
  const darurat = perluTindakanDarurat(state.keuangan);
  const daduTerakhir = state.riwayatDadu.at(-1);

  return (
    <main className="mx-auto max-w-md p-5 pb-28">
      <header className="flex items-baseline justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-tinta/50">Lingkar Harian</p>
          <p className="text-sm tabular-nums text-tinta/60">Giliran {state.giliran}</p>
        </div>
        <Uang nilai={state.keuangan.saldoKas} berwarna />
      </header>

      <div className="mt-5">
        <GarisArus keuangan={state.keuangan} />
      </div>

      <div className="mt-5">
        <Papan posisi={state.posisi} />
      </div>

      <div className="mt-5">
        <BarisBot bot={state.bot} />
      </div>

      {state.pasarTerbuka && <KartuPasar />}

      {darurat && <LembarDarurat />}

      {lolos && (
        <p className="mt-4 rounded-lg bg-teal-muda px-3 py-3 text-sm font-semibold text-teal-tua">
          Pendapatan pasif sudah menutup pengeluaran. Lingkar Luas menunggu.
        </p>
      )}

      <div className="fixed inset-x-0 bottom-0 mx-auto flex max-w-md gap-2 bg-ivory p-4">
        <Tombol
          onClick={() => void kirim({ tipe: 'LEMPAR_DADU', isi: { pemainId: 'p1' } })}
          disabled={
            state.kartuTerbuka !== null || state.pasarTerbuka !== null || darurat || memproses
          }
          lebarPenuh
        >
          Lempar dadu{daduTerakhir ? ` · ${daduTerakhir}` : ''}
        </Tombol>
        <Tombol jenis="kedua" onClick={() => setLaporanTerbuka(true)}>
          Keuangan
        </Tombol>
      </div>

      {state.kartuTerbuka && (
        <KartuPeluangTampil
          kartu={state.kartuTerbuka}
          saldoKas={state.keuangan.saldoKas}
          memproses={memproses}
          onPutuskan={(pilihan) =>
            void kirim({
              tipe: 'PUTUSKAN',
              isi: { kartuId: state.kartuTerbuka!.id, pilihan },
            })
          }
        />
      )}

      <LembarBawah
        judul="Laporan keuangan"
        terbuka={laporanTerbuka}
        onTutup={() => setLaporanTerbuka(false)}
      >
        <LaporanKeuangan keuangan={state.keuangan} onPilihLiabilitas={setUtangDipilih} />
      </LembarBawah>

      <LembarPelunasan liabilitasId={utangDipilih} onTutup={() => setUtangDipilih(null)} />
    </main>
  );
}
