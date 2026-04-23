import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GradientOrb } from "@/components/brand/gradient-orb";

export default function NotFound() {
  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden px-6">
      <GradientOrb color="violet" size="xl" className="left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-40" />
      <div className="relative text-center">
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary">
          404
        </p>
        <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-5xl">
          This page <span className="gradient-text">took a day off</span>.
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist — or maybe it moved.
          Let&apos;s get you back on track.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button asChild variant="gradient" size="lg">
            <Link href="/">Back home</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/dashboard">Go to dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
