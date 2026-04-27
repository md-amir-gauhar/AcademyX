export type Tone =
  | "indigo"
  | "violet"
  | "sky"
  | "emerald"
  | "amber"
  | "rose"
  | "teal";

const TONE_MAP: Record<
  Tone,
  { gradient: string; bg: string; text: string; border: string }
> = {
  indigo: {
    gradient: "from-indigo-500/15 to-indigo-500/5 text-indigo-500",
    bg: "bg-indigo-500/10",
    text: "text-indigo-500",
    border: "border-indigo-500/30",
  },
  violet: {
    gradient: "from-violet-500/15 to-violet-500/5 text-violet-500",
    bg: "bg-violet-500/10",
    text: "text-violet-500",
    border: "border-violet-500/30",
  },
  sky: {
    gradient: "from-sky-500/15 to-sky-500/5 text-sky-500",
    bg: "bg-sky-500/10",
    text: "text-sky-500",
    border: "border-sky-500/30",
  },
  emerald: {
    gradient: "from-emerald-500/15 to-emerald-500/5 text-emerald-500",
    bg: "bg-emerald-500/10",
    text: "text-emerald-500",
    border: "border-emerald-500/30",
  },
  amber: {
    gradient: "from-amber-500/15 to-amber-500/5 text-amber-600",
    bg: "bg-amber-500/10",
    text: "text-amber-600",
    border: "border-amber-500/30",
  },
  rose: {
    gradient: "from-rose-500/15 to-rose-500/5 text-rose-500",
    bg: "bg-rose-500/10",
    text: "text-rose-500",
    border: "border-rose-500/30",
  },
  teal: {
    gradient: "from-teal-500/15 to-teal-500/5 text-teal-500",
    bg: "bg-teal-500/10",
    text: "text-teal-500",
    border: "border-teal-500/30",
  },
};

export function getToneClasses(tone: Tone | string) {
  return TONE_MAP[tone as Tone] ?? TONE_MAP.indigo;
}

export function isActivePath(pathname: string, href: string) {
  return pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
}
