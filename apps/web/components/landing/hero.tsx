"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Play, Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GradientOrb } from "@/components/brand/gradient-orb";
import { AnimatedCounter } from "@/components/brand/animated-counter";
import { useOrgConfig } from "@/hooks/useOrgConfig";
import { HeroMockup } from "./hero-mockup";

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

        <HeroMockup />
      </div>
    </section>
  );
}
