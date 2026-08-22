import { semuaJurnal } from './db';
import { jurnalKeMarkdown } from './jurnal-markdown';

/**
 * Meminta sistem menandai data agar tidak dibersihkan otomatis saat
 * penyimpanan menipis. Tidak dijamin dikabulkan — hasilnya ditampilkan
 * apa adanya di layar Pengaturan.
 */
export async function mintaPenyimpananPermanen(): Promise<boolean> {
  if (!navigator.storage?.persist) return false;
  if (await navigator.storage.persisted()) return true;
  return navigator.storage.persist();
}

export async function statusPenyimpanan(): Promise<{
  permanen: boolean;
  terpakaiMB: number;
  kuotaMB: number;
}> {
  if (!navigator.storage?.estimate) {
    return { permanen: false, terpakaiMB: 0, kuotaMB: 0 };
  }
  const permanen = (await navigator.storage.persisted?.()) ?? false;
  const { usage = 0, quota = 0 } = await navigator.storage.estimate();
  return {
    permanen,
    terpakaiMB: Math.round((usage / 1048576) * 10) / 10,
    kuotaMB: Math.round(quota / 1048576),
  };
}

/** Cadangan jurnal dalam bentuk teks JSON. */
export async function buatCadanganJurnal(): Promise<string> {
  return JSON.stringify(
    { versi: 1, dibuatPada: Date.now(), jurnal: await semuaJurnal() },
    null,
    2,
  );
}

/** Mengunduh cadangan jurnal ke folder Unduhan. */
export async function unduhCadanganJurnal(): Promise<void> {
  const teks = await buatCadanganJurnal();
  const tanggal = new Date().toISOString().slice(0, 10);
  const url = URL.createObjectURL(new Blob([teks], { type: 'application/json' }));
  const tautan = document.createElement('a');
  tautan.href = url;
  tautan.download = `jurnal-arus-${tanggal}.json`;
  tautan.click();
  URL.revokeObjectURL(url);
}

/**
 * Mengunduh jurnal sebagai markdown (§12). Berbeda tugas dari cadangan `.json`:
 * yang satu dibaca mesin saat data hilang, yang satu dibaca orang saat ia
 * melanjutkan latihannya di luar aplikasi.
 */
export async function unduhJurnalMarkdown(): Promise<void> {
  const teks = jurnalKeMarkdown(await semuaJurnal());
  const tanggal = new Date().toISOString().slice(0, 10);
  const url = URL.createObjectURL(new Blob([teks], { type: 'text/markdown' }));
  const tautan = document.createElement('a');
  tautan.href = url;
  tautan.download = `jurnal-arus-${tanggal}.md`;
  tautan.click();
  URL.revokeObjectURL(url);
}
