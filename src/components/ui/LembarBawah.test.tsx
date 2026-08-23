import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { LembarBawah } from './LembarBawah';

/**
 * CACAT YANG DITEMUKAN DI HP SUNGGUHAN, bukan di terminal dan bukan di
 * peramban meja.
 *
 * Panel lembar tidak punya batas tinggi dan tidak punya area gulir. Begitu
 * isinya lebih panjang dari layar, `items-end` menambatkan tepi bawahnya dan
 * kelebihannya keluar ke ATAS — hilang, tanpa cara apa pun menjangkaunya.
 * Pada laporan keuangan di layar 360x640, sekitar 300 px isi tidak pernah
 * bisa dibaca.
 *
 * Ini menyentuh SEMUA lembar: laporan, kartu peluang, kartu pasar, Jeda
 * Batin, panen, darurat.
 *
 * KENAPA SELURUH UJI SAYA MELEWATKANNYA: saya membaca isi lembar dengan
 * innerText, dan innerText mengembalikan teks yang terpotong sama lengkapnya
 * dengan teks yang terlihat. Tangkapan layar saya pakai fullPage, yang
 * merentangkan halaman. Tidak sekali pun saya MENGGULIR. Pengukuran yang
 * benar adalah scrollHeight lawan clientHeight — dan itu hanya ada di
 * peramban, tidak di jsdom.
 *
 * Yang dijaga di berkas ini KONTRAK SUSUNANNYA saja: panel terikat tinggi
 * layar, dan isinya duduk di dalam wadah yang bisa digulir. Buktinya sendiri
 * tetap datang dari mengukur di peramban.
 */
afterEach(cleanup);

function pasang(isi = 'isi') {
  render(
    <LembarBawah judul="Uji" terbuka onTutup={() => undefined}>
      <p>{isi}</p>
    </LembarBawah>,
  );
  return screen.getByRole('dialog');
}

describe('lembar bawah tidak pernah tumbuh melewati layar', () => {
  it('panelnya terikat tinggi induk yang setinggi layar', () => {
    // max-h-full, bukan vh/dvh: induknya `fixed inset-0`, jadi "full" persis
    // setinggi viewport di peramban ponsel maupun di WebView APK.
    expect(pasang().className).toContain('max-h-full');
  });

  it('panelnya kolom lentur, supaya judul dan isi bisa dibagi tugasnya', () => {
    const dialog = pasang();
    expect(dialog.className).toContain('flex');
    expect(dialog.className).toContain('flex-col');
  });

  it('isinya duduk di wadah yang bisa digulir', () => {
    const wadah = pasang().querySelector('[data-isi-lembar]');
    expect(wadah).toBeTruthy();
    expect(wadah!.className).toContain('overflow-y-auto');
  });

  it('gulirannya tertahan di dalam lembar', () => {
    const wadah = pasang().querySelector('[data-isi-lembar]');
    expect(wadah!.className).toContain('overscroll-contain');
  });

  /**
   * Bilah navigasi Android menutupi baris terakhir — itulah yang memotong
   * "Kekayaan bersih" di tangkapan layar HP.
   *
   * Dituntut lewat `--aman-bawah`, bukan `env()`. Sampai 0.8.2 tes ini hijau
   * dengan `env(safe-area-inset-bottom)` sementara di perangkat bantalannya
   * nol: WebView Android di bawah Capacitor menyuntikkan angkanya sebagai
   * properti kustom, dan env() baru ikut terisi mulai WebView 140.
   */
  it('bantalan bawahnya menghitung area aman perangkat', () => {
    const wadah = pasang().querySelector('[data-isi-lembar]');
    expect(wadah!.className).toContain('var(--aman-bawah)');
  });

  it('tidak memakai env() sendirian — di WebView Android nilainya nol', () => {
    const wadah = pasang().querySelector('[data-isi-lembar]');
    expect(wadah!.className).not.toContain('env(safe-area-inset');
  });

  /**
   * Lembar setinggi layar menaruh judul dan tombol tutupnya di balik jam dan
   * ikon baterai. Bantalan atas ada di latarnya, bukan di panelnya: `max-h-full`
   * diukur dari induk itu, jadi memangkas induknya memangkas panelnya juga.
   */
  it('latarnya menyisakan ruang bilah status di atas', () => {
    const latar = pasang().parentElement;
    expect(latar!.className).toContain('var(--aman-atas)');
  });

  it('judulnya tidak ikut hanyut — tombol tutup harus tetap terjangkau', () => {
    const dialog = pasang();
    const kepala = dialog.querySelector('div');
    expect(kepala!.className).toContain('shrink-0');
    expect(kepala!.querySelector('h2')).toBeTruthy();
  });

  it('isi yang diberikan benar-benar berada di dalam wadah gulirnya', () => {
    const dialog = pasang('kalimat panjang');
    const wadah = dialog.querySelector('[data-isi-lembar]');
    expect(wadah!.textContent).toContain('kalimat panjang');
  });
});
