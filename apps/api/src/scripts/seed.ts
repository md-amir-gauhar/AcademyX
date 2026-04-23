import "dotenv/config";
import bcrypt from "bcrypt";
import { eq, and } from "drizzle-orm";
import { db } from "../db";
import {
  organization,
  organizationConfig,
  user,
  teachers,
  batches,
  subjects,
  chapters,
  topics,
  contents,
  batchTeacherMapping,
  teacherSubjectMapping,
  testSeries,
  tests,
  testSections,
  testQuestions,
  testQuestionOptions,
} from "../db/schema";

/**
 * Idempotent seed for a JEE/NEET coaching organization ("Acme Academy").
 * Safe to re-run: every row is looked up by a natural key (slug / email /
 * (parent, name)) and only inserted if missing.
 *
 * Usage: npx tsx src/scripts/seed.ts
 */

const ORG_NAME = "Acme Academy";
const ORG_SLUG = "acme-academy";

const ADMIN_EMAIL = "admin@acme-academy.test";
const ADMIN_PASSWORD = "Admin@12345";
const ADMIN_USERNAME = "acmeadmin";

type Logger = (step: string, status: "create" | "exists", extra?: string) => void;
const log: Logger = (step, status, extra) => {
  const tag = status === "create" ? "+" : "=";
  console.log(`  ${tag} ${step}${extra ? ` (${extra})` : ""}`);
};

async function seedOrganization() {
  const existing = await db.query.organization.findFirst({
    where: eq(organization.slug, ORG_SLUG),
  });
  if (existing) {
    log(`organization ${ORG_SLUG}`, "exists", existing.id);
    return existing;
  }
  const [row] = await db
    .insert(organization)
    .values({ name: ORG_NAME, slug: ORG_SLUG })
    .returning();
  log(`organization ${ORG_SLUG}`, "create", row.id);
  return row;
}

async function seedOrganizationConfig(organizationId: string) {
  const existing = await db.query.organizationConfig.findFirst({
    where: eq(organizationConfig.organizationId, organizationId),
  });
  if (existing) {
    log("organization_config", "exists");
    return existing;
  }
  const [row] = await db
    .insert(organizationConfig)
    .values({
      organizationId,
      name: ORG_NAME,
      slug: ORG_SLUG,
      domain: "acme-academy.test",
      contactEmail: "contact@acme-academy.test",
      contactPhone: "+919999900000",
      currency: "INR",
      motto: "Learn. Practice. Crack it.",
      description:
        "Acme Academy is a JEE/NEET coaching platform built on QueztLearn.",
      theme: {
        primaryColor: "#0ea5e9",
        secondaryColor: "#1e293b",
        fontFamily: "Inter, sans-serif",
      },
      heroTitle: "Crack JEE & NEET with Acme Academy",
      heroSubtitle:
        "Structured batches, daily mocks, and doubt support from top mentors.",
      ctaText: "Explore Batches",
      ctaUrl: "/batches",
      features: [
        {
          title: "Live + Recorded Lectures",
          description: "Daily live classes with full recorded backups.",
          icon: "video",
        },
        {
          title: "Mock Tests",
          description: "Weekly NTA-pattern full-length tests with analysis.",
          icon: "file-check",
        },
        {
          title: "Doubt Support",
          description: "24x7 doubt resolution by subject mentors.",
          icon: "help-circle",
        },
      ],
      faq: [
        {
          question: "Is there a free demo?",
          answer: "Yes, the first week of every batch is free to audit.",
        },
        {
          question: "Do I get recordings?",
          answer: "All live classes are recorded and available in the batch.",
        },
      ],
      socialLinks: {
        instagram: "https://instagram.com/acme-academy",
        youtube: "https://youtube.com/@acme-academy",
      },
      metaTitle: "Acme Academy | JEE & NEET Coaching",
      metaDescription:
        "Online coaching for JEE Main, JEE Advanced, and NEET. Batches, tests, and mentor support.",
      supportEmail: "support@acme-academy.test",
      featuresEnabled: {
        batches: true,
        testSeries: true,
        schedules: true,
      },
      maintenanceMode: false,
      isActive: true,
    })
    .returning();
  log("organization_config", "create");
  return row;
}

