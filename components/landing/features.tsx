"use client";

import { motion } from "framer-motion";
import {
  BookOpen,
  Brain,
  Flame,
  MessageSquare,
  PlayCircle,
  Trophy,
  Video,
  Zap,
} from "lucide-react";
import { SectionHeading } from "@/components/brand/section-heading";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: PlayCircle,
    title: "Adaptive video lessons",
    description:
      "Pick up exactly where you left off — with speed control, bookmarks, and auto-generated transcripts.",
    tone: "indigo",
    span: "sm:col-span-2",
  },
  {
    icon: Brain,
    title: "AI study assistant",
    description: "Ask any doubt, get explained answers and practice sets.",
    tone: "violet",
  },
  {
    icon: Video,
    title: "Live mentor classes",
    description: "Scheduled sessions with top educators, replayable anytime.",
    tone: "sky",
  },
  {
    icon: Trophy,
    title: "Quizzes & tests",
    description:
      "Timed exams, instant analytics, a beautiful question palette and result breakdown.",
    tone: "emerald",
    span: "sm:col-span-2",
  },
  {
    icon: Flame,
    title: "Streaks & XP",
    description: "Daily goals, leaderboards and badges keep your motivation up.",
    tone: "amber",
  },
  {
    icon: MessageSquare,
    title: "Community",
    description: "Discussion threads, study groups and peer reactions.",
    tone: "rose",
  },
  {
    icon: BookOpen,
    title: "Practice zone",
    description: "Flashcards, drag-drop drills and a coding playground.",
    tone: "indigo",
  },
  {
    icon: Zap,
    title: "Offline & mobile",
    description: "Download lectures, review on the go — stays perfectly in sync.",
    tone: "sky",
  },
];

const toneBg: Record<string, string> = {
  indigo: "from-indigo-500/15 to-indigo-500/5 text-indigo-500",
  violet: "from-violet-500/15 to-violet-500/5 text-violet-500",
  sky: "from-sky-500/15 to-sky-500/5 text-sky-500",
  emerald: "from-emerald-500/15 to-emerald-500/5 text-emerald-500",
  amber: "from-amber-500/15 to-amber-500/5 text-amber-600",
  rose: "from-rose-500/15 to-rose-500/5 text-rose-500",
};

export function Features() {
  return (
    <section id="features" className="relative py-24">
      <div className="container">
        <SectionHeading
          eyebrow="Everything you need"
          title={
            <>
              One platform, <span className="gradient-text">every habit</span> of
              a great learner
            </>
          }
          description="From structured courses to live mentors and gamified practice — built so your focus stays on learning, not logistics."
        />

        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10% 0px" }}
              transition={{ delay: i * 0.05, duration: 0.5 }}
              className={cn(
                "group relative overflow-hidden rounded-3xl border border-border/60 bg-card p-6 transition-all hover:-translate-y-1 hover:shadow-glow",
                f.span
              )}
            >
              <div
                className={cn(
                  "inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br",
                  toneBg[f.tone]
                )}
              >
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-lg font-semibold tracking-tight">
                {f.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {f.description}
              </p>
              <div
                aria-hidden
                className="pointer-events-none absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-gradient-brand opacity-0 blur-3xl transition-opacity group-hover:opacity-20"
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
