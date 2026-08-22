import { describe, it, expect, beforeEach } from 'vitest';
import { usePermainan } from './use-permainan';
import { db, simpanKejadian, semuaJurnal, tambahJurnal, VERSI_LOG } from '../lib/db';
import { PESAN_LOG_USANG } from '../data/naskah-sistem';

async function rekamPermainan(id: string, versiLog?: number) {
  await db.permainan.add({
    id,
    seed: 'uji-versi',
    profesiId: 'asn-3b',
    dibuatPada: 1,
    status: 'berjalan',
    ...(versiLog === undefined ? {} : { versiLog }),
  } as Parameters<typeof db.permainan.add>[0]);
  await simpanKejadian(id, {
    t: 0,
    tipe: 'MULAI',
    isi: { seed: 'uji-versi', profesiId: 'asn-3b' },
  });
  await simpanKejadian(id, { t: 1, tipe: 'LEMPAR_DADU', isi: { pemainId: 'p1' } });
}

beforeEach(async () => {
  await db.permainan.clear();
  await db.kejadian.clear();
  await db.jurnal.clear();
  usePermainan.setState({
    state: null,
    permainanId: null,
    nomorKejadian: 0,
    memproses: false,
    galatMuat: null,
  });
});

describe('versi skema log', () => {
  it('menandai permainan baru dengan versi log yang berlaku', async () => {
    await usePermainan.getState().mulai('seed-baru', 'asn-3b');
    const baris = await db.permainan.get(usePermainan.getState().permainanId!);
    expect(baris!.versiLog).toBe(VERSI_LOG);
  });

  it('memuat permainan yang versinya sama', async () => {
    await rekamPermainan('g-baru', VERSI_LOG);
    await usePermainan.getState().muat('g-baru');
    expect(usePermainan.getState().state).not.toBeNull();
    expect(usePermainan.getState().galatMuat).toBeNull();
  });

  it('menolak permainan ber-versi lama, dengan pesan yang terang', async () => {
    await rekamPermainan('g-lama', VERSI_LOG - 1);
    await usePermainan.getState().muat('g-lama');
    expect(usePermainan.getState().state).toBeNull();
    expect(usePermainan.getState().permainanId).toBeNull();
    expect(usePermainan.getState().galatMuat).toBe(PESAN_LOG_USANG);
  });

  /** Baris lama dari sebelum kolom ini ada sama saja dengan versi 1. */
  it('memperlakukan permainan tanpa penanda versi sebagai versi lama', async () => {
    await rekamPermainan('g-tanpa-versi');
    await usePermainan.getState().muat('g-tanpa-versi');
    expect(usePermainan.getState().state).toBeNull();
    expect(usePermainan.getState().galatMuat).toBe(PESAN_LOG_USANG);
  });

  it('menolak permainan yang barisnya tidak ada sama sekali', async () => {
    await usePermainan.getState().muat('entah-apa');
    expect(usePermainan.getState().state).toBeNull();
    expect(usePermainan.getState().galatMuat).toBe(PESAN_LOG_USANG);
  });

  /** Jurnal milik pemain, bukan milik sesi — penolakan tidak boleh menyentuhnya. */
  it('tidak menyentuh jurnal saat menolak', async () => {
    await tambahJurnal({
      permainanId: 'g-lama',
      dibuatPada: 1,
      kebutuhan: 'keamanan',
      kalimat: 'Saya takut kurang.',
      tindakan: 'Cek saldo sekali saja.',
      hasilLuar: 0,
      hasilDalam: 'tenang',
    });
    await rekamPermainan('g-lama', VERSI_LOG - 1);
    await usePermainan.getState().muat('g-lama');
    expect(await semuaJurnal()).toHaveLength(1);
  });

  it('membersihkan pesan begitu permainan baru dimulai', async () => {
    await rekamPermainan('g-lama', VERSI_LOG - 1);
    await usePermainan.getState().muat('g-lama');
    expect(usePermainan.getState().galatMuat).toBe(PESAN_LOG_USANG);
    await usePermainan.getState().mulai('seed-lain', 'asn-3b');
    expect(usePermainan.getState().galatMuat).toBeNull();
  });
});

describe('pesan penolakan sampai ke layar', () => {
  it('muncul di layar mulai, di antara tombol-tombol permainan baru', async () => {
    const { render, screen, cleanup } = await import('@testing-library/react');
    const { LayarMulai } = await import('../screens/LayarMulai');

    await rekamPermainan('g-lama-ui', VERSI_LOG - 1);
    await usePermainan.getState().muat('g-lama-ui');

    render(<LayarMulai />);
    expect(screen.getByText(PESAN_LOG_USANG)).toBeTruthy();
    expect(screen.getAllByRole('button', { name: /Mulai sebagai/ }).length).toBeGreaterThan(0);
    cleanup();
  });

  it('tidak muncul saat tidak ada yang ditolak', async () => {
    const { render, screen, cleanup } = await import('@testing-library/react');
    const { LayarMulai } = await import('../screens/LayarMulai');
    render(<LayarMulai />);
    expect(screen.queryByText(PESAN_LOG_USANG)).toBeNull();
    cleanup();
  });
});
