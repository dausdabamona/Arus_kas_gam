const FORMAT_RUPIAH = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

/**
 * Rupiah ditulis penuh tanpa singkatan "jt" atau "rb".
 * Panjang angkanya adalah bagian dari rasa — jangan dipendekkan.
 */
export function rupiah(nilai: number): string {
  return FORMAT_RUPIAH.format(nilai);
}

const FORMAT_TAHUN = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 });

/**
 * Angka tahun dengan koma desimal, bukan titik. Di layar yang sama "Rp
 * 3.400.000" memakai titik sebagai pemisah ribuan; "3.2 th" di sebelahnya
 * terbaca seperti angka ribuan yang cacat, bukan seperti tiga koma dua.
 */
export function tahun(nilai: number): string {
  return FORMAT_TAHUN.format(nilai);
}