async function seedAdminUser(organizationId: string) {
  const existing = await db.query.user.findFirst({
    where: eq(user.email, ADMIN_EMAIL),
  });
  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
  if (existing) {
    // Keep it verified with a known password so the login smoke test works.
    await db
      .update(user)
      .set({
        password: hashedPassword,
        isVerified: true,
        role: "ADMIN",
        updatedAt: new Date(),
      })
      .where(eq(user.id, existing.id));
    log(`admin ${ADMIN_EMAIL}`, "exists", existing.id);
    return existing;
  }
  const [row] = await db
    .insert(user)
    .values({
      organizationId,
      email: ADMIN_EMAIL,
      username: ADMIN_USERNAME,
      password: hashedPassword,
      role: "ADMIN",
      isVerified: true,
    })
    .returning();
  log(`admin ${ADMIN_EMAIL}`, "create", row.id);
  return row;
}

type TeacherSeed = {
  name: string;
  highlights: string;
  imageUrl?: string;
  subjects: string[];
};

async function seedTeachers(organizationId: string, seeds: TeacherSeed[]) {
  const out: Record<string, typeof teachers.$inferSelect> = {};
  for (const s of seeds) {
    const existing = await db.query.teachers.findFirst({
      where: and(
        eq(teachers.organizationId, organizationId),
        eq(teachers.name, s.name)
      ),
    });
    if (existing) {
      log(`teacher ${s.name}`, "exists");
      out[s.name] = existing;
      continue;
    }
    const [row] = await db
      .insert(teachers)
      .values({
        organizationId,
        name: s.name,
        highlights: s.highlights,
        imageUrl: s.imageUrl,
        subjects: s.subjects,
      })
      .returning();
    log(`teacher ${s.name}`, "create");
    out[s.name] = row;
  }
  return out;
}

type BatchSeed = {
  slug: string;
  name: string;
  description: string;
  class: "11" | "12" | "12+" | "Grad";
  exam: "JEE" | "NEET" | "UPSC" | "BANK" | "SSC" | "GATE" | "CAT" | "NDA" | "CLAT" | "OTHER";
  imageUrl?: string;
  startDate: Date;
  endDate: Date;
  language: string;
  totalPrice: number;
  discountPercentage: number;
  teacherNames: string[]; // keys from seedTeachers
  subjects: Array<{
    name: string;
    thumbnailUrl?: string;
    teacherNames: string[];
    chapters: Array<{
      name: string;
      lectureCount: number;
      lectureDuration: string;
      topics: Array<{
        name: string;
        contents: Array<{
          name: string;
          type: "Lecture" | "PDF";
          videoUrl?: string;
          videoType?: "HLS" | "YOUTUBE";
          videoThumbnail?: string;
          videoDuration?: number;
          pdfUrl?: string;
        }>;
      }>;
    }>;
  }>;
};

