"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Clock, FileText, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PriceBlock } from "@/components/shared/price-block";
import { cn } from "@/lib/utils";
import type { TestSeries } from "@/types/test";

interface TestSeriesCardProps {
  series: TestSeries;
  href?: string;
  className?: string;
}

export function TestSeriesCard({ series, href, className }: TestSeriesCardProps) {
  const link = href ?? `/tests/${series.slug}`;
  const isFree = series.isFree || series.discountedPrice === 0;

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-5% 0px" }}
      transition={{ duration: 0.4 }}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-3xl border border-border/60 bg-card transition-all hover:-translate-y-1 hover:shadow-glow",
        className
      )}
    >
      <Link href={link} className="relative block">
        <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-indigo-500 via-violet-500 to-sky-500">
          {series.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={series.thumbnailUrl}
              alt={series.title}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="grid h-full w-full place-items-center">
              <Trophy className="h-14 w-14 text-white/80" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/0 to-transparent" />
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            {series.exam && (
              <Badge className="bg-background/90 text-foreground border-transparent">
                {series.exam}
              </Badge>
            )}
            {isFree && <Badge variant="success">Free</Badge>}
          </div>
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <Link
            href={link}
            className="line-clamp-2 text-base font-semibold leading-snug tracking-tight"
          >
            {series.title}
          </Link>
          {series.description && (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
              {series.description}
            </p>
          )}
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          {series.totalTests != null && (
            <span className="inline-flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" />
              {series.totalTests} tests
            </span>
          )}
          {series.durationDays != null && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {series.durationDays} days access
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-3">
          <PriceBlock
            total={series.totalPrice}
            discounted={series.discountedPrice}
            discountPercentage={series.discountPercentage}
            size="sm"
            isFree={isFree}
          />
          {(series.isEnrolled || series.isPurchased) && (
            <Badge variant="success">Enrolled</Badge>
          )}
        </div>
      </div>
    </motion.article>
  );
}
