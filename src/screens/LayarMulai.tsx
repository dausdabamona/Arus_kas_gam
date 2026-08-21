import { PROFESI } from '../data/profesi';
import { usePermainan } from '../hooks/use-permainan';
import { rupiah } from '../lib/format';
import { Tombol } from '../components/ui/Tombol';

export function LayarMulai() {
  const mulai = usePermainan((t) => t.mulai);
  const memproses = usePermainan((t) => t.memproses);

  return (
    <main className="mx-auto max-w-md p-5">
      <h1 className="text-[32px] font-bold tracking-tight text-teal-tua">Arus</h1>
      <p className="mt-1 text-sm text-tinta/60">Pilih titik berangkat.</p>

      <ul className="mt-6 space-y-3">
        {PROFESI.map((p) => (
          <li key={p.id} className="rounded-xl border border-teal-muda bg-white p-4">
            <h2 className="font-semibold">{p.nama}</h2>
            <p className="mt-1 text-sm tabular-nums text-tinta/60">
              Gaji {rupiah(p.kondisiAwal.gajiBersihBulanan)} · {p.kondisiAwal.liabilitas.length} utang
            </p>
            <div className="mt-3">
              <Tombol
                onClick={() => void mulai(`arus-${Date.now()}`, p.id)}
                disabled={memproses}
                lebarPenuh
              >
                Mulai sebagai {p.nama}
              </Tombol>
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-6 text-xs text-tinta/50">
        Simulasi untuk latihan. Angka disederhanakan dan bukan saran investasi.
      </p>
    </main>
  );
}