async function seedBatches(
  organizationId: string,
  teacherMap: Record<string, typeof teachers.$inferSelect>,
  seeds: BatchSeed[]
) {
  for (const s of seeds) {
    let batch = await db.query.batches.findFirst({
      where: eq(batches.slug, s.slug),
    });
    if (!batch) {
      const [row] = await db
        .insert(batches)
        .values({
          organizationId,
          slug: s.slug,
          name: s.name,
          description: s.description,
          class: s.class,
          exam: s.exam,
          imageUrl: s.imageUrl,
          startDate: s.startDate,
          endDate: s.endDate,
          language: s.language,
          totalPrice: s.totalPrice,
          discountPercentage: s.discountPercentage,
        })
        .returning();
      batch = row;
      log(`batch ${s.slug}`, "create");
    } else {
      log(`batch ${s.slug}`, "exists");
    }

    // Batch <-> Teacher mappings
    for (const tname of s.teacherNames) {
      const teacher = teacherMap[tname];
      if (!teacher) continue;
      const exists = await db.query.batchTeacherMapping.findFirst({
        where: and(
          eq(batchTeacherMapping.batchId, batch.id),
          eq(batchTeacherMapping.teacherId, teacher.id)
        ),
      });
      if (!exists) {
        await db.insert(batchTeacherMapping).values({
          batchId: batch.id,
          teacherId: teacher.id,
          organizationId,
        });
        log(`  batch->teacher ${s.slug} <- ${tname}`, "create");
      }
    }

    // Subjects -> chapters -> topics -> contents
    for (const sub of s.subjects) {
      let subject = await db.query.subjects.findFirst({
        where: and(eq(subjects.batchId, batch.id), eq(subjects.name, sub.name)),
      });
      if (!subject) {
        const [row] = await db
          .insert(subjects)
          .values({
            batchId: batch.id,
            name: sub.name,
            thumbnailUrl: sub.thumbnailUrl,
          })
          .returning();
        subject = row;
        log(`  subject ${sub.name}`, "create");
      } else {
        log(`  subject ${sub.name}`, "exists");
      }

      for (const tname of sub.teacherNames) {
        const teacher = teacherMap[tname];
        if (!teacher) continue;
        const exists = await db.query.teacherSubjectMapping.findFirst({
          where: and(
            eq(teacherSubjectMapping.teacherId, teacher.id),
            eq(teacherSubjectMapping.subjectId, subject.id)
          ),
        });
        if (!exists) {
          await db.insert(teacherSubjectMapping).values({
            teacherId: teacher.id,
            subjectId: subject.id,
          });
          log(`    subject->teacher ${sub.name} <- ${tname}`, "create");
        }
      }

      for (const ch of sub.chapters) {
        let chapter = await db.query.chapters.findFirst({
          where: and(eq(chapters.subjectId, subject.id), eq(chapters.name, ch.name)),
        });
        if (!chapter) {
          const [row] = await db
            .insert(chapters)
            .values({
              subjectId: subject.id,
              name: ch.name,
              lectureCount: ch.lectureCount,
              lectureDuration: ch.lectureDuration,
            })
            .returning();
          chapter = row;
          log(`    chapter ${ch.name}`, "create");
        } else {
          log(`    chapter ${ch.name}`, "exists");
        }

        for (const tp of ch.topics) {
          let topic = await db.query.topics.findFirst({
            where: and(
              eq(topics.chapterId, chapter.id),
              eq(topics.name, tp.name)
            ),
          });
          if (!topic) {
            const [row] = await db
              .insert(topics)
              .values({ chapterId: chapter.id, name: tp.name })
              .returning();
            topic = row;
            log(`      topic ${tp.name}`, "create");
          } else {
            log(`      topic ${tp.name}`, "exists");
          }

          for (const c of tp.contents) {
            const existing = await db.query.contents.findFirst({
              where: and(eq(contents.topicId, topic.id), eq(contents.name, c.name)),
            });
            if (existing) {
              log(`        content ${c.name}`, "exists");
              continue;
            }
            await db.insert(contents).values({
              topicId: topic.id,
              name: c.name,
              type: c.type,
              videoUrl: c.videoUrl,
              videoType: c.videoType,
              videoThumbnail: c.videoThumbnail,
              videoDuration: c.videoDuration,
              pdfUrl: c.pdfUrl,
            });
            log(`        content ${c.name}`, "create");
          }
        }
      }
    }
  }
}

type TestSeriesSeed = {
  slug: string;
  title: string;
  description: string;
  exam: "JEE" | "NEET" | "UPSC" | "BANK" | "SSC" | "GATE" | "CAT" | "NDA" | "CLAT" | "OTHER";
  imageUrl?: string;
  totalPrice: number;
  discountPercentage: number;
  isFree: boolean;
  durationDays: number;
  test: {
    slug: string;
    title: string;
    description: string;
    instructions: string[];
    durationMinutes: number;
    totalMarks: number;
    passingMarks: number;
    isFree: boolean;
    sections: Array<{
      name: string;
      displayOrder: number;
      totalMarks: number;
      questions: Array<{
        text: string;
        marks: number;
        negativeMarks?: number;
        difficulty?: "EASY" | "MEDIUM" | "HARD";
        explanation?: string;
        options: Array<{ text: string; isCorrect: boolean }>;
      }>;
    }>;
  };
};

