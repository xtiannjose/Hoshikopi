// Money is integer centavos everywhere (ADR 0002). Only this file formats it.

function assertCentavos(value: number): void {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`Not an integer number of centavos: ${value}`);
  }
}

function format(cents: number, alwaysCentavos: boolean): string {
  assertCentavos(cents);
  const abs = Math.abs(cents);
  const pesos = Math.trunc(abs / 100).toLocaleString("en-PH");
  const centavos = abs % 100;
  const fraction =
    alwaysCentavos || centavos ? `.${String(centavos).padStart(2, "0")}` : "";
  return `${cents < 0 ? "-" : ""}PHP ${pesos}${fraction}`;
}

/** Menu prices: 16500 -> "PHP 165", 16550 -> "PHP 165.50". */
export function formatPrice(cents: number): string {
  return format(cents, false);
}

/** A Price Delta on an Option chip: 3500 -> "+35"; free Options show nothing. */
export function formatDelta(cents: number): string {
  return cents === 0 ? "" : `+${format(cents, false).replace("PHP ", "")}`;
}

/** Receipts and totals: 16500 -> "PHP 165.00". */
export function formatReceipt(cents: number): string {
  return format(cents, true);
}

const PESOS = /^(?:php)?\s*(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d{1,2}))?$/i;

/** "185", "35.5" or "PHP 1,250.00" -> centavos; null if unclear or negative. */
export function parsePesos(input: string): number | null {
  const match = PESOS.exec(input.trim());
  if (!match) return null;
  const cents =
    Number(match[1].replaceAll(",", "")) * 100 +
    Number((match[2] ?? "").padEnd(2, "0"));
  return Number.isSafeInteger(cents) ? cents : null;
}

/** Sum of centavos. Throws on non-integers so float errors cannot enter. */
export function addMoney(...amounts: number[]): number {
  let total = 0;
  for (const amount of amounts) {
    assertCentavos(amount);
    total += amount;
  }
  assertCentavos(total);
  return total;
}

/** The VAT inside a VAT-inclusive total (12/112), rounded half up once. */
export function vatPart(totalCents: number): number {
  assertCentavos(totalCents);
  return Math.floor((totalCents * 12 + 56) / 112);
}
