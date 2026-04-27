export type VideoType = "YOUTUBE" | "YOUTUBE_LIVE" | "HLS" | "MP4";

/**
 * Match a few canonical YouTube URL shapes:
 *   - youtu.be/<id>
 *   - youtube.com/watch?v=<id>
 *   - youtube.com/embed/<id>
 *   - youtube.com/live/<id>          (live stream)
 *   - youtube.com/shorts/<id>
 *
 * `live` is captured as group 1 when the URL hits the /live/ form so we can
 * differentiate a live broadcast embed for any UI affordances.
 */
const YT_PATTERNS: ReadonlyArray<{ re: RegExp; live?: boolean }> = [
  { re: /youtu\.be\/([\w-]{6,})/i },
  { re: /youtube\.com\/watch\?[^#]*?\bv=([\w-]{6,})/i },
  { re: /youtube\.com\/embed\/([\w-]{6,})/i },
  { re: /youtube\.com\/shorts\/([\w-]{6,})/i },
  { re: /youtube\.com\/live\/([\w-]{6,})/i, live: true },
];

export interface YouTubeMatch {
  videoId: string;
  isLive: boolean;
}

export function parseYouTube(url: string): YouTubeMatch | null {
  for (const { re, live } of YT_PATTERNS) {
    const m = url.match(re);
    if (m && m[1]) {
      return { videoId: m[1], isLive: Boolean(live) };
    }
  }
  return null;
}

export function detectVideoType(url: string): VideoType {
  const yt = parseYouTube(url);
  if (yt) return yt.isLive ? "YOUTUBE_LIVE" : "YOUTUBE";
  if (/\.m3u8(\?|$)/i.test(url)) return "HLS";
  return "MP4";
}

export interface YouTubeEmbedOptions {
  autoplay?: boolean;
  mute?: boolean;
  controls?: boolean;
  loop?: boolean;
  start?: number;
  origin?: string;
}

/**
 * Build a YouTube embed URL with the params we use across the app.
 * `enablejsapi=1` is set unconditionally so the IFrame API can drive the
 * player from JS for events (ready / playing / ended).
 */
export function getYouTubeEmbedUrl(
  videoId: string,
  options: YouTubeEmbedOptions = {},
): string {
  const params = new URLSearchParams();
  params.set("enablejsapi", "1");
  params.set("modestbranding", "1");
  params.set("rel", "0");
  params.set("playsinline", "1");
  params.set("iv_load_policy", "3");
  params.set("cc_load_policy", "0");
  if (options.autoplay) params.set("autoplay", "1");
  if (options.mute) params.set("mute", "1");
  if (options.controls === false) params.set("controls", "0");
  if (options.loop) {
    params.set("loop", "1");
    params.set("playlist", videoId);
  }
  if (options.start) params.set("start", String(options.start));
  if (options.origin) params.set("origin", options.origin);
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}
