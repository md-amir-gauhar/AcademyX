"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, Clock, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PriceBlock } from "@/components/shared/price-block";
import { TeacherRow } from "@/components/shared/teacher-row";
import { cn, formatNumber } from "@/lib/utils";
import type { Batch } from "@/types/batch";

interface BatchCardProps {
  batch: Batch;
  href?: string;
  compact?: boolean;
  className?: string;
}

export function BatchCard({ batch, href, compact, className }: BatchCardProps) {
  const link = href ?? `/discover/${batch.slug}`;
  const isFree = batch.totalPrice === 0 || batch.discountedPrice === 0;

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
        <div className="relative aspect-[16/10] overflow-hidden bg-gradient-brand">
          {batch.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={batch.thumbnailUrl}
              alt={batch.name}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-5xl font-bold text-white/70">
              {batch.name.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-transparent" />
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            {batch.exam && (
              <Badge className="bg-background/90 text-foreground border-transparent">
                {batch.exam}
              </Badge>
            )}
            {batch.class && (
              <Badge variant="outline" className="bg-background/70 backdrop-blur">
                Class {batch.class}
              </Badge>
            )}
            {isFree && <Badge variant="success">Free</Badge>}
          </div>
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <Link href={link} className="line-clamp-2 text-base font-semibold leading-snug tracking-tight">
            {batch.name}
          </Link>
          {!compact && batch.description && (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
              {batch.description}
            </p>
          )}
        </div>

        {batch.teachers?.length > 0 && <TeacherRow teachers={batch.teachers} />}

        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
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
              {formatNumber(batch.studentsCount)}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-3">
          <PriceBlock
            total={batch.totalPrice}
            discounted={batch.discountedPrice}
            discountPercentage={batch.discountPercentage}
            size="sm"
          />
          {batch.isPurchased && (
            <Badge variant="success">Enrolled</Badge>
          )}
        </div>
      </div>
    </motion.article>
  );
}

export function BatchCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-3xl border border-border/60 bg-card">
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
