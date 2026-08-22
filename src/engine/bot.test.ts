import { describe, it, expect } from 'vitest';
import { reduce, stateAwal } from './reducer';
import { cariKartuGuncang } from '../data/kartu-guncang';
import type { StatePermainan } from '../types/state';
import type { Kejadian } from '../types/kejadian';

function maju(state: StatePermainan, giliran: number): StatePermainan {
  let s = state;
  for (let t = 1; t <= giliran; t++) {
    s = reduce(s, { t, tipe: 'LEMPAR_DADU', isi: { pemainId: 'p1' } });
    if (s.kartuTerbuka) {
      s = reduce(s, { t: t + 10_000, tipe: 'PUTUSKAN',
        isi: { kartuId: s.kartuTerbuka.id, pilihan: 'tolak' } });
    }
    if (s.pasarTerbuka) {
      s = reduce(s, { t: t + 20_000, tipe: 'TRANSAKSI_PASAR',
        isi: { instrumenId: s.pasarTerbuka, aksi: 'lewat', unit: 0, ketukan: 4 } });
    }
  }
  return s;
}

describe('kehadiran bot', () => {
  it('permainan dimulai dengan tiga bot', () => {
    const s = stateAwal('uji-bot', 'asn-3b');
    expect(s.bot).toHaveLength(3);
    expect(s.bot.map((b) => b.id)).toEqual(['pak-rudi', 'bu-sinta', 'pak-umar']);
  });

  it('bot di dalam bot selalu kosong — tidak ada dunia bersarang', () => {
    const s = maju(stateAwal('uji-bot', 'asn-3b'), 20);
    expect(s.bot.every((b) => b.state.bot.length === 0)).toBe(true);
  });

  it('bot ikut maju saat pemain melempar dadu', () => {
    const s = maju(stateAwal('uji-bot', 'asn-3b'), 10);
    expect(s.bot.every((b) => b.state.giliran === 10)).toBe(true);
  });

  it('bot tidak pernah punya kartu atau tawaran menggantung', () => {
    const s = maju(stateAwal('uji-bot', 'asn-3b'), 40);
    expect(s.bot.every((b) => b.state.kartuTerbuka === null && b.state.pasarTerbuka === null))
      .toBe(true);
  });
});

describe('determinisme bot', () => {
  it('seed sama menghasilkan dunia bot yang identik', () => {
    const a = maju(stateAwal('sama', 'asn-3b'), 30);
    const b = maju(stateAwal('sama', 'asn-3b'), 30);
    expect(a.bot).toEqual(b.bot);
  });

  it('tiga bot menjalani nasib yang berbeda-beda', () => {
    const s = maju(stateAwal('beda', 'asn-3b'), 30);
    const posisi = new Set(s.bot.map((b) => b.state.posisi));
    const kas = new Set(s.bot.map((b) => b.state.keuangan.saldoKas));
    expect(posisi.size + kas.size).toBeGreaterThan(2);
  });
});

describe('INVARIAN ISOLASI — bot tidak pernah menyentuh pemain', () => {
  it('state pemain identik bit demi bit dengan atau tanpa bot', () => {
    const dengan = maju(stateAwal('isolasi', 'asn-3b'), 50);
    const tanpa = maju({ ...stateAwal('isolasi', 'asn-3b'), bot: [] }, 50);

    // Perbandingan sengaja tetap seluruh state, bukan bidang pilihan: satu-
    // satunya jalur sah dari bot ke pemain diuji terpisah di bawah, dan kalau
    // tes ini suatu hari menyala, jawabannya ada di sana — bukan di sini.
    const inti = (s: StatePermainan) => ({ ...s, bot: [] });
    expect(inti(dengan)).toEqual(inti(tanpa));
  });

  it('bot yang bangkrut pun tidak menggeser sepeser kas pemain', () => {
    const dengan = maju(stateAwal('isolasi-panjang', 'guru-honorer'), 120);
    const tanpa = maju({ ...stateAwal('isolasi-panjang', 'guru-honorer'), bot: [] }, 120);
    expect(dengan.keuangan).toEqual(tanpa.keuangan);
    expect(dengan.hargaPasar).toEqual(tanpa.hargaPasar);
    expect(dengan.riwayatDadu).toEqual(tanpa.riwayatDadu);
  });
});

/**
 * BATAS INVARIAN ISOLASI, DINYATAKAN TERANG-TERANGAN.
 *
 * refleks-banding (§7.2) menaikkan pengeluaran pemain tiap kali bot melampaui
 * kekayaannya. Itu berarti keadaan bot menggerakkan UANG pemain — satu-satunya
 * tempat di seluruh mesin yang begitu, dan memang itu inti kartunya: iri butuh
 * orang lain yang terlihat. Isolasi bit-demi-bit karena itu TIDAK berlaku untuk
 * pemain yang sedang membawa kartu ini di Lingkar Luas.
 *
 * Yang tetap dijaga, dan diuji di sini:
 *   1. Isolasi penuh di Lingkar Harian, apa pun yang terjadi.
 *   2. Isolasi penuh di Lingkar Luas untuk pemain tanpa refleks-banding.
 *   3. Pengecualiannya tunggal: dengan refleks-banding, yang berbeda hanya
 *      pengeluaran tetap dan penanda kartunya — tidak ada jalur kedua.
 */
