import { Capacitor } from '@capacitor/core';

/**
 * Menyimpan satu berkas teks ke luar aplikasi.
 *
 * DUA jalan, karena satu jalan tidak cukup. Di peramban, `<a download>` bekerja
 * seperti biasa. Di dalam APK ia **diam-diam tidak melakukan apa pun**: WebView
 * Android tidak memasang DownloadListener, jadi ketukan pemain tidak
 * menghasilkan berkas dan tidak menghasilkan pesan galat.
 *
 * Itu bukan cacat kecil di sini. Seluruh protokol uji manusia Fase 8
 * bergantung pada pemain yang menekan "Simpan salinan" — kalau tombol itu
 * mati di APK, ujinya pulang tanpa data dan tidak ada yang tahu kenapa.
 *
 * Di HP, berkasnya ditulis ke Documents lalu ditawarkan lewat lembar Bagikan.
 * Berkasnya tetap tersimpan meski lembar Bagikan ditutup.
 */
export async function simpanBerkas(nama: string, teks: string, mime: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    const url = URL.createObjectURL(new Blob([teks], { type: mime }));
    const tautan = document.createElement('a');
    tautan.href = url;
    tautan.download = nama;
    tautan.click();
    URL.revokeObjectURL(url);
    return;
  }

  // Dimuat saat dibutuhkan saja: di peramban, plugin ini tidak pernah dipakai
  // dan tidak perlu ikut menambah unduhan pertama.
  const [{ Filesystem, Directory, Encoding }, { Share }] = await Promise.all([
    import('@capacitor/filesystem'),
    import('@capacitor/share'),
  ]);

  const { uri } = await Filesystem.writeFile({
    path: nama,
    data: teks,
    directory: Directory.Documents,
    encoding: Encoding.UTF8,
    recursive: true,
  });

  // Menulis saja tidak cukup: berkas di Documents sulit ditemukan orang yang
  // tidak terbiasa dengan pengelola berkas, dan penguji Fase 8 perlu
  // mengirimkannya keluar dari HP.
  await Share.share({ title: nama, url: uri }).catch(() => undefined);
}
