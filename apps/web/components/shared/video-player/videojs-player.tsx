"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VideoType } from "@/lib/video";
import {
  readVideoPrefs,
  writeVolume,
  writeRate,
  writeMuted,
} from "@/lib/video-prefs";
import "video.js/dist/video-js.css";
import "./videojs-skin.css";

/* ─── Minimal video.js typings ───────────────────────────────────────────
 * Wide enough for what we use; we cast at the boundary in setup().
 */

interface VjsRepresentation {
  id: string;
  bandwidth?: number;
  width?: number;
  height?: number;
  enabled: (state?: boolean) => boolean;
}

interface VjsControlBar {
  addChild: (
    name: string,
    options?: Record<string, unknown>,
    index?: number,
  ) => unknown;
  children: () => Array<{ name: () => string }>;
}

interface VjsTech {
  vhs?: { representations?: () => VjsRepresentation[] };
}

interface VideoJsPlayer {
  dispose: () => void;
  src: (source: { src: string; type: string }) => void;
  on: (event: string, handler: () => void) => void;
  off: (event: string, handler: () => void) => void;
  ready: (cb: () => void) => void;
  duration: () => number;
  currentTime: (seconds?: number) => number;
  buffered: () => { length: number; end: (i: number) => number };
  paused: () => boolean;
  play: () => Promise<void> | undefined;
  pause: () => void;
  muted: (state?: boolean) => boolean;
  volume: (level?: number) => number;
  playbackRate: (rate?: number) => number;
  isFullscreen: () => boolean;
  requestFullscreen: () => Promise<void> | undefined;
  exitFullscreen: () => Promise<void> | undefined;
  el: () => HTMLElement;
  controlBar: VjsControlBar;
  tech_: (opts: { IWillNotUseThisInPlugins: true }) => VjsTech;
  options_: Record<string, unknown>;
}

type VjsComponentCtor = new (
  player: VideoJsPlayer,
  options: Record<string, unknown>,
) => unknown;

interface VideoJsApi {
  (el: Element, options?: Record<string, unknown>): VideoJsPlayer;
  getComponent: (name: string) => VjsComponentCtor;
  registerComponent: (name: string, comp: VjsComponentCtor) => void;
}

type VideoJsModule = { default: VideoJsApi };

/* ─── Quality selector component (registered once) ───────────────────────
 * Subclasses video.js's MenuButton + MenuItem to add a settings-style menu
 * to the control bar. Items are rebuilt from VHS `representations()` after
 * `loadedmetadata` fires.
 */

const QUALITY_BUTTON_NAME = "AcademyxQualityMenuButton";
let qualityRegistered = false;

interface QualityRendition {
  id: string;
  label: string;
  height?: number;
  bandwidth?: number;
}

interface VjsMenuItemInstance {
  selected(state: boolean): void;
  handleClick(): void;
  options_: Record<string, unknown>;
}

interface VjsMenuButtonInstance {
  addClass(name: string): void;
  controlText(text: string): void;
  update(): void;
  createItems(): unknown[];
  options_: Record<string, unknown>;
  player_: VideoJsPlayer;
}

interface VjsMenuItemCtor {
  new (
    player: VideoJsPlayer,
    options: Record<string, unknown>,
  ): VjsMenuItemInstance;
}

interface VjsMenuButtonCtor {
  new (
    player: VideoJsPlayer,
    options: Record<string, unknown>,
  ): VjsMenuButtonInstance;
}

function registerQualityComponent(videojs: VideoJsApi) {
  if (qualityRegistered) return;

  const MenuButton = videojs.getComponent(
    "MenuButton",
  ) as unknown as VjsMenuButtonCtor;
  const MenuItem = videojs.getComponent(
    "MenuItem",
  ) as unknown as VjsMenuItemCtor;

  class QualityMenuItem extends MenuItem {
    constructor(
      player: VideoJsPlayer,
      options: Record<string, unknown> & {
        rendition: QualityRendition | null;
        label: string;
        onSelect: (rendition: QualityRendition | null) => void;
        isSelected: () => boolean;
      },
    ) {
      super(player, { ...options, label: options.label, selectable: true });
      this.selected(options.isSelected());
    }

    override handleClick() {
      const opts = this.options_ as {
        rendition: QualityRendition | null;
        onSelect: (rendition: QualityRendition | null) => void;
      };
      opts.onSelect(opts.rendition);
    }
  }

  class QualityMenuButton extends MenuButton {
    constructor(
      player: VideoJsPlayer,
      options: Record<string, unknown> & {
        getRenditions: () => QualityRendition[];
        getCurrentId: () => string | null;
        onSelect: (rendition: QualityRendition | null) => void;
      },
    ) {
      super(player, options);
      this.addClass("vjs-academyx-quality-button");
      this.controlText("Quality");
    }

    override createItems() {
      const opts = this.options_ as {
        getRenditions: () => QualityRendition[];
        getCurrentId: () => string | null;
        onSelect: (rendition: QualityRendition | null) => void;
      };
      const player = this.player_;
      if (!player) return [];

      const renditions = opts.getRenditions();
      const currentId = opts.getCurrentId();

      const items: unknown[] = [];

      items.push(
        new QualityMenuItem(player, {
          rendition: null,
          label: "Auto",
          onSelect: opts.onSelect,
          isSelected: () => currentId === null,
        }),
      );

      for (const r of renditions) {
        items.push(
          new QualityMenuItem(player, {
            rendition: r,
            label: r.label,
            onSelect: opts.onSelect,
            isSelected: () => currentId === r.id,
          }),
        );
      }

      return items;
    }
  }

  videojs.registerComponent(
    "AcademyxQualityMenuItem",
    QualityMenuItem as unknown as VjsComponentCtor,
  );
  videojs.registerComponent(
    QUALITY_BUTTON_NAME,
    QualityMenuButton as unknown as VjsComponentCtor,
  );
  qualityRegistered = true;
}

