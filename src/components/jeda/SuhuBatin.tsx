import { useState } from 'react';
import { TANYA_SUHU, LABEL_TOMBOL } from '../../data/naskah-jeda';
import { Tombol } from '../ui/Tombol';

interface Props {
  fase: 'sebelum' | 'sesudah';
  onCatat: (nilai: number) => void;
  disabled?: boolean;
}

/**
 * Slider 0-10. Tanpa warna menghakimi: angka 9 tidak lebih merah daripada
 * angka 2, karena tidak ada suhu yang salah.
 */
export function SuhuBatin({ fase, onCatat, disabled = false }: Props) {
  const [nilai, setNilai] = useState(5);
  const pertanyaan = TANYA_SUHU[fase];

  return (
    <div className="space-y-4">
      <p className="text-base text-tinta">{pertanyaan}</p>

      <p className="text-center text-[44px] font-bold leading-none tabular-nums text-tinta">
        {nilai}
      </p>

      <input
        type="range"
        min={0}
        max={10}
        step={1}
        value={nilai}
        aria-label={pertanyaan}
        aria-valuetext={String(nilai)}
        onChange={(e) => setNilai(Number(e.target.value))}
        className="w-full accent-teal"
      />

      <div className="flex justify-between text-xs text-tinta/70">
        <span>{TANYA_SUHU.kiri}</span>
        <span>{TANYA_SUHU.kanan}</span>
      </div>

      <Tombol onClick={() => onCatat(nilai)} disabled={disabled} lebarPenuh>
        {LABEL_TOMBOL.catat}
      </Tombol>
    </div>
  );
}
