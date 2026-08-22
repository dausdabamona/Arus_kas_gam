import { describe, it, expect, beforeEach, vi } from 'vitest';
import { daftarkanPenutup, tutupTeratas, jumlahPenutup } from './tombol-kembali';

beforeEach(() => {
  while (tutupTeratas()) { /* kosongkan */ }
});

describe('tombol Kembali Android', () => {
  it('tanpa lembar terbuka, tidak ada yang ditutup', () => {
    expect(tutupTeratas()).toBe(false);
  });

  it('menutup yang teratas lebih dulu, bukan yang pertama dibuka', () => {
    const urutan: string[] = [];
    daftarkanPenutup(() => urutan.push('bawah'));
    daftarkanPenutup(() => urutan.push('atas'));
    tutupTeratas();
    expect(urutan).toEqual(['atas']);
    tutupTeratas();
    expect(urutan).toEqual(['atas', 'bawah']);
  });

  it('lembar yang ditutup lewat layarnya sendiri ikut hilang dari tumpukan', () => {
    const tutup = vi.fn();
    const lepas = daftarkanPenutup(tutup);
    lepas();
    expect(jumlahPenutup()).toBe(0);
    expect(tutupTeratas()).toBe(false);
    expect(tutup).not.toHaveBeenCalled();
  });

  /**
   * Melepas yang di tengah tidak boleh menggeser urutan yang lain — lembar
   * bisa ditutup dari layarnya sendiri kapan saja, tidak selalu dari atas.
   */
  it('melepas dari tengah tidak mengacaukan urutan', () => {
    const urutan: string[] = [];
    daftarkanPenutup(() => urutan.push('a'));
    const lepasB = daftarkanPenutup(() => urutan.push('b'));
    daftarkanPenutup(() => urutan.push('c'));
    lepasB();
    tutupTeratas();
    tutupTeratas();
    expect(urutan).toEqual(['c', 'a']);
  });
});
