import { useEffect, useState } from 'react';
import { putarUlang } from './engine/reducer';
import { mintaPenyimpananPermanen, statusPenyimpanan } from './lib/penyimpanan';
import type { Kejadian } from './types/kejadian';

const CONTOH: Kejadian[] = [
  { t: 0, tipe: 'MULAI', isi: { seed: 'sorong-2026', profesiId: 'asn-3b' } },
  { t: 1, tipe: 'LEMPAR_DADU', isi: { pemainId: 'p1' } },
  { t: 2, tipe: 'LEMPAR_DADU', isi: { pemainId: 'p1' } },
  { t: 3, tipe: 'LEMPAR_DADU', isi: { pemainId: 'p1' } },
];

export default function App() {
  const [penyimpanan, setPenyimpanan] = useState<Awaited<ReturnType<typeof statusPenyimpanan>> | null>(null);
  const state = putarUlang(CONTOH);

  useEffect(() => {
    void (async () => {
      await mintaPenyimpananPermanen();
      setPenyimpanan(await statusPenyimpanan());
    })();
  }, []);

  return (
    <main className="mx-auto max-w-md p-5">
      <h1 className="text-2xl font-bold text-teal-tua">Arus</h1>
      <p className="mt-1 text-sm text-tinta/60">Fase 0 — pemeriksaan fondasi</p>

      <section className="mt-6 rounded-xl border border-teal-muda bg-white p-4">
        <h2 className="font-semibold">Mesin deterministik</h2>
        <p className="mt-2 text-sm">Seed: <span className="font-mono">{state.seed}</span></p>
        <p className="text-sm">Giliran: {state.giliran}</p>
        <p className="text-sm">Posisi petak: {state.posisi}</p>
        <p className="text-sm">Hasil dadu: {state.riwayatDadu.join(', ')}</p>
        <p className="mt-2 text-xs text-tinta/60">
          Angka di atas harus sama persis setiap kali halaman dimuat ulang.
        </p>
      </section>

      <section className="mt-4 rounded-xl border border-teal-muda bg-white p-4">
        <h2 className="font-semibold">Penyimpanan</h2>
        {penyimpanan ? (
          <>
            <p className="mt-2 text-sm">
              Status: {penyimpanan.permanen ? 'Permanen — aman dari pembersihan otomatis' : 'Sementara'}
            </p>
            <p className="text-sm">
              Terpakai {penyimpanan.terpakaiMB} MB dari {penyimpanan.kuotaMB} MB
            </p>
          </>
        ) : (
          <p className="mt-2 text-sm text-tinta/60">Memeriksa…</p>
        )}
      </section>

      <p className="mt-6 text-xs text-tinta/50">
        Simulasi untuk latihan. Angka disederhanakan dan bukan saran investasi.
      </p>
    </main>
  );
}
