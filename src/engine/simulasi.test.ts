import { describe, it, expect } from 'vitest';
import { jalankanSimulasi } from './simulasi';
import { reduce, stateAwal } from './reducer';
import { KARTU_GUNCANG } from '../data/kartu-guncang';
import { PROFESI } from '../data/profesi';
import { arusKasBulanan, pendapatanPasif } from './keuangan';
import { MAKS_ANAK } from './reducer';

const SEED = ['a1', 'b2', 'c3', 'd4', 'e5'];

describe('konvergensi sistem', () => {
  it.each(PROFESI.map((p) => p.id))(
    'profesi %s tidak pernah meledak dengan kebijakan hati-hati',
    (profesiId) => {
      for (const seed of SEED) {
        const hasil = jalankanSimulasi({ seed, profesiId, kebijakan: 'hati-hati', maksGiliran: 1000 });
        expect(hasil.puncakPengeluaran).toBeLessThan(1_000_000_000);
      }
    },
  );

  it('kebijakan serakah selalu berakhir — tidak ada permainan tanpa ujung', () => {
    for (const seed of SEED) {
      for (const profesi of PROFESI) {
        const hasil = jalankanSimulasi({
          seed, profesiId: profesi.id, kebijakan: 'serakah', maksGiliran: 1000,
        });
        expect(hasil.akhir).not.toBe('batas-giliran');
      }
    }
  });

  /**
   * Pemain yang menolak setiap peluang tidak meledak dan tidak mati; dia
   * hanya tidak pernah maju. Itu justru bunyi §6.1 tentang petak Gajian —
   * "kelegaan sesaat, lalu sadar tidak berubah apa-apa" — jadi kemandekan
   * di sini adalah perilaku yang benar, dan dituntut, bukan sekadar ditolerir.
   *
   * AMANDEMEN FASE 5. Dulu ini dituntut sampai giliran 1000. Setelah GUNCANG
   * ada, tuntutan itu mustahil dan bukan karena angkanya kurang setel: pemain
   * yang tidak pernah menumbuhkan pendapatan pasif tidak punya sumber baru,
   * sementara pukulan yang dirancang terus menetes, dan tuasnya habis (hemat
   * dua kali, pinjam sampai plafon, tidak ada aset untuk dijual). Simulator
   * mengukur kebangkrutan paling awal di giliran 220 lintas 80 seed dan tiga
   * profesi, dengan median 580-737.
   *
   * Jadi yang dijaga sekarang adalah kemandekannya, bukan keabadiannya —
   * sepanjang permainan yang sungguh-sungguh dimainkan orang (200 giliran,
   * jauh di atas 20-35 menit di §1.4): tidak mati, tidak lolos, dan pendapatan
   * pasifnya tetap NOL. Klausa pendapatan pasif itu tuntutan baru yang lebih
   * keras daripada versi lama, yang hanya melarang bangkrut.
   */
  it.each(PROFESI.map((p) => p.id))('kebijakan hati-hati mandek, bukan bangkrut — §6.1 (%s)', (profesiId) => {
    for (const seed of SEED) {
      const h = jalankanSimulasi({ seed, profesiId, kebijakan: 'hati-hati', maksGiliran: 200 });
      expect(h.akhir).toBe('batas-giliran');
      expect(pendapatanPasif(h.state.keuangan)).toBe(0);
    }
  });

  it('utang darurat tidak pernah melampaui plafon 6x gaji bulanan', () => {
    for (const seed of SEED) {
      const hasil = jalankanSimulasi({
        seed, profesiId: 'guru-honorer', kebijakan: 'serakah', maksGiliran: 1000,
      });
      const gaji = hasil.state.keuangan.gajiBersihBulanan;
      expect(hasil.puncakUtang).toBeLessThanOrEqual(gaji * 6);
    }
  });

  it.each(PROFESI.map((p) => p.id))(
    'profesi %s memenuhi Invarian 3: pemasukan >= 1,5x drain per giliran',
    (profesiId) => {
      for (const seed of SEED) {
        const h = jalankanSimulasi({ seed, profesiId, kebijakan: 'hati-hati', maksGiliran: 1000 });
        expect(h.pemasukanPerGiliran).toBeGreaterThanOrEqual(h.drainPerGiliran * 1.5);
      }
    },
  );

  it('kebijakan hati-hati bisa lolos, bukan sekadar bertahan', () => {
    const hasil = SEED.map((seed) =>
      jalankanSimulasi({ seed, profesiId: 'asn-3b', kebijakan: 'seimbang', maksGiliran: 1000 }),
    );
    expect(hasil.some((h) => h.akhir === 'lolos')).toBe(true);
  });
});

