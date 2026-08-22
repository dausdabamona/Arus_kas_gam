import type { ArahNilai } from '../engine/kredit';

/**
 * Sumbu kedua §8.3, dikatakan apa adanya tanpa satu pun kata sifat untuk
 * keputusannya. "Nilai turun" adalah kenyataan; "hati-hati, nilainya turun"
 * adalah permainan yang menyimpulkan untuk pemain (Prinsip 4).
 */
export const ARAH_NILAI: Record<ArahNilai, string> = {
  tumbuh: 'Nilai naik',
  diam: 'Nilai nyaris diam',
  turun: 'Nilai turun',
};
