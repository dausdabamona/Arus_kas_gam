import { hitungLaporan } from '../../engine/keuangan';
import { PROFIL_BOT } from '../../data/bot';
import type { BotBerjalan } from '../../types/state';

/**
 * Tiga bot sebagai tiga baris ringkas. Garis Arus mini memakai rasio yang
 * sama dengan GarisArus milik pemain, tanpa satu digit pun — pemain membaca
 * posisi ketiganya dengan sekali lirik.
 *
 * Tidak ada animasi giliran: bot bergerak diam-diam, dan komentar adalah
 * satu-satunya suaranya.
 */
export function BarisBot({ bot }: { bot: BotBerjalan[] }) {
  if (bot.length === 0) return null;

  return (
    <section aria-label="Pemain lain" className="space-y-2">
      {bot.map((b) => {
        const profil = PROFIL_BOT.find((p) => p.id === b.id);
        const laporan = hitungLaporan(b.state.keuangan);
        const rasio = Math.min(
          1,
          Math.max(0, laporan.pendapatanPasif) / Math.max(1, laporan.totalPengeluaran),
        );
        const lolos = b.lolosPadaGiliran !== null;

        return (
          <div key={b.id} className="rounded-lg bg-white/60 px-3 py-2">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-sm font-semibold">{profil?.nama}</span>
              <span className="text-xs tabular-nums text-tinta/70">
                {lolos
                  ? `Lolos di giliran ${b.lolosPadaGiliran}`
                  : b.bangkrutPadaGiliran !== null
                    ? 'Berhenti'
                    : `Petak ${b.state.posisi + 1}`}
              </span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-amber/60">
              <div
                className="h-full bg-teal transition-[width] duration-300 motion-reduce:transition-none"
                style={{ width: `${(lolos ? 1 : rasio) * 100}%` }}
              />
            </div>
            {b.komentar && (
              <p className="mt-1.5 text-xs italic text-tinta/70">&ldquo;{b.komentar}&rdquo;</p>
            )}
          </div>
        );
      })}
    </section>
  );
}