describe('BATAS ISOLASI — refleks-banding satu-satunya pengecualian', () => {
  function diLuas(seed: string, kebiasaan: string[], denganBot: boolean): StatePermainan {
    const dasar = stateAwal(seed, 'asn-3b');
    return {
      ...dasar,
      tahap: 'luas',
      niat: 'Menemani anak tumbuh.',
      kebiasaan: kebiasaan.map((id) => ({ id, kemajuan: 0, lepas: false, lawanUnggul: false })),
      bot: denganBot
        ? dasar.bot.map((b) => ({
            ...b,
            // Bot dibuat jelas lebih kaya supaya pelampauan benar-benar terjadi.
            state: {
              ...b.state,
              keuangan: { ...b.state.keuangan, saldoKas: 5_000_000_000, liabilitas: [] },
            },
          }))
        : [],
    };
  }

  it('tetap identik bit demi bit tanpa refleks-banding, meski bot jauh lebih kaya', () => {
    const dengan = maju(diLuas('batas', ['refleks-panik', 'refleks-kejar'], true), 40);
    const tanpa = maju(diLuas('batas', ['refleks-panik', 'refleks-kejar'], false), 40);
    expect({ ...dengan, bot: [] }).toEqual({ ...tanpa, bot: [] });
  });

  it('dengan refleks-banding, pengeluaran pemain memang bergerak karena bot', () => {
    const dengan = maju(diLuas('batas-banding', ['refleks-banding'], true), 40);
    const tanpa = maju(diLuas('batas-banding', ['refleks-banding'], false), 40);

    // Pembandingan ini hanya berarti kalau jalurnya benar-benar menyala.
    expect(dengan.keuangan.pengeluaranTetap).toBeGreaterThan(tanpa.keuangan.pengeluaranTetap);
    expect(dengan.kebiasaan[0].lawanUnggul).toBe(true);
  });

  it('dan itu SATU-SATUNYA jalurnya — tidak ada yang lain ikut bergeser', () => {
    const dengan = maju(diLuas('batas-banding', ['refleks-banding'], true), 40);
    const tanpa = maju(diLuas('batas-banding', ['refleks-banding'], false), 40);

    // Posisi, dadu, harga, dan riwayat keputusan tidak boleh tersentuh sama
    // sekali: yang berbeda hanya akibat kenaikan pengeluaran, bukan jalannya.
    expect(dengan.posisi).toBe(tanpa.posisi);
    expect(dengan.riwayatDadu).toEqual(tanpa.riwayatDadu);
    expect(dengan.hargaPasar).toEqual(tanpa.hargaPasar);
    expect(dengan.riwayatDitolak).toEqual(tanpa.riwayatDitolak);
    expect(dengan.keuangan.gajiBersihBulanan).toBe(tanpa.keuangan.gajiBersihBulanan);
    expect(dengan.keuangan.jumlahAnak).toBe(tanpa.keuangan.jumlahAnak);
  });

  it('berhenti bergerak begitu refleksnya dilepas', () => {
    const lepas: StatePermainan = {
      ...diLuas('batas-lepas', ['refleks-banding'], true),
      kebiasaan: [{ id: 'refleks-banding', kemajuan: 1, lepas: true, lawanUnggul: false }],
    };
    const tanpa: StatePermainan = { ...lepas, bot: [] };
    expect(maju(lepas, 40).keuangan.pengeluaranTetap).toBe(
      maju(tanpa, 40).keuangan.pengeluaranTetap,
    );
  });
});

/**
 * `maju()` hanya melempar dadu dan menutup tawaran, jadi ia tidak pernah
 * menyentuh Gerbang Niat — `tahap`, `niat`, dan `kebiasaan` dibandingkan dalam
 * keadaan kosong di kedua lengan, dan pembandingannya hampa untuk ketiganya.
 *
 * Di sini ketiganya benar-benar diisi: kedua lengan dipaksa lolos, menulis
 * niat, dan masuk Lingkar Luas membawa kartu kebiasaan.
 */
describe('INVARIAN ISOLASI — tahap dua pun tidak disentuh bot', () => {
  function masukLuas(state: StatePermainan): StatePermainan {
    const lolos: StatePermainan = {
      ...state,
      skor: { keputusanTenang: 2, keputusanBertekanan: 9 },
      keuangan: {
        ...state.keuangan,
        aset: [
          { id: 'kos-besar-0', nama: 'Kos besar', nilai: 900_000_000, arusKasBulanan: 20_000_000 },
        ],
      },
    };
    const langkah: Kejadian[] = [
      { t: 900, tipe: 'GERBANG_NIAT', isi: { niat: 'Menemani anak tumbuh.' } },
      { t: 901, tipe: 'MASUK_LINGKAR_LUAS', isi: {} },
    ];
    return langkah.reduce(reduce, lolos);
  }

  it('tahap, niat, dan kartu kebiasaan identik dengan atau tanpa bot', () => {
    const dengan = masukLuas(maju(stateAwal('isolasi-luas', 'asn-3b'), 30));
    const tanpa = masukLuas(maju({ ...stateAwal('isolasi-luas', 'asn-3b'), bot: [] }, 30));

    // Pembandingan hanya berarti kalau bidangnya benar-benar terisi.
    expect(dengan.tahap).toBe('luas');
    expect(dengan.kebiasaan.length).toBeGreaterThan(0);

    expect(dengan.tahap).toBe(tanpa.tahap);
    expect(dengan.niat).toBe(tanpa.niat);
    expect(dengan.kebiasaan).toEqual(tanpa.kebiasaan);
    expect({ ...dengan, bot: [] }).toEqual({ ...tanpa, bot: [] });
  });
});

