import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Tepi aman perangkat — kontraknya diuji di berkas gayanya sendiri.
 *
 * Ini tes pembaca sumber, sekelas `kemurnian.test.ts`. Alasannya sama: yang
 * dijaga bukan perilaku satu komponen, melainkan satu aturan yang berlaku ke
 * seluruh produk dan yang paling mudah hilang saat berkas gayanya dirapikan.
 *
 * Yang dijaga khususnya: DUA mekanisme, bukan satu. Peramban dan iOS mengisi
 * `env(safe-area-inset-*)`. WebView Android di bawah Capacitor 8 menyuntikkan
 * properti kustom `--safe-area-inset-*` ke <html>, dan baru meneruskan env()
 * bila versi WebView-nya 140 ke atas. Menulis salah satu saja berarti memilih
 * satu jenis perangkat dan membiarkan yang lain terpotong.
 */
const CSS = readFileSync(resolve(__dirname, 'index.css'), 'utf8');

const SISI = [
  { id: 'atas', inggris: 'top' },
  { id: 'bawah', inggris: 'bottom' },
  { id: 'kiri', inggris: 'left' },
  { id: 'kanan', inggris: 'right' },
] as const;

function nilaiToken(id: string): string | null {
  const cocok = CSS.match(new RegExp(`--aman-${id}\\s*:([^;]*);`));
  return cocok ? cocok[1] : null;
}

describe('token tepi aman', () => {
  it.each(SISI)('--aman-$id ada', ({ id }) => {
    expect(nilaiToken(id)).not.toBeNull();
  });

  it.each(SISI)('--aman-$id membaca env() — peramban dan iOS', ({ id, inggris }) => {
    expect(nilaiToken(id)).toContain(`env(safe-area-inset-${inggris}`);
  });

  it.each(SISI)(
    '--aman-$id membaca var(--safe-area-inset-*) — WebView Android',
    ({ id, inggris }) => {
      expect(nilaiToken(id)).toContain(`var(--safe-area-inset-${inggris}`);
    },
  );

  /**
   * Bukan sekadar menyebut keduanya, tetapi memungut mana pun yang terisi.
   * Menjumlahkannya akan menggandakan bantalan di WebView >= 140, tempat
   * kedua mekanisme berisi angka yang sama.
   */
  it.each(SISI)('--aman-$id memungut yang terbesar, bukan menjumlahkan', ({ id }) => {
    expect(nilaiToken(id)).toMatch(/^\s*max\(/);
  });

  /**
   * Bantalan dipasang sekali di body. Layar yang harus mengingat sendiri
   * adalah layar yang lupa: sampai 0.8.2, empat dari lima <main> tidak pernah
   * menyebut area aman sama sekali.
   */
  it.each(SISI)('body memakai --aman-$id', ({ id }) => {
    const badan = CSS.slice(CSS.indexOf('body {'));
    expect(badan.slice(0, badan.indexOf('}'))).toContain(`var(--aman-${id})`);
  });
});

describe('unsur fixed menghitung tepinya sendiri', () => {
  /**
   * Bantalan body tidak menolong unsur `fixed`: ia diukur dari viewport, bukan
   * dari body. Dua tempat itu harus menyebut variabelnya langsung — dan
   * keduanya justru yang terlihat terpotong di tangkapan layar HP.
   */
  it.each([
    ['screens/LayarPapan.tsx', 'fixed inset-x-0 bottom-0'],
    ['components/ui/LembarBawah.tsx', 'fixed inset-0'],
  ])('%s menyebut --aman- di sekitar %s', (berkas, penanda) => {
    const isi = readFileSync(resolve(__dirname, berkas), 'utf8');
    const baris = isi.split('\n').find((b) => b.includes(penanda));
    expect(baris, `tidak ada baris berisi "${penanda}"`).toBeTruthy();
    expect(baris).toContain('--aman-');
  });

  /**
   * env() sendirian di WebView Android lama bernilai nol, dan bantalan nol
   * itulah yang menyembunyikan baris terakhir laporan keuangan di balik bilah
   * navigasi. Tidak boleh ada sisa pemakaian env() langsung di komponen.
   */
  it('tidak ada komponen yang memakai env(safe-area-inset-*) langsung', () => {
    const berkas = ['screens/LayarPapan.tsx', 'components/ui/LembarBawah.tsx'];
    for (const b of berkas) {
      expect(readFileSync(resolve(__dirname, b), 'utf8')).not.toContain('env(safe-area-inset');
    }
  });
});
