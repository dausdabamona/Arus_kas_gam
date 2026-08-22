import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Capacitor } from '@capacitor/core';
import { pasangNative } from './pasang-native';

beforeEach(() => vi.restoreAllMocks());

describe('penyesuaian khusus APK', () => {
  /**
   * Di peramban, service worker justru yang membuat aplikasi jalan tanpa
   * jaringan (§3 Prinsip 5). Menyingkirkannya di sana akan membatalkan
   * seluruh janji luring — jadi jalurnya harus benar-benar tertutup.
   */
  it('tidak menyentuh apa pun saat berjalan di peramban', async () => {
    vi.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(false);
    const daftar = vi.fn();
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: { getRegistrations: daftar },
    });

    await pasangNative();

    expect(daftar).not.toHaveBeenCalled();
  });

  it('di dalam APK, service worker dicabut dan cache dibuang', async () => {
    vi.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(true);
    const cabut = vi.fn().mockResolvedValue(true);
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: { getRegistrations: vi.fn().mockResolvedValue([{ unregister: cabut }]) },
    });
    const buang = vi.fn().mockResolvedValue(true);
    Object.defineProperty(globalThis, 'caches', {
      configurable: true,
      value: { keys: vi.fn().mockResolvedValue(['lama']), delete: buang },
    });

    await pasangNative().catch(() => undefined);

    expect(cabut).toHaveBeenCalled();
    expect(buang).toHaveBeenCalledWith('lama');
  });
});
