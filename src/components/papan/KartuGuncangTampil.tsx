import { usePermainan } from '../../hooks/use-permainan';
import { LABEL_TOMBOL } from '../../data/naskah-jeda';
import { LembarBawah } from '../ui/LembarBawah';
import { Tombol } from '../ui/Tombol';

/**
 * Kartu guncang. Tidak ada pilihan di sini — guncangan memang tidak menawarkan
 * apa pun. Yang ditawarkan sudah lewat, di Jeda Batin sebelum layar ini.
 */
export function KartuGuncangTampil() {
  const state = usePermainan((t) => t.state);
  const kirim = usePermainan((t) => t.kirim);
  const memproses = usePermainan((t) => t.memproses);

  const guncang = state?.guncangTerbuka;
  if (!guncang) return null;

  return (
    <LembarBawah
      judul={guncang.judul}
      terbuka
      onTutup={() => void kirim({ tipe: 'TUTUP_GUNCANG', isi: { kartuId: guncang.kartuId } })}
    >
      <div className="space-y-5">
        <p className="text-base leading-relaxed text-tinta">{guncang.teks}</p>
        <Tombol
          onClick={() => void kirim({ tipe: 'TUTUP_GUNCANG', isi: { kartuId: guncang.kartuId } })}
          disabled={memproses}
          lebarPenuh
        >
          {LABEL_TOMBOL.lanjut}
        </Tombol>
      </div>
    </LembarBawah>
  );
}
