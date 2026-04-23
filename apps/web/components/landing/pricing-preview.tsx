"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { SectionHeading } from "@/components/brand/section-heading";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PLANS = [
  {
    name: "Starter",
    price: "Free",
    tagline: "Explore the platform",
    features: [
      "3 free batches",
      "AI assistant — 10 questions / day",
      "Basic analytics",
      "Community access",
    ],
    cta: "Get started",
    highlight: false,
  },
  {
    name: "Pro",
    price: "₹2,499",
    period: "/ mo",
    tagline: "For serious aspirants",
    features: [
      "All batches + live classes",
      "Unlimited AI assistant",
      "Full test series + analytics",
      "Mentor Q&A priority",
      "Offline downloads",
    ],
    cta: "Start Pro",
    highlight: true,
  },
  {
    name: "Institute",
    price: "Custom",
    tagline: "For schools & coaching",
    features: [
      "Unlimited seats",
      "Custom branding & domain",
      "Admin & analytics dashboard",
      "Priority support",
      "Bulk licensing",
    ],
    cta: "Talk to sales",
    highlight: false,
  },
];

export function PricingPreview() {
  return (
    <section id="pricing" className="relative py-24">
      <div className="container">
        <SectionHeading
          eyebrow="Pricing"
          title={
            <>
              Simple plans. <span className="gradient-text">Serious results.</span>
            </>
          }
          description="Start free, upgrade only when you're ready. Cancel any time."
        />

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              className={cn(
                "relative flex flex-col rounded-3xl border bg-card p-7 transition-all",
                plan.highlight
                  ? "border-primary/40 shadow-glow md:-mt-4 md:mb-4"
                  : "border-border/60 hover:-translate-y-1 hover:shadow-soft"
              )}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-gradient-brand px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">
                  <Sparkles className="h-3 w-3" />
                  Most popular
                </span>
              )}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {plan.tagline}
                  </p>
                </div>
              </div>
              <div className="mt-6 flex items-baseline gap-1">
                <span
                  className={cn(
                    "text-4xl font-semibold tracking-tight",
                    plan.highlight && "gradient-text"
                  )}
                >
                  {plan.price}
                </span>
                {plan.period && (
                  <span className="text-sm text-muted-foreground">
                    {plan.period}
                  </span>
                )}
              </div>
              <ul className="mt-6 flex-1 space-y-3 text-sm">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <span className="mt-0.5 grid h-5 w-5 place-items-center rounded-full bg-success/15 text-success">
                      <Check className="h-3 w-3" />
                    </span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                asChild
                className="mt-8 w-full"
                variant={plan.highlight ? "gradient" : "outline"}
                size="lg"
              >
                <Link href="/sign-in">{plan.cta}</Link>
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
