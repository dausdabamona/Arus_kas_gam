import { describe, it, expect } from 'vitest';
import { stateAwal } from './reducer';
import { jalankanSimulasi, type Kebijakan } from './simulasi';
import { normalkanBenih } from './benih';

/**
 * Benih yang terlihat memberi satu janji kepada pemain: ketik benih yang sama,
 * dapatkan dunia yang sama. Sampai sekarang janji itu diuji per potongan —
 * dadu, pasar, bot, kartu kebiasaan masing-masing punya tes determinismenya —
 * tapi tidak pernah sebagai satu permainan utuh. Enam belas potongan yang
 * masing-masing deterministik tetap bisa jadi permainan yang tidak, kalau ada
 * satu saja sumber acak yang bocor di jahitannya.
 *
 * Yang diuji di sini permainan penuh sampai ratusan giliran, dengan bot hidup.
 */

const PROFESI = ['asn-3b', 'guru-honorer'];
const KEBIJAKAN: Kebijakan[] = ['hati-hati', 'serakah', 'pasar-saham'];

function mainkan(seed: string, profesiId: string, kebijakan: Kebijakan) {
  return jalankanSimulasi({
    seed,
    profesiId,
    kebijakan,
    maksGiliran: 200,
    // Bot dihidupkan. Justru dunia bot yang paling mudah bocor: ia berjalan
    // di samping pemain dan tidak terlihat di angka mana pun sampai ia
    // melampaui pemain.
    lanjutKeLuas: true,
  });
}

describe('benih sama, dunia sama — sebagai permainan utuh', () => {
  it('dua permainan dengan benih sama identik sampai giliran ke-200', () => {
    for (const profesiId of PROFESI) {
      for (const kebijakan of KEBIJAKAN) {
        const a = mainkan('kabut-rusa-lontar', profesiId, kebijakan);
        const b = mainkan('kabut-rusa-lontar', profesiId, kebijakan);
        expect(b, `${profesiId}/${kebijakan}`).toEqual(a);
      }
    }
  });

  /**
   * Penjaga tak-hampa. Kalau simulator kebetulan memberi hasil yang sama untuk
   * benih apa pun, tes di atas hijau tanpa membuktikan apa-apa — ia akan
   * mengukur bahwa dua nol sama besar.
   */
  it('benih berbeda memang memberi permainan berbeda', () => {
    const dasar = mainkan('kabut-rusa-lontar', 'asn-3b', 'serakah');
    let pernahBerbeda = 0;
    for (const lain of ['senja-merak-pandan', 'embun-anoa-sagu', 'fajar-nuri-matoa']) {
      if (JSON.stringify(mainkan(lain, 'asn-3b', 'serakah')) !== JSON.stringify(dasar)) {
        pernahBerbeda++;
      }
    }
    expect(pernahBerbeda).toBe(3);
  });

  it('titik berangkat identik, termasuk dunia bot', () => {
    for (const profesiId of PROFESI) {
      const a = stateAwal('kabut-rusa-lontar', profesiId);
      const b = stateAwal('kabut-rusa-lontar', profesiId);
      expect(b).toEqual(a);
      expect(a.bot.length).toBeGreaterThan(0);
    }
  });
});

describe('benih yang diketik ulang membuka dunia yang sama', () => {
  /**
   * Ini jalur yang sebenarnya ditempuh manusia: benih dibaca dari layar,
   * disalin ke sebuah pesan, lalu diketik lagi di ponsel lain — dengan huruf
   * besar, spasi, atau tanda hubung ganda yang tak sengaja.
   */
  it.each([
    'Kabut-Rusa-Lontar',
    'KABUT RUSA LONTAR',
    '  kabut  rusa  lontar  ',
    'kabut_rusa_lontar',
    'kabut, rusa, lontar',
  ])('%s memberi permainan yang sama persis', (diketik) => {
    const asli = mainkan('kabut-rusa-lontar', 'asn-3b', 'serakah');
    const ulang = mainkan(normalkanBenih(diketik), 'asn-3b', 'serakah');
    expect(ulang).toEqual(asli);
  });

  it('bukan karena benihnya diabaikan — teks yang beda arti tetap beda dunia', () => {
    // Kalau normalisasi terlalu rakus (misal membuang semua tanda hubung),
    // "kabut-rusa-lontar" dan "kabutrusalontar" jadi satu benih, dan tes di
    // atas hijau karena benih apa pun bertemu di tempat yang sama.
    const asli = mainkan('kabut-rusa-lontar', 'asn-3b', 'serakah');
    const gepeng = mainkan(normalkanBenih('kabutrusalontar'), 'asn-3b', 'serakah');
    expect(gepeng).not.toEqual(asli);
  });
});