async function seedTestSeries(organizationId: string, seed: TestSeriesSeed) {
  let series = await db.query.testSeries.findFirst({
    where: eq(testSeries.slug, seed.slug),
  });
  if (!series) {
    const [row] = await db
      .insert(testSeries)
      .values({
        organizationId,
        exam: seed.exam,
        title: seed.title,
        description: seed.description,
        slug: seed.slug,
        imageUrl: seed.imageUrl,
        totalPrice: seed.totalPrice,
        discountPercentage: seed.discountPercentage,
        isFree: seed.isFree,
        durationDays: seed.durationDays,
        isPublished: true,
        publishedAt: new Date(),
      })
      .returning();
    series = row;
    log(`test_series ${seed.slug}`, "create");
  } else {
    log(`test_series ${seed.slug}`, "exists");
  }

  let test = await db.query.tests.findFirst({
    where: eq(tests.slug, seed.test.slug),
  });
  if (!test) {
    const [row] = await db
      .insert(tests)
      .values({
        testSeriesId: series.id,
        organizationId,
        title: seed.test.title,
        description: seed.test.description,
        slug: seed.test.slug,
        instructions: seed.test.instructions,
        durationMinutes: seed.test.durationMinutes,
        totalMarks: seed.test.totalMarks,
        passingMarks: seed.test.passingMarks,
        isFree: seed.test.isFree,
        isPublished: true,
        publishedAt: new Date(),
      })
      .returning();
    test = row;
    log(`  test ${seed.test.slug}`, "create");
  } else {
    log(`  test ${seed.test.slug}`, "exists");
  }

  let totalQuestions = 0;
  for (const sec of seed.test.sections) {
    let section = await db.query.testSections.findFirst({
      where: and(
        eq(testSections.testId, test.id),
        eq(testSections.name, sec.name)
      ),
    });
    if (!section) {
      const [row] = await db
        .insert(testSections)
        .values({
          testId: test.id,
          name: sec.name,
          displayOrder: sec.displayOrder,
          totalMarks: sec.totalMarks,
          questionCount: sec.questions.length,
        })
        .returning();
      section = row;
      log(`    section ${sec.name}`, "create");
    } else {
      log(`    section ${sec.name}`, "exists");
    }

    for (let i = 0; i < sec.questions.length; i++) {
      const q = sec.questions[i];
      let question = await db.query.testQuestions.findFirst({
        where: and(
          eq(testQuestions.sectionId, section.id),
          eq(testQuestions.text, q.text)
        ),
      });
      if (!question) {
        const [row] = await db
          .insert(testQuestions)
          .values({
            sectionId: section.id,
            organizationId,
            text: q.text,
            marks: q.marks,
            negativeMarks: q.negativeMarks ?? 0,
            difficulty: q.difficulty ?? "MEDIUM",
            explanation: q.explanation,
            displayOrder: i,
          })
          .returning();
        question = row;
        log(`      question[${i}]`, "create");
      } else {
        log(`      question[${i}]`, "exists");
      }

      for (let j = 0; j < q.options.length; j++) {
        const o = q.options[j];
        const exists = await db.query.testQuestionOptions.findFirst({
          where: and(
            eq(testQuestionOptions.questionId, question.id),
            eq(testQuestionOptions.text, o.text)
          ),
        });
        if (!exists) {
          await db.insert(testQuestionOptions).values({
            questionId: question.id,
            text: o.text,
            displayOrder: j,
            isCorrect: o.isCorrect,
          });
        }
      }
      totalQuestions++;
    }
  }

  // Roll up counts on the test/series
  await db
    .update(tests)
    .set({
      sectionCount: seed.test.sections.length,
      questionCount: totalQuestions,
      updatedAt: new Date(),
    })
    .where(eq(tests.id, test.id));

  await db
    .update(testSeries)
    .set({
      testCount: 1,
      totalQuestions,
      updatedAt: new Date(),
    })
    .where(eq(testSeries.id, series.id));
}

