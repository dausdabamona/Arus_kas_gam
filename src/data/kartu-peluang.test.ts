import { describe, it, expect } from 'vitest';
import { KARTU_PELUANG_KECIL, KARTU_PELUANG_BESAR, cariKartu } from './kartu-peluang';

const semua = [...KARTU_PELUANG_KECIL, ...KARTU_PELUANG_BESAR];

describe('data kartu peluang', () => {
  it('menyediakan minimal 5 kartu kecil dan 3 kartu besar', () => {
    expect(KARTU_PELUANG_KECIL.length).toBeGreaterThanOrEqual(5);
    expect(KARTU_PELUANG_BESAR.length).toBeGreaterThanOrEqual(3);
  });

  it('memakai id yang unik', () => {
    expect(new Set(semua.map((k) => k.id)).size).toBe(semua.length);
  });

  it('mencantumkan tumpukan yang cocok dengan daftarnya', () => {
    expect(KARTU_PELUANG_KECIL.every((k) => k.tumpukan === 'PELUANG_KECIL')).toBe(true);
    expect(KARTU_PELUANG_BESAR.every((k) => k.tumpukan === 'PELUANG_BESAR')).toBe(true);
  });

  it('tidak pernah menetapkan uang muka melebihi harga', () => {
    expect(semua.every((k) => k.uangMuka <= k.harga)).toBe(true);
  });

  it('menjaga harga = uang muka + sisa utang', () => {
    expect(semua.every((k) => k.harga === k.uangMuka + k.sisaUtang)).toBe(true);
  });

  it('memuat satu instrumen membosankan tanpa arus kas — sesuai §8.2', () => {
    expect(semua.some((k) => k.arusKasBulanan === 0)).toBe(true);
  });

  it('menemukan kartu berdasarkan id', () => {
    expect(cariKartu(semua[0].id)?.judul).toBe(semua[0].judul);
  });

  it('mengembalikan undefined untuk id yang tidak ada', () => {
    expect(cariKartu('tidak-ada')).toBeUndefined();
  });
});

describe('§8.3 kelas nilai aset — dua sumbu, bukan satu', () => {
  const kelas = ['apresiasi', 'stagnan', 'depresiasi'] as const;

  const median = (angka: number[]) => {
    const urut = [...angka].sort((a, b) => a - b);
    return urut[Math.floor(urut.length / 2)];
  };
  /** Imbal kas bulanan sebagai pecahan harga. */
  const imbal = (k: (typeof semua)[number]) => k.arusKasBulanan / k.harga;
  const perKelas = (nama: (typeof kelas)[number]) => semua.filter((k) => k.kelas === nama);

  it('ketiga kelas terwakili', () => {
    for (const nama of kelas) expect(perKelas(nama).length).toBeGreaterThan(0);
  });

  it('apresiasi tumbuh, depresiasi menyusut, stagnan nyaris diam', () => {
    expect(median(perKelas('apresiasi').map((k) => k.driftBulanan))).toBeGreaterThan(0);
    expect(median(perKelas('depresiasi').map((k) => k.driftBulanan))).toBeLessThan(0);
    expect(Math.abs(median(perKelas('stagnan').map((k) => k.driftBulanan)))).toBeLessThan(0.005);
  });

  // Aturan isi §8.3: kalau satu kelas unggul di kedua sumbu, kelas lainnya
  // cuma hiasan dan pilihan pemain berhenti jadi pilihan.
  it('tidak ada kelas yang unggul di kedua sumbu sekaligus', () => {
    const profil = kelas.map((nama) => ({
      nama,
      imbal: median(perKelas(nama).map(imbal)),
      drift: median(perKelas(nama).map((k) => k.driftBulanan)),
    }));

    for (const a of profil) {
      for (const b of profil) {
        if (a.nama === b.nama) continue;
        const unggulKeduanya = a.imbal >= b.imbal && a.drift >= b.drift;
        expect(unggulKeduanya, `${a.nama} mendominasi ${b.nama}`).toBe(false);
      }
    }
  });

  it('kelas berarus kas paling deras justru paling cepat menyusut', () => {
    const urutImbal = [...kelas].sort(
      (a, b) => median(perKelas(b).map(imbal)) - median(perKelas(a).map(imbal)),
    );
    const urutDrift = [...kelas].sort(
      (a, b) => median(perKelas(b).map((k) => k.driftBulanan)) -
        median(perKelas(a).map((k) => k.driftBulanan)),
    );
    expect(urutImbal[0]).toBe(urutDrift[urutDrift.length - 1]);
  });
});
