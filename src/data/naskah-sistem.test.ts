import { describe, it, expect } from 'vitest';
import * as NASKAH from './naskah-sistem';
import { PENJELASAN_BENIH, PESAN_BENIH_KOSONG } from './naskah-sistem';

/**
 * Pesan sistem bukan suara pemandu 4T, tapi ia muncul di layar yang sama dan
 * dibaca oleh orang yang sama. Nadanya ikut menentukan apakah permainan ini
 * terasa menemani atau mengawasi.
 *
 * LANTAI, bukan langit-langit: kalimat bisa lolos semua kata di bawah dan
 * tetap terdengar menghakimi.
 */
const KATA_VONIS = ['denda', 'hukuman', 'gagal', 'kalah', 'salah'];

// Tiap ekspor naskah-sistem bertipe literal, jadi Object.values memberi union
// literal — bukan string. Dilebarkan dulu, kalau tidak predikat tipenya ditolak
// tsc sementara vitest tetap hijau.
const semuaKalimat = (Object.values(NASKAH) as unknown[]).filter(
  (n): n is string => typeof n === 'string',
);

describe('naskah sistem', () => {
  it('benar-benar memeriksa kalimat, bukan modul kosong', () => {
    expect(semuaKalimat.length).toBeGreaterThanOrEqual(4);
  });

  it.each(KATA_VONIS)('tidak pernah memakai kata "%s"', (kata) => {
    expect(semuaKalimat.filter((s) => s.toLowerCase().includes(kata))).toEqual([]);
  });

  it('tidak pernah menyapa pemain dengan bentuk kekurangan', () => {
    for (const s of semuaKalimat) expect(/kamu (belum|tidak|kurang)/i.test(s)).toBe(false);
  });

  /**
   * Pesan sistem menerangkan KEADAAN, bukan menetapkan aturan atas pemain.
   * "Benih tidak boleh kosong" adalah peraturan; "Benih masih kosong" adalah
   * kenyataan yang bisa diperbaiki, dan yang kedua tidak menegur siapa pun.
   */
  it('menerangkan keadaan, bukan melarang', () => {
    for (const s of semuaKalimat) expect(s.toLowerCase()).not.toContain('tidak boleh');
  });

  it('tanpa seruan — sistem tidak perlu meninggikan suara', () => {
    for (const s of semuaKalimat) expect(s).not.toContain('!');
  });

  /**
   * Kejujuran, bukan selera: benih sendirian TIDAK cukup mengulang permainan.
   * Kalimat yang menjanjikan sebaliknya membuat orang mengirim benih saja,
   * lalu heran kenapa dunianya berbeda.
   */
  it('kalimat benih tidak pernah menjanjikan benih saja sudah cukup', () => {
    expect(PENJELASAN_BENIH.toLowerCase()).toContain('profesi');
  });

  it('pesan benih kosong menunjuk jalan keluar yang ada di layar', () => {
    expect(PESAN_BENIH_KOSONG.toLowerCase()).toContain('benih baru');
  });
});
