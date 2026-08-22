import { describe, it, expect } from 'vitest';
import { normalkanBenih, benihSah, rakitBenih, PEMISAH_BENIH } from './benih';
import { buatPrng } from './prng';
import { KATA_BENIH } from '../data/kata-benih';

describe('normalkanBenih merapikan sekali, di pintu masuk', () => {
  it('menyatukan ragam ketikan orang yang sama-sama benar', () => {
    const ragam = [
      'kabut-rusa-lontar',
      'Kabut-Rusa-Lontar',
      'KABUT RUSA LONTAR',
      '  kabut  rusa  lontar  ',
      'kabut_rusa_lontar',
      'kabut--rusa---lontar',
      '-kabut-rusa-lontar-',
      'kabut, rusa, lontar',
    ];
    for (const t of ragam) {
      expect(normalkanBenih(t)).toBe('kabut-rusa-lontar');
    }
  });

  it('idempoten — merapikan yang sudah rapi tidak mengubah apa pun', () => {
    const contoh = ['kabut-rusa-lontar', 'arus-1755870421123', 'a', '2026', ''];
    for (const t of contoh) {
      const sekali = normalkanBenih(t);
      expect(normalkanBenih(sekali)).toBe(sekali);
    }
  });

  it('menyisakan kosong bila tidak ada yang bisa diselamatkan', () => {
    for (const t of ['', '   ', '---', '???', '·—·']) {
      expect(normalkanBenih(t)).toBe('');
    }
  });

  it('membiarkan benih format lama tetap terketik', () => {
    // Benih mesin dari sebelum tambalan ini masih harus bisa dibuka lagi;
    // orang yang menyalinnya dari laporan lama tidak boleh ditolak.
    expect(normalkanBenih('arus-1755870421123')).toBe('arus-1755870421123');
  });
});

describe('benihSah menjaga pintu, bukan selera', () => {
  it('menolak yang kosong sesudah dirapikan', () => {
    for (const t of ['', '  ', '---', '???']) expect(benihSah(t)).toBe(false);
  });

  it('menerima apa pun yang menyisakan huruf atau angka', () => {
    for (const t of ['kabut-rusa-lontar', 'a', 'arus-1755870421123', 'Kabut Rusa']) {
      expect(benihSah(t)).toBe(true);
    }
  });
});

describe('rakitBenih memberi benih yang bisa diucapkan', () => {
  it('tiga kata dari tiga daftar, berurutan', () => {
    const benih = rakitBenih(buatPrng('uji-rakit'));
    const kata = benih.split(PEMISAH_BENIH);
    expect(kata).toHaveLength(3);
    expect(KATA_BENIH[0]).toContain(kata[0]);
    expect(KATA_BENIH[1]).toContain(kata[1]);
    expect(KATA_BENIH[2]).toContain(kata[2]);
  });

  it('deterministik — prng yang sama memberi benih yang sama', () => {
    expect(rakitBenih(buatPrng('sama'))).toBe(rakitBenih(buatPrng('sama')));
  });

  /**
   * Titik tetap adalah syarat yang menahan seluruh janji tambalan ini: benih
   * yang ditampilkan lalu diketik ulang harus membuka dunia yang sama. Kalau
   * rakitan bisa keluar dalam bentuk yang masih perlu dirapikan, yang tampil
   * di layar bukan lagi benih yang dipakai mesin.
   */
  it('selalu titik tetap normalisasi', () => {
    for (let i = 0; i < 500; i++) {
      const benih = rakitBenih(buatPrng(`titik-tetap-${i}`));
      expect(normalkanBenih(benih)).toBe(benih);
    }
  });

  it('menarik tepat tiga angka acak, apa pun kata yang keluar', () => {
    // Invarian konsumsi PRNG (§4.2): jumlah tarikan tidak boleh bergantung
    // pada konteks. Di sini deretnya dibagi dengan pemakai lain seed yang sama.
    let tarikan = 0;
    const dasar = buatPrng('hitung-tarikan');
    rakitBenih(() => {
      tarikan++;
      return dasar();
    });
    expect(tarikan).toBe(3);
  });

  it('memberi ragam, bukan satu benih berulang', () => {
    const kumpulan = new Set<string>();
    for (let i = 0; i < 200; i++) kumpulan.add(rakitBenih(buatPrng(`ragam-${i}`)));
    expect(kumpulan.size).toBeGreaterThan(150);
  });
});
