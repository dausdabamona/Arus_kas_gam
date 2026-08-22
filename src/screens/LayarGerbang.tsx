import { useMemo, useState } from 'react';
import { usePermainan } from '../hooks/use-permainan';
import { kebiasaanTerbawa } from '../engine/kebiasaan';
import { cariKartuKebiasaan } from '../data/kartu-kebiasaan';
import {
  UCAPAN_LOLOS,
  TANYA_NIAT,
  PETUNJUK_NIAT,
  JUDUL_KEBIASAAN,
  PENJELASAN_KEBIASAAN,
  TANPA_KEBIASAAN,
  LABEL_MASUK,
  LABEL_SIMPAN_NIAT,
} from '../data/naskah-gerbang';
import { Tombol } from '../components/ui/Tombol';

/**
 * Gerbang Niat (§7.1). Muncul sekali, saat lolos, sebelum Lingkar Luas.
 *
 * Kartu kebiasaan dibaca dari `kebiasaanTerbawa` — fungsi yang sama persis yang
 * dipakai reducer saat MASUK_LINGKAR_LUAS, supaya layar tidak pernah
 * menjanjikan kartu yang berbeda dari yang benar-benar dibawa.
 */
export function LayarGerbang() {
  const state = usePermainan((t) => t.state);
  const kirim = usePermainan((t) => t.kirim);
  const memproses = usePermainan((t) => t.memproses);
  const [niat, setNiat] = useState('');

  const akanDibawa = useMemo(
    () => (state ? kebiasaanTerbawa(state.seed, state.skor) : []),
    [state],
  );

  if (!state) return null;

  const niatTersimpan = state.niat !== null;

  return (
    <main className="mx-auto max-w-md p-5">
      <p className="mt-8 text-lg leading-relaxed text-tinta">{UCAPAN_LOLOS}</p>

      {!niatTersimpan ? (
        <div className="mt-8 space-y-3">
          <p className="text-xl font-semibold text-teal-tua">{TANYA_NIAT}</p>
          <textarea
            rows={3}
            value={niat}
            aria-label={TANYA_NIAT}
            onChange={(e) => setNiat(e.target.value)}
            className="w-full rounded-xl border border-tinta/15 bg-ivory p-3 text-base text-tinta"
          />
          <p className="text-xs text-tinta/50">{PETUNJUK_NIAT}</p>
          <Tombol
            onClick={() => void kirim({ tipe: 'GERBANG_NIAT', isi: { niat } })}
            disabled={niat.trim().length === 0 || memproses}
            lebarPenuh
          >
            {LABEL_SIMPAN_NIAT}
          </Tombol>
        </div>
      ) : (
        <div className="mt-8 space-y-5">
          <blockquote className="border-l-2 border-teal pl-3 text-lg leading-relaxed text-tinta">
            {state.niat}
          </blockquote>

          {akanDibawa.length > 0 ? (
            <div className="space-y-3">
              <h2 className="text-sm uppercase tracking-wide text-tinta/50">{JUDUL_KEBIASAAN}</h2>
              <p className="text-sm leading-relaxed text-tinta/80">{PENJELASAN_KEBIASAAN}</p>
              <ul className="space-y-2">
                {akanDibawa.map((berjalan) => {
                  const kartu = cariKartuKebiasaan(berjalan.id);
                  return (
                    <li key={kartu.id} className="rounded-xl bg-teal-muda/50 p-3">
              {/*
                HIERARKI TIGA BARIS — NADA, BUKAN SEKADAR WARNA.
                nama (tebal) -> keterangan (tinta pudar) -> caraLepas (tinta penuh).

                Cara-lepas WAJIB bertinta lebih penuh daripada keterangan, sebab
                mata membaca yang paling gelap lebih dulu: pemain melihat jalan
                keluarnya sebelum melihat cacatnya. Membalik dua baris ini
                membalik nada seluruh layar dari "ini pekerjaannya" menjadi "ini
                yang salah padamu" — tanpa satu kata pun berubah, dan tanpa satu
                tes kata pun menyala.
              */}
                      <p className="font-semibold text-teal-tua">{kartu.nama}</p>
                      <p className="mt-1 text-sm text-tinta/70">{kartu.keterangan}</p>
                      <p className="mt-2 text-sm text-tinta">{kartu.caraLepas}</p>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-tinta/70">{TANPA_KEBIASAAN}</p>
          )}

          <Tombol
            onClick={() => void kirim({ tipe: 'MASUK_LINGKAR_LUAS', isi: {} })}
            disabled={memproses}
            lebarPenuh
          >
            {LABEL_MASUK}
          </Tombol>
        </div>
      )}
    </main>
  );
}
