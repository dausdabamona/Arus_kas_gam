import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Pembungkus APK. GDD §4.6 sudah menyebutnya sejak awal: "Jika nanti dibungkus
 * jadi APK (Capacitor), kode yang sama jalan tanpa ditulis ulang dan Dexie
 * tetap berfungsi di dalamnya."
 *
 * Yang berubah cuma cara sampainya ke HP, bukan isinya. §2 tetap berlaku —
 * tanpa Play Store; berkasnya diambil langsung dari halaman Rilis GitHub.
 *
 * `androidScheme: 'https'` membuat WebView menyajikan aplikasi dari
 * https://localhost, bukan file://. Itu syarat IndexedDB (§4.5) dan
 * navigator.storage bekerja normal di dalam APK.
 */
const config: CapacitorConfig = {
  appId: 'id.ac.polikpsorong.arus',
  appName: 'Arus',
  webDir: 'dist',
  android: {
    // Tanpa ini, kegagalan jaringan apa pun (yang seharusnya mustahil — semua
    // aset lokal) akan menampilkan halaman galat peramban, bukan aplikasi.
    allowMixedContent: false,
  },
  server: {
    androidScheme: 'https',
  },
};

export default config;
