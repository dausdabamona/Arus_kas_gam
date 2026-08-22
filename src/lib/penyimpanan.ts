import { semuaJurnal, ringkasanPermainan } from './db';
import { jurnalKeMarkdown } from './jurnal-markdown';
import { simpanBerkas } from './berkas';

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
    {
      versi: 2,
      dibuatPada: Date.now(),
      jurnal: await semuaJurnal(),
      // Ringkasan permainan ikut sejak versi 2, untuk uji manusia Fase 8:
      // durasi §1.4 tidak bisa diukur simulator. Tidak ada apa pun tentang
      // orangnya di sini — cuma benih, profesi, giliran, dan waktu.
      permainan: await ringkasanPermainan(),
    },
    null,
    2,
  );
}

/** Menyimpan cadangan jurnal sebagai berkas .json di luar aplikasi. */
export async function unduhCadanganJurnal(): Promise<void> {
  const tanggal = new Date().toISOString().slice(0, 10);
  await simpanBerkas(`jurnal-arus-${tanggal}.json`, await buatCadanganJurnal(), 'application/json');
}

/**
 * Mengunduh jurnal sebagai markdown (§12). Berbeda tugas dari cadangan `.json`:
 * yang satu dibaca mesin saat data hilang, yang satu dibaca orang saat ia
 * melanjutkan latihannya di luar aplikasi.
 */
export async function unduhJurnalMarkdown(): Promise<void> {
  const tanggal = new Date().toISOString().slice(0, 10);
  const teks = jurnalKeMarkdown(await semuaJurnal());
  await simpanBerkas(`jurnal-arus-${tanggal}.md`, teks, 'text/markdown');
}
