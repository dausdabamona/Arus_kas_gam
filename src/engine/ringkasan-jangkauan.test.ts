import { describe, it, expect } from 'vitest';
import { jalankanSimulasi, type Kebijakan, type GayaJeda } from './simulasi';
import { ringkasAkhir, KUADRAN, type Kuadran } from './ringkasan';

/**
 * INVARIAN JANGKAUAN KUADRAN. Tabel §10.3 punya empat sel. Sel yang tidak
 * pernah bisa dicapai adalah tabel yang rapi di dokumen dan mati di dunia —
 * kelas cacat yang sama dengan `ambangTurun: 0.2` di Fase 5, yang secara
 * struktur tak terjangkau dan lolos berbulan-bulan karena efeknya "0,0%".
 *
 * Temuan yang melahirkan tes ini: dengan pelari lama, 300 permainan (3 profesi
 * x 5 kebijakan x 20 benih) hanya pernah mendarat di DUA kuadran —
 * 'belum-jalan' 162 kali dan 'kaya-terikat' 138 kali. Ujian maksimum: NOL.
 * Pelari tidak pernah menyentuh Jeda, jadi papan Kemerdekaan membeku di
 * "belum teruji" dan separuh tabel mustahil menyala.
 */

const KEBIJAKAN: Kebijakan[] = ['hati-hati', 'serakah', 'seimbang', 'pasar-indeks'];
const PROFESI = ['asn-3b', 'guru-honorer', 'pegawai-bank'];
const GAYA: GayaJeda[] = ['abaikan', 'lewati', 'reda', 'tetap'];

function sapu(): { hitung: Record<string, number>; ujianMaks: number; total: number } {
  const hitung: Record<string, number> = {};
  let ujianMaks = 0;
  let total = 0;
  for (const profesiId of PROFESI) {
    for (const kebijakan of KEBIJAKAN) {
      for (const gayaJeda of GAYA) {
        for (let i = 0; i < 6; i++) {
          const h = jalankanSimulasi({
            seed: `jangkauan-${i}`,
            profesiId,
            kebijakan,
            maksGiliran: 200,
            lanjutKeLuas: true,
            gayaJeda,
          });
          const r = ringkasAkhir(h.state);
          hitung[r.kuadran] = (hitung[r.kuadran] ?? 0) + 1;
          ujianMaks = Math.max(ujianMaks, r.kemerdekaan.ujian);
          total++;
        }
      }
    }
  }
  return { hitung, ujianMaks, total };
}

const HASIL = sapu();

describe('keempat kuadran §10.3 benar-benar bisa dicapai', () => {
  it('sapuannya nyata, bukan daftar kosong', () => {
    expect(HASIL.total).toBe(PROFESI.length * KEBIJAKAN.length * GAYA.length * 6);
    expect(HASIL.ujianMaks).toBeGreaterThan(0);
  });

  it.each(Object.keys(KUADRAN) as Kuadran[])('%s pernah menyala', (kuadran) => {
    expect(HASIL.hitung[kuadran] ?? 0).toBeGreaterThan(0);
  });

  it('tidak ada kuadran kelima — selain "tak terbaca", yang memang bukan kuadran', () => {
    // null bukan petak kelima: ia justru penolakan menaruh orang di petak mana
    // pun saat satu sumbunya belum punya angka.
    const nyata = Object.keys(HASIL.hitung).filter((k) => k !== 'null');
    expect(nyata.sort()).toEqual(Object.keys(KUADRAN).sort());
  });

  it('yang belum teruji memang berakhir tanpa kuadran, bukan di kolom rendah', () => {
    expect(HASIL.hitung['null'] ?? 0).toBeGreaterThan(0);
  });
});

describe('gaya jeda pelari benar-benar menggerakkan papan Kemerdekaan', () => {
  const jalankan = (gayaJeda: GayaJeda) =>
    ringkasAkhir(
      jalankanSimulasi({
        seed: 'gaya-jeda',
        profesiId: 'asn-3b',
        kebijakan: 'seimbang',
        maksGiliran: 120,
        lanjutKeLuas: true,
        gayaJeda,
      }).state,
    ).kemerdekaan;

  it('abaikan: tidak satu pun keputusan pernah diukur', () => {
    const m = jalankan('abaikan');
    expect(m.ujian).toBe(0);
    expect(m.belumTeruji).toBe(true);
  });

  it('lewati: ikut diukur, tidak pernah terhitung tenang, dan tanpa penalti', () => {
    const m = jalankan('lewati');
    expect(m.ujian).toBeGreaterThan(0);
    expect(m.skor).toBe(0);
  });

  it('tetap: berjeda tapi suhunya tidak turun — bertekanan, bukan tenang', () => {
    const m = jalankan('tetap');
    expect(m.ujian).toBeGreaterThan(0);
    expect(m.skor).toBe(0);
  });

  it('reda: suhunya turun sepenuh ambang — tenang', () => {
    const m = jalankan('reda');
    expect(m.ujian).toBeGreaterThan(0);
    expect(m.skor).toBe(100);
    expect(m.tinggi).toBe(true);
  });
});

describe('bawaan pelari tidak berubah', () => {
  /**
   * Seluruh angka Invarian 1-6 disetel di atas pelari yang tidak menyentuh
   * jeda. Kalau bawaannya bergeser, setiap angka itu ikut bergeser tanpa satu
   * tes pun menyalak — sebab tes-tes itu memang mengukur pelari, bukan ambang.
   */
  it('tanpa gayaJeda, hasilnya identik dengan gayaJeda "abaikan"', () => {
    const opsi = { seed: 'bawaan', profesiId: 'asn-3b', kebijakan: 'serakah' as const, maksGiliran: 150 };
    expect(jalankanSimulasi({ ...opsi, gayaJeda: 'abaikan' })).toEqual(jalankanSimulasi(opsi));
  });

  it('dan BERBEDA dari gaya yang berjeda — kalau tidak, opsinya tidak berbuat apa-apa', () => {
    const opsi = { seed: 'bawaan', profesiId: 'asn-3b', kebijakan: 'serakah' as const, maksGiliran: 150 };
    expect(jalankanSimulasi({ ...opsi, gayaJeda: 'reda' })).not.toEqual(jalankanSimulasi(opsi));
  });
});
