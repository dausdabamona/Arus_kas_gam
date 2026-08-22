import { useState } from 'react';
import { usePermainan } from '../../hooks/use-permainan';
import {
  ekuitasAset,
  utangMelekat,
  tuasTersedia,
  sisaPlafonPinjaman,
  POTONGAN_BERHEMAT,
  type Aset,
  type KondisiKeuangan,
} from '../../engine/keuangan';
import { rupiah } from '../../lib/format';
import { LembarBawah } from '../ui/LembarBawah';
import { Tombol } from '../ui/Tombol';
import { Uang } from '../ui/Uang';

function BarisHitung({ label, nilai, tebal }: { label: string; nilai: number; tebal?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between gap-3 py-1 ${tebal ? 'font-semibold' : ''}`}>
      <span className="text-sm text-tinta/70">{label}</span>
      <Uang nilai={nilai} berwarna={tebal} />
    </div>
  );
}

/**
 * Hitungan penuh sebelum menjual, ditampilkan di puncak tekanan — justru di
 * situ keputusan ini paling sering diambil dari ingatan, bukan dari data.
 *
 * DUA angka dampak bulanan, bukan satu. Cicilan yang lenyap dan arus kas yang
 * hilang bergerak berlawanan arah; menggabungkannya jadi satu selisih
 * menyembunyikan pertukaran yang justru sedang ditimbang pemain — dan
 * pertukaran itulah yang membedakan menjual kos dari menjual emas.
 */
function HitunganJual({
  keuangan,
  aset,
  onJual,
  onBatal,
  memproses,
}: {
  keuangan: KondisiKeuangan;
  aset: Aset;
  onJual: () => void;
  onBatal: () => void;
  memproses: boolean;
}) {
  const melekat = utangMelekat(keuangan, aset.id);
  const sisaMelekat = melekat.reduce((j, l) => j + l.sisaUtang, 0);
  const cicilanLenyap = melekat.reduce((j, l) => j + l.cicilanBulanan, 0);
  const kasDiterima = ekuitasAset(keuangan, aset.id);

  return (
    <section aria-label={`Jual ${aset.nama}`} className="space-y-3">
      <div className="rounded-xl bg-teal-muda/40 p-3">
        {/*
          Pengurangannya hanya ditampilkan bila memang ada yang dikurangi.
          Tanpa utang melekat, "Nilai jual" dan "Kas yang diterima" adalah
          angka yang sama dua kali, dan baris kembar membuat pemain mencari
          beda yang tidak ada.
        */}
        {sisaMelekat > 0 && (
          <>
            <BarisHitung label="Nilai jual" nilai={aset.nilai} />
            <BarisHitung label="Utang melekat" nilai={-sisaMelekat} />
            <div className="mt-1 border-t border-teal/20" />
          </>
        )}
        <BarisHitung label="Kas yang diterima" nilai={kasDiterima} tebal />
      </div>

      <div className="rounded-xl bg-teal-muda/40 p-3">
        <p className="text-xs uppercase tracking-wide text-tinta/70">Tiap bulan sesudahnya</p>
        {/*
          Dua angka itu ADA gunanya justru karena berlawanan arah. Kalau
          keduanya nol — aset bebas utang yang juga tak berarus kas, seperti
          emas — tiga baris nol bukan kejujuran, cuma derau yang mengencerkan
          momen. Satu kalimat lebih terang.
        */}
        {cicilanLenyap === 0 && aset.arusKasBulanan === 0 ? (
          <p className="py-1 text-sm text-tinta/70">Tidak ada yang berubah.</p>
        ) : (
          <>
            <BarisHitung label="Cicilan yang lenyap" nilai={cicilanLenyap} />
            <BarisHitung label="Arus kas yang hilang" nilai={-aset.arusKasBulanan} />
            <div className="mt-1 border-t border-teal/20 pt-1">
              <BarisHitung
                label="Perubahan arus kas"
                nilai={cicilanLenyap - aset.arusKasBulanan}
                tebal
              />
            </div>
          </>
        )}
      </div>

      <div className="flex gap-2">
        <Tombol lebarPenuh disabled={memproses} onClick={onJual}>
          Jual
        </Tombol>
        <Tombol jenis="kedua" lebarPenuh disabled={memproses} onClick={onBatal}>
          Batal
        </Tombol>
      </div>
    </section>
  );
}

/**
 * Simpul keputusan paling penting di seluruh permainan. Ketiga tuas tampil
 * berdampingan dengan bobot visual sama, dan tidak ada yang terpasang di
 * muka — pemain yang memilih, bukan game.
 */
export function LembarDarurat() {
  const state = usePermainan((t) => t.state);
  const kirim = usePermainan((t) => t.kirim);
  const memproses = usePermainan((t) => t.memproses);
  const [asetDipilih, setAsetDipilih] = useState<string | null>(null);

  if (!state) return null;

  const tersedia = tuasTersedia(state.keuangan);
  const potongan = Math.round(state.keuangan.pengeluaranTetap * POTONGAN_BERHEMAT);
  // SEMUA aset yang bisa dijual, bukan yang pertama saja. Aset terbenam (§8.3)
  // tidak menghasilkan kas sepeser pun; menawarkannya adalah tombol mati.
  const bisaDijual = state.keuangan.aset.filter((a) => ekuitasAset(state.keuangan, a.id) > 0);
  const dipilih = bisaDijual.find((a) => a.id === asetDipilih);

  const pilih = (tuas: 'jual' | 'pinjam' | 'hemat', asetId?: string) =>
    void kirim({ tipe: 'TINDAKAN_DARURAT', isi: { tuas, asetId } });

  return (
    <LembarBawah judul="Saldo kas minus" terbuka bisaDitutup={false} onTutup={() => undefined}>
      <div className="space-y-4">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-tinta/70">Kekurangan</span>
          <Uang nilai={state.keuangan.saldoKas} berwarna />
        </div>

        {dipilih ? (
          <HitunganJual
            keuangan={state.keuangan}
            aset={dipilih}
            memproses={memproses}
            onJual={() => {
              pilih('jual', dipilih.id);
              setAsetDipilih(null);
            }}
            onBatal={() => setAsetDipilih(null)}
          />
        ) : tersedia.length === 0 ? (
          <>
            <p className="rounded-lg bg-rugi/10 px-3 py-3 text-sm text-rugi">
              {state.keuangan.aset.length > 0
                ? // Pemain PUNYA aset — yang benar adalah tak satu pun bisa
                  // dijual. "Tidak ada aset" akan terbaca seperti kekeliruan
                  // game oleh orang yang barusan melihat asetnya di neraca.
                  'Tak satu pun aset bisa dijual, plafon pinjaman penuh, penghematan sudah mentok.'
                : 'Tidak ada aset untuk dijual, plafon pinjaman penuh, penghematan sudah mentok.'}
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
            {bisaDijual.map((a) => (
              <Tombol
                key={a.id}
                jenis="kedua"
                lebarPenuh
                disabled={memproses}
                onClick={() => setAsetDipilih(a.id)}
              >
                Jual {a.nama} — {rupiah(ekuitasAset(state.keuangan, a.id))}
              </Tombol>
            ))}
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
