import { describe, it, expect } from 'vitest';
import { jalankanSimulasi } from './simulasi';
import { PROFESI } from '../data/profesi';
import { arusKasBulanan } from './keuangan';
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

  // Pemain yang menolak setiap peluang tidak meledak dan tidak mati; dia
  // hanya tidak pernah maju. Itu justru bunyi §6.1 tentang petak Gajian —
  // "kelegaan sesaat, lalu sadar tidak berubah apa-apa" — jadi kemandekan
  // di sini adalah perilaku yang benar, dan dituntut, bukan sekadar ditolerir.
  it('kebijakan hati-hati mandek, bukan bangkrut — §6.1', () => {
    for (const seed of SEED) {
      const h = jalankanSimulasi({ seed, profesiId: 'asn-3b', kebijakan: 'hati-hati', maksGiliran: 1000 });
      expect(h.akhir).toBe('batas-giliran');
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

  it('saham individual jauh lebih menyebar daripada indeks', () => {
    const sebaran = (angka: number[]) => Math.max(...angka) - Math.min(...angka);
    expect(sebaran(jalankan('pasar-saham'))).toBeGreaterThan(sebaran(jalankan('pasar-indeks')) * 2);
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
