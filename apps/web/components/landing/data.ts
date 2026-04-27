import {
  BookOpen,
  Brain,
  Compass,
  Flame,
  GraduationCap,
  MessageSquare,
  PlayCircle,
  Rocket,
  Trophy,
  Video,
  Zap,
} from "lucide-react";

export const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
] as const;

export const FEATURES: ReadonlyArray<{
  icon: typeof import("lucide-react").PlayCircle;
  title: string;
  description: string;
  tone: string;
  span?: string;
}> = [
  {
    icon: PlayCircle,
    title: "Adaptive video lessons",
    description:
      "Pick up exactly where you left off — with speed control, bookmarks, and auto-generated transcripts.",
    tone: "indigo",
    span: "sm:col-span-2",
  },
  {
    icon: Brain,
    title: "AI study assistant",
    description: "Ask any doubt, get explained answers and practice sets.",
    tone: "violet",
  },
  {
    icon: Video,
    title: "Live mentor classes",
    description: "Scheduled sessions with top educators, replayable anytime.",
    tone: "sky",
  },
  {
    icon: Trophy,
    title: "Quizzes & tests",
    description:
      "Timed exams, instant analytics, a beautiful question palette and result breakdown.",
    tone: "emerald",
    span: "sm:col-span-2",
  },
  {
    icon: Flame,
    title: "Streaks & XP",
    description:
      "Daily goals, leaderboards and badges keep your motivation up.",
    tone: "amber",
  },
  {
    icon: MessageSquare,
    title: "Community",
    description: "Discussion threads, study groups and peer reactions.",
    tone: "rose",
  },
  {
    icon: BookOpen,
    title: "Practice zone",
    description: "Flashcards, drag-drop drills and a coding playground.",
    tone: "indigo",
  },
  {
    icon: Zap,
    title: "Offline & mobile",
    description:
      "Download lectures, review on the go — stays perfectly in sync.",
    tone: "sky",
  },
] as const;

export const STEPS = [
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
] as const;

export const PLANS: ReadonlyArray<{
  name: string;
  price: string;
  period?: string;
  tagline: string;
  features: readonly string[];
  cta: string;
  highlight: boolean;
}> = [
  {
    name: "Starter",
    price: "Free",
    tagline: "Explore the platform",
    features: [
      "3 free batches",
      "AI assistant — 10 questions / day",
      "Basic analytics",
      "Community access",
    ],
    cta: "Get started",
    highlight: false,
  },
  {
    name: "Pro",
    price: "₹2,499",
    period: "/ mo",
    tagline: "For serious aspirants",
    features: [
      "All batches + live classes",
      "Unlimited AI assistant",
      "Full test series + analytics",
      "Mentor Q&A priority",
      "Offline downloads",
    ],
    cta: "Start Pro",
    highlight: true,
  },
  {
    name: "Institute",
    price: "Custom",
    tagline: "For schools & coaching",
    features: [
      "Unlimited seats",
      "Custom branding & domain",
      "Admin & analytics dashboard",
      "Priority support",
      "Bulk licensing",
    ],
    cta: "Talk to sales",
    highlight: false,
  },
];

export const FALLBACK_FAQ = [
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
] as const;

export const FALLBACK_TESTIMONIALS = [
  {
    name: "Aditi Sharma",
    role: "JEE Advanced aspirant",
    quote:
      "AcademyX feels like a calm, focused space. Live classes, doubts, streaks — I stopped juggling 5 apps and my rank jumped 2,000 places.",
    avatarUrl: "https://i.pravatar.cc/120?img=47",
  },
  {
    name: "Rahul Verma",
    role: "NEET 2025",
    quote:
      "The AI assistant and adaptive tests are unreal. It knows exactly where I'm weak and quietly nudges me to practice the right thing.",
    avatarUrl: "https://i.pravatar.cc/120?img=13",
  },
  {
    name: "Meera Iyer",
    role: "CBSE Class 12",
    quote:
      "Beautiful product. Feels premium. My teachers post live sessions and I can rewatch everything on my phone on the bus.",
    avatarUrl: "https://i.pravatar.cc/120?img=5",
  },
] as const;

export const FOOTER_LINKS: Array<{
  title: string;
  links: Array<{ href: string; label: string }>;
}> = [
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

export const SOCIAL_PROOF_LOGOS = [
  "IIT Delhi",
  "BITS Pilani",
  "NIT Trichy",
  "VIT Vellore",
  "Chaitanya",
  "Allen",
  "Aakash",
  "FIIT",
] as const;
