import { useEffect, useState } from 'react';
import { jurnalPermainan, semuaJurnal, type EntriJurnal } from '../lib/db';

/**
 * Entri jurnal, dimuat sekali saat layar berdiri. `permainanId` null berarti
 * seluruh jurnal lintas sesi.
 */
export function useJurnal(permainanId: string | null): EntriJurnal[] | null {
  const [entri, setEntri] = useState<EntriJurnal[] | null>(null);

  useEffect(() => {
    let hidup = true;
    const ambil = permainanId === null ? semuaJurnal() : jurnalPermainan(permainanId);
    void ambil.then((hasil) => {
      if (hidup) setEntri(hasil);
    });
    return () => {
      hidup = false;
    };
  }, [permainanId]);

  return entri;
}
