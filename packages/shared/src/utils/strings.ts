export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function truncate(input: string, max: number, suffix = "…"): string {
  if (input.length <= max) return input;
  return input.slice(0, Math.max(0, max - suffix.length)) + suffix;
}

/**
 * Return up to `max` uppercase initials from a full name. Safe for
 * null/undefined and whitespace-only input, falling back to the caller's
 * supplied fallback string (default: "").
 */
export function initials(
  name: string | null | undefined,
  max = 2,
  fallback = ""
): string {
  if (!name) return fallback;
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fallback;
  return parts
    .slice(0, max)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}