describe('Invarian 4 §5.4 — profesi tidak boleh mati oleh dadu saja', () => {
  // Kedatangan anak sepenuhnya ditentukan dadu, tanpa satu pun keputusan
  // pemain. Kalau bebannya melampaui 60% arus kas bersih awal, profesi itu
  // bisa mati tanpa pernah salah memilih.
  it.each(PROFESI.map((p) => p.id))('profesi %s menahan beban anak penuh', (profesiId) => {
    const profesi = PROFESI.find((p) => p.id === profesiId)!;
    const arusAwal = arusKasBulanan(profesi.kondisiAwal);
    const bebanPenuh = MAKS_ANAK * profesi.kondisiAwal.biayaPerAnak;
    expect(bebanPenuh).toBeLessThanOrEqual(arusAwal * 0.6);
  });
});

describe('Invarian 5 §5.4 — jenjang pasar jujur', () => {
  const SEED_BANYAK = Array.from({ length: 25 }, (_, i) => `pasar-${i}`);

  const median = (angka: number[]) => {
    const urut = [...angka].sort((a, b) => a - b);
    return urut[Math.floor(urut.length / 2)];
  };

  const jalankan = (kebijakan: 'pasar-indeks' | 'pasar-saham' | 'pasar-panik') =>
    SEED_BANYAK.map(
      (seed) =>
        jalankanSimulasi({ seed, profesiId: 'asn-3b', kebijakan, maksGiliran: 300 })
          .nilaiAkhirPasar,
    );

  it('median indeks tidak kalah dari median saham individual', () => {
    expect(median(jalankan('pasar-indeks'))).toBeGreaterThanOrEqual(median(jalankan('pasar-saham')));
  });

  /**
   * AMANDEMEN FASE 5. Dulu sebaran diukur dari nilai portofolio akhir apa
   * adanya. Setelah GUNCANG ada, angka itu tidak lagi mengukur yang diklaimnya:
   * ia bercampur dengan BERAPA UNIT yang sempat dibeli, dan itu kini bergantung
   * pada nasib guncangan, bukan pada gejolak instrumennya. Simulator
   * menunjukkan sebaran mentah indeks JUSTRU melampaui saham (24 juta lawan
   * 42 juta dengan median 9,4 juta lawan 3,6 juta) — bukan karena indeks jadi
   * liar, tapi karena kebijakan indeks sempat membeli jauh lebih banyak unit.
   *
   * Yang diukur sekarang sebaran RELATIF terhadap mediannya, yang memang arti
   * "menyebar" dan tidak bisa ditolong oleh angka besar semata. Marginnya juga
   * bukan lagi tipis: 4,7x, bukan 2,1x.
   */
  it('saham individual jauh lebih menyebar daripada indeks', () => {
    const sebaranRelatif = (angka: number[]) => {
      const bersih = angka.filter((x) => x > 0);
      return (Math.max(...bersih) - Math.min(...bersih)) / median(bersih);
    };
    const perUnit = (kebijakan: 'pasar-indeks' | 'pasar-saham') =>
      SEED_BANYAK.map((seed) => {
        const h = jalankanSimulasi({ seed, profesiId: 'asn-3b', kebijakan, maksGiliran: 300 });
        const unit = h.state.keuangan.aset
          .filter((a) => a.instrumenId !== undefined)
          .reduce((jml, a) => jml + (a.unit ?? 0), 0);
        return unit === 0 ? 0 : h.nilaiAkhirPasar / unit;
      });
    expect(sebaranRelatif(perUnit('pasar-saham'))).toBeGreaterThan(
      sebaranRelatif(perUnit('pasar-indeks')) * 2,
    );
  });

  it('panik jual kalah dari sekadar memegang — dan ini yang ditunjukkan Pak Rudi di Fase 4', () => {
    expect(median(jalankan('pasar-panik'))).toBeLessThan(median(jalankan('pasar-saham')));
  });
});

describe('Invarian 3 tetap terjaga setelah pasar masuk', () => {
  it.each(PROFESI.map((p) => p.id))('profesi %s', (profesiId) => {
    for (const seed of SEED) {
      const h = jalankanSimulasi({ seed, profesiId, kebijakan: 'seimbang', maksGiliran: 500 });
      expect(h.pemasukanPerGiliran).toBeGreaterThanOrEqual(h.drainPerGiliran * 1.5);
    }
  });
});

