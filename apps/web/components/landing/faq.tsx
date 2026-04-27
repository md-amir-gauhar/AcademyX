"use client";

import { SectionHeading } from "@/components/brand/section-heading";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useOrgConfig } from "@/hooks/useOrgConfig";
import { FALLBACK_FAQ } from "@/components/landing/data";

export function FAQ() {
  const { config } = useOrgConfig();
  const items = config?.faq && config.faq.length > 0 ? config.faq : FALLBACK_FAQ;

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
