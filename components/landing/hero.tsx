"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Play, Sparkles, Star, Users, BookOpen, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GradientOrb } from "@/components/brand/gradient-orb";
import { AnimatedCounter } from "@/components/brand/animated-counter";
import { useOrgConfig } from "@/hooks/useOrgConfig";

const float = {
  animate: {
    y: [0, -8, 0],
    transition: { duration: 6, repeat: Infinity, ease: "easeInOut" },
  },
};

export function Hero() {
  const { config } = useOrgConfig();
  const headline =
    config?.heroTitle ?? "Learn Smarter. Grow Faster.";
  const subheadline =
    config?.heroSubtitle ??
    "A premium learning experience built for ambitious students — live classes, adaptive tests, and a mentor-backed community, all in one beautiful app.";

  return (
    <section className="relative overflow-hidden pb-24 pt-16 sm:pt-24">
      <GradientOrb
        color="violet"
        size="xl"
        className="-top-40 left-1/2 -translate-x-1/2"
      />
      <GradientOrb
        color="sky"
        size="lg"
        className="-bottom-40 -right-20 opacity-40"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(hsl(var(--muted-foreground)/0.08)_1px,transparent_1px)] [background-size:24px_24px] mask-fade-b"
      />

      <div className="container relative">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-4xl text-center"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            AI-powered study plans • Daily streaks • Live mentors
          </div>
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl lg:text-[4rem] lg:leading-[1.05]">
            {headline.split(".").map((part, i, arr) =>
              part ? (
                <span key={i}>
                  {i === arr.length - 2 ? (
                    <span className="gradient-text">{part}.</span>
                  ) : (
                    <>{part}{i < arr.length - 1 ? "." : ""}</>
                  )}{" "}
                </span>
              ) : null
            )}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-balance text-base leading-relaxed text-muted-foreground sm:text-lg">
            {subheadline}
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild variant="gradient" size="xl" className="w-full sm:w-auto">
              <Link href="/sign-in">
                Start learning free <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="xl"
              className="w-full sm:w-auto"
            >
              <Link href="#how-it-works">
                <Play className="h-4 w-4 fill-current" />
                Watch demo
              </Link>
            </Button>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="flex -space-x-2">
                {[
                  "https://i.pravatar.cc/40?img=13",
                  "https://i.pravatar.cc/40?img=22",
                  "https://i.pravatar.cc/40?img=47",
                  "https://i.pravatar.cc/40?img=5",
                ].map((src) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={src}
                    src={src}
                    alt=""
                    className="h-7 w-7 rounded-full border-2 border-background object-cover"
                  />
                ))}
              </div>
              <span className="ml-2">
                <AnimatedCounter value={240000} />+ learners
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <Star
                  key={i}
                  className="h-4 w-4 fill-amber-400 text-amber-400"
                />
              ))}
              <span className="ml-1 font-medium text-foreground">4.9</span>
              <span>avg rating</span>
            </div>
          </div>
        </motion.div>

        {/* Preview mockup */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto mt-16 max-w-5xl"
        >
          <div className="glass-strong relative overflow-hidden rounded-3xl p-3 shadow-glow">
            <div className="rounded-2xl border border-border/40 bg-gradient-to-br from-background to-muted p-6 sm:p-10">
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <DemoStat
                  icon={BookOpen}
                  value={14}
                  label="Active courses"
                  sublabel="+2 this week"
                  tone="indigo"
                />
                <DemoStat
                  icon={Users}
                  value={8}
                  label="Live mentors"
                  sublabel="Available today"
                  tone="violet"
                />
                <DemoStat
                  icon={Trophy}
                  value={47}
                  label="Day streak"
                  sublabel="Keep it going!"
                  tone="emerald"
                />
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <ProgressPreview
                  title="JEE Advanced Physics"
                  progress={68}
                  tag="In progress"
                />
                <ProgressPreview
                  title="Organic Chemistry"
                  progress={32}
                  tag="Resume"
                />
              </div>
            </div>
          </div>

          <motion.div
            variants={float}
            animate="animate"
            className="absolute -left-10 -top-6 hidden sm:block"
          >
            <div className="glass rounded-2xl p-4 shadow-soft">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <span className="absolute inset-0 rounded-full bg-destructive animate-pulse-ring" />
                  <span className="relative block h-2.5 w-2.5 rounded-full bg-destructive" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-medium">Calc II — Live now</p>
                  <p className="text-[11px] text-muted-foreground">
                    324 watching
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={float}
            animate="animate"
            transition={{ delay: 0.2 }}
            className="absolute -right-6 -bottom-4 hidden sm:block"
          >
            <div className="glass rounded-2xl p-4 shadow-soft">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-success/15">
                  <Trophy className="h-4 w-4 text-success" />
                </div>
                <div>
                  <p className="text-xs font-semibold">+120 XP earned</p>
                  <p className="text-[11px] text-muted-foreground">
                    Quiz • 9/10 correct
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function DemoStat({
  icon: Icon,
  value,
  label,
  sublabel,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: number;
  label: string;
  sublabel: string;
  tone: "indigo" | "violet" | "emerald";
}) {
  const toneMap: Record<string, string> = {
    indigo: "from-indigo-500/15 to-indigo-500/5 text-indigo-500",
    violet: "from-violet-500/15 to-violet-500/5 text-violet-500",
    emerald: "from-emerald-500/15 to-emerald-500/5 text-emerald-500",
  };
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5">
      <div className="flex items-center justify-between">
        <div
          className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${toneMap[tone]}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="text-right">
          <div className="text-2xl font-semibold tracking-tight">
            <AnimatedCounter value={value} />
          </div>
          <div className="text-xs text-muted-foreground">{sublabel}</div>
        </div>
      </div>
      <p className="mt-3 text-sm font-medium text-muted-foreground">{label}</p>
    </div>
  );
}

function ProgressPreview({
  title,
  progress,
  tag,
}: {
  title: string;
  progress: number;
  tag: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">{title}</h4>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
          {tag}
        </span>
      </div>
      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-gradient-brand transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>{progress}% complete</span>
        <span>Resume lesson →</span>
      </div>
    </div>
  );
}