/**
 * Invarian 6 §5.4 — krisis benar-benar terjadi.
 *
 * BENTUKNYA DIUBAH SIMULATOR. Rencana menuntut `giliranPerKrisis <= 40` untuk
 * tiap seed. Itu tidak bisa dipenuhi oleh angka setelan mana pun, dan sebabnya
 * struktural, bukan kurang setel:
 *
 * skala guncangan DIKUNCI di arus kas bersih AWAL (§5.4, dan memang harus
 * begitu — guncangan yang ikut tumbuh membuat membangun aset jadi sia-sia).
 * Sementara itu kas pemain yang berhasil tumbuh tanpa batas: pada saat kartu
 * guncang tiba, kasnya bergerak dari sekitar 3x skala di awal permainan sampai
 * 40-60x di akhir. Pukulan berskala tetap mustahil menembus tembok itu, jadi
 * laju krisis SELALU melandai di paruh kedua permainan — kecuali pengali
 * dinaikkan sampai profesi bermargin tipis bangkrut 19 dari 20 permainan, dan
 * bahkan di situ masih ada permainan tanpa satu pun krisis.
 *
 * Yang bisa dijaga, dan yang sebenarnya dimaksud "krisis benar-benar terjadi",
 * adalah bahwa tekanan itu NYATA dan DATANG SAAT PEMAIN MASIH TELANJANG.
 * Karena itu ukurannya: kapan krisis PERTAMA tiba, dan berapa banyak permainan
 * yang benar-benar mengalaminya.
 */
describe('Invarian 6 §5.4 — krisis benar-benar terjadi', () => {
  const SEED_LEBAR = Array.from({ length: 30 }, (_, i) => `s${i}`);

  const median = (angka: number[]) => {
    const urut = [...angka].sort((a, b) => a - b);
    return urut[Math.floor(urut.length / 2)];
  };

  const jalankan = (profesiId: string) =>
    SEED_LEBAR.map((seed) =>
      jalankanSimulasi({ seed, profesiId, kebijakan: 'seimbang', maksGiliran: 200 }),
    );

  it.each(PROFESI.map((p) => p.id))(
    'kas minus tiba sebelum giliran ke-40 di permainan tipikal (%s)',
    (profesiId) => {
      expect(median(jalankan(profesiId).map((h) => h.giliranKrisisPertama))).toBeLessThanOrEqual(40);
    },
  );

  it.each(PROFESI.map((p) => p.id))(
    'hampir setiap permainan menyentuh kas minus setidaknya sekali (%s)',
    (profesiId) => {
      const hasil = jalankan(profesiId);
      const pernah = hasil.filter((h) => h.jumlahKrisis > 0).length;
      expect(pernah).toBeGreaterThanOrEqual(Math.ceil(hasil.length * 0.75));
    },
  );

  it.each(PROFESI.map((p) => p.id))(
    'mayoritas permainan memakai tuas darurat minimal sekali (%s)',
    (profesiId) => {
      const hasil = jalankan(profesiId);
      const pernah = hasil.filter((h) => h.jumlahTuasTerpakai > 0).length;
      expect(pernah).toBeGreaterThan(hasil.length / 2);
    },
  );

  // Kartu tanpa-efek tidak menyentuh kas sepeser pun, jadi ia tidak
  // menyumbang apa pun ke frekuensi krisis. Yang disetel memang hanya empat
  // kartu kas dan satu inflasi — dan tes ini menjaga agar simulator tidak
  // diam-diam bersandar pada kartu yang tidak bisa menopangnya.
  it('kartu tanpa efek tidak pernah bisa memicu krisis', () => {
    const tanpaEfek = KARTU_GUNCANG.filter((k) => k.efek.jenis === 'tanpa-efek');
    expect(tanpaEfek.length).toBeGreaterThan(0);
    const sebelum = stateAwal('tanpa-efek', 'guru-honorer');
    for (const kartu of tanpaEfek) {
      const terbuka = {
        ...sebelum,
        guncangTerbuka: { kartuId: kartu.id, judul: kartu.judul, teks: kartu.teks },
      };
      const sesudah = reduce(terbuka, { t: 5, tipe: 'TUTUP_GUNCANG', isi: { kartuId: kartu.id } });
      expect(sesudah.keuangan, kartu.id).toEqual(sebelum.keuangan);
    }
  });

  it('tapi krisis tidak boleh jadi hujan — Invarian 1 dan 3 tetap hijau', () => {
    for (const h of jalankan('asn-3b')) {
      expect(h.akhir).not.toBe('batas-giliran'); // seimbang tetap bisa lolos/berakhir
      expect(h.pemasukanPerGiliran).toBeGreaterThanOrEqual(h.drainPerGiliran * 1.5);
    }
  });

  /**
   * Bukti mekanismenya, bukan cerita: kas pemain yang berhasil memang tumbuh
   * jauh melampaui skala guncangan, sehingga pukulan berskala tetap tidak lagi
   * bisa menembusnya. Kalau suatu hari tes ini menyala, artinya alasan bentuk
   * Invarian 6 di atas sudah tidak berlaku dan bentuknya layak ditinjau ulang.
   */
  it('kas pemain yang lolos tumbuh jauh melampaui skala guncangan', () => {
    const lolos = jalankan('asn-3b').filter((h) => h.akhir === 'lolos');
    expect(lolos.length).toBeGreaterThan(0);
    const nisbah = lolos.map((h) => h.state.keuangan.saldoKas / h.state.skalaGuncangan);
    expect(median(nisbah)).toBeGreaterThan(20);
  });
});
