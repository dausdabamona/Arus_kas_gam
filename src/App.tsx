import { useEffect } from 'react';
import { usePermainan } from './hooks/use-permainan';
import { mintaPenyimpananPermanen } from './lib/penyimpanan';
import { LayarMulai } from './screens/LayarMulai';
import { LayarPapan } from './screens/LayarPapan';
import { LayarGerbang } from './screens/LayarGerbang';
import { hitungLaporan, lolosTahapSatu } from './engine/keuangan';

export default function App() {
  const state = usePermainan((t) => t.state);

  useEffect(() => {
    void mintaPenyimpananPermanen();
  }, []);

  if (!state) return <LayarMulai />;

  // Gerbang Niat berdiri di antara dua tahap: begitu syarat lolos terpenuhi,
  // tidak ada jalan ke Lingkar Luas selain lewat sini (§7.1).
  const diGerbang = state.tahap === 'harian' && lolosTahapSatu(hitungLaporan(state.keuangan));

  return diGerbang ? <LayarGerbang /> : <LayarPapan />;
}
