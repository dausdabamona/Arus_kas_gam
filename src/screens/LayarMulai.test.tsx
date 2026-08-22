import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, act } from '@testing-library/react';
import App from '../App';
import { usePermainan } from '../hooks/use-permainan';
import { stateAwal } from '../engine/reducer';
import { KATA_BENIH } from '../data/kata-benih';
import { db } from '../lib/db';

/**
 * Dexie berjalan di atas putaran kejadian sungguhan, bukan sekadar microtask,
 * jadi satu flush dari act() belum tentu cukup. Ditunggu sampai syaratnya
 * terpenuhi — dengan batas, supaya kegagalan tetap gagal dan bukan menggantung.
 */
async function tunggu(syarat: () => boolean) {
  for (let i = 0; i < 50 && !syarat(); i++) {
    await act(async () => {
      await new Promise((r) => setTimeout(r, 1));
    });
  }
}

function kolomBenih() {
  return screen.getByLabelText(/benih/i) as HTMLInputElement;
}

function tombolMulai() {
  return screen.getAllByRole('button', { name: /^Mulai sebagai/ }) as HTMLButtonElement[];
}

beforeEach(async () => {
  await db.kejadian.clear();
  await db.permainan.clear();
  usePermainan.setState({
    state: null,
    permainanId: null,
    nomorKejadian: 0,
    memproses: false,
    galatMuat: null,
  });
});
afterEach(cleanup);

describe('benih terlihat di layar mulai', () => {
  it('terisi benih tiga kata yang bisa dibaca, bukan cap waktu', () => {
    render(<App />);
    const kata = kolomBenih().value.split('-');
    expect(kata).toHaveLength(3);
    expect(KATA_BENIH[0]).toContain(kata[0]);
    expect(KATA_BENIH[1]).toContain(kata[1]);
    expect(KATA_BENIH[2]).toContain(kata[2]);
  });

  it('bisa diacak ulang tanpa memulai permainan', () => {
    render(<App />);
    const semula = kolomBenih().value;
    let berbeda = false;
    // Diulang beberapa kali: dua benih acak sesekali memang bisa kembar.
    for (let i = 0; i < 5 && !berbeda; i++) {
      fireEvent.click(screen.getByRole('button', { name: /benih baru/i }));
      berbeda = kolomBenih().value !== semula;
    }
    expect(berbeda).toBe(true);
    expect(usePermainan.getState().state).toBeNull();
  });

  it('menerima benih ketikan orang, apa pun ragam ketikannya', async () => {
    render(<App />);
    fireEvent.change(kolomBenih(), { target: { value: 'Kabut Rusa Lontar' } });
    fireEvent.click(tombolMulai()[0]);
    await tunggu(() => usePermainan.getState().state !== null);
    expect(usePermainan.getState().state?.seed).toBe('kabut-rusa-lontar');
  });

  /**
   * Yang tampil di kolom harus benih yang benar-benar dipakai. Kalau kolom
   * masih memperlihatkan "Kabut Rusa Lontar" sementara mesin memakai
   * "kabut-rusa-lontar", pemain menyalin benih yang tidak pernah dipakai —
   * dan baru tahu itu keliru berbulan-bulan kemudian.
   */
  it('merapikan ketikan begitu kolom ditinggalkan', () => {
    render(<App />);
    const kolom = kolomBenih();
    fireEvent.change(kolom, { target: { value: '  Kabut__Rusa,,, Lontar ' } });
    fireEvent.blur(kolom);
    expect(kolomBenih().value).toBe('kabut-rusa-lontar');
  });

  it('tidak merapikan selagi diketik — tanda hubung yang belum selesai dibiarkan', () => {
    render(<App />);
    fireEvent.change(kolomBenih(), { target: { value: 'kabut-' } });
    expect(kolomBenih().value).toBe('kabut-');
  });

  it('benih kosong menutup pintu, dengan alasan yang terbaca', () => {
    render(<App />);
    fireEvent.change(kolomBenih(), { target: { value: '   ' } });
    for (const t of tombolMulai()) expect(t.disabled).toBe(true);
    expect(screen.getByRole('status')).toBeTruthy();
  });

  it('membuka kembali pintu begitu benih diisi lagi', () => {
    render(<App />);
    fireEvent.change(kolomBenih(), { target: { value: '' } });
    fireEvent.change(kolomBenih(), { target: { value: 'embun-anoa-sagu' } });
    for (const t of tombolMulai()) expect(t.disabled).toBe(false);
  });
});

describe('benih terlihat selagi bermain', () => {
  function pasang(seed: string) {
    usePermainan.setState({
      state: stateAwal(seed, 'asn-3b'),
      permainanId: 'g-uji',
      nomorKejadian: 1,
      memproses: false,
    });
  }

  function bukaKeuangan() {
    fireEvent.click(screen.getByRole('button', { name: /^Keuangan$/ }));
  }

  it('tampil di lembar Keuangan — tempat orang membuka saat ada yang janggal', () => {
    pasang('kabut-rusa-lontar');
    render(<App />);
    bukaKeuangan();
    expect(screen.getByText('kabut-rusa-lontar')).toBeTruthy();
  });

  /**
   * Ditampilkan APA ADANYA. Benih yang dipercantik saat ditampilkan adalah
   * benih yang salah: ia tidak lagi membuka dunia yang sama. Benih format lama
   * jelek dilihat, dan itu bukan alasan untuk mengubahnya.
   */
  it('menampilkan benih tersimpan apa adanya, termasuk format lama', () => {
    pasang('arus-1755870421123');
    render(<App />);
    bukaKeuangan();
    expect(screen.getByText('arus-1755870421123')).toBeTruthy();
  });

  it('tak pernah tampil tanpa profesinya — benih sendirian tidak cukup', () => {
    pasang('kabut-rusa-lontar');
    render(<App />);
    bukaKeuangan();
    const kotak = screen.getByText('kabut-rusa-lontar').closest('[data-benih]');
    expect(kotak?.textContent).toContain('ASN Golongan III/b');
  });
});
