import { useJurnal } from '../hooks/use-jurnal';
import { unduhCadanganJurnal, unduhJurnalMarkdown } from '../lib/penyimpanan';
import { polaKebutuhan } from '../engine/pola-jurnal';
import { NASKAH_TUAI } from '../data/naskah-jeda';
import {
  JUDUL_JURNAL,
  PENJELASAN_JURNAL,
  JURNAL_KOSONG_SEMUA,
  LABEL_EKSPOR,
  PENJELASAN_EKSPOR,
  LABEL_KEMBALI,
  LABEL_SALIN_TEKS,
  PENJELASAN_SALIN_TEKS,
  NAMA_KEBUTUHAN,
  kalimatPola,
} from '../data/naskah-jurnal';
import { Tombol } from '../components/ui/Tombol';
import { Uang } from '../components/ui/Uang';
import type { EntriJurnal } from '../lib/db';

/**
 * Satu entri, dengan DUA sisi hasil berbobot sama — aturan Tuai §9.3 berlaku
 * juga di sini. Jurnal adalah satu-satunya tempat sisi dalam masih tersimpan
 * setelah permainannya lewat; jurnal yang cuma menyimpan sisi uang membuat
 * separuh latihannya lenyap dari ingatan pemain.
 */
function Entri({ entri }: { entri: EntriJurnal }) {
  return (
    <li className="rounded-xl border border-teal-muda bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-tinta/50">
        {NAMA_KEBUTUHAN[entri.kebutuhan]}
      </p>
      <p className="mt-2 text-base leading-relaxed text-tinta">{entri.kalimat}</p>
      <p className="mt-1 text-sm text-tinta/60">{entri.tindakan}</p>

      <div className="mt-3 flex gap-3 border-t border-teal-muda pt-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-wide text-tinta/50">{NASKAH_TUAI.hasilLuar}</p>
          <p className="mt-0.5 text-sm font-semibold">
            {/* Nol berarti tak terukur, bukan impas. Aturan yang sama dengan Layar Panen. */}
            {entri.hasilLuar === 0 ? NASKAH_TUAI.takTerukur : <Uang nilai={entri.hasilLuar} berwarna />}
          </p>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-wide text-tinta/50">{NASKAH_TUAI.hasilDalam}</p>
          <p
            className={`mt-0.5 text-sm font-semibold ${
              // amber, bukan amber-tua: palet §13.1 cuma punya amber dan
              // amber-muda, dan kelas yang tidak ada membuat sisi ini tampil
              // hitam biasa di sebelah sisi yang berwarna — §9.3 justru
              // meminta dua sisi berbobot sama.
              entri.hasilDalam === 'tenang' ? 'text-teal-tua' : 'text-amber'
            }`}
          >
            {NASKAH_TUAI[entri.hasilDalam]}
          </p>
        </div>
      </div>
    </li>
  );
}

export function LayarJurnal({ onTutup }: { onTutup: () => void }) {
  const jurnal = useJurnal(null);
  const pola = jurnal ? polaKebutuhan(jurnal) : null;

  return (
    <main className="mx-auto max-w-md p-5">
      <h1 className="text-[28px] font-bold tracking-tight text-teal-tua">{JUDUL_JURNAL}</h1>
      <p className="mt-1 text-sm text-tinta/60">{PENJELASAN_JURNAL}</p>

      {/*
        Satu pola, dihitung dan tidak ditafsirkan (§12). Ia berdiri sendiri di
        atas daftar, tanpa kesimpulan yang ditempelkan di bawahnya — pemain
        yang menyimpulkan, bukan permainan (Prinsip 4). Kalau tidak ada satu
        pola yang bisa dinyatakan, tidak ada kalimat sama sekali; kalimat pola
        yang dipaksakan justru menafsirkan lewat bentuknya.
      */}
      {pola && (
        <p className="mt-4 rounded-xl bg-teal-muda/40 px-4 py-3 text-base leading-relaxed text-tinta">
          {kalimatPola(pola.total, pola.jumlah, pola.kebutuhan)}
        </p>
      )}

      {jurnal !== null &&
        (jurnal.length === 0 ? (
          <p className="mt-6 text-sm text-tinta/60">{JURNAL_KOSONG_SEMUA}</p>
        ) : (
          <ul className="mt-5 space-y-3">
            {jurnal.map((e) => (
              <Entri key={e.id} entri={e} />
            ))}
          </ul>
        ))}

      {/*
        Dua ekspor, dua tugas. Cadangan .json dibaca MESIN saat data hilang;
        berkas .md dibaca ORANG saat ia melanjutkan latihannya di luar
        aplikasi. Satu berkas yang mencoba jadi keduanya akan gagal di dua sisi.
      */}
      <div className="mt-6 border-t border-teal-muda pt-4">
        <Tombol jenis="kedua" lebarPenuh onClick={() => void unduhJurnalMarkdown()}>
          {LABEL_SALIN_TEKS}
        </Tombol>
        <p className="mt-2 text-xs text-tinta/50">{PENJELASAN_SALIN_TEKS}</p>
      </div>

      <div className="mt-4">
        <Tombol jenis="kedua" lebarPenuh onClick={() => void unduhCadanganJurnal()}>
          {LABEL_EKSPOR}
        </Tombol>
        <p className="mt-2 text-xs text-tinta/50">{PENJELASAN_EKSPOR}</p>
      </div>

      <div className="mt-4">
        <Tombol lebarPenuh onClick={onTutup}>
          {LABEL_KEMBALI}
        </Tombol>
      </div>
    </main>
  );
}
