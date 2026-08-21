import { useEffect, useRef, useState } from 'react';
import { KETUKAN_PER_GILIRAN } from '../engine/pasar';

const DETIK_PER_KETUKAN = 5;

interface Opsi {
  /** Saat true, waktu berhenti total. Dipakai Jeda Batin di Fase 5 (§8.1). */
  beku: boolean;
  onHabis: () => void;
}

/**
 * Timer kartu pasar. Satu interval dijadwalkan sekali dan terus berdetak —
 * bukan rantai setTimeout per ketukan, yang tidak pernah sempat menjadwalkan
 * ketukan berikutnya sebelum React render ulang.
 */
export function useTimerPasar({ beku, onHabis }: Opsi) {
  const [ketukan, setKetukan] = useState(0);
  const habisRef = useRef(onHabis);
  habisRef.current = onHabis;
  const sudahHabis = useRef(false);

  useEffect(() => {
    if (beku) return;

    const jam = setInterval(() => {
      setKetukan((k) => (k >= KETUKAN_PER_GILIRAN ? k : k + 1));
    }, DETIK_PER_KETUKAN * 1000);

    return () => clearInterval(jam);
  }, [beku]);

  useEffect(() => {
    if (beku || ketukan < KETUKAN_PER_GILIRAN || sudahHabis.current) return;
    sudahHabis.current = true;
    habisRef.current();
  }, [beku, ketukan]);

  return {
    ketukan,
    detikTersisa: (KETUKAN_PER_GILIRAN - ketukan) * DETIK_PER_KETUKAN,
  };
}
