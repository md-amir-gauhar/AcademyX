"use client";

import { motion } from "framer-motion";
import { SectionHeading } from "@/components/brand/section-heading";
import { cn } from "@/lib/utils";
import { FEATURES } from "@/components/landing/data";
import { getToneClasses } from "@/lib/ui-helpers";

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
                  getToneClasses(f.tone).gradient
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
