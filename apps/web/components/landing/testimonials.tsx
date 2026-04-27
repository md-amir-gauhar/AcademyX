"use client";

import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import { SectionHeading } from "@/components/brand/section-heading";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/lib/utils";
import { useOrgConfig } from "@/hooks/useOrgConfig";
import { FALLBACK_TESTIMONIALS } from "@/components/landing/data";

export function Testimonials() {
  const { config } = useOrgConfig();
  const items =
    config?.testimonials && config.testimonials.length > 0
      ? config.testimonials
      : FALLBACK_TESTIMONIALS;

  return (
    <section className="relative py-24">
      <div className="container">
        <SectionHeading
          eyebrow="Loved by learners"
          title={
            <>
              Real stories, <span className="gradient-text">real growth</span>
            </>
          }
          description="A growing community of focused students who showed up every day."
        />

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {items.slice(0, 3).map((t, i) => (
            <motion.figure
              key={t.name + i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10% 0px" }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="group relative flex h-full flex-col justify-between gap-6 rounded-3xl border border-border/60 bg-card p-6"
            >
              <Quote className="absolute right-6 top-6 h-6 w-6 text-primary/40" />
              <blockquote className="text-sm leading-relaxed text-foreground/90">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="flex items-center gap-3">
                <Avatar>
                  {t.avatarUrl && <AvatarImage src={t.avatarUrl} alt={t.name} />}
                  <AvatarFallback>{initials(t.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-sm font-semibold">{t.name}</div>
                  {t.role && (
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  )}
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}
