const vnd = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });

/** Integer VND → "150.000 ₫" (Intl output, including its non-breaking space). */
export function formatVnd(n: number): string {
  return vnd.format(n);
}
