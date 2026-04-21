"use client";

import Link from "next/link";
import { Github, Instagram, Twitter, Youtube } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { useOrgConfig } from "@/hooks/useOrgConfig";
import { env } from "@/lib/env";

const LINKS: Array<{ title: string; links: Array<{ href: string; label: string }> }> = [
  {
    title: "Product",
    links: [
      { href: "#features", label: "Features" },
      { href: "#pricing", label: "Pricing" },
      { href: "#how-it-works", label: "How it works" },
      { href: "/sign-in", label: "Start free" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "#", label: "About" },
      { href: "#", label: "Careers" },
      { href: "#", label: "Press" },
      { href: "#", label: "Contact" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "#faq", label: "FAQ" },
      { href: "#", label: "Blog" },
      { href: "#", label: "Help center" },
      { href: "#", label: "Status" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "#", label: "Terms" },
      { href: "#", label: "Privacy" },
      { href: "#", label: "Cookies" },
      { href: "#", label: "Security" },
    ],
  },
];

export function Footer() {
  const { config } = useOrgConfig();
  const year = new Date().getFullYear();
  const name = config?.name ?? env.appName;

  return (
    <footer className="border-t border-border/60 bg-muted/20 py-14">
      <div className="container">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_2fr]">
          <div className="space-y-4">
            <Logo />
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              {config?.description ??
                "A premium learning platform for ambitious students — live classes, adaptive tests and a mentor-backed community."}
            </p>
            <div className="flex items-center gap-2">
              {[Twitter, Instagram, Youtube, Github].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="grid h-9 w-9 place-items-center rounded-full border border-border/60 bg-background/70 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="Social link"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {LINKS.map((group) => (
              <div key={group.title}>
                <div className="text-sm font-semibold">{group.title}</div>
                <ul className="mt-3 space-y-2">
                  {group.links.map((l) => (
                    <li key={l.label}>
                      <Link
                        href={l.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border/60 pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>
            © {year} {name}. All rights reserved.
          </p>
          <p>Crafted for focused learners.</p>
        </div>
      </div>
    </footer>
  );
}
