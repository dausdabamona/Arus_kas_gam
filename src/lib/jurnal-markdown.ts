import { polaKebutuhan } from '../engine/pola-jurnal';
import { rupiah } from './format';
import { NASKAH_TUAI } from '../data/naskah-jeda';
import { NAMA_KEBUTUHAN, JUDUL_JURNAL, kalimatPola } from '../data/naskah-jurnal';
import type { EntriJurnal } from './db';

const TANGGAL = new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' });

/**
 * Jurnal sebagai markdown, untuk disalin ke jurnal 30 hari yang sesungguhnya
 * (§12). Bukan cadangan — cadangan itu `.json` dan tugasnya berbeda: yang satu
 * dibaca mesin saat data hilang, yang satu dibaca orang saat ia melanjutkan
 * latihannya di luar aplikasi.
 *
 * Karena itu isinya kalimat, bukan bidang: yang disalin orang ke buku
 * catatannya adalah apa yang ia tulis dan apa yang terjadi sesudahnya.
 */
export function jurnalKeMarkdown(entri: readonly EntriJurnal[]): string {
  const pola = polaKebutuhan(entri);
  const bagian: string[] = [`# ${JUDUL_JURNAL} Arus`, ''];

  if (pola) bagian.push(kalimatPola(pola.total, pola.jumlah, pola.kebutuhan), '');

  // Terlama dulu. Layar menampilkan terbaru dulu — itu benar untuk menelusuri.
  // Tapi berkas ini disalin ke buku catatan yang berjalan maju; blok terbalik
  // di dalamnya membuat latihan orang terbaca mundur.
  for (const e of [...entri].sort((a, b) => a.dibuatPada - b.dibuatPada)) {
    bagian.push(
      '---',
      '',
      `## ${TANGGAL.format(new Date(e.dibuatPada))} · ${NAMA_KEBUTUHAN[e.kebutuhan]}`,
      '',
      `> ${e.kalimat}`,
      '',
      e.tindakan,
      '',
      // Dua sisi, bobot sama — aturan Tuai §9.3 ikut sampai ke berkas yang
      // dibawa keluar. Nol berarti tak terukur, bukan impas.
      `- **${NASKAH_TUAI.hasilLuar}:** ${e.hasilLuar === 0 ? NASKAH_TUAI.takTerukur : rupiah(e.hasilLuar)}`,
      `- **${NASKAH_TUAI.hasilDalam}:** ${NASKAH_TUAI[e.hasilDalam]}`,
      '',
    );
  }

  return bagian.join('\n');
}
