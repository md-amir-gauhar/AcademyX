import { randomBytes } from "crypto";

/**
 * Generate a URL-friendly slug from a human name plus a short random hex suffix
 * for global uniqueness. Examples:
 *
 *   "JEE 2026 Dropper Batch"        -> "jee-2026-dropper-batch-a3f2c4"
 *   "JEE Main Mock Test #1"         -> "jee-main-mock-test-1-9e0d11"
 *   "  Très spéciale!  "            -> "tres-speciale-7b22ae"
 *   ""                              -> "item-c19df0"
 *
 * The random suffix is 6 hex chars (3 bytes ≈ 16M values), enough to avoid
 * collisions for any realistic write rate. We accept the tiny chance of
 * collision by surfacing the unique-constraint error from Postgres if it ever
 * happens — callers that want to be paranoid can retry.
 */
export function generateSlug(name: string): string {
  const base = (name ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
  const safe = base || "item";
  const suffix = randomBytes(3).toString("hex");
  return `${safe}-${suffix}`;
}
