import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import tema from '../../tailwind.config.js';

/**
 * §13.1: target sentuh minimal 44x44 px. Pengguna sasaran §1.4 memakai HP
 * Android kelas bawah, sering sambil berdiri, sering dengan jempol.
 *
 * Aturan ini TIDAK bisa dibuktikan di jsdom — tidak ada tata letak di sana.
 * Yang dijaga di berkas ini adalah SUMBER aturannya: token 44px benar-benar
 * bernilai 44, dan lapis dasar benar-benar memasangnya ke tiap jenis kendali.
 * Buktinya sendiri datang dari mengukurnya di peramban.
 *
 * Ditulis setelah pengukuran menemukan dua kendali yang lolos delapan fase:
 * kolom benih 286x38 dan slider Suhu Batin 320x16. Keduanya lahir setelah
 * aturan Fase 0 ditulis untuk `button` saja.
 */
const KONFIG = tema as { theme: { extend: { minHeight: Record<string, string>; minWidth: Record<string, string> } } };
const CSS = readFileSync('src/index.css', 'utf8');

describe('sumber aturan target sentuh', () => {
  it('tokennya benar-benar 44px', () => {
    expect(KONFIG.theme.extend.minHeight.sentuh).toBe('44px');
    expect(KONFIG.theme.extend.minWidth.sentuh).toBe('44px');
  });

  it.each(['button', 'input', 'textarea', 'select'])('lapis dasar memasangnya ke %s', (tag) => {
    const blok = CSS.match(new RegExp(`(^|\\n)\\s*${tag}[,\\s][^{]*\\{[^}]*\\}|(^|\\n)\\s*${tag}\\s*\\{[^}]*\\}`));
    expect(blok, `${tag} tidak punya aturan di index.css`).toBeTruthy();
    const gabungan = CSS.slice(0, CSS.length);
    // Tag harus muncul di dalam pemilih yang menerapkan min-h-sentuh.
    const punya = /@apply[^;]*min-h-sentuh/.test(gabungan);
    expect(punya).toBe(true);
  });

  it('slider suhu diberi tinggi penuh, bukan sekadar batas bawah', () => {
    // min-height saja tidak menaikkan daerah sentuh input[type=range]:
    // bawaan peramban tetap menggambar trek tipis setinggi 16px.
    expect(CSS).toMatch(/input\[type='range'\][\s\S]*height:\s*theme\('minHeight\.sentuh'\)/);
  });

  it('tidak ada kendali yang mematikan aturannya dengan tinggi tetap', () => {
    // h-4, h-8 dan kawan-kawan di elemen kendali akan mengalahkan min-height.
    const berkas = readFileSync('src/components/jeda/SuhuBatin.tsx', 'utf8');
    expect(berkas).not.toMatch(/<input[^>]*className="[^"]*\bh-\d/);
  });
});