/**
 * Tes di atas hijau tanpa perubahan setelah kartu guncang masuk — tapi hanya
 * karena tidak ada bot yang lolos dalam 50 maupun 120 giliran, sehingga kartu
 * `ada-bot-lolos` tidak pernah layak dipilih. Hijau yang kebetulan bukan bukti.
 *
 * Di sini bot dipaksa lolos supaya jalur itu benar-benar terbuka. Yang dijaga:
 * bot boleh menyentuh pemain PERSIS satu kali, lewat kalimat, dan tidak pernah
 * lewat uang.
 */
describe('satu-satunya jalur bot ke pemain adalah kalimat', () => {
  function paksaLolos(state: StatePermainan): StatePermainan {
    return {
      ...state,
      bot: state.bot.map((b, i) => (i === 1 ? { ...b, lolosPadaGiliran: 1 } : b)),
    };
  }

  it('kartu {nama} benar-benar terpilih setelah ada bot yang lolos', () => {
    const terpilih: string[] = [];
    for (let awal = 0; awal < 24; awal++) {
      for (let t = 1; t < 40; t++) {
        const dasar = paksaLolos({ ...stateAwal(`lolos-${awal}`, 'asn-3b'), posisi: awal });
        const coba = reduce(dasar, { t, tipe: 'LEMPAR_DADU', isi: { pemainId: 'p1' } });
        if (coba.guncangTerbuka) terpilih.push(coba.guncangTerbuka.kartuId);
      }
    }
    expect(terpilih).toContain('bot-lolos');
  });

  it('mengisi {nama} dengan nama bot yang lolos, bukan penanda mentah', () => {
    for (let awal = 0; awal < 24; awal++) {
      for (let t = 1; t < 40; t++) {
        const dasar = paksaLolos({ ...stateAwal(`nama-${awal}`, 'asn-3b'), posisi: awal });
        const coba = reduce(dasar, { t, tipe: 'LEMPAR_DADU', isi: { pemainId: 'p1' } });
        if (coba.guncangTerbuka?.kartuId !== 'bot-lolos') continue;
        expect(coba.guncangTerbuka.judul).not.toContain('{nama}');
        expect(coba.guncangTerbuka.judul).toContain('Bu Sinta');
        return;
      }
    }
    throw new Error('kartu bot-lolos tidak pernah terpilih');
  });

  it('tidak menggeser sepeser pun meski kartunya berbeda', () => {
    const dengan = maju(paksaLolos(stateAwal('jalur', 'asn-3b')), 60);
    const tanpa = maju({ ...stateAwal('jalur', 'asn-3b'), bot: [] }, 60);

    expect(dengan.keuangan).toEqual(tanpa.keuangan);
    expect(dengan.posisi).toBe(tanpa.posisi);
    expect(dengan.riwayatDadu).toEqual(tanpa.riwayatDadu);
    expect(dengan.hargaPasar).toEqual(tanpa.hargaPasar);
    expect(dengan.riwayatDitolak).toEqual(tanpa.riwayatDitolak);
    expect(dengan.skor).toEqual(tanpa.skor);
    expect(dengan.tanamTertunda).toEqual(tanpa.tanamTertunda);
  });

  it('kalau kartunya sampai berbeda, keduanya tanpa efek uang', () => {
    // Sapu banyak seed supaya kasus "berbeda" benar-benar tertangkap, bukan
    // dilewati diam-diam oleh satu seed yang kebetulan sama.
    let pernahBerbeda = false;
    for (let i = 0; i < 40; i++) {
      const dengan = maju(paksaLolos(stateAwal(`jalur-${i}`, 'asn-3b')), 30);
      const tanpa = maju({ ...stateAwal(`jalur-${i}`, 'asn-3b'), bot: [] }, 30);
      expect(dengan.keuangan.saldoKas).toBe(tanpa.keuangan.saldoKas);
      if (dengan.guncangTerbuka?.kartuId === tanpa.guncangTerbuka?.kartuId) continue;
      pernahBerbeda = true;
      for (const id of [dengan.guncangTerbuka?.kartuId, tanpa.guncangTerbuka?.kartuId]) {
        if (id) expect(cariKartuGuncang(id).efek.jenis, id).toBe('tanpa-efek');
      }
    }
    expect(pernahBerbeda, 'kartunya tidak pernah berbeda — tes ini hampa').toBe(true);
  });
});
