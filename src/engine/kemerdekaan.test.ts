import { describe, it, expect } from 'vitest';
import { ringkasKemerdekaan, MINIMUM_UJIAN } from './kemerdekaan';

const skor = (tenang: number, tekanan: number) => ({
  keputusanTenang: tenang,
  keputusanBertekanan: tekanan,
});

describe('ringkasKemerdekaan', () => {
  it('0/0 menghasilkan skor penuh — tidak pernah diuji bukan kegagalan', () => {
    expect(ringkasKemerdekaan(skor(0, 0)).skor).toBe(100);
  });

  it('tapi 0/0 tetap belum teruji — dan membawa dua kartu', () => {
    const r = ringkasKemerdekaan(skor(0, 0));
    expect(r.belumTeruji).toBe(true);
    expect(r.kartuKebiasaan).toBe(2);
  });

  it('skor penuh yang benar-benar teruji membawa nol kartu', () => {
    const banyak = MINIMUM_UJIAN + 5;
    const r = ringkasKemerdekaan(skor(banyak, banyak));
    expect(r.skor).toBe(100);
    expect(r.belumTeruji).toBe(false);
    expect(r.kartuKebiasaan).toBe(0);
  });

  it('yang bergulat dan menang sebagian membawa lebih sedikit daripada yang tak teruji', () => {
    const banyak = MINIMUM_UJIAN + 5;
    const bergulat = ringkasKemerdekaan(skor(Math.round(banyak * 0.75), banyak));
    const takTeruji = ringkasKemerdekaan(skor(0, 0));
    expect(bergulat.kartuKebiasaan).toBeLessThan(takTeruji.kartuKebiasaan);
  });

  it('tabel §7.2: teruji, skor sedang → satu kartu', () => {
    const banyak = MINIMUM_UJIAN + 5;
    expect(ringkasKemerdekaan(skor(Math.round(banyak * 0.5), banyak)).kartuKebiasaan).toBe(1);
  });

  it('tabel §7.2: teruji, skor rendah → dua kartu', () => {
    const banyak = MINIMUM_UJIAN + 5;
    expect(ringkasKemerdekaan(skor(Math.round(banyak * 0.2), banyak)).kartuKebiasaan).toBe(2);
  });

  it('tepat di ambang minimum sudah dihitung teruji', () => {
    expect(ringkasKemerdekaan(skor(MINIMUM_UJIAN, MINIMUM_UJIAN)).belumTeruji).toBe(false);
  });

  it('skor tidak pernah melampaui 100 maupun turun di bawah 0', () => {
    for (let tekanan = 1; tekanan < 30; tekanan++) {
      for (let tenang = 0; tenang <= tekanan; tenang++) {
        const s = ringkasKemerdekaan(skor(tenang, tekanan)).skor;
        expect(s).toBeGreaterThanOrEqual(0);
        expect(s).toBeLessThanOrEqual(100);
      }
    }
  });

  /**
   * Jantung keputusan desain Fase 6, dinyatakan sebagai perbandingan langsung:
   * berapa pun rasionya, yang tidak pernah membiarkan dirinya diukur tidak
   * boleh masuk lebih bersih daripada yang ikut diukur.
   */
  it('tidak pernah membiarkan yang belum teruji masuk lebih bersih daripada yang teruji', () => {
    const takTeruji = ringkasKemerdekaan(skor(0, 0)).kartuKebiasaan;
    const banyak = MINIMUM_UJIAN + 5;
    for (let tenang = 0; tenang <= banyak; tenang++) {
      expect(ringkasKemerdekaan(skor(tenang, banyak)).kartuKebiasaan).toBeLessThanOrEqual(takTeruji);
    }
  });

  it('membaca ujian apa adanya dari keputusan bertekanan', () => {
    expect(ringkasKemerdekaan(skor(3, 7)).ujian).toBe(7);
  });
});
