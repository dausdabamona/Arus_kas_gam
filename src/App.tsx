import { useEffect } from 'react';
import { usePermainan } from './hooks/use-permainan';
import { mintaPenyimpananPermanen } from './lib/penyimpanan';
import { LayarMulai } from './screens/LayarMulai';
import { LayarPapan } from './screens/LayarPapan';

export default function App() {
  const state = usePermainan((t) => t.state);

  useEffect(() => {
    void mintaPenyimpananPermanen();
  }, []);

  return state ? <LayarPapan /> : <LayarMulai />;
}
