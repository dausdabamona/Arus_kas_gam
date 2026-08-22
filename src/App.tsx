import { useEffect } from 'react';
import { usePermainan } from './hooks/use-permainan';
import { mintaPenyimpananPermanen } from './lib/penyimpanan';
import { LayarMulai } from './screens/LayarMulai';
import { LayarPapan } from './screens/LayarPapan';
import { LayarGerbang } from './screens/LayarGerbang';
import { LayarAkhir } from './screens/LayarAkhir';
import { hitungLaporan, lolosTahapSatu } from './engine/keuangan';

export default function App() {
  const state = usePermainan((t) => t.state);

  useEffect(() => {
    void mintaPenyimpananPermanen();
  }, []);

  if (!state) return <LayarMulai />;

  // Permainan yang selesai berhenti menjadi papan. Sebelum ini papannya tetap
  // berdiri seolah tidak terjadi apa-apa, dan satu-satunya tanda bahwa
  // permainan berakhir adalah tombol dadu yang diam.
  if (state.status === 'selesai') return <LayarAkhir />;

  // Gerbang Niat berdiri di antara dua tahap: begitu syarat lolos terpenuhi,
  // tidak ada jalan ke Lingkar Luas selain lewat sini (§7.1).
  const diGerbang = state.tahap === 'harian' && lolosTahapSatu(hitungLaporan(state.keuangan));

  return diGerbang ? <LayarGerbang /> : <LayarPapan />;
}
