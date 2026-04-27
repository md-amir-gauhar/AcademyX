"use client";

import { motion } from "framer-motion";
import { SOCIAL_PROOF_LOGOS } from "@/components/landing/data";

export function SocialProof() {
  return (
    <section className="border-y border-border/60 bg-muted/30 py-10">
      <div className="container">
        <p className="text-center text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Trusted by students from
        </p>
        <div className="relative mt-6 overflow-hidden mask-fade-r">
          <motion.div
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
            className="flex w-max items-center gap-12"
          >
            {[...SOCIAL_PROOF_LOGOS, ...SOCIAL_PROOF_LOGOS].map((name, i) => (
              <span
                key={`${name}-${i}`}
                className="whitespace-nowrap text-xl font-semibold tracking-tight text-muted-foreground/70 sm:text-2xl"
              >
                {name}
              </span>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
