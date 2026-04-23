"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Clock, FileText, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PriceBlock } from "@/components/shared/price-block";
import { HtmlContent } from "@/components/shared/html-content";
import { cn, hashToIndex } from "@/lib/utils";
import type { TestSeries } from "@/types/test";

const CARD_GRADIENTS = [
  "from-indigo-500 via-violet-500 to-fuchsia-500",
  "from-sky-500 via-indigo-500 to-violet-500",
  "from-emerald-500 via-teal-500 to-sky-500",
  "from-amber-500 via-rose-500 to-fuchsia-500",
  "from-violet-500 via-fuchsia-500 to-pink-500",
  "from-cyan-500 via-sky-500 to-indigo-500",
];

interface TestSeriesCardProps {
  series: TestSeries;
  href?: string;
  className?: string;
}

export function TestSeriesCard({ series, href, className }: TestSeriesCardProps) {
  const link = href ?? `/tests/${series.slug}`;
  const isFree = series.isFree || series.discountedPrice === 0;
  const gradient =
    CARD_GRADIENTS[hashToIndex(series.id || series.slug || series.title, CARD_GRADIENTS.length)];

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-5% 0px" }}
      transition={{ duration: 0.4 }}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-3xl border border-border/60 bg-card shadow-soft transition-all duration-300",
        "hover:-translate-y-1 hover:border-primary/30 hover:shadow-glow",
        className
      )}
    >
      <Link href={link} className="relative block" aria-label={series.title}>
        <div className="relative aspect-[16/9] overflow-hidden">
          {series.thumbnailUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={series.thumbnailUrl}
                alt=""
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
            </>
          ) : (
            <Placeholder gradient={gradient} />
          )}

          <span className="pointer-events-none absolute right-3 top-3 grid h-9 w-9 translate-y-1 place-items-center rounded-full bg-background/90 text-foreground opacity-0 shadow-soft backdrop-blur transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <ArrowUpRight className="h-4 w-4" />
          </span>

          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            {series.exam && (
              <Badge className="border-transparent bg-background/90 text-foreground backdrop-blur">
                {series.exam}
              </Badge>
            )}
            {isFree && <Badge variant="success">Free</Badge>}
            {(series.isEnrolled || series.isPurchased) && (
              <Badge variant="success" className="shadow-soft">Enrolled</Badge>
            )}
          </div>
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-3.5 p-5">
        <div>
          <Link
            href={link}
            className="line-clamp-2 text-[15px] font-semibold leading-snug tracking-tight transition-colors group-hover:text-primary"
          >
            {series.title}
          </Link>
          {series.description && (
            <HtmlContent
              html={series.description}
              variant="clamp"
              className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground"
            />
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-[11px] font-medium text-muted-foreground">
          {series.totalTests != null && (
            <span className="inline-flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" />
              {series.totalTests} tests
            </span>
          )}
          {series.durationDays != null && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {series.durationDays}d access
            </span>
          )}
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-border/60 pt-3.5">
          <PriceBlock
            total={series.totalPrice}
            discounted={series.discountedPrice}
            discountPercentage={series.discountPercentage}
            size="sm"
            isFree={isFree}
          />
        </div>
      </div>
    </motion.article>
  );
}

function Placeholder({ gradient }: { gradient: string }) {
  return (
    <div
      className={cn(
        "relative grid h-full w-full place-items-center bg-gradient-to-br",
        gradient
      )}
    >
      <div
        aria-hidden
        className="absolute inset-0 opacity-30 mix-blend-overlay"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)",
          backgroundSize: "16px 16px",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent"
      />
      <Trophy className="relative h-14 w-14 text-white/95 drop-shadow-[0_4px_12px_rgba(0,0,0,0.35)]" />
    </div>
  );
}