/* ─── Component ───────────────────────────────────────────────────────── */

const SOURCE_TYPE: Record<"HLS" | "MP4", string> = {
  HLS: "application/x-mpegURL",
  MP4: "video/mp4",
};

interface VideoJsPlayerProps {
  url: string;
  videoType: Extract<VideoType, "HLS" | "MP4">;
  thumbnail?: string | null;
  autoPlay?: boolean;
  className?: string;
  onReady?: () => void;
  onProgress?: (state: {
    played: number;
    playedSeconds: number;
    loaded: number;
  }) => void;
  onDuration?: (duration: number) => void;
  onEnded?: () => void;
  onError?: () => void;
}

export function VideoJsPlayer({
  url,
  videoType,
  thumbnail,
  autoPlay = false,
  className,
  onReady,
  onProgress,
  onDuration,
  onEnded,
  onError,
}: VideoJsPlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<VideoJsPlayer | null>(null);
  const currentQualityIdRef = useRef<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);

  const onReadyRef = useRef(onReady);
  const onProgressRef = useRef(onProgress);
  const onDurationRef = useRef(onDuration);
  const onEndedRef = useRef(onEnded);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onReadyRef.current = onReady;
    onProgressRef.current = onProgress;
    onDurationRef.current = onDuration;
    onEndedRef.current = onEnded;
    onErrorRef.current = onError;
  }, [onReady, onProgress, onDuration, onEnded, onError]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    let player: VideoJsPlayer | null = null;
    let removeKeyHandler: (() => void) | null = null;

    const setup = async () => {
      const videoEl = document.createElement("video-js");
      videoEl.setAttribute(
        "class",
        "video-js vjs-fluid vjs-academyx vjs-big-play-centered",
      );
      videoEl.setAttribute("playsinline", "");
      videoEl.setAttribute("tabindex", "-1");
      if (autoPlay) videoEl.setAttribute("autoplay", "");
      if (thumbnail) videoEl.setAttribute("poster", thumbnail);
      container.innerHTML = "";
      container.appendChild(videoEl);

      const mod = (await import("video.js")) as unknown as VideoJsModule;
      if (cancelled) return;
      const videojs = mod.default;

      registerQualityComponent(videojs);

      player = videojs(videoEl, {
        controls: true,
        autoplay: autoPlay,
        preload: "auto",
        responsive: true,
        fluid: true,
        playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2],
        controlBar: {
          remainingTimeDisplay: { displayNegative: false },
        },
        html5: {
          vhs: {
            overrideNative: true,
            enableLowInitialPlaylist: true,
            limitRenditionByPlayerDimensions: true,
            useDevicePixelRatio: true,
          },
        },
      });

      player.src({ src: url, type: SOURCE_TYPE[videoType] });
      playerRef.current = player;

      // ── Restore preferences ─────────────────────────────────────
      const prefs = readVideoPrefs();
      if (prefs.volume != null) player.volume(prefs.volume);
      if (prefs.muted != null) player.muted(prefs.muted);
      if (prefs.playbackRate != null) player.playbackRate(prefs.playbackRate);

      const handleVolumeChange = () => {
        if (!player) return;
        writeVolume(player.volume());
        writeMuted(player.muted());
      };
      const handleRateChange = () => {
        if (!player) return;
        writeRate(player.playbackRate());
      };

      player.on("volumechange", handleVolumeChange);
      player.on("ratechange", handleRateChange);

      // ── Quality selector ────────────────────────────────────────
      const collectRenditions = (): QualityRendition[] => {
        try {
          const tech = player?.tech_({ IWillNotUseThisInPlugins: true });
          const reps = tech?.vhs?.representations?.() ?? [];
          return reps
            .map((r) => ({
              id: r.id,
              height: r.height,
              bandwidth: r.bandwidth,
              label: r.height
                ? `${r.height}p${
                    r.bandwidth ? ` · ${Math.round(r.bandwidth / 1000)}k` : ""
                  }`
                : `${Math.round((r.bandwidth ?? 0) / 1000)}k`,
            }))
            .sort((a, b) => (b.height ?? 0) - (a.height ?? 0));
        } catch {
          return [];
        }
      };

      const setQuality = (rendition: QualityRendition | null) => {
        const tech = player?.tech_({ IWillNotUseThisInPlugins: true });
        const reps = tech?.vhs?.representations?.() ?? [];
        if (!rendition) {
          for (const r of reps) r.enabled(true);
          currentQualityIdRef.current = null;
        } else {
          for (const r of reps) r.enabled(r.id === rendition.id);
          currentQualityIdRef.current = rendition.id;
        }
        // Force the menu to re-render with the new selection state.
        const btn = (
          player as unknown as {
            getChild: (name: string) => { update: () => void } | undefined;
            controlBar: { getChild: (name: string) => { update: () => void } | undefined };
          }
        )?.controlBar?.getChild?.(QUALITY_BUTTON_NAME);
        btn?.update?.();
      };

      const handleLoadedMetadata = () => {
        if (!player) return;
        const duration = player.duration();
        if (duration > 0) onDurationRef.current?.(duration);

        const renditions = collectRenditions();
        if (renditions.length === 0) return;

        // Remove any prior instance first (handles src swaps).
        const cb = player.controlBar as unknown as {
          getChild: (name: string) => unknown;
          removeChild: (child: unknown) => void;
        };
        const existing = cb.getChild?.(QUALITY_BUTTON_NAME);
        if (existing) cb.removeChild(existing);

        const children = player.controlBar.children();
        const fsIndex = children.findIndex(
          (c) => c.name() === "FullscreenToggle",
        );
        const insertAt = fsIndex >= 0 ? fsIndex : children.length;

        player.controlBar.addChild(
          QUALITY_BUTTON_NAME,
          {
            getRenditions: collectRenditions,
            getCurrentId: () => currentQualityIdRef.current,
            onSelect: setQuality,
          },
          insertAt,
        );
      };

      player.on("loadedmetadata", handleLoadedMetadata);

      // ── Standard playback events ────────────────────────────────
      player.ready(() => {
        if (cancelled) return;
        setIsReady(true);
        onReadyRef.current?.();
      });

      player.on("timeupdate", () => {
        if (!player) return;
        const duration = player.duration();
        const current = player.currentTime();
        const buffered = player.buffered();
        const loadedEnd =
          buffered.length > 0 ? buffered.end(buffered.length - 1) : 0;
        if (duration > 0) {
          onProgressRef.current?.({
            played: current / duration,
            playedSeconds: current,
            loaded: loadedEnd / duration,
          });
        }
      });

      player.on("ended", () => onEndedRef.current?.());

      player.on("error", () => {
        setHasError(true);
        onErrorRef.current?.();
      });

      // ── Keyboard shortcuts ──────────────────────────────────────
      const isTypingTarget = (target: EventTarget | null) => {
        if (!(target instanceof HTMLElement)) return false;
        const tag = target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT")
          return true;
        if (target.isContentEditable) return true;
        return false;
      };

      const handleKey = (e: KeyboardEvent) => {
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        if (isTypingTarget(e.target)) return;
        const p = playerRef.current;
        if (!p) return;

        const seek = (delta: number) => {
          const t = p.currentTime();
          const d = p.duration();
          const next = Math.max(0, Math.min(d || Infinity, t + delta));
          p.currentTime(next);
        };

        switch (e.key) {
          case " ":
          case "k":
          case "K":
            e.preventDefault();
            if (p.paused()) p.play();
            else p.pause();
            break;
          case "j":
          case "J":
            e.preventDefault();
            seek(-10);
            break;
          case "l":
          case "L":
            e.preventDefault();
            seek(10);
            break;
          case "ArrowLeft":
            e.preventDefault();
            seek(-5);
            break;
          case "ArrowRight":
            e.preventDefault();
            seek(5);
            break;
          case "m":
          case "M":
            e.preventDefault();
            p.muted(!p.muted());
            break;
          case "f":
          case "F":
            e.preventDefault();
            if (p.isFullscreen()) p.exitFullscreen();
            else p.requestFullscreen();
            break;
        }
      };

      window.addEventListener("keydown", handleKey);
      removeKeyHandler = () =>
        window.removeEventListener("keydown", handleKey);
    };

    setup();

    return () => {
      cancelled = true;
      removeKeyHandler?.();
      try {
        playerRef.current?.dispose();
      } catch {
        // ignore disposal errors during fast remounts
      }
      playerRef.current = null;
      container.innerHTML = "";
    };
  }, [url, videoType, autoPlay, thumbnail]);

  if (hasError) {
    return (
      <div
        className={cn(
          "relative aspect-video w-full overflow-hidden rounded-2xl bg-black/95",
          className,
        )}
      >
        <div className="flex h-full flex-col items-center justify-center gap-3 text-white/70">
          <p className="text-sm">Failed to load video</p>
          <button
            onClick={() => {
              setHasError(false);
              setIsReady(false);
            }}
            className="rounded-full bg-white/10 px-4 py-1.5 text-xs font-medium text-white hover:bg-white/20 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative aspect-video w-full overflow-hidden rounded-2xl bg-black",
        className,
      )}
    >
      {!isReady && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-white/50" />
            <p className="text-xs text-white/40">Loading video...</p>
          </div>
        </div>
      )}
      <div
        ref={containerRef}
        data-vjs-player
        className="absolute inset-0 h-full w-full"
      />
    </div>
  );
}
