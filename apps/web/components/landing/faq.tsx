"use client";

import { SectionHeading } from "@/components/brand/section-heading";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useOrgConfig } from "@/hooks/useOrgConfig";

const FALLBACK = [
  {
    q: "Is AcademyX free to try?",
    a: "Yes. The Starter plan gives you access to selected batches, the AI assistant (with a daily cap) and the full community — no credit card required.",
  },
  {
    q: "How do live classes work?",
    a: "Live classes are scheduled by mentors and show up on your dashboard with a 'join' button. Missed a class? Replays are available instantly, with transcripts and chapter markers.",
  },
  {
    q: "Can I study on mobile?",
    a: "AcademyX is mobile-first. Everything — video, tests, practice zone, community — works perfectly on your phone, including offline downloads.",
  },
  {
    q: "How secure are payments?",
    a: "All payments are processed via Razorpay with verified HMAC signatures. Your card details never touch our servers.",
  },
  {
    q: "Do you support coaching institutes?",
    a: "Yes. Our Institute plan ships with custom branding, admin analytics, content tools, and dedicated support.",
  },
];

export function FAQ() {
  const { config } = useOrgConfig();
  const items = config?.faq && config.faq.length > 0 ? config.faq : FALLBACK;

  return (
    <section id="faq" className="relative py-24">
      <div className="container max-w-3xl">
        <SectionHeading
          eyebrow="FAQ"
          title={
            <>
              Frequently asked <span className="gradient-text">questions</span>
            </>
          }
          description="Can't find the answer you need? Reach out to our team any time."
        />
        <div className="mt-12 rounded-3xl border border-border/60 bg-card px-6">
          <Accordion type="single" collapsible className="w-full">
            {items.map((item, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger>{item.q}</AccordionTrigger>
                <AccordionContent>{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