// ---------- data ----------

const TEACHER_SEEDS: TeacherSeed[] = [
  {
    name: "Dr. R. K. Sharma",
    highlights:
      "<p>IIT Delhi alumnus. 12+ years teaching JEE/NEET Physics. Has mentored 50+ AIR < 500.</p>",
    subjects: ["Physics"],
  },
  {
    name: "Prof. Neha Gupta",
    highlights:
      "<p>M.Sc Chemistry, IIT Bombay. Author of 3 reference books on Organic Chemistry.</p>",
    subjects: ["Chemistry"],
  },
  {
    name: "Ajay Kumar",
    highlights:
      "<p>B.Tech IIT Kanpur. 8 years mentoring JEE Math. Specializes in Calculus and Algebra.</p>",
    subjects: ["Mathematics"],
  },
  {
    name: "Dr. Priya Menon",
    highlights:
      "<p>MBBS AIIMS Delhi. 10 years teaching NEET Biology with focus on NCERT-first approach.</p>",
    subjects: ["Biology"],
  },
];

const now = new Date();
const plusMonths = (m: number) => {
  const d = new Date(now);
  d.setMonth(d.getMonth() + m);
  return d;
};

const BATCH_SEEDS: BatchSeed[] = [
  {
    slug: "jee-2026-dropper",
    name: "JEE 2026 Dropper Batch",
    description:
      "<p>Comprehensive year-long program for JEE Main + Advanced aspirants. Includes live classes, tests, and mentorship.</p>",
    class: "12+",
    exam: "JEE",
    startDate: plusMonths(0),
    endDate: plusMonths(12),
    language: "Hinglish",
    totalPrice: 29999,
    discountPercentage: 20,
    teacherNames: ["Dr. R. K. Sharma", "Prof. Neha Gupta", "Ajay Kumar"],
    subjects: [
      {
        name: "Physics",
        teacherNames: ["Dr. R. K. Sharma"],
        chapters: [
          {
            name: "Kinematics",
            lectureCount: 12,
            lectureDuration: "14 hr",
            topics: [
              {
                name: "Motion in a Straight Line",
                contents: [
                  {
                    name: "Intro to Kinematics",
                    type: "Lecture",
                    videoType: "YOUTUBE",
                    videoUrl: "https://www.youtube.com/watch?v=ZM8ECpBuQYE",
                    videoDuration: 45,
                  },
                  {
                    name: "Kinematics Formula Sheet",
                    type: "PDF",
                    pdfUrl: "https://example.com/pdfs/kinematics.pdf",
                  },
                ],
              },
            ],
          },
          {
            name: "Laws of Motion",
            lectureCount: 10,
            lectureDuration: "11 hr",
            topics: [
              {
                name: "Newton's Laws",
                contents: [
                  {
                    name: "Newton's 3 Laws Explained",
                    type: "Lecture",
                    videoType: "YOUTUBE",
                    videoUrl: "https://www.youtube.com/watch?v=kKKM8Y-u7ds",
                    videoDuration: 50,
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        name: "Chemistry",
        teacherNames: ["Prof. Neha Gupta"],
        chapters: [
          {
            name: "Some Basic Concepts of Chemistry",
            lectureCount: 8,
            lectureDuration: "9 hr",
            topics: [
              {
                name: "Mole Concept",
                contents: [
                  {
                    name: "Mole Concept Masterclass",
                    type: "Lecture",
                    videoType: "YOUTUBE",
                    videoUrl: "https://www.youtube.com/watch?v=q4p1JZIe5cQ",
                    videoDuration: 55,
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        name: "Mathematics",
        teacherNames: ["Ajay Kumar"],
        chapters: [
          {
            name: "Sets, Relations & Functions",
            lectureCount: 9,
            lectureDuration: "10 hr",
            topics: [
              {
                name: "Functions",
                contents: [
                  {
                    name: "Functions - One Shot",
                    type: "Lecture",
                    videoType: "YOUTUBE",
                    videoUrl: "https://www.youtube.com/watch?v=5zB3u8kO9LY",
                    videoDuration: 60,
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "neet-2026-crash",
    name: "NEET 2026 Crash Course",
    description:
      "<p>3-month intensive crash course focused on NCERT, high-yield topics, and daily tests.</p>",
    class: "12+",
    exam: "NEET",
    startDate: plusMonths(0),
    endDate: plusMonths(3),
    language: "Hinglish",
    totalPrice: 14999,
    discountPercentage: 15,
    teacherNames: ["Dr. R. K. Sharma", "Prof. Neha Gupta", "Dr. Priya Menon"],
    subjects: [
      {
        name: "Physics",
        teacherNames: ["Dr. R. K. Sharma"],
        chapters: [
          {
            name: "Mechanics Revision",
            lectureCount: 6,
            lectureDuration: "7 hr",
            topics: [
              {
                name: "Work, Energy, Power",
                contents: [
                  {
                    name: "WEP Revision One-Shot",
                    type: "Lecture",
                    videoType: "YOUTUBE",
                    videoUrl: "https://www.youtube.com/watch?v=w4QFJb9a8vo",
                    videoDuration: 70,
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        name: "Chemistry",
        teacherNames: ["Prof. Neha Gupta"],
        chapters: [
          {
            name: "Chemical Bonding",
            lectureCount: 5,
            lectureDuration: "6 hr",
            topics: [
              {
                name: "VSEPR Theory",
                contents: [
                  {
                    name: "VSEPR in 30 mins",
                    type: "Lecture",
                    videoType: "YOUTUBE",
                    videoUrl: "https://www.youtube.com/watch?v=X0X6P3q9a3E",
                    videoDuration: 32,
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        name: "Biology",
        teacherNames: ["Dr. Priya Menon"],
        chapters: [
          {
            name: "Human Physiology",
            lectureCount: 10,
            lectureDuration: "12 hr",
            topics: [
              {
                name: "Digestion & Absorption",
                contents: [
                  {
                    name: "Digestion NCERT Line-by-Line",
                    type: "Lecture",
                    videoType: "YOUTUBE",
                    videoUrl: "https://www.youtube.com/watch?v=Sx0hFzJqY0c",
                    videoDuration: 65,
                  },
                  {
                    name: "Digestion Notes",
                    type: "PDF",
                    pdfUrl: "https://example.com/pdfs/digestion.pdf",
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];

const TEST_SERIES_SEED: TestSeriesSeed = {
  slug: "jee-main-mocks-2026",
  title: "JEE Main Mocks 2026",
  description:
    "<p>NTA-pattern full-length mocks for JEE Main 2026 with detailed solutions.</p>",
  exam: "JEE",
  totalPrice: 1999,
  discountPercentage: 50,
  isFree: false,
  durationDays: 365,
  test: {
    slug: "jee-main-mock-1",
    title: "JEE Main Mock #1",
    description: "<p>Full-length mock covering Physics, Chemistry, Math.</p>",
    instructions: [
      "Test is 3 hours long.",
      "+4 for correct answer, -1 for incorrect.",
      "No negative marking for unattempted questions.",
    ],
    durationMinutes: 180,
    totalMarks: 120,
    passingMarks: 40,
    isFree: true,
    sections: [
      {
        name: "Physics",
        displayOrder: 1,
        totalMarks: 40,
        questions: [
          {
            text: "The SI unit of electric current is:",
            marks: 4,
            negativeMarks: 1,
            difficulty: "EASY",
            explanation: "Ampere (A) is the SI unit of electric current.",
            options: [
              { text: "Volt", isCorrect: false },
              { text: "Ampere", isCorrect: true },
              { text: "Ohm", isCorrect: false },
              { text: "Watt", isCorrect: false },
            ],
          },
          {
            text: "A body is moving with a uniform velocity. Its acceleration is:",
            marks: 4,
            negativeMarks: 1,
            difficulty: "EASY",
            explanation:
              "Uniform velocity ⇒ no change in velocity ⇒ acceleration is zero.",
            options: [
              { text: "Zero", isCorrect: true },
              { text: "Positive", isCorrect: false },
              { text: "Negative", isCorrect: false },
              { text: "Infinite", isCorrect: false },
            ],
          },
        ],
      },
      {
        name: "Chemistry",
        displayOrder: 2,
        totalMarks: 40,
        questions: [
          {
            text: "The number of moles in 22 g of CO2 is:",
            marks: 4,
            negativeMarks: 1,
            difficulty: "MEDIUM",
            explanation: "Molar mass of CO2 = 44 g/mol. 22/44 = 0.5 mol.",
            options: [
              { text: "0.25", isCorrect: false },
              { text: "0.5", isCorrect: true },
              { text: "1", isCorrect: false },
              { text: "2", isCorrect: false },
            ],
          },
          {
            text: "Which of the following is an aromatic compound?",
            marks: 4,
            negativeMarks: 1,
            difficulty: "EASY",
            explanation: "Benzene is the prototypical aromatic compound.",
            options: [
              { text: "Cyclohexane", isCorrect: false },
              { text: "Benzene", isCorrect: true },
              { text: "Hexane", isCorrect: false },
              { text: "Ethene", isCorrect: false },
            ],
          },
        ],
      },
      {
        name: "Mathematics",
        displayOrder: 3,
        totalMarks: 40,
        questions: [
          {
            text: "The derivative of sin(x) with respect to x is:",
            marks: 4,
            negativeMarks: 1,
            difficulty: "EASY",
            explanation: "d/dx[sin(x)] = cos(x).",
            options: [
              { text: "cos(x)", isCorrect: true },
              { text: "-cos(x)", isCorrect: false },
              { text: "-sin(x)", isCorrect: false },
              { text: "tan(x)", isCorrect: false },
            ],
          },
          {
            text: "The value of ∫ 1 dx from 0 to 5 is:",
            marks: 4,
            negativeMarks: 1,
            difficulty: "EASY",
            explanation: "∫ 1 dx = x. Evaluated from 0 to 5 gives 5.",
            options: [
              { text: "0", isCorrect: false },
              { text: "1", isCorrect: false },
              { text: "5", isCorrect: true },
              { text: "10", isCorrect: false },
            ],
          },
        ],
      },
    ],
  },
};

// ---------- main ----------

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set. Please configure .env.");
  }
  console.log("🌱 Seeding QueztLearn database...\n");
  console.log("Database:", process.env.DATABASE_URL.replace(/:[^:@]*@/, ":***@"));
  console.log();

  console.log("Organization");
  const org = await seedOrganization();
  await seedOrganizationConfig(org.id);

  console.log("\nAdmin user");
  const admin = await seedAdminUser(org.id);

  console.log("\nTeachers");
  const teacherMap = await seedTeachers(org.id, TEACHER_SEEDS);

  console.log("\nBatches & content tree");
  await seedBatches(org.id, teacherMap, BATCH_SEEDS);

  console.log("\nTest series");
  await seedTestSeries(org.id, TEST_SERIES_SEED);

  console.log("\n✅ Seed completed.\n");
  console.log("── Login credentials ───────────────────────────────");
  console.log(`Organization : ${ORG_NAME}  (slug: ${ORG_SLUG}, id: ${org.id})`);
  console.log(`Admin email  : ${ADMIN_EMAIL}`);
  console.log(`Admin pass   : ${ADMIN_PASSWORD}`);
  console.log(`Admin id     : ${admin.id}`);
  console.log("────────────────────────────────────────────────────");
  console.log("Login via: POST /admin/auth/login  { email, password }");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\n❌ Seed failed:", err);
    process.exit(1);
  });
