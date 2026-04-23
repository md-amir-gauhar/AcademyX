"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CreditCard, Loader2, Sparkles } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useFreeEnroll, usePaidEnroll } from "@/hooks/useEnrollment";

interface EnrollButtonProps extends Omit<ButtonProps, "onClick"> {
  kind: "BATCH" | "TEST_SERIES";
  id: string;
  name: string;
  isFree: boolean;
  isEnrolled: boolean;
  goToOnEnrolled?: string;
  label?: string;
}

export function EnrollButton({
  kind,
  id,
  name,
  isFree,
  isEnrolled,
  goToOnEnrolled,
  label,
  variant = "gradient",
  size = "lg",
  className,
  ...rest
}: EnrollButtonProps) {
  const router = useRouter();
  const free = useFreeEnroll();
  const paid = usePaidEnroll();

  const loading = free.isPending || paid.isPending;

  if (isEnrolled) {
    return (
      <Button
        variant="default"
        size={size}
        className={className}
        onClick={() => goToOnEnrolled && router.push(goToOnEnrolled)}
        {...rest}
      >
        <Sparkles className="h-4 w-4" /> Continue learning
        <ArrowRight className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      disabled={loading}
      onClick={async () => {
        try {
          if (isFree) {
            await free.mutateAsync({ kind, id });
          } else {
            await paid.mutateAsync({
              kind,
              id,
              entityName: name,
            });
          }
          if (goToOnEnrolled) router.push(goToOnEnrolled);
        } catch {
          // errors surface via toasts inside the mutations
        }
      }}
      {...rest}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {isFree ? "Enrolling…" : "Processing…"}
        </>
      ) : isFree ? (
        <>
          Enroll free <ArrowRight className="h-4 w-4" />
        </>
      ) : (
        <>
          <CreditCard className="h-4 w-4" />
          {label ?? "Enroll now"}
        </>
      )}
    </Button>
  );
}
