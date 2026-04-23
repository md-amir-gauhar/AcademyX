"use client";

import { motion } from "framer-motion";
import { Compass, GraduationCap, Rocket } from "lucide-react";
import { SectionHeading } from "@/components/brand/section-heading";

const STEPS = [
  {
    icon: Compass,
    title: "Discover your path",
    description:
      "Tell us what you want to master — our platform curates a batch of courses, live sessions and daily goals built for your goal.",
  },
  {
    icon: GraduationCap,
    title: "Learn with mentors",
    description:
      "Attend live classes, watch replays, ask doubts inline, take tests and climb the leaderboard — guided by top educators.",
  },
  {
    icon: Rocket,
    title: "Track & accelerate",
    description:
      "Streaks, XP, insights and personalised recommendations keep you showing up. Progress is visible, measurable and celebrated.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-24">
      <div className="container">
        <SectionHeading
          eyebrow="How it works"
          title={
            <>
              Three steps to <span className="gradient-text">serious progress</span>
            </>
          }
          description="No more scattered playlists, note docs and random PDFs. AcademyX gives you a single, beautifully-structured learning journey."
        />

        <div className="relative mx-auto mt-14 grid max-w-5xl gap-6 md:grid-cols-3">
          <div
            aria-hidden
            className="absolute left-8 top-10 hidden h-px w-[calc(100%-4rem)] bg-gradient-to-r from-transparent via-primary/50 to-transparent md:block"
          />
          {STEPS.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="relative rounded-3xl border border-border/60 bg-card p-6"
            >
              <div className="flex items-center gap-3">
                <div className="relative grid h-12 w-12 place-items-center rounded-2xl bg-gradient-brand text-white shadow-glow">
                  <step.icon className="h-5 w-5" />
                </div>
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Step {i + 1}
                </div>
              </div>
              <h3 className="mt-5 text-xl font-semibold tracking-tight">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
