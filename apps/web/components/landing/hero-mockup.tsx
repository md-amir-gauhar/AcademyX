"use client";

import { motion } from "framer-motion";
import { BookOpen, Trophy, Users } from "lucide-react";
import { AnimatedCounter } from "@/components/brand/animated-counter";
import { getToneClasses } from "@/lib/ui-helpers";

const float = {
  animate: {
    y: [0, -8, 0],
    transition: { duration: 6, repeat: Infinity, ease: "easeInOut" },
  },
};

export function HeroMockup() {
  return (
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
              <p className="text-[11px] text-muted-foreground">324 watching</p>
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
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5">
      <div className="flex items-center justify-between">
        <div
          className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${getToneClasses(tone).gradient}`}
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
