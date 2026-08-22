import { usePermainan } from '../hooks/use-permainan';
import { useJurnal } from '../hooks/use-jurnal';
import { ringkasAkhir } from '../engine/ringkasan';
import { cariProfesi } from '../data/profesi';
import { LABEL_BENIH } from '../data/naskah-sistem';
import {
  JUDUL_LAYAR,
  JUDUL_KEKAYAAN,
  JUDUL_KEMERDEKAAN,
  JUDUL_KUADRAN,
  KETERANGAN_KUADRAN,
  KETERANGAN_AKHIR,
  LABEL_KEKAYAAN_BERSIH,
  LABEL_PENDAPATAN_PASIF,
  LABEL_PENGELUARAN,
  LABEL_SKOR,
  LABEL_UJIAN,
  LABEL_NIAT,
  LABEL_GILIRAN,
  BELUM_TERUJI,
  JUDUL_JURNAL_PERMAINAN,
  JURNAL_KOSONG,
  AJAKAN_MAIN_LAGI,
  CATATAN_ALAT_LATIHAN,
  DISCLAIMER,
} from '../data/naskah-akhir';
import { PapanSkor, BarisPapan } from '../components/akhir/PapanSkor';
import { Tombol } from '../components/ui/Tombol';
import { Uang } from '../components/ui/Uang';

export function LayarAkhir() {
  const state = usePermainan((t) => t.state);
  const permainanId = usePermainan((t) => t.permainanId);
  const tutup = usePermainan((t) => t.tutup);
  const jurnal = useJurnal(permainanId);

  if (!state) return null;
  const r = ringkasAkhir(state);

  return (
    <main className="mx-auto max-w-md p-5 pb-10">
      <p className="text-xs uppercase tracking-wide text-tinta/50">{JUDUL_LAYAR}</p>
      <h1 className="mt-1 text-[28px] font-bold leading-tight tracking-tight text-teal-tua">
        {JUDUL_KUADRAN[r.kuadran]}
      </h1>
      <p className="mt-2 text-sm text-tinta/70">{KETERANGAN_KUADRAN[r.kuadran]}</p>
      {r.alasanAkhir && (
        <p className="mt-3 border-l-2 border-teal/40 pl-2 text-sm italic text-tinta/60">
          {KETERANGAN_AKHIR[r.alasanAkhir]}
        </p>
      )}

      {/*
        Ditumpuk, selebar layar, cetakan sama. Dua percobaan sebelumnya gagal
        dan keduanya hanya ketahuan saat dimainkan: flex membuat papan Kekayaan
        252 px dan Kemerdekaan 142 px, lalu grid dua kolom membuat keduanya
        169 px tapi memotong "Rp 221.282.585" jadi dua baris.

        Yang di atas bukan yang utama; keduanya memang tidak selalu searah (§0),
        dan itu justru isinya.
      */}
      <div className="mt-5 grid grid-cols-1 gap-3">
        <PapanSkor judul={JUDUL_KEKAYAAN}>
          <BarisPapan
            label={LABEL_KEKAYAAN_BERSIH}
            nilai={<Uang nilai={r.kekayaan.kekayaanBersih} berwarna />}
          />
          <BarisPapan
            label={LABEL_PENDAPATAN_PASIF}
            nilai={<Uang nilai={r.kekayaan.pendapatanPasif} />}
          />
          <BarisPapan
            label={LABEL_PENGELUARAN}
            nilai={<Uang nilai={r.kekayaan.totalPengeluaran} />}
          />
        </PapanSkor>

        <PapanSkor judul={JUDUL_KEMERDEKAAN}>
          {r.kemerdekaan.belumTeruji ? (
            <p className="text-sm text-tinta/70">{BELUM_TERUJI}</p>
          ) : (
            <>
              <BarisPapan label={LABEL_SKOR} nilai={`${r.kemerdekaan.skor}%`} />
              <BarisPapan label={LABEL_UJIAN} nilai={r.kemerdekaan.ujian} />
            </>
          )}
        </PapanSkor>
      </div>

      <div className="mt-5 space-y-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm text-tinta/70">{LABEL_GILIRAN}</span>
          <span className="text-sm font-semibold tabular-nums">{r.giliran}</span>
        </div>
        {r.niat && (
          <div className="pt-2">
            <p className="text-xs uppercase tracking-wide text-tinta/50">{LABEL_NIAT}</p>
            <p className="mt-1 text-sm italic text-tinta/80">{r.niat}</p>
          </div>
        )}
      </div>

      <section className="mt-6">
        <h2 className="text-xs uppercase tracking-wide text-tinta/50">
          {JUDUL_JURNAL_PERMAINAN}
        </h2>
        {jurnal !== null &&
          (jurnal.length === 0 ? (
            <p className="mt-1 text-sm text-tinta/60">{JURNAL_KOSONG}</p>
          ) : (
            <ul className="mt-2 space-y-3">
              {jurnal.map((e) => (
                <li key={e.id} className="rounded-lg bg-teal-muda/40 p-3">
                  <p className="text-sm text-tinta/85">{e.kalimat}</p>
                  <p className="mt-1 text-xs text-tinta/55">{e.tindakan}</p>
                </li>
              ))}
            </ul>
          ))}
      </section>

      {/*
        Benih dan profesi berdampingan, apa adanya — GDD §4.2. Di layar inilah
        ia paling berguna: kalau ada yang terasa keliru pada angka di atas,
        inilah yang membuat permainan tadi bisa dibuka lagi persis.
      */}
      <div data-benih className="mt-6 border-t border-teal-muda pt-3">
        <p className="text-xs uppercase tracking-wide text-tinta/50">{LABEL_BENIH}</p>
        <p className="mt-1 select-all break-all font-mono text-sm text-tinta/80">{r.seed}</p>
        <p className="text-xs text-tinta/50">{cariProfesi(r.profesiId).nama}</p>
      </div>

      <div className="mt-6">
        <Tombol lebarPenuh onClick={tutup}>
          {AJAKAN_MAIN_LAGI}
        </Tombol>
      </div>

      <p className="mt-6 text-xs text-tinta/50">{CATATAN_ALAT_LATIHAN}</p>
      <p className="mt-1 text-xs text-tinta/50">{DISCLAIMER}</p>
    </main>
  );
}
