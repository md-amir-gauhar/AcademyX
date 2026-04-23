"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useOrgConfig } from "@/hooks/useOrgConfig";
import { env } from "@/lib/env";

interface LogoProps {
  className?: string;
  textClassName?: string;
  hideText?: boolean;
}

export function Logo({ className, textClassName, hideText }: LogoProps) {
  const { config } = useOrgConfig();
  const name = config?.name || env.appName;

  return (
    <Link
      href="/"
      className={cn("group inline-flex items-center gap-2.5", className)}
      aria-label={`${name} home`}
    >
      <span className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-xl bg-gradient-brand shadow-glow">
        {config?.logoUrl ? (
          <Image
            src={config.logoUrl}
            alt={name}
            width={36}
            height={36}
            className="h-full w-full object-cover"
            unoptimized
          />
        ) : (
          <span className="text-base font-bold text-white">
            {name.slice(0, 1).toUpperCase()}
          </span>
        )}
        <span className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      </span>
      {!hideText && (
        <span
          className={cn(
            "text-lg font-semibold tracking-tight",
            textClassName
          )}
        >
          {name}
        </span>
      )}
    </Link>
  );
}
