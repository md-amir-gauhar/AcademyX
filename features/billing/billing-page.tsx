"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { useOrders } from "@/hooks/useOrders";
import type { Order, PaymentStatus } from "@/types/order";
import { cn, formatINR } from "@/lib/utils";

export function BillingPage() {
  const [status, setStatus] = React.useState<PaymentStatus | undefined>(undefined);
  const [page, setPage] = React.useState(1);
  const limit = 10;

  const orders = useOrders({ status, page, limit });

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <PageHeader
        eyebrow="Billing"
        title={
          <>
            Your <span className="gradient-text">payments & invoices</span>
          </>
        }
        description="Every batch and test series you've purchased, with the full status of each transaction."
        actions={
          <Button asChild variant="outline">
            <Link href="/discover">
              Explore more <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <StatusFilter
          value={status}
          onChange={(s) => {
            setStatus(s);
            setPage(1);
          }}
        />
      </div>

      {orders.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : !orders.data?.items.length ? (
        <EmptyState
          icon={CreditCard}
          title="No orders yet"
          description="Once you enroll in a paid batch or test series, the receipts will show up here."
          action={
            <Button asChild variant="gradient" size="sm">
              <Link href="/discover">Browse catalogue</Link>
            </Button>
          }
        />
      ) : (
        <>
          <div className="space-y-3">
            {orders.data.items.map((o) => (
              <OrderRow key={o.id} order={o} />
            ))}
          </div>
          <Pagination
            page={orders.data.pagination.currentPage}
            totalPages={orders.data.pagination.totalPages}
            hasNext={orders.data.pagination.hasNextPage}
            hasPrev={orders.data.pagination.hasPreviousPage}
            onChange={setPage}
          />
        </>
      )}
    </div>
  );
}

function OrderRow({ order }: { order: Order }) {
  const entityDetails = order.entityDetails as
    | { name?: string; title?: string; description?: string | null }
    | undefined;
  const title = entityDetails?.name ?? entityDetails?.title ?? "—";
  return (
    <Card className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
      <StatusIcon status={order.paymentStatus} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="text-[10px] uppercase">
            {order.entityType === "BATCH" ? "Batch" : "Test series"}
          </Badge>
          <PaymentStatusBadge status={order.paymentStatus} />
        </div>
        <p className="mt-1.5 line-clamp-1 text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">
          {new Date(order.createdAt).toLocaleString()} · {order.receiptId ?? order.id.slice(0, 8)}
        </p>
      </div>
      <div className="text-right">
        <p className="text-base font-semibold tracking-tight">
          {formatINR(order.amount)}
        </p>
        {order.paymentStatus === "REFUNDED" && order.refundAmount != null && (
          <p className="text-xs text-muted-foreground">
            Refunded {formatINR(order.refundAmount)}
          </p>
        )}
      </div>
    </Card>
  );
}

function StatusIcon({ status }: { status: PaymentStatus }) {
  const map: Record<PaymentStatus, { icon: React.ComponentType<{ className?: string }>; tone: string }> = {
    SUCCESS: { icon: CheckCircle2, tone: "text-success bg-success/10" },
    FAILED: { icon: XCircle, tone: "text-destructive bg-destructive/10" },
    PENDING: { icon: Clock, tone: "text-muted-foreground bg-muted" },
    PROCESSING: { icon: Clock, tone: "text-muted-foreground bg-muted" },
    REFUNDED: { icon: RotateCcw, tone: "text-warning bg-warning/10" },
  };
  const { icon: Icon, tone } = map[status];
  return (
    <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", tone)}>
      <Icon className="h-5 w-5" />
    </div>
  );
}

function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  switch (status) {
    case "SUCCESS":
      return <Badge variant="success">Paid</Badge>;
    case "FAILED":
      return <Badge variant="destructive">Failed</Badge>;
    case "PENDING":
    case "PROCESSING":
      return <Badge variant="warning">Pending</Badge>;
    case "REFUNDED":
      return <Badge variant="outline">Refunded</Badge>;
  }
}

function StatusFilter({
  value,
  onChange,
}: {
  value?: PaymentStatus;
  onChange: (status?: PaymentStatus) => void;
}) {
  const options: Array<{ label: string; value?: PaymentStatus }> = [
    { label: "All" },
    { label: "Paid", value: "SUCCESS" },
    { label: "Pending", value: "PENDING" },
    { label: "Failed", value: "FAILED" },
    { label: "Refunded", value: "REFUNDED" },
  ];
  return (
    <div className="flex items-center gap-1 rounded-full border border-border/60 bg-card p-1">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.label}
            onClick={() => onChange(opt.value)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              active
                ? "bg-gradient-brand text-white"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  hasNext,
  hasPrev,
  onChange,
}: {
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between gap-3">
      <Button
        variant="outline"
        size="sm"
        disabled={!hasPrev}
        onClick={() => onChange(page - 1)}
      >
        <ChevronLeft className="h-4 w-4" /> Previous
      </Button>
      <span className="text-xs text-muted-foreground">
        Page {page} of {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={!hasNext}
        onClick={() => onChange(page + 1)}
      >
        Next <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
