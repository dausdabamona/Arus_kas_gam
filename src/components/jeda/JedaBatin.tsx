import { useState } from 'react';
import { usePermainan } from '../../hooks/use-permainan';
import { arusKasBulanan, sisaPlafonPinjaman } from '../../engine/keuangan';
import {
  NASKAH_TENANG,
  PETUNJUK_TENANG,
  TAWARAN_JEDA,
  TANYA_LOKASI,
  LOKASI_TUBUH,
  TANYA_TEMU,
  PETUNJUK_TEKS_BEBAS,
  LABEL_PANCINGAN,
  TANYA_PILAH,
  JENIS_TEMUAN,
  NASKAH_PELEPASAN,
  NASKAH_INFORMASI,
  LABEL_DATA,
  NASKAH_KEBIASAAN,
  NASKAH_TANAM,
  LABEL_TOMBOL,
} from '../../data/naskah-jeda';
import { LembarBawah } from '../ui/LembarBawah';
import { Tombol } from '../ui/Tombol';
import { Uang } from '../ui/Uang';
import { SuhuBatin } from './SuhuBatin';
import type { KebutuhanId, JenisTemuan, IsiJedaBatin } from '../../types/kejadian';

interface Props {
  /** Judul pemicu yang sedang menunggu keputusan. */
  judul: string;
  kebutuhan: KebutuhanId;
  onSelesai: () => void;
}

type Langkah =
  | 'suhu-sebelum'
  | 'tawaran'
  | 'tenang'
  | 'lokasi'
  | 'temu'
  | 'pilah'
  | 'lepas'
  | 'informasi'
  | 'kebiasaan'
  | 'tanam'
  | 'suhu-sesudah';

/** Berapa kali "Tidak" sebelum pertanyaan cadangan muncul. */
const RAGU_SETELAH = 2;

/**
 * Mesin langkah Jeda Batin. Tidak ada satu pun kalimat pemandu yang ditulis
 * di berkas ini — semuanya dari `naskah-jeda.ts`, dan ada tesnya.
 *
 * Tombol Lewati ada di setiap langkah dan tidak pernah menghukum: `LEWATI_JEDA`
 * tidak menyentuh penghitung skor mana pun. Sesi batin yang dipaksa berubah
 * jadi basa-basi.
 */
