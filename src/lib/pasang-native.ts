import { Capacitor } from '@capacitor/core';
import { tutupTeratas } from './tombol-kembali';

/**
 * Menyingkirkan service worker di dalam APK.
 *
 * Seluruh aset sudah lokal di dalam berkas APK, jadi cache-nya tidak menambah
 * apa pun — tapi ia bisa MENGURANGI: cache yang dibuat versi lama tetap hidup
 * sesudah APK diperbarui, dan pemain menjalankan aplikasi lama di dalam
 * pembungkus baru tanpa satu tanda pun. Di peramban service worker tetap
 * bekerja seperti biasa; di sanalah gunanya (§3 Prinsip 5, luring).
 */
async function singkirkanServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  for (const daftar of await navigator.serviceWorker.getRegistrations()) {
    await daftar.unregister().catch(() => undefined);
  }
  if ('caches' in globalThis) {
    for (const nama of await caches.keys()) await caches.delete(nama).catch(() => undefined);
  }
}

/**
 * Memasang perilaku tombol Kembali Android. Hanya di dalam APK — di peramban
 * tidak ada tombol perangkat keras, dan memasangnya di sana cuma menambah
 * unduhan pertama tanpa guna.
 *
 * Aplikasi TIDAK PERNAH ditutup dari sini. Bawaan Android akan menutup
 * activity-nya, dan pemain yang menekannya di tengah Jeda kembali ke pemilihan
 * profesi seolah permainannya tidak pernah ada. Yang dilakukan: tutup lembar
 * teratas kalau ada, kalau tidak, perkecil aplikasi — permainannya tetap hidup.
 */
async function pasangTombolKembali(): Promise<void> {
  const { App } = await import('@capacitor/app');
  await App.addListener('backButton', () => {
    if (!tutupTeratas()) void App.minimizeApp();
  });
}

/**
 * Penyesuaian yang HANYA berlaku di dalam APK. Di peramban fungsi ini keluar
 * seketika: tidak ada tombol perangkat keras di sana, dan service worker-nya
 * justru yang membuat aplikasi jalan tanpa jaringan.
 */
export async function pasangNative(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  await singkirkanServiceWorker();
  await pasangTombolKembali();
}
