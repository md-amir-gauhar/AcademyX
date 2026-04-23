export function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}

export interface PageWindow {
  offset: number;
  limit: number;
}

/**
 * Normalize pagination inputs into a safe offset/limit window.
 * Defaults: page=1, limit=20. Caller provides the upper bound for limit.
 */
export function toPageWindow(
  page: number | undefined,
  limit: number | undefined,
  maxLimit = 100
): PageWindow {
  const p = Math.max(1, Math.floor(page ?? 1));
  const l = clamp(Math.floor(limit ?? 20), 1, maxLimit);
  return { offset: (p - 1) * l, limit: l };
}

export function formatInteger(n: number, locale = "en-IN"): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(n);
}

/**
 * Locale-aware number formatting with no forced fraction-digit handling
 * (contrast with `formatInteger`, which strips decimals).
 */
export function formatNumber(value: number, locale = "en-IN"): string {
  return new Intl.NumberFormat(locale).format(value);
}
