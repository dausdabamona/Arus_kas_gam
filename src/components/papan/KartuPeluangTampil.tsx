import { useState } from 'react';
import type { KartuPeluang } from '../../types/kartu';
import type { KondisiKeuangan } from '../../engine/keuangan';
import { ringkasKredit } from '../../engine/kredit';
import { rupiah, tahun } from '../../lib/format';
import { LembarBawah } from '../ui/LembarBawah';
import { LaporanKeuangan } from '../keuangan/LaporanKeuangan';
import { Tombol } from '../ui/Tombol';

interface Props {
  kartu: KartuPeluang;
  /**
   * Seluruh kondisi, bukan saldo kasnya saja — laporan yang dibuka dari dalam
   * kartu membaca dari sini. Satu bidang menggantikan dua: saldo kas tetap
   * diambil dari kondisi yang sama, jadi tidak ada dua sumber angka.
   */
  keuangan: KondisiKeuangan;
  onPutuskan: (pilihan: 'ambil' | 'tolak') => void;
  /** Benar selagi keputusan sebelumnya masih ditulis — mencegah ketukan ganda. */
  memproses?: boolean;
}

export function KartuPeluangTampil({ kartu, keuangan, onPutuskan, memproses = false }: Props) {
  const [laporanTerbuka, setLaporanTerbuka] = useState(false);
  const mampu = keuangan.saldoKas >= kartu.uangMuka;
  const kredit = ringkasKredit(kartu);

  return (
    <LembarBawah judul={kartu.judul} terbuka onTutup={() => onPutuskan('tolak')}>
      <div className="space-y-4">
        <p className="text-sm text-tinta/70">{kartu.keterangan}</p>

        <dl className="space-y-1.5 text-sm tabular-nums">
          <div className="flex justify-between">
            <dt className="text-tinta/60">Harga</dt>
            <dd>{rupiah(kartu.harga)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-tinta/60">Uang muka</dt>
            <dd>{rupiah(kartu.uangMuka)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-tinta/60">Arus kas per bulan</dt>
            <dd className={kartu.arusKasBulanan > 0 ? 'text-untung' : 'text-tinta/60'}>
              {rupiah(kartu.arusKasBulanan)}
            </dd>
          </div>
          {kartu.sisaUtang > 0 && (
            <div className="flex justify-between">
              <dt className="text-tinta/60">Utang menempel</dt>
              <dd>{rupiah(kartu.sisaUtang)}</dd>
            </div>
          )}
        </dl>

        {!mampu && (
          <p className="rounded-lg bg-rugi/10 px-3 py-2 text-sm text-rugi">
            Saldo kas belum cukup untuk uang mukanya.
          </p>
        )}

        {/*
          Tiga angka yang sebenarnya menentukan, untuk kartu berutang. Tanpa
          ini pemain membandingkan "arus kas Rp 350.000" dengan "harga Rp 14
          juta" dan menyimpulkan dari besar angkanya — padahal yang menentukan
          adalah SELISIH terhadap cicilan, dan itu tidak tertulis di mana pun.

          Tanpa satu pun kata penilaian. Selisih minus bukan kartu buruk: itu
          pertukaran yang sah (§8.3) — kas berkurang, ekuitas tumbuh — dan
          menempelkan "hati-hati" di situ adalah game yang menyimpulkan untuk
          pemain (Prinsip 4).
        */}
        {kredit && (
          <div
            role="group"
            aria-label="Ringkasan kredit"
            className="rounded-lg bg-teal-muda/40 px-3 py-2 text-sm tabular-nums"
          >
            <span className="text-tinta/60">Cicilan </span>
            <span className="font-semibold">{rupiah(kredit.cicilan)}</span>
            <span className="text-tinta/45">/bln · </span>
            <span className="text-tinta/60">Selisih </span>
            <span
              data-selisih
              className={`font-semibold ${kredit.selisih > 0 ? 'text-untung' : 'text-rugi'}`}
            >
              {kredit.selisih > 0 ? '+' : ''}
              {rupiah(kredit.selisih)}
            </span>
            <span className="text-tinta/45">/bln · </span>
            {kredit.balikModal === null ? (
              <span className="text-tinta/60">Ekuitas tumbuh</span>
            ) : (
              <>
                <span className="text-tinta/60">Balik modal </span>
                {/* Satu napas: "~3,2" dan "th" yang terpisah baris membuat
                    satuannya terbaca sebagai baris baru, bukan sebagai satuan. */}
                <span className="whitespace-nowrap font-semibold">~{tahun(kredit.balikModal)} th</span>
              </>
            )}
          </div>
        )}

        {/*
          Memeriksa angka BUKAN keputusan. Kartu tetap berdiri di belakang dan
          tawarannya tidak hangus: pemain yang kehilangan tawaran karena
          memeriksa laporan akan belajar untuk tidak memeriksa laporan — persis
          kebalikan dari yang dilatih permainan ini.
        */}
        {/*
          Keuangan mengambil barisnya sendiri, DI ATAS keputusan. Tiga tombol
          sebaris terpotong di layar 360 px — yang tampil "Keuang". Urutannya
          juga yang benar: periksa dulu, putuskan kemudian.
        */}
        <Tombol jenis="kedua" lebarPenuh onClick={() => setLaporanTerbuka(true)}>
          Keuangan
        </Tombol>

        <div className="flex gap-2">
          <Tombol onClick={() => onPutuskan('ambil')} disabled={!mampu || memproses} lebarPenuh>
            Ambil
          </Tombol>
          <Tombol jenis="kedua" onClick={() => onPutuskan('tolak')} disabled={memproses} lebarPenuh>
            Lewati
          </Tombol>
        </div>
      </div>

      {/*
        Laporan di sini MEMBACA saja. Baris utangnya biasanya membuka lembar
        pelunasan; melunasi utang di tengah tawaran yang belum diputuskan adalah
        kejadian permainan yang lahir dari layar yang sedang menunggu, dan
        komponen ini tidak boleh mengirim kejadian apa pun.
      */}
      <LembarBawah
        judul="Laporan keuangan"
        terbuka={laporanTerbuka}
        onTutup={() => setLaporanTerbuka(false)}
      >
        <LaporanKeuangan keuangan={keuangan} onPilihLiabilitas={() => undefined} />
      </LembarBawah>
    </LembarBawah>
  );
}
