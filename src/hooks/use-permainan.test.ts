import { describe, it, expect, beforeEach } from 'vitest';
import { usePermainan } from './use-permainan';
import { db } from '../lib/db';

beforeEach(async () => {
  await db.kejadian.clear();
  await db.permainan.clear();
  usePermainan.setState({ state: null, permainanId: null, nomorKejadian: 0, memproses: false });
});

describe('usePermainan', () => {
  it('membuat state awal saat permainan dimulai', async () => {
    await usePermainan.getState().mulai('seed-uji', 'asn-3b');
    expect(usePermainan.getState().state?.profesiId).toBe('asn-3b');
    expect(usePermainan.getState().state?.giliran).toBe(0);
  });

  it('menaikkan giliran saat dadu dikirim', async () => {
    await usePermainan.getState().mulai('seed-uji', 'asn-3b');
    await usePermainan.getState().kirim({ tipe: 'LEMPAR_DADU', isi: { pemainId: 'p1' } });
    expect(usePermainan.getState().state?.giliran).toBe(1);
  });

  it('menyimpan setiap kejadian ke basis data', async () => {
    await usePermainan.getState().mulai('seed-uji', 'asn-3b');
    await usePermainan.getState().kirim({ tipe: 'LEMPAR_DADU', isi: { pemainId: 'p1' } });
    const id = usePermainan.getState().permainanId!;
    expect(await db.kejadian.where('permainanId').equals(id).count()).toBe(2);
  });

  it('mengabaikan kirim yang tumpang tindih — mencegah t ganda dari ketukan ganda', async () => {
    await usePermainan.getState().mulai('seed-uji', 'asn-3b');
    const dua = [
      usePermainan.getState().kirim({ tipe: 'LEMPAR_DADU', isi: { pemainId: 'p1' } }),
      usePermainan.getState().kirim({ tipe: 'LEMPAR_DADU', isi: { pemainId: 'p1' } }),
    ];
    await Promise.all(dua);

    expect(usePermainan.getState().state?.giliran).toBe(1);
    const id = usePermainan.getState().permainanId!;
    expect(await db.kejadian.where('permainanId').equals(id).count()).toBe(2); // MULAI + satu LEMPAR_DADU
  });

  it('memulihkan state yang sama persis setelah dimuat ulang', async () => {
    await usePermainan.getState().mulai('seed-uji', 'asn-3b');
    await usePermainan.getState().kirim({ tipe: 'LEMPAR_DADU', isi: { pemainId: 'p1' } });
    await usePermainan.getState().kirim({ tipe: 'LEMPAR_DADU', isi: { pemainId: 'p1' } });
    const sebelum = usePermainan.getState().state;
    const id = usePermainan.getState().permainanId!;

    usePermainan.setState({ state: null, permainanId: null, nomorKejadian: 0, memproses: false });
    await usePermainan.getState().muat(id);

    expect(usePermainan.getState().state).toEqual(sebelum);
  });
});
