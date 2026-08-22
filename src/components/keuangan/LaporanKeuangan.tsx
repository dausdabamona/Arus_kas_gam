import {
  hitungLaporan,
  kekayaanBersih,
  utangMelekat,
  ekuitasAset,
  type KondisiKeuangan,
  type Liabilitas,
} from '../../engine/keuangan';
import { rupiah } from '../../lib/format';
import { Uang } from '../ui/Uang';

interface Props {
  keuangan: KondisiKeuangan;
  onPilihLiabilitas: (id: string) => void;
}

function Baris({ label, catatan, nilai }: { label: string; catatan?: string; nilai: number }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <span className="min-w-0 text-sm text-tinta/70">
        {label}
        {catatan && <span className="block text-xs text-tinta/45">{catatan}</span>}
      </span>
      <Uang nilai={nilai} />
    </div>
  );
}

function BarisUtang({
  utang,
  catatan,
  onPilih,
}: {
  utang: Liabilitas;
  catatan?: string;
  onPilih: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPilih}
      className="flex w-full items-baseline justify-between gap-3 rounded-lg py-2 text-left active:bg-teal-muda/40"
    >
      <span className="min-w-0 text-sm">
        {utang.nama}
        <span className="block text-xs text-tinta/45">
          {catatan ?? `Sisa ${rupiah(utang.sisaUtang)}`}
        </span>
      </span>
      <Uang nilai={-utang.cicilanBulanan} />
    </button>
  );
}

/**
 * Dua laporan, seperti akuntansi sungguhan — dan ARUS KAS lebih dulu.
 *
 * Urutannya keputusan desain, bukan selera tata letak: game ini melatih
 * menaikkan arus kas dan mengelola rasa yang dibawanya (§0), jadi laporan yang
 * dibuka pemain di tengah tekanan harus laporan yang ia kerjakan. Neraca
 * adalah potret; arus kas yang bergerak tiap bulan.
 *
 * Setiap rupiah tertelusuri ke sumbernya: tidak ada baris "pasif dari aset"
 * yang menggumpalkan beberapa aset jadi satu angka, dan tidak ada aset yang
 * hilang dari layar hanya karena arus kasnya nol.
 */
export function LaporanKeuangan({ keuangan, onPilihLiabilitas }: Props) {
  const laporan = hitungLaporan(keuangan);
  const asetBerarusKas = keuangan.aset.filter((a) => a.arusKasBulanan !== 0);
  const utangMurni = keuangan.liabilitas.filter((l) => l.asetId === undefined);
  const namaAset = (id: string) => keuangan.aset.find((a) => a.id === id)?.nama;

  return (
    <div className="space-y-6">
      <section aria-label="Arus kas bulanan" className="space-y-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-tinta/50">Arus kas bulanan</p>
          <Uang nilai={laporan.arusKasBulanan} besar berwarna />
        </div>

        <div className="border-t border-teal-muda pt-2">
          <h3 className="text-xs uppercase tracking-wide text-tinta/50">Masuk</h3>
          <Baris label="Gaji" nilai={laporan.pendapatanAktif} />
          {asetBerarusKas.map((a) => (
            <Baris key={a.id} label={a.nama} nilai={a.arusKasBulanan} />
          ))}
        </div>

        <div className="border-t border-teal-muda pt-2">
          <h3 className="text-xs uppercase tracking-wide text-tinta/50">Keluar</h3>
          <Baris label="Hidup tetap" nilai={-keuangan.pengeluaranTetap} />
          <Baris
            label={`Biaya anak (${keuangan.jumlahAnak})`}
            nilai={-keuangan.biayaPerAnak * keuangan.jumlahAnak}
          />
          {keuangan.liabilitas.map((l) => (
            <BarisUtang
              key={l.id}
              utang={l}
              // Cicilan yang melekat aset menyebut asetnya: pemain perlu tahu
              // beban ini punya barang di baliknya, dan bisa lenyap bersamanya.
              catatan={l.asetId ? `Melekat pada ${namaAset(l.asetId) ?? l.asetId}` : undefined}
              onPilih={() => onPilihLiabilitas(l.id)}
            />
          ))}
        </div>
      </section>

      <section aria-label="Neraca" className="space-y-3">
        <h2 className="text-xs uppercase tracking-wide text-tinta/50">Neraca</h2>

        <Baris label="Kas" nilai={keuangan.saldoKas} />

        <div className="border-t border-teal-muda pt-2">
          <h3 className="text-xs uppercase tracking-wide text-tinta/50">Aset</h3>
          {keuangan.aset.length === 0 && (
            <p className="py-2 text-sm text-tinta/50">Belum ada.</p>
          )}
          {keuangan.aset.map((a) => {
            const melekat = utangMelekat(keuangan, a.id);
            const ekuitas = ekuitasAset(keuangan, a.id);
            const sisaMelekat = melekat.reduce((j, l) => j + l.sisaUtang, 0);
            return (
              // Tiap aset satu kelompok bernama: pembaca layar menyebut nama
              // asetnya sebelum membacakan nilai, utang, dan ekuitasnya —
              // tanpa itu ketiga angka itu mengambang tanpa pemilik.
              <div key={a.id} role="group" aria-label={a.nama} className="py-2">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 text-sm text-tinta/70">{a.nama}</span>
                  <Uang nilai={a.nilai} />
                </div>
                <div className="mt-0.5 flex items-baseline justify-between gap-3 text-xs">
                  <span className="text-tinta/45">
                    {a.unit !== undefined
                      ? `${a.unit} unit x ${rupiah(Math.round(a.nilai / a.unit))}`
                      : sisaMelekat > 0
                        ? `Utang melekat ${rupiah(sisaMelekat)}`
                        : 'Bebas utang'}
                  </span>
                  {/* Ekuitas negatif ditampilkan apa adanya. Menyembunyikannya
                      membuat aset terbenam tampak seperti tabungan. */}
                  <span className={ekuitas < 0 ? 'text-rugi' : 'text-tinta/60'}>
                    <Uang nilai={ekuitas} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t border-teal-muda pt-2">
          <h3 className="text-xs uppercase tracking-wide text-tinta/50">Utang murni</h3>
          {utangMurni.length === 0 && <p className="py-2 text-sm text-tinta/50">Tidak ada.</p>}
          {utangMurni.map((l) => (
            <BarisUtang key={l.id} utang={l} onPilih={() => onPilihLiabilitas(l.id)} />
          ))}
        </div>

        <div className="border-t border-teal-muda pt-2">
          <Baris label="Kekayaan bersih" nilai={kekayaanBersih(keuangan)} />
        </div>
      </section>
    </div>
  );
}
