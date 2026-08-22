import { describe, it, expect } from 'vitest';
import { tambahJeda, BATAS_JEDA_MS, kosong, type Pencatat } from './waktu';

describe('pencatat waktu bermain', () => {
  it('mulai dari nol', () => {
    expect(kosong()).toEqual({ msAktif: 0, msJeda: 0, jumlahJeda: 0, jumlahLewati: 0, terakhirPada: null, jedaMulai: null });
  });

  it('ketukan pertama tidak menambah waktu — belum ada jarak untuk diukur', () => {
    const p = tambahJeda(kosong(), 1_000, 'LEMPAR_DADU');
    expect(p.msAktif).toBe(0);
    expect(p.terakhirPada).toBe(1_000);
  });

  it('menjumlahkan jarak antar ketukan', () => {
    let p = tambahJeda(kosong(), 1_000, 'LEMPAR_DADU');
    p = tambahJeda(p, 4_000, 'LEMPAR_DADU');
    p = tambahJeda(p, 6_500, 'LEMPAR_DADU');
    expect(p.msAktif).toBe(5_500);
  });

  /**
   * HP yang ditaruh bukan waktu bermain. Tanpa batas ini satu orang yang
   * meninggalkan permainan semalaman akan melaporkan sesi delapan jam, dan
   * seluruh pengukuran durasi §1.4 jadi omong kosong.
   */
  it('jarak yang kelewat panjang dipotong, bukan dibuang', () => {
    let p = tambahJeda(kosong(), 0, 'LEMPAR_DADU');
    p = tambahJeda(p, 3 * 60 * 60 * 1000, 'LEMPAR_DADU');
    expect(p.msAktif).toBe(BATAS_JEDA_MS);
  });

  it('batasnya masuk akal untuk satu ketukan yang lama, bukan untuk ditinggal', () => {
    expect(BATAS_JEDA_MS).toBe(60_000);
  });

  it('waktu tidak pernah mundur meski jam sistem berubah', () => {
    let p = tambahJeda(kosong(), 10_000, 'LEMPAR_DADU');
    p = tambahJeda(p, 5_000, 'LEMPAR_DADU');
    expect(p.msAktif).toBe(0);
    expect(p.terakhirPada).toBe(5_000);
  });
});

describe('waktu di dalam Jeda Batin', () => {
  const jalan = (langkah: Array<[number, string]>): Pencatat =>
    langkah.reduce((p, [t, tipe]) => tambahJeda(p, t, tipe), kosong());

  it('dihitung dari suhu pertama sampai suhu terakhir', () => {
    const p = jalan([
      [0, 'LEMPAR_DADU'],
      [1_000, 'SUHU_BATIN'],
      [40_000, 'SUHU_BATIN'],
      [41_000, 'LEMPAR_DADU'],
    ]);
    expect(p.msJeda).toBe(39_000);
    expect(p.jumlahJeda).toBe(1);
  });

  it('jeda yang dilewati tercatat terpisah, dan waktunya tetap terhitung', () => {
    const p = jalan([
      [0, 'LEMPAR_DADU'],
      [1_000, 'SUHU_BATIN'],
      [6_000, 'LEWATI_JEDA'],
      [7_000, 'LEMPAR_DADU'],
    ]);
    expect(p.jumlahLewati).toBe(1);
    expect(p.jumlahJeda).toBe(0);
    expect(p.msJeda).toBe(5_000);
  });

  it('menghitung beberapa jeda dalam satu permainan', () => {
    const p = jalan([
      [0, 'LEMPAR_DADU'],
      [1_000, 'SUHU_BATIN'], [11_000, 'SUHU_BATIN'],
      [12_000, 'LEMPAR_DADU'],
      [13_000, 'SUHU_BATIN'], [33_000, 'SUHU_BATIN'],
    ]);
    expect(p.jumlahJeda).toBe(2);
    expect(p.msJeda).toBe(30_000);
  });

  it('waktu jeda tidak pernah melampaui waktu aktif', () => {
    const p = jalan([
      [0, 'LEMPAR_DADU'],
      [1_000, 'SUHU_BATIN'],
      [200_000, 'SUHU_BATIN'],
    ]);
    expect(p.msJeda).toBeLessThanOrEqual(p.msAktif);
  });

  it('murni — pencatat lama tidak berubah', () => {
    const awal = tambahJeda(kosong(), 1_000, 'LEMPAR_DADU');
    const salinan = { ...awal };
    tambahJeda(awal, 2_000, 'LEMPAR_DADU');
    expect(awal).toEqual(salinan);
  });
});