export function JedaBatin({ judul, kebutuhan, onSelesai }: Props) {
  const state = usePermainan((t) => t.state);
  const kirim = usePermainan((t) => t.kirim);
  const memproses = usePermainan((t) => t.memproses);

  const [langkah, setLangkah] = useState<Langkah>('suhu-sebelum');
  const [nomorTenang, setNomorTenang] = useState(0);
  const [lokasi, setLokasi] = useState<IsiJedaBatin['lokasiTubuh']>('tidak-jelas');
  const [temuan, setTemuan] = useState('');
  const [nomorLepas, setNomorLepas] = useState(0);
  const [jumlahTidak, setJumlahTidak] = useState(0);
  const [kalimat, setKalimat] = useState('');
  const [tindakan, setTindakan] = useState('');

  if (!state) return null;

  const lewati = async () => {
    await kirim({ tipe: 'LEWATI_JEDA', isi: { pemicuId: judul } });
    onSelesai();
  };

  const catatSuhu = async (nilai: number, fase: 'sebelum' | 'sesudah') => {
    await kirim({ tipe: 'SUHU_BATIN', isi: { nilai, fase } });
    if (fase === 'sebelum') setLangkah('tawaran');
    else onSelesai();
  };

  const pilihJenis = async (jenis: JenisTemuan) => {
    await kirim({ tipe: 'JEDA_BATIN', isi: { lokasiTubuh: lokasi, jenisTemuan: jenis, kebutuhan } });
    if (jenis === 'emosi') setLangkah('lepas');
    else if (jenis === 'informasi') setLangkah('informasi');
    else if (jenis === 'kebiasaan') setLangkah('kebiasaan');
    else setLangkah('tanam');
  };

  const tanam = async () => {
    await kirim({
      tipe: 'TANAM',
      // Jadwal panen dihitung ulang oleh mesin; angka di sini tidak menentukan apa pun.
      isi: { kalimat, tindakan, panenPadaGiliran: 0 },
    });
    setLangkah('suhu-sesudah');
  };

  const jawabLepas = (ya: boolean) => {
    const tidakBaru = ya ? jumlahTidak : jumlahTidak + 1;
    setJumlahTidak(tidakBaru);
    if (nomorLepas < NASKAH_PELEPASAN.tiga.length - 1) setNomorLepas(nomorLepas + 1);
    else setLangkah('tanam');
  };

  const isi = () => {
    switch (langkah) {
      case 'suhu-sebelum':
        return <SuhuBatin fase="sebelum" disabled={memproses} onCatat={(n) => void catatSuhu(n, 'sebelum')} />;

      case 'tawaran':
        return (
          <div className="flex flex-col gap-2">
            <Tombol onClick={() => setLangkah('tenang')} lebarPenuh>
              {TAWARAN_JEDA.jeda}
            </Tombol>
            <Tombol jenis="kedua" onClick={() => void lewati()} disabled={memproses} lebarPenuh>
              {TAWARAN_JEDA.langsung}
            </Tombol>
          </div>
        );

      case 'tenang':
        return (
          <button
            type="button"
            className="w-full space-y-6 rounded-xl py-6 text-left"
            onClick={() =>
              nomorTenang < NASKAH_TENANG.length - 1
                ? setNomorTenang(nomorTenang + 1)
                : setLangkah('lokasi')
            }
          >
            <p className="text-lg leading-relaxed text-tinta">{NASKAH_TENANG[nomorTenang]}</p>
            <p className="text-xs text-tinta/40">{PETUNJUK_TENANG}</p>
          </button>
        );

      case 'lokasi':
        return (
          <div className="space-y-3">
            <p className="text-base text-tinta">{TANYA_LOKASI}</p>
            <div className="flex flex-wrap gap-2">
              {LOKASI_TUBUH.map((l) => (
                <Tombol
                  key={l.id}
                  jenis="kedua"
                  onClick={() => {
                    setLokasi(l.id);
                    setLangkah('temu');
                  }}
                >
                  {l.label}
                </Tombol>
              ))}
            </div>
          </div>
        );

      case 'temu':
        return (
          <div className="space-y-3">
            <p className="text-base text-tinta">{TANYA_TEMU[kebutuhan]}</p>
            <textarea
              rows={3}
              value={temuan}
              aria-label={TANYA_TEMU[kebutuhan]}
              placeholder={PETUNJUK_TEKS_BEBAS}
              onChange={(e) => setTemuan(e.target.value)}
              className="w-full rounded-xl border border-tinta/15 bg-ivory p-3 text-base text-tinta"
            />
            <Tombol onClick={() => setLangkah('pilah')} lebarPenuh>
              {LABEL_TOMBOL.lanjut}
            </Tombol>
          </div>
        );

      case 'pilah':
        return (
          <div className="space-y-3">
            <p className="text-base text-tinta">{TANYA_PILAH}</p>
            <div className="space-y-2">
              {JENIS_TEMUAN.map((j) => (
                <button
                  key={j.id}
                  type="button"
                  disabled={memproses}
                  onClick={() => void pilihJenis(j.id)}
                  className="w-full rounded-xl bg-teal-muda p-3 text-left disabled:opacity-40"
                >
                  <span className="block font-semibold text-teal-tua">{j.label}</span>
                  <span className="block text-sm text-tinta/70">{j.keterangan}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-tinta/40">{LABEL_PANCINGAN}</p>
          </div>
        );

      case 'lepas':
        return (
          <div className="space-y-4">
            <p className="text-sm text-tinta/60">{NASKAH_PELEPASAN.pembuka}</p>
            <p className="text-lg text-tinta">{NASKAH_PELEPASAN.tiga[nomorLepas]}</p>
            {jumlahTidak >= RAGU_SETELAH && (
              <p className="text-base text-tinta/70">{NASKAH_PELEPASAN.bilaRagu}</p>
            )}
            <div className="flex gap-2">
              <Tombol jenis="kedua" onClick={() => jawabLepas(true)} lebarPenuh>
                {LABEL_TOMBOL.ya}
              </Tombol>
              <Tombol jenis="kedua" onClick={() => jawabLepas(false)} lebarPenuh>
                {LABEL_TOMBOL.tidak}
              </Tombol>
            </div>
            <p className="text-xs text-tinta/40">{NASKAH_PELEPASAN.catatan}</p>
          </div>
        );

      case 'informasi':
        return (
          <div className="space-y-3">
            <p className="text-base text-tinta">{NASKAH_INFORMASI}</p>
            <dl className="space-y-2 rounded-xl bg-teal-muda/50 p-3">
              <div className="flex justify-between gap-3">
                <dt className="text-sm text-tinta/70">{LABEL_DATA.arusKas}</dt>
                <dd><Uang nilai={arusKasBulanan(state.keuangan)} berwarna /></dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-sm text-tinta/70">{LABEL_DATA.sisaPlafon}</dt>
                <dd><Uang nilai={sisaPlafonPinjaman(state.keuangan)} /></dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-sm text-tinta/70">{LABEL_DATA.totalCicilan}</dt>
                <dd>
                  <Uang
                    nilai={state.keuangan.liabilitas.reduce((j, l) => j + l.cicilanBulanan, 0)}
                  />
                </dd>
              </div>
            </dl>
            <Tombol onClick={() => setLangkah('suhu-sesudah')} lebarPenuh>
              {LABEL_TOMBOL.lanjut}
            </Tombol>
          </div>
        );

      case 'kebiasaan':
        return (
          <div className="space-y-3">
            <p className="text-base text-tinta">{NASKAH_KEBIASAAN}</p>
            <p className="text-sm text-tinta/70">{NASKAH_TANAM.tindakan}</p>
            <textarea
              rows={2}
              value={tindakan}
              aria-label={NASKAH_TANAM.tindakan}
              placeholder={PETUNJUK_TEKS_BEBAS}
              onChange={(e) => setTindakan(e.target.value)}
              className="w-full rounded-xl border border-tinta/15 bg-ivory p-3 text-base text-tinta"
            />
            <Tombol onClick={() => void tanam()} disabled={memproses} lebarPenuh>
              {LABEL_TOMBOL.simpan}
            </Tombol>
          </div>
        );

      case 'tanam':
        return (
          <div className="space-y-3">
            {/*
              Petunjuknya tampil sebagai label, bukan sekadar placeholder:
              placeholder lenyap begitu pemain mengetik, dan kalimat sepanjang
              ini terpotong di dalam kolom dua baris. Petunjuk yang tidak
              terbaca sama saja dengan petunjuk yang tidak ada.
            */}
            <p className="text-sm text-tinta/70">{NASKAH_TANAM.kalimat}</p>
            <textarea
              rows={2}
              value={kalimat}
              aria-label={NASKAH_TANAM.kalimat}
              placeholder={PETUNJUK_TEKS_BEBAS}
              onChange={(e) => setKalimat(e.target.value)}
              className="w-full rounded-xl border border-tinta/15 bg-ivory p-3 text-base text-tinta"
            />
            <p className="text-sm text-tinta/70">{NASKAH_TANAM.tindakan}</p>
            <textarea
              rows={2}
              value={tindakan}
              aria-label={NASKAH_TANAM.tindakan}
              placeholder={PETUNJUK_TEKS_BEBAS}
              onChange={(e) => setTindakan(e.target.value)}
              className="w-full rounded-xl border border-tinta/15 bg-ivory p-3 text-base text-tinta"
            />
            <p className="text-xs text-tinta/40">{NASKAH_TANAM.sekali}</p>
            <Tombol onClick={() => void tanam()} disabled={memproses} lebarPenuh>
              {LABEL_TOMBOL.simpan}
            </Tombol>
          </div>
        );

      case 'suhu-sesudah':
        return <SuhuBatin fase="sesudah" disabled={memproses} onCatat={(n) => void catatSuhu(n, 'sesudah')} />;
    }
  };

  return (
    <LembarBawah judul={judul} terbuka onTutup={() => void lewati()}>
      <div className="space-y-5">
        {isi()}
        <Tombol jenis="kedua" onClick={() => void lewati()} disabled={memproses} lebarPenuh>
          {LABEL_TOMBOL.lewati}
        </Tombol>
      </div>
    </LembarBawah>
  );
}
