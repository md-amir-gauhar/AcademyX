"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GradientOrb } from "@/components/brand/gradient-orb";

export function FinalCTA() {
  return (
    <section className="relative py-20">
      <div className="container">
        <div className="relative overflow-hidden rounded-[2rem] border border-border/60 bg-card px-6 py-16 text-center sm:px-16 sm:py-20">
          <GradientOrb
            color="indigo"
            size="xl"
            className="left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-60"
          />
          <div className="relative">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Join 240,000+ learners already on board
              </span>
              <h2 className="mx-auto mt-6 max-w-2xl text-balance text-3xl font-semibold tracking-tight sm:text-5xl">
                Ready to <span className="gradient-text">level up</span> your learning?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-balance text-base text-muted-foreground sm:text-lg">
                Start free today. Your first lesson, live class and AI mentor are waiting.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button asChild variant="gradient" size="xl">
                  <Link href="/sign-in">
                    Start free now <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="xl">
                  <Link href="#pricing">Compare plans</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
