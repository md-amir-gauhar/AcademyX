"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  BookOpen,
  Clock,
  Star,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PriceBlock } from "@/components/shared/price-block";
import { TeacherRow } from "@/components/shared/teacher-row";
import { cn, formatNumber, hashToIndex, stripHtml } from "@/lib/utils";
import type { Batch } from "@/types/batch";

const CARD_GRADIENTS = [
  "from-indigo-500 via-violet-500 to-fuchsia-500",
  "from-sky-500 via-indigo-500 to-violet-500",
  "from-emerald-500 via-teal-500 to-sky-500",
  "from-amber-500 via-rose-500 to-fuchsia-500",
  "from-violet-500 via-fuchsia-500 to-pink-500",
  "from-cyan-500 via-sky-500 to-indigo-500",
  "from-rose-500 via-orange-500 to-amber-500",
];

interface BatchCardProps {
  batch: Batch;
  href?: string;
  compact?: boolean;
  className?: string;
}

export function BatchCard({ batch, href, compact, className }: BatchCardProps) {
  const link = href ?? `/discover/${batch.slug}`;
  const isFree = batch.totalPrice === 0 || batch.discountedPrice === 0;
  const description = stripHtml(batch.description);
  const gradient =
    CARD_GRADIENTS[hashToIndex(batch.id || batch.slug || batch.name, CARD_GRADIENTS.length)];

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
      <Link href={link} className="relative block" aria-label={batch.name}>
        <div className="relative aspect-[16/10] overflow-hidden">
          {batch.thumbnailUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={batch.thumbnailUrl}
                alt=""
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            </>
          ) : (
            <Placeholder gradient={gradient} label={batch.name} />
          )}

          {/* Floating open indicator */}
          <span className="pointer-events-none absolute right-3 top-3 grid h-9 w-9 translate-y-1 place-items-center rounded-full bg-background/90 text-foreground opacity-0 shadow-soft backdrop-blur transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <ArrowUpRight className="h-4 w-4" />
          </span>

          {/* Badges row */}
          <div className="absolute left-3 top-3 flex max-w-[calc(100%-4rem)] flex-wrap gap-1.5">
            {batch.exam && (
              <Badge className="border-transparent bg-background/90 text-foreground backdrop-blur">
                {batch.exam}
              </Badge>
            )}
            {batch.class && (
              <Badge variant="outline" className="bg-background/70 backdrop-blur">
                Class {batch.class}
              </Badge>
            )}
            {isFree && <Badge variant="success">Free</Badge>}
            {batch.isPurchased && (
              <Badge variant="success" className="shadow-soft">Enrolled</Badge>
            )}
          </div>

          {/* Rating pill */}
          {typeof batch.rating === "number" && (
            <div className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-background/95 px-2.5 py-1 text-xs font-semibold shadow-soft backdrop-blur">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {batch.rating.toFixed(1)}
            </div>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-3.5 p-5">
        <div>
          <Link
            href={link}
            className="line-clamp-2 text-[15px] font-semibold leading-snug tracking-tight transition-colors group-hover:text-primary"
          >
            {batch.name}
          </Link>
          {!compact && description && (
            <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}
        </div>

        {batch.teachers?.length > 0 && <TeacherRow teachers={batch.teachers} />}

        <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-[11px] font-medium text-muted-foreground">
          {batch.lessonsCount != null && (
            <span className="inline-flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5" />
              {batch.lessonsCount} lessons
            </span>
          )}
          {batch.durationHours != null && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {batch.durationHours}h
            </span>
          )}
          {batch.studentsCount != null && (
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {formatNumber(batch.studentsCount)} enrolled
            </span>
          )}
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-border/60 pt-3.5">
          <PriceBlock
            total={batch.totalPrice}
            discounted={batch.discountedPrice}
            discountPercentage={batch.discountPercentage}
            size="sm"
            isFree={isFree}
          />
          {batch.validity?.days ? (
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {batch.validity.days}d access
            </span>
          ) : null}
        </div>
      </div>
    </motion.article>
  );
}

function Placeholder({ gradient, label }: { gradient: string; label: string }) {
  const initial = (label || "A").trim().slice(0, 1).toUpperCase();
  return (
    <div
      className={cn(
        "relative grid h-full w-full place-items-center bg-gradient-to-br",
        gradient
      )}
    >
      {/* grid pattern */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-30 mix-blend-overlay"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)",
          backgroundSize: "16px 16px",
        }}
      />
      {/* shine */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent"
      />
      <span className="relative text-6xl font-bold text-white/95 drop-shadow-[0_4px_12px_rgba(0,0,0,0.35)]">
        {initial}
      </span>
    </div>
  );
}

export function BatchCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-3xl border border-border/60 bg-card shadow-soft">
      <div className="relative aspect-[16/10] animate-pulse bg-muted" />
      <div className="space-y-3 p-5">
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
        <div className="h-3 w-full animate-pulse rounded bg-muted" />
        <div className="h-6 w-1/3 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
