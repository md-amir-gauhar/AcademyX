export type VideoType = "YOUTUBE" | "HLS" | "MP4";

export function detectVideoType(url: string): VideoType {
  if (/youtube\.com|youtu\.be/i.test(url)) return "YOUTUBE";
  if (/\.m3u8/i.test(url)) return "HLS";
  return "MP4";
}
