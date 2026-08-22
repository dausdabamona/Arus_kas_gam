import { describe, it, expect, beforeEach } from 'vitest';
import { usePermainan } from './use-permainan';
import { db } from '../lib/db';
import { buatCadanganJurnal } from '../lib/penyimpanan';
import { kosong } from '../lib/waktu';

beforeEach(async () => {
  await db.kejadian.clear();
  await db.permainan.clear();
  await db.jurnal.clear();
  usePermainan.setState({
    state: null, permainanId: null, nomorKejadian: 0, memproses: false,
    galatMuat: null, waktu: kosong(),
  });
});

describe('catatan waktu untuk uji manusia (§1.4)', () => {
  it('mencatat giliran dan waktu ke baris permainan, bukan ke event log', async () => {
    await usePermainan.getState().mulai('kabut-rusa-lontar', 'asn-3b');
    const id = usePermainan.getState().permainanId!;
    await usePermainan.getState().kirim({ tipe: 'LEMPAR_DADU', isi: { pemainId: 'p1' } });

    const baris = await db.permainan.get(id);
    expect(baris?.giliran).toBe(1);
    expect(typeof baris?.msAktif).toBe('number');

    // Event log tetap bersih: tidak ada jam dinding di dalamnya (§4.3).
    const kejadian = await db.kejadian.where('permainanId').equals(id).toArray();
    for (const k of kejadian) {
      expect(JSON.stringify(k.data)).not.toMatch(/msAktif|dibuatPada|waktu/);
    }
  });

  it('menghitung jeda yang diambil dan yang dilewati terpisah', async () => {
    await usePermainan.getState().mulai('kabut-rusa-lontar', 'asn-3b');
    const k = usePermainan.getState().kirim;
    await k({ tipe: 'SUHU_BATIN', isi: { nilai: 8, fase: 'sebelum' } });
    await k({ tipe: 'SUHU_BATIN', isi: { nilai: 4, fase: 'sesudah' } });
    await k({ tipe: 'SUHU_BATIN', isi: { nilai: 7, fase: 'sebelum' } });
    await k({ tipe: 'LEWATI_JEDA', isi: { pemicuId: 'x' } });

    const w = usePermainan.getState().waktu;
    expect(w.jumlahJeda).toBe(1);
    expect(w.jumlahLewati).toBe(1);
  });

  /**
   * Angka waktu tidak boleh menyentuh permainan. Kalau ia bocor ke state,
   * determinisme "benih sama, dunia sama" langsung batal — dua orang dengan
   * benih sama tidak pernah mengetuk pada milidetik yang sama.
   */
  it('tidak menyentuh state permainan sama sekali', async () => {
    await usePermainan.getState().mulai('kabut-rusa-lontar', 'asn-3b');
    await usePermainan.getState().kirim({ tipe: 'LEMPAR_DADU', isi: { pemainId: 'p1' } });
    const s = usePermainan.getState().state!;
    expect(JSON.stringify(s)).not.toMatch(/msAktif|msJeda|jumlahJeda|jumlahLewati/);
  });

  it('kembali kosong saat permainan ditutup', async () => {
    await usePermainan.getState().mulai('kabut-rusa-lontar', 'asn-3b');
    await usePermainan.getState().kirim({ tipe: 'LEMPAR_DADU', isi: { pemainId: 'p1' } });
    usePermainan.getState().tutup();
    expect(usePermainan.getState().waktu).toEqual(kosong());
  });

  it('ikut keluar hanya lewat berkas cadangan yang diminta pemain', async () => {
    await usePermainan.getState().mulai('kabut-rusa-lontar', 'asn-3b');
    await usePermainan.getState().kirim({ tipe: 'LEMPAR_DADU', isi: { pemainId: 'p1' } });

    const cadangan = JSON.parse(await buatCadanganJurnal());
    expect(cadangan.versi).toBe(2);
    expect(cadangan.permainan).toHaveLength(1);
    expect(cadangan.permainan[0].seed).toBe('kabut-rusa-lontar');
    expect(cadangan.permainan[0].giliran).toBe(1);
  });

  /**
   * Daftar putih, bukan daftar pasti: bidang waktu baru muncul sesudah kejadian
   * pertama, jadi menuntut daftar yang persis akan menguji URUTAN pengisian,
   * bukan yang sebenarnya dijaga — bahwa tidak ada bidang tak terduga yang
   * pernah ikut keluar.
   */
  it('cadangan tidak memuat apa pun tentang orangnya (§15.5)', async () => {
    const DIIZINKAN = [
      'dibuatPada', 'giliran', 'id', 'jumlahJeda', 'jumlahLewati',
      'msAktif', 'msJeda', 'profesiId', 'seed', 'status', 'versiLog',
    ];
    await usePermainan.getState().mulai('kabut-rusa-lontar', 'asn-3b');
    await usePermainan.getState().kirim({ tipe: 'LEMPAR_DADU', isi: { pemainId: 'p1' } });
    await usePermainan.getState().kirim({ tipe: 'SUHU_BATIN', isi: { nilai: 8, fase: 'sebelum' } });

    const cadangan = JSON.parse(await buatCadanganJurnal());
    const bidang = Object.keys(cadangan.permainan[0]).sort();
    expect(bidang.filter((b) => !DIIZINKAN.includes(b))).toEqual([]);
    // Dan yang memang dicari uji manusia benar-benar ada.
    for (const wajib of ['msAktif', 'msJeda', 'giliran', 'seed']) {
      expect(bidang).toContain(wajib);
    }
  });
});
