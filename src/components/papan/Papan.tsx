import { PAPAN, type JenisPetak } from '../../engine/papan';

const LABEL: Record<JenisPetak, string> = {
  GAJIAN: 'Gajian',
  PELUANG_KECIL: 'Peluang kecil',
  PELUANG_BESAR: 'Peluang besar',
  PASAR: 'Pasar',
  BIAYA_TAK_TERDUGA: 'Biaya tak terduga',
  GUNCANG: 'Guncang',
  AMAL: 'Amal',
  TAMBAH_ANAK: 'Tambah anak',
};

const WARNA: Record<JenisPetak, string> = {
  GAJIAN: 'bg-teal text-ivory',
  PELUANG_KECIL: 'bg-teal-muda text-teal-tua',
  PELUANG_BESAR: 'bg-teal-muda text-teal-tua',
  PASAR: 'bg-amber/20 text-amber',
  BIAYA_TAK_TERDUGA: 'bg-rugi/15 text-rugi',
  GUNCANG: 'bg-rugi/15 text-rugi',
  AMAL: 'bg-white text-tinta/60',
  TAMBAH_ANAK: 'bg-white text-tinta/60',
};

export function Papan({ posisi }: { posisi: number }) {
  return (
    <ol className="grid grid-cols-6 gap-1" aria-label="Papan Lingkar Harian">
      {PAPAN.map((petak, i) => {
        const disini = i === posisi;
        return (
          <li
            key={i}
            aria-current={disini ? 'step' : undefined}
            className={[
              'flex aspect-square flex-col items-center justify-center rounded-lg p-1 text-center',
              'text-[9px] leading-tight',
              WARNA[petak],
              disini ? 'ring-2 ring-tinta ring-offset-1' : '',
            ].join(' ')}
          >
            {disini && <span className="mb-0.5 text-sm">●</span>}
            <span>{LABEL[petak]}</span>
          </li>
        );
      })}
    </ol>
  );
}
