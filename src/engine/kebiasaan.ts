import { kekayaanBersih } from './keuangan';
import { cariKartuKebiasaan } from '../data/kartu-kebiasaan';
import type { StatePermainan, KebiasaanBerjalan } from '../types/state';

/**
 * Refleks Kebiasaan Lama (§7.2). Murni: tidak menyentuh waktu, keacakan, atau
 * apa pun di luar argumennya.
 *
 * Kartu ini BUKAN hukuman. Konsekuensinya mengikat seluruh berkas: refleks yang
 * memaksa harus tetap membiarkan Jeda terbuka pada keputusan yang sama, sebab
 * di situlah pemain melatih pelepasannya. Yang mengunci tanpa jalan keluar
 * adalah denda, dan §7.2 melarangnya.
 */

/** Peristiwa yang bisa memajukan syarat lepas. */
export type PeristiwaPelepasan = 'jeda-pasar-turun' | 'tolak-tenang' | 'jeda-pengakuan';

/**
 * Nama peristiwa dan nama syarat sengaja tidak disamakan: yang satu kejadian
 * di permainan, yang satu kondisi di data kartu. Padanannya ditulis di sini
 * supaya salah satu bisa berganti nama tanpa yang lain diam-diam berhenti
 * cocok — kesamaan string yang kebetulan adalah cara paling sunyi untuk gagal.
 */
const PERISTIWA_UNTUK: Record<string, PeristiwaPelepasan> = {
  'lolos-jeda-pasar-turun': 'jeda-pasar-turun',
  'tolak-tenang': 'tolak-tenang',
  'lolos-jeda-pengakuan': 'jeda-pengakuan',
};

export type KonteksRefleks =
  | { jenis: 'pasar'; turunPersen: number }
  | { jenis: 'kartu'; imbalPersen: number };

/**
 * Apakah sebuah refleks memaksa aksi pada keputusan ini?
 *
 * Ambangnya dilampaui, bukan disentuh: ">20%" di §7.2 berarti lebih dari,
 * jadi tepat di ambang pemain masih memutuskan sendiri.
 */
export function refleksMemaksa(
  kebiasaan: readonly KebiasaanBerjalan[],
  konteks: KonteksRefleks,
): { dipaksa: boolean; kartuId?: string } {
  for (const berjalan of kebiasaan) {
    if (berjalan.lepas) continue;
    const efek = cariKartuKebiasaan(berjalan.id).efek;

    if (konteks.jenis === 'pasar' && efek.jenis === 'panik') {
      if (konteks.turunPersen > efek.ambangTurun) return { dipaksa: true, kartuId: berjalan.id };
    }
    if (konteks.jenis === 'kartu' && efek.jenis === 'kejar') {
      if (konteks.imbalPersen > efek.ambangImbal) return { dipaksa: true, kartuId: berjalan.id };
    }
  }
  return { dipaksa: false };
}

/** Memperbarui kemajuan syarat lepas setelah sebuah peristiwa yang relevan. */
export function majukanPelepasan(
  kebiasaan: readonly KebiasaanBerjalan[],
  peristiwa: PeristiwaPelepasan,
): KebiasaanBerjalan[] {
  return kebiasaan.map((berjalan) => {
    if (berjalan.lepas) return berjalan;
    const syarat = cariKartuKebiasaan(berjalan.id).syaratLepas;
    if (PERISTIWA_UNTUK[syarat.jenis] !== peristiwa) return berjalan;

    const kemajuan = berjalan.kemajuan + 1;
    return { ...berjalan, kemajuan, lepas: kemajuan >= syarat.kali };
  });
}

/**
 * refleks-banding: pengeluaran gaya hidup naik SEKALI tiap kali lawan
 * MELAMPAUI kekayaan pemain — bukan tiap giliran selama ia unggul.
 *
 * Pemicunya adalah perubahan `lawanUnggul` dari salah ke benar. Saat pemain
 * menyusul kembali, penandanya turun lagi, sehingga pelampauan berikutnya
 * benar-benar dihitung sebagai kejadian baru.
 *
 * CATATAN ISOLASI: ini satu-satunya jalur di seluruh mesin tempat keadaan bot
 * menggerakkan uang pemain, dan itu memang inti kartunya — iri butuh orang
 * lain yang terlihat. Invarian isolasi Fase 4 karena itu berlaku penuh di
 * Lingkar Harian dan untuk pemain yang tidak membawa kartu ini; pengecualiannya
 * tunggal, bernama, dan diuji terpisah di bot.test.ts.
 */
export function terapkanBanding(state: StatePermainan): StatePermainan {
  if (state.tahap !== 'luas') return state;

  const indeks = state.kebiasaan.findIndex((k) => k.id === 'refleks-banding' && !k.lepas);
  if (indeks < 0) return state;

  const berjalan = state.kebiasaan[indeks];
  const efek = cariKartuKebiasaan('refleks-banding').efek;
  if (efek.jenis !== 'banding') return state;

  const kekayaanPemain = kekayaanBersih(state.keuangan);
  const unggul = state.bot.some((b) => kekayaanBersih(b.state.keuangan) > kekayaanPemain);

  if (unggul === berjalan.lawanUnggul) return state;

  const kebiasaan = state.kebiasaan.map((k, i) => (i === indeks ? { ...k, lawanUnggul: unggul } : k));

  // Turun dari unggul ke tidak unggul hanya menyetel ulang penanda; tidak ada
  // pengeluaran yang dikembalikan. Gaya hidup yang sudah naik memang lengket.
  if (!unggul) return { ...state, kebiasaan };

  return {
    ...state,
    kebiasaan,
    keuangan: {
      ...state.keuangan,
      pengeluaranTetap: Math.round(state.keuangan.pengeluaranTetap * (1 + efek.kenaikanGayaHidup)),
    },
  };
}
