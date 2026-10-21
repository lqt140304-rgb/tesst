/** Weight: decimal comma, at most one decimal, no-break space before the unit so "kg" never wraps alone ("4,2 kg"). */
export function formatKg(n: number): string {
  const rounded = Math.round(n * 10) / 10;
  return `${String(rounded).replace('.', ',')}\u00A0kg`;
}

/** Invoice line quantity: whole numbers plainly, fractions with a decimal comma ("0,1", "2,2"). */
export function formatQty(n: number): string {
  return String(Math.round(n * 100) / 100).replace('.', ',');
}
