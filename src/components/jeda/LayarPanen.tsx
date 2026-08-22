import { useEffect, useState } from 'react';
import { usePermainan } from '../../hooks/use-permainan';
import { hitungHasilLuar } from '../../engine/tuai';
import { NASKAH_TUAI, LABEL_TOMBOL } from '../../data/naskah-jeda';
import { LembarBawah } from '../ui/LembarBawah';
import { Tombol } from '../ui/Tombol';
import { Uang } from '../ui/Uang';

/**
 * Jeda tiga detik sebelum Lanjut menyala. Bukan hiasan: layar ini satu-satunya
 * tempat pelajaran inti masuk, dan ia masuk lewat kontras dua angka. Tombol
 * yang bisa diketuk seketika membuat layarnya terlewat sebelum terbaca.
 */
const DETIK_TAHAN = 3;

export function LayarPanen() {
  const state = usePermainan((t) => t.state);
  const kirim = usePermainan((t) => t.kirim);
  const memproses = usePermainan((t) => t.memproses);
  const [siap, setSiap] = useState(false);

  const panen = state?.panenTerbuka ?? null;

  useEffect(() => {
    if (!panen) return;
    setSiap(false);
    const jam = setTimeout(() => setSiap(true), DETIK_TAHAN * 1000);
    return () => clearTimeout(jam);
  }, [panen]);

  if (!state || !panen) return null;

  // Menanam berarti sempat ragu, dan Tanam selalu lahir di layar keputusan
  // yang belum diputuskan — jadi sisi luar diukur sebagai jalur yang dilewati.
  const hasilLuar = panen.objek ? hitungHasilLuar(state, panen.objek, 'tolak') : 0;
  const luarTerukur = panen.objek !== null && panen.objek.jenis !== 'guncang' && hasilLuar !== 0;

  return (
    <LembarBawah
      judul={NASKAH_TUAI.pembuka(state.giliran - panen.padaGiliran)}
      terbuka
      bisaDitutup={false}
      onTutup={() => undefined}
    >
      <div className="space-y-5">
        <blockquote className="border-l-2 border-teal pl-3 text-lg leading-relaxed text-tinta">
          {panen.kalimat}
        </blockquote>
        <p className="text-sm text-tinta/70">{panen.tindakan}</p>

        {/* Dua sisi, bobot sama, sengaja bisa berlawanan warna — §9.3. */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-teal-muda/40 p-3">
            <p className="text-xs uppercase tracking-wide text-tinta/50">{NASKAH_TUAI.hasilLuar}</p>
            <p className="mt-1">
              {luarTerukur ? (
                <Uang nilai={hasilLuar} berwarna />
              ) : (
                <span className="text-base tabular-nums text-tinta/50">{NASKAH_TUAI.takTerukur}</span>
              )}
            </p>
          </div>
          <div className="rounded-xl bg-teal-muda/40 p-3">
            <p className="text-xs uppercase tracking-wide text-tinta/50">{NASKAH_TUAI.hasilDalam}</p>
            <p
              className={`mt-1 text-base ${
                panen.hasilDalam === 'tenang'
                  ? 'text-untung'
                  : panen.hasilDalam === 'tersulut'
                    ? 'text-rugi'
                    : 'text-tinta/50'
              }`}
            >
              {panen.hasilDalam === null ? NASKAH_TUAI.takTerukur : NASKAH_TUAI[panen.hasilDalam]}
            </p>
          </div>
        </div>

        <Tombol
          onClick={() =>
            void kirim({
              tipe: 'TUAI',
              isi: {
                tanamT: panen.t,
                hasilLuar,
                hasilDalam: panen.hasilDalam ?? 'tersulut',
              },
            })
          }
          disabled={!siap || memproses}
          lebarPenuh
        >
          {LABEL_TOMBOL.lanjut}
        </Tombol>
      </div>
    </LembarBawah>
  );
}
