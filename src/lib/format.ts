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
