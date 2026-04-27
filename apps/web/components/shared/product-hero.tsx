"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { GradientOrb } from "@/components/brand/gradient-orb";

interface ProductHeroProps {
  title: string;
  description?: React.ReactNode;
  badges?: React.ReactNode;
  teacher?: React.ReactNode;
  priceBlock?: React.ReactNode;
  features?: { icon: React.ReactNode; label: string }[];
  children?: React.ReactNode;
}

export function ProductHero({
  title,
  description,
  badges,
  teacher,
  priceBlock,
  features,
  children,
}: ProductHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-brand p-6 text-white shadow-glow sm:p-10">
      <GradientOrb
        color="violet"
        size="xl"
        className="-top-20 -right-20 opacity-60"
      />
      <GradientOrb
        color="sky"
        size="lg"
        className="-bottom-20 -left-20 opacity-40"
      />
      <div className="relative grid gap-8 lg:grid-cols-[2fr_1fr] lg:items-center">
        <div className="space-y-5">
          {badges && (
            <div className="flex flex-wrap items-center gap-2">{badges}</div>
          )}
          <h1 className="text-balance text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            {title}
          </h1>
          {description}
          {teacher}
        </div>

        {(priceBlock || features) && (
          <Card className="bg-background/95 text-foreground shadow-soft backdrop-blur">
            <div className="space-y-5 p-6">
              {priceBlock}
              {features && features.length > 0 && (
                <ul className="space-y-2 text-sm">
                  {features.map((f, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-2 text-muted-foreground"
                    >
                      {f.icon}
                      {f.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>
        )}
      </div>
      {children}
    </section>
  );
}
