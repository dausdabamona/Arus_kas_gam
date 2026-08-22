import { useState } from 'react';
import { PROFESI } from '../data/profesi';
import { usePermainan } from '../hooks/use-permainan';
import { benihSah, normalkanBenih } from '../engine/benih';
import { benihBaru } from '../lib/benih-baru';
import {
  LABEL_BENIH,
  LABEL_BENIH_BARU,
  PENJELASAN_BENIH,
  PESAN_BENIH_KOSONG,
} from '../data/naskah-sistem';
import { rupiah } from '../lib/format';
import { Tombol } from '../components/ui/Tombol';

export function LayarMulai() {
  const mulai = usePermainan((t) => t.mulai);
  const memproses = usePermainan((t) => t.memproses);
  const galatMuat = usePermainan((t) => t.galatMuat);
  const [benih, setBenih] = useState(benihBaru);

  const sah = benihSah(benih);

  return (
    <main className="mx-auto max-w-md p-5">
      <h1 className="text-[32px] font-bold tracking-tight text-teal-tua">Arus</h1>
      <p className="mt-1 text-sm text-tinta/60">Pilih titik berangkat.</p>

      {/*
        Penolakan permainan usang muncul di sini, di layar yang sudah punya
        jalan keluarnya: setiap tombol di bawah memulai permainan baru. Pesan
        buntu tanpa langkah berikutnya adalah pintu terkunci tanpa kunci.
      */}
      {galatMuat && (
        <p role="status" className="mt-4 rounded-lg bg-amber-muda px-3 py-3 text-sm text-tinta/80">
          {galatMuat}
        </p>
      )}

      {/*
        Benih dibiarkan mentah selagi diketik dan baru dirapikan saat kolom
        ditinggalkan. Merapikan tiap ketukan akan memakan tanda hubung yang
        belum selesai: "kabut-" langsung jadi "kabut", lalu huruf berikutnya
        mendarat di kata yang salah.
      */}
      <div className="mt-6 rounded-xl border border-teal-muda bg-white p-4">
        <label htmlFor="benih" className="text-xs uppercase tracking-wide text-tinta/50">
          {LABEL_BENIH}
        </label>
        {/*
          Kolom mengambil satu baris penuh, tombolnya di bawah. Berbagi baris
          dengan "Benih baru" memotong ekor benih di layar 390px —
          "malam-penyu-rumbi" bukan benih, dan benih yang tak terbaca utuh
          persis sama tak bergunanya dengan benih yang tak pernah ditampilkan.

          Yang menjaga kolom ini tetap muat adalah batas 9 huruf per kata di
          kata-benih.test.ts: 29 aksara terpanjang yang mungkin.
        */}
        <input
          id="benih"
          value={benih}
          onChange={(e) => setBenih(e.target.value)}
          onBlur={() => setBenih(normalkanBenih(benih))}
          // Papan ketik ponsel akan mengawali dengan huruf besar dan
          // membetulkan "matoa" jadi "mata" kalau tidak dilarang di sini.
          autoCapitalize="none"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          className="mt-1 w-full rounded-lg border border-teal-muda bg-ivory px-3 py-2 font-mono text-sm text-tinta"
        />
        <div className="mt-2">
          <Tombol jenis="kedua" onClick={() => setBenih(benihBaru())} disabled={memproses}>
            {LABEL_BENIH_BARU}
          </Tombol>
        </div>
        {sah ? (
          <p className="mt-2 text-xs text-tinta/50">{PENJELASAN_BENIH}</p>
        ) : (
          <p role="status" className="mt-2 text-xs text-rugi">
            {PESAN_BENIH_KOSONG}
          </p>
        )}
      </div>

      <ul className="mt-6 space-y-3">
        {PROFESI.map((p) => (
          <li key={p.id} className="rounded-xl border border-teal-muda bg-white p-4">
            <h2 className="font-semibold">{p.nama}</h2>
            <p className="mt-1 text-sm tabular-nums text-tinta/60">
              Gaji {rupiah(p.kondisiAwal.gajiBersihBulanan)} · {p.kondisiAwal.liabilitas.length} utang
            </p>
            <div className="mt-3">
              <Tombol
                onClick={() => void mulai(normalkanBenih(benih), p.id)}
                disabled={memproses || !sah}
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
