/**
 * Tiny localStorage-backed store for the video player's "sticky" preferences.
 * Same shape on every read so callers don't have to null-check fields.
 */

const VOLUME_KEY = "academyx.video.volume";
const RATE_KEY = "academyx.video.rate";
const MUTED_KEY = "academyx.video.muted";

const ALLOWED_RATES = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] as const;

export interface VideoPrefs {
  volume: number | null;
  playbackRate: number | null;
  muted: boolean | null;
}

function readNumber(key: string, lo: number, hi: number): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw == null) return null;
    const n = Number(raw);
    if (!Number.isFinite(n) || n < lo || n > hi) return null;
    return n;
  } catch {
    return null;
  }
}

export function readVideoPrefs(): VideoPrefs {
  if (typeof window === "undefined") {
    return { volume: null, playbackRate: null, muted: null };
  }
  const rawRate = readNumber(RATE_KEY, 0.25, 4);
  const playbackRate =
    rawRate != null && (ALLOWED_RATES as readonly number[]).includes(rawRate)
      ? rawRate
      : null;
  const volume = readNumber(VOLUME_KEY, 0, 1);
  let muted: boolean | null = null;
  try {
    const raw = window.localStorage.getItem(MUTED_KEY);
    if (raw === "true") muted = true;
    else if (raw === "false") muted = false;
  } catch {
    /* ignore */
  }
  return { volume, playbackRate, muted };
}

function safeWrite(key: string, value: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* ignore quota / privacy errors */
  }
}

export function writeVolume(v: number) {
  safeWrite(VOLUME_KEY, String(Math.max(0, Math.min(1, v))));
}

export function writeRate(r: number) {
  safeWrite(RATE_KEY, String(r));
}

export function writeMuted(m: boolean) {
  safeWrite(MUTED_KEY, m ? "true" : "false");
}
