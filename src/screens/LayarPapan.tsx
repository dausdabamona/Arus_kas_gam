import { useMemo, useState } from 'react';
import { usePermainan } from '../hooks/use-permainan';
import { perluTindakanDarurat } from '../engine/keuangan';
import { Papan } from '../components/papan/Papan';
import { KartuPeluangTampil } from '../components/papan/KartuPeluangTampil';
import { GarisArus } from '../components/keuangan/GarisArus';
import { LaporanKeuangan } from '../components/keuangan/LaporanKeuangan';
import { BarisBot } from '../components/papan/BarisBot';
import { KartuPasar } from '../components/pasar/KartuPasar';
import { KartuGuncangTampil } from '../components/papan/KartuGuncangTampil';
import { JedaBatin } from '../components/jeda/JedaBatin';
import { LayarPanen } from '../components/jeda/LayarPanen';
import { cariKartuGuncang } from '../data/kartu-guncang';
import { cariInstrumen } from '../data/instrumen';
import { PitaKebiasaan } from '../components/papan/PitaKebiasaan';
import { LABEL_TAHAP, PESAN_REFLEKS_AMBIL_ALIH } from '../data/naskah-gerbang';
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
  const [pemicuSelesai, setPemicuSelesai] = useState<string | null>(null);

  /**
   * Jeda ditawarkan pada GUNCANG, PELUANG_BESAR, dan tawaran PASAR — tidak
   * pada PELUANG_KECIL. Godaan kecil memang dibiarkan lewat tanpa upacara,
   * supaya jeda tidak jadi ritual kosong yang menjemukan.
   *
   * Kebutuhan kartu guncang datang dari datanya sendiri. Dua pemicu lain tidak
   * punya pemicu tertulis, jadi dipetakan tetap — dan pemetaan ini KEPUTUSAN
   * DESAIN dari tabel §9.1 GDD, bukan tempelan yang boleh diganti sekenanya:
   *
   *   PELUANG_BESAR -> keamanan. Barisnya "Serakah": tawaran yang sayang
   *   dilewatkan menyentuh keamanan/kendali, dan yang menonjol saat uang besar
   *   benar-benar keluar adalah rasa aman.
   *
   *   PASAR -> kendali. Barisnya "Menyesal": harga bergerak sendiri, dan yang
   *   tersentuh adalah keinginan mengatur hal yang memang tidak bisa diatur.
   */
  const pemicu = useMemo(() => {
    if (!state) return null;
    if (state.guncangTerbuka) {
      return {
        id: `g${state.giliran}:${state.guncangTerbuka.kartuId}`,
        judul: state.guncangTerbuka.judul,
        kebutuhan: cariKartuGuncang(state.guncangTerbuka.kartuId).pemicu,
      };
    }
    if (state.kartuTerbuka?.tumpukan === 'PELUANG_BESAR') {
      return {
        id: `k${state.giliran}:${state.kartuTerbuka.id}`,
        judul: state.kartuTerbuka.judul,
        kebutuhan: 'keamanan' as const,
      };
    }
    if (state.pasarTerbuka) {
      return {
        id: `p${state.giliran}:${state.pasarTerbuka}`,
        judul: cariInstrumen(state.pasarTerbuka)?.nama ?? state.pasarTerbuka,
        kebutuhan: 'kendali' as const,
      };
    }
    return null;
  }, [state]);

  if (!state) return null;

  const jedaTerbuka = pemicu !== null && pemicu.id !== pemicuSelesai;

  const darurat = perluTindakanDarurat(state.keuangan);
  const daduTerakhir = state.riwayatDadu.at(-1);

  return (
    <main className="mx-auto max-w-md p-5 pb-28">
      <header className="flex items-baseline justify-between">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-tinta/50">
            {LABEL_TAHAP[state.tahap]}
          </p>
          <p className="text-sm tabular-nums text-tinta/60">Giliran {state.giliran}</p>
        </div>
        <Uang nilai={state.keuangan.saldoKas} berwarna />
      </header>

      {/*
        Niat dimunculkan kembali persis di layar tempat angka besar paling
        menarik (§7.1). Satu baris tenang yang selalu ada, bukan pengingat
        yang menyela.
      */}
      {state.tahap === 'luas' && state.niat && (
        <p className="mt-2 border-l-2 border-teal/40 pl-2 text-sm italic text-tinta/60">
          {state.niat}
        </p>
      )}

      <div className="mt-5">
        <GarisArus keuangan={state.keuangan} />
      </div>

      {state.refleksMengambilAlih && (
        <p
          aria-live="polite"
          className="mt-4 rounded-lg bg-amber-muda px-3 py-3 text-sm text-tinta/80"
        >
          {PESAN_REFLEKS_AMBIL_ALIH}
        </p>
      )}

      {state.kebiasaan.length > 0 && (
        <div className="mt-5">
          <PitaKebiasaan kebiasaan={state.kebiasaan} />
        </div>
      )}

      <div className="mt-5">
        <Papan posisi={state.posisi} />
      </div>

      <div className="mt-5">
        <BarisBot bot={state.bot} />
      </div>

      {state.pasarTerbuka && <KartuPasar beku={jedaTerbuka} />}

      {darurat && <LembarDarurat />}

      <div className="fixed inset-x-0 bottom-0 mx-auto flex max-w-md gap-2 bg-ivory p-4">
        <Tombol
          onClick={() => void kirim({ tipe: 'LEMPAR_DADU', isi: { pemainId: 'p1' } })}
          disabled={
            // Guncang dan panen ikut mengunci: guncangan yang bisa dilewati
            // dengan melempar dadu adalah guncangan gratis, dan seluruh angka
            // Invarian 6 disetel di atas dunia yang tidak membolehkannya.
            // Layarnya sendiri baru dibangun di Tugas 6-7; kuncinya duluan.
            state.kartuTerbuka !== null ||
            state.pasarTerbuka !== null ||
            state.guncangTerbuka !== null ||
            state.panenTerbuka !== null ||
            darurat ||
            memproses
          }
          lebarPenuh
        >
          Lempar dadu{daduTerakhir ? ` · ${daduTerakhir}` : ''}
        </Tombol>
        <Tombol jenis="kedua" onClick={() => setLaporanTerbuka(true)}>
          Keuangan
        </Tombol>
      </div>

      {state.guncangTerbuka && !jedaTerbuka && <KartuGuncangTampil />}

      {state.kartuTerbuka && !jedaTerbuka && (
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

      <LayarPanen />

      {jedaTerbuka && pemicu && (
        <JedaBatin
          key={pemicu.id}
          judul={pemicu.judul}
          kebutuhan={pemicu.kebutuhan}
          onSelesai={() => setPemicuSelesai(pemicu.id)}
        />
      )}

      <LembarPelunasan liabilitasId={utangDipilih} onTutup={() => setUtangDipilih(null)} />
    </main>
  );
}
