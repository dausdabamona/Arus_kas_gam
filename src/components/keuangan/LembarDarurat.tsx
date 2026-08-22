import { usePermainan } from '../../hooks/use-permainan';
import { ekuitasAset, tuasTersedia, sisaPlafonPinjaman, POTONGAN_BERHEMAT } from '../../engine/keuangan';
import { rupiah } from '../../lib/format';
import { LembarBawah } from '../ui/LembarBawah';
import { Tombol } from '../ui/Tombol';
import { Uang } from '../ui/Uang';

/**
 * Simpul keputusan paling penting di seluruh permainan. Ketiga tuas tampil
 * berdampingan dengan bobot visual sama, dan tidak ada yang terpasang di
 * muka — pemain yang memilih, bukan game. Fase 5 memasang Jeda Batin di sini.
 */
export function LembarDarurat() {
  const state = usePermainan((t) => t.state);
  const kirim = usePermainan((t) => t.kirim);
  const memproses = usePermainan((t) => t.memproses);
  if (!state) return null;

  const tersedia = tuasTersedia(state.keuangan);
  const potongan = Math.round(state.keuangan.pengeluaranTetap * POTONGAN_BERHEMAT);
  // Aset pertama yang BISA dijual, bukan aset pertama. Aset terbenam (§8.3)
  // tidak menghasilkan kas, dan menawarkannya berarti menawarkan tombol yang
  // tidak mengubah apa pun. Sementara sampai Tugas 6 memberi hitungan penuh.
  const aset = state.keuangan.aset.find((a) => ekuitasAset(state.keuangan, a.id) > 0);

  const pilih = (tuas: 'jual' | 'pinjam' | 'hemat', asetId?: string) =>
    void kirim({ tipe: 'TINDAKAN_DARURAT', isi: { tuas, asetId } });

  return (
    <LembarBawah judul="Saldo kas minus" terbuka onTutup={() => {}}>
      <div className="space-y-4">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-tinta/70">Kekurangan</span>
          <Uang nilai={state.keuangan.saldoKas} berwarna />
        </div>

        {tersedia.length === 0 ? (
          <>
            <p className="rounded-lg bg-rugi/10 px-3 py-3 text-sm text-rugi">
              Tidak ada aset untuk dijual, plafon pinjaman penuh, penghematan sudah mentok.
            </p>
            <Tombol
              jenis="bahaya"
              lebarPenuh
              disabled={memproses}
              onClick={() => void kirim({ tipe: 'TINDAKAN_DARURAT', isi: {} })}
            >
              Akhiri permainan
            </Tombol>
          </>
        ) : (
          <div className="flex flex-col gap-2">
            {tersedia.includes('jual') && aset && (
              <Tombol jenis="kedua" lebarPenuh disabled={memproses} onClick={() => pilih('jual', aset.id)}>
                Jual {aset.nama} — {rupiah(ekuitasAset(state.keuangan, aset.id))}
              </Tombol>
            )}
            {tersedia.includes('pinjam') && (
              <Tombol jenis="kedua" lebarPenuh disabled={memproses} onClick={() => pilih('pinjam')}>
                Pinjam darurat — sisa plafon {rupiah(sisaPlafonPinjaman(state.keuangan))}
              </Tombol>
            )}
            {tersedia.includes('hemat') && (
              <Tombol jenis="kedua" lebarPenuh disabled={memproses} onClick={() => pilih('hemat')}>
                Berhemat — pengeluaran turun {rupiah(potongan)} per bulan, permanen
              </Tombol>
            )}
          </div>
        )}
      </div>
    </LembarBawah>
  );
}
