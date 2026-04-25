import "dotenv/config";
import bcrypt from "bcrypt";
import { eq, and } from "drizzle-orm";
import type { ClassLevel, Exam } from "@academyx/shared";
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
  class: ClassLevel;
  exam: Exam;
  imageUrl?: string;
  startDate: Date;
  endDate: Date;
  language: string;
  totalPrice: number;
  discountPercentage: number;
  teacherNames: string[];
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
  exam: Exam;
  imageUrl?: string;
  totalPrice: number;
  discountPercentage: number;
  isFree: boolean;
  durationDays: number;
  tests: Array<{
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
  }>;
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

  let grandTotalQuestions = 0;

  for (const testSeed of seed.tests) {
    let test = await db.query.tests.findFirst({
      where: eq(tests.slug, testSeed.slug),
    });
    if (!test) {
      const [row] = await db
        .insert(tests)
        .values({
          testSeriesId: series.id,
          organizationId,
          title: testSeed.title,
          description: testSeed.description,
          slug: testSeed.slug,
          instructions: testSeed.instructions,
          durationMinutes: testSeed.durationMinutes,
          totalMarks: testSeed.totalMarks,
          passingMarks: testSeed.passingMarks,
          isFree: testSeed.isFree,
          isPublished: true,
          publishedAt: new Date(),
        })
        .returning();
      test = row;
      log(`  test ${testSeed.slug}`, "create");
    } else {
      log(`  test ${testSeed.slug}`, "exists");
    }

    let totalQuestions = 0;
    for (const sec of testSeed.sections) {
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

    await db
      .update(tests)
      .set({
        sectionCount: testSeed.sections.length,
        questionCount: totalQuestions,
        updatedAt: new Date(),
      })
      .where(eq(tests.id, test.id));

    grandTotalQuestions += totalQuestions;
  }

  await db
    .update(testSeries)
    .set({
      testCount: seed.tests.length,
      totalQuestions: grandTotalQuestions,
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

// ==================== JEE MAIN TEST SERIES ====================

const JEE_TEST_SERIES: TestSeriesSeed = {
  slug: "jee-main-mocks-2026",
  title: "JEE Main Mocks 2026",
  description:
    "<p>NTA-pattern full-length mocks for JEE Main 2026 with detailed solutions and performance analytics. Practice with realistic difficulty and marking scheme.</p>",
  exam: "JEE",
  totalPrice: 1999,
  discountPercentage: 50,
  isFree: false,
  durationDays: 365,
  tests: [
    {
      slug: "jee-main-mock-1",
      title: "JEE Main Mock Test #1",
      description:
        "<p>Full-length NTA-pattern mock covering Physics, Chemistry, and Mathematics. 90 questions, 300 marks, 3 hours.</p>",
      instructions: [
        "Total duration: 3 hours (180 minutes).",
        "+4 for each correct answer.",
        "-1 for each incorrect answer.",
        "No penalty for unattempted questions.",
        "Each section has 30 questions — 20 single-choice + 10 numerical (attempt any 5 of 10 numerical).",
      ],
      durationMinutes: 180,
      totalMarks: 300,
      passingMarks: 90,
      isFree: true,
      sections: [
        {
          name: "Physics",
          displayOrder: 1,
          totalMarks: 100,
          questions: [
            {
              text: "A projectile is launched at 60° with horizontal at 20 m/s. The range of the projectile is (g = 10 m/s²):",
              marks: 4, negativeMarks: 1, difficulty: "MEDIUM",
              explanation: "R = u²sin(2θ)/g = 400 × sin(120°)/10 = 400 × (√3/2)/10 = 20√3 ≈ 34.6 m.",
              options: [
                { text: "20√3 m", isCorrect: true },
                { text: "40 m", isCorrect: false },
                { text: "20 m", isCorrect: false },
                { text: "40√3 m", isCorrect: false },
              ],
            },
            {
              text: "The dimensional formula for Planck's constant is:",
              marks: 4, negativeMarks: 1, difficulty: "EASY",
              explanation: "E = hν → h = E/ν → [ML²T⁻²]/[T⁻¹] = [ML²T⁻¹].",
              options: [
                { text: "[ML²T⁻¹]", isCorrect: true },
                { text: "[MLT⁻¹]", isCorrect: false },
                { text: "[ML²T⁻²]", isCorrect: false },
                { text: "[ML²T⁻³]", isCorrect: false },
              ],
            },
            {
              text: "A block of mass 5 kg is placed on a frictionless incline of 30°. The normal force on the block is:",
              marks: 4, negativeMarks: 1, difficulty: "EASY",
              explanation: "N = mg cos(30°) = 5 × 10 × (√3/2) = 25√3 N ≈ 43.3 N.",
              options: [
                { text: "25√3 N", isCorrect: true },
                { text: "50 N", isCorrect: false },
                { text: "25 N", isCorrect: false },
                { text: "50√3 N", isCorrect: false },
              ],
            },
            {
              text: "Two identical charges of +2 μC are placed 30 cm apart. The electric field at the midpoint is:",
              marks: 4, negativeMarks: 1, difficulty: "MEDIUM",
              explanation: "At the midpoint, the fields from both charges are equal and opposite, cancelling out to zero.",
              options: [
                { text: "Zero", isCorrect: true },
                { text: "4 × 10⁵ N/C", isCorrect: false },
                { text: "8 × 10⁵ N/C", isCorrect: false },
                { text: "2 × 10⁵ N/C", isCorrect: false },
              ],
            },
            {
              text: "A capacitor of 6 μF is charged to 100 V. The energy stored is:",
              marks: 4, negativeMarks: 1, difficulty: "EASY",
              explanation: "U = ½CV² = ½ × 6×10⁻⁶ × 10000 = 0.03 J = 30 mJ.",
              options: [
                { text: "0.03 J", isCorrect: true },
                { text: "0.06 J", isCorrect: false },
                { text: "0.3 J", isCorrect: false },
                { text: "3 J", isCorrect: false },
              ],
            },
            {
              text: "In Young's double-slit experiment, the fringe width is 0.5 mm. If the wavelength is doubled, the new fringe width is:",
              marks: 4, negativeMarks: 1, difficulty: "MEDIUM",
              explanation: "β = λD/d. Doubling λ doubles β to 1.0 mm.",
              options: [
                { text: "1.0 mm", isCorrect: true },
                { text: "0.25 mm", isCorrect: false },
                { text: "0.5 mm", isCorrect: false },
                { text: "2.0 mm", isCorrect: false },
              ],
            },
            {
              text: "An electron is accelerated through a potential difference of 100 V. Its de Broglie wavelength is approximately:",
              marks: 4, negativeMarks: 1, difficulty: "HARD",
              explanation: "λ = 1.226/√V nm = 1.226/√100 = 0.1226 nm ≈ 1.23 Å.",
              options: [
                { text: "1.23 Å", isCorrect: true },
                { text: "12.3 Å", isCorrect: false },
                { text: "0.123 Å", isCorrect: false },
                { text: "123 Å", isCorrect: false },
              ],
            },
            {
              text: "The escape velocity from Earth's surface is approximately:",
              marks: 4, negativeMarks: 1, difficulty: "EASY",
              explanation: "v_e = √(2gR) ≈ √(2 × 10 × 6.4 × 10⁶) ≈ 11.2 km/s.",
              options: [
                { text: "11.2 km/s", isCorrect: true },
                { text: "7.9 km/s", isCorrect: false },
                { text: "8.5 km/s", isCorrect: false },
                { text: "3.2 km/s", isCorrect: false },
              ],
            },
            {
              text: "A wire of resistance 12 Ω is bent into a circle. The effective resistance between diametrically opposite points is:",
              marks: 4, negativeMarks: 1, difficulty: "MEDIUM",
              explanation: "Each half = 6 Ω. Parallel: 6×6/(6+6) = 3 Ω.",
              options: [
                { text: "3 Ω", isCorrect: true },
                { text: "6 Ω", isCorrect: false },
                { text: "12 Ω", isCorrect: false },
                { text: "24 Ω", isCorrect: false },
              ],
            },
            {
              text: "A nucleus with mass number A = 240 splits into two nuclei each with A = 120. The binding energy per nucleon increases from 7.6 MeV to 8.5 MeV. The energy released is:",
              marks: 4, negativeMarks: 1, difficulty: "HARD",
              explanation: "ΔE = 240 × (8.5 - 7.6) = 240 × 0.9 = 216 MeV.",
              options: [
                { text: "216 MeV", isCorrect: true },
                { text: "200 MeV", isCorrect: false },
                { text: "180 MeV", isCorrect: false },
                { text: "240 MeV", isCorrect: false },
              ],
            },
          ],
        },
        {
          name: "Chemistry",
          displayOrder: 2,
          totalMarks: 100,
          questions: [
            {
              text: "Which of the following has the highest lattice energy?",
              marks: 4, negativeMarks: 1, difficulty: "MEDIUM",
              explanation: "LiF has the smallest ions → highest lattice energy (charge/size ratio is maximum).",
              options: [
                { text: "LiF", isCorrect: true },
                { text: "NaCl", isCorrect: false },
                { text: "KBr", isCorrect: false },
                { text: "CsI", isCorrect: false },
              ],
            },
            {
              text: "The hybridization of Xe in XeF₄ is:",
              marks: 4, negativeMarks: 1, difficulty: "MEDIUM",
              explanation: "Xe in XeF₄ has 4 bond pairs + 2 lone pairs = 6 electron pairs → sp³d² hybridization.",
              options: [
                { text: "sp³d²", isCorrect: true },
                { text: "sp³d", isCorrect: false },
                { text: "sp³", isCorrect: false },
                { text: "dsp³", isCorrect: false },
              ],
            },
            {
              text: "The IUPAC name of CH₃CH(OH)CH₂CHO is:",
              marks: 4, negativeMarks: 1, difficulty: "MEDIUM",
              explanation: "4-carbon chain with -OH at C3 and -CHO at C1 → 3-Hydroxybutanal.",
              options: [
                { text: "3-Hydroxybutanal", isCorrect: true },
                { text: "2-Hydroxybutanal", isCorrect: false },
                { text: "4-Hydroxybutanone", isCorrect: false },
                { text: "3-Oxobutanol", isCorrect: false },
              ],
            },
            {
              text: "For the reaction 2A + B → C, if the rate = k[A]²[B], what is the overall order?",
              marks: 4, negativeMarks: 1, difficulty: "EASY",
              explanation: "Order = 2 + 1 = 3 (sum of exponents).",
              options: [
                { text: "3", isCorrect: true },
                { text: "2", isCorrect: false },
                { text: "1", isCorrect: false },
                { text: "4", isCorrect: false },
              ],
            },
            {
              text: "Which molecule is optically active?",
              marks: 4, negativeMarks: 1, difficulty: "MEDIUM",
              explanation: "2-Butanol (CH₃CH(OH)CH₂CH₃) has a chiral center at C2.",
              options: [
                { text: "2-Butanol", isCorrect: true },
                { text: "2-Propanol", isCorrect: false },
                { text: "Diethyl ether", isCorrect: false },
                { text: "Acetone", isCorrect: false },
              ],
            },
            {
              text: "The pH of 0.001 M HCl solution is:",
              marks: 4, negativeMarks: 1, difficulty: "EASY",
              explanation: "HCl is a strong acid. pH = -log[H⁺] = -log(10⁻³) = 3.",
              options: [
                { text: "3", isCorrect: true },
                { text: "11", isCorrect: false },
                { text: "4", isCorrect: false },
                { text: "2", isCorrect: false },
              ],
            },
            {
              text: "The coordination number of Fe in [Fe(CN)₆]⁴⁻ is:",
              marks: 4, negativeMarks: 1, difficulty: "EASY",
              explanation: "CN⁻ is a monodentate ligand; 6 CN⁻ → coordination number = 6.",
              options: [
                { text: "6", isCorrect: true },
                { text: "4", isCorrect: false },
                { text: "2", isCorrect: false },
                { text: "8", isCorrect: false },
              ],
            },
            {
              text: "Which of the following is the most stable carbocation?",
              marks: 4, negativeMarks: 1, difficulty: "MEDIUM",
              explanation: "Benzyl carbocation is stabilized by resonance with the aromatic ring.",
              options: [
                { text: "(C₆H₅)CH₂⁺ (benzyl)", isCorrect: true },
                { text: "CH₃⁺ (methyl)", isCorrect: false },
                { text: "(CH₃)₂CH⁺ (isopropyl)", isCorrect: false },
                { text: "CH₃CH₂⁺ (ethyl)", isCorrect: false },
              ],
            },
            {
              text: "The number of σ and π bonds in CH₂=CH–CH=CH₂ is:",
              marks: 4, negativeMarks: 1, difficulty: "MEDIUM",
              explanation: "σ bonds: 3 C-C + 6 C-H = 9. π bonds: 2 (from two C=C).",
              options: [
                { text: "9σ, 2π", isCorrect: true },
                { text: "8σ, 2π", isCorrect: false },
                { text: "9σ, 3π", isCorrect: false },
                { text: "10σ, 2π", isCorrect: false },
              ],
            },
            {
              text: "Which gas is released when Na₂CO₃ reacts with dilute HCl?",
              marks: 4, negativeMarks: 1, difficulty: "EASY",
              explanation: "Na₂CO₃ + 2HCl → 2NaCl + H₂O + CO₂↑",
              options: [
                { text: "CO₂", isCorrect: true },
                { text: "O₂", isCorrect: false },
                { text: "H₂", isCorrect: false },
                { text: "Cl₂", isCorrect: false },
              ],
            },
          ],
        },
        {
          name: "Mathematics",
          displayOrder: 3,
          totalMarks: 100,
          questions: [
            {
              text: "The value of lim(x→0) (sin 3x)/(2x) is:",
              marks: 4, negativeMarks: 1, difficulty: "EASY",
              explanation: "lim(x→0) sin(3x)/(2x) = (3/2) × lim(x→0) sin(3x)/(3x) = 3/2.",
              options: [
                { text: "3/2", isCorrect: true },
                { text: "2/3", isCorrect: false },
                { text: "1", isCorrect: false },
                { text: "0", isCorrect: false },
              ],
            },
            {
              text: "If f(x) = x³ - 3x² + 2, then f'(1) equals:",
              marks: 4, negativeMarks: 1, difficulty: "EASY",
              explanation: "f'(x) = 3x² - 6x. f'(1) = 3 - 6 = -3.",
              options: [
                { text: "-3", isCorrect: true },
                { text: "3", isCorrect: false },
                { text: "0", isCorrect: false },
                { text: "-6", isCorrect: false },
              ],
            },
            {
              text: "The number of ways to arrange the letters of MISSISSIPPI is:",
              marks: 4, negativeMarks: 1, difficulty: "HARD",
              explanation: "11!/(4!4!2!1!) = 34650.",
              options: [
                { text: "34650", isCorrect: true },
                { text: "39916800", isCorrect: false },
                { text: "11880", isCorrect: false },
                { text: "69300", isCorrect: false },
              ],
            },
            {
              text: "The sum of the first 20 terms of an AP with a = 3 and d = 2 is:",
              marks: 4, negativeMarks: 1, difficulty: "EASY",
              explanation: "S = n/2 × [2a + (n-1)d] = 20/2 × [6 + 38] = 10 × 44 = 440.",
              options: [
                { text: "440", isCorrect: true },
                { text: "420", isCorrect: false },
                { text: "400", isCorrect: false },
                { text: "460", isCorrect: false },
              ],
            },
            {
              text: "∫₀^π sin²x dx equals:",
              marks: 4, negativeMarks: 1, difficulty: "MEDIUM",
              explanation: "∫₀^π sin²x dx = π/2 (using the identity sin²x = (1-cos2x)/2).",
              options: [
                { text: "π/2", isCorrect: true },
                { text: "π", isCorrect: false },
                { text: "0", isCorrect: false },
                { text: "π/4", isCorrect: false },
              ],
            },
            {
              text: "The eccentricity of the ellipse x²/25 + y²/16 = 1 is:",
              marks: 4, negativeMarks: 1, difficulty: "MEDIUM",
              explanation: "a² = 25, b² = 16. e = √(1 - b²/a²) = √(1 - 16/25) = √(9/25) = 3/5.",
              options: [
                { text: "3/5", isCorrect: true },
                { text: "4/5", isCorrect: false },
                { text: "5/3", isCorrect: false },
                { text: "√5/5", isCorrect: false },
              ],
            },
            {
              text: "The general solution of dy/dx = y/x is:",
              marks: 4, negativeMarks: 1, difficulty: "MEDIUM",
              explanation: "Separating variables: dy/y = dx/x → ln|y| = ln|x| + C → y = Cx.",
              options: [
                { text: "y = Cx", isCorrect: true },
                { text: "y = x + C", isCorrect: false },
                { text: "y = Ce^x", isCorrect: false },
                { text: "y = x²/2 + C", isCorrect: false },
              ],
            },
            {
              text: "The value of ³C₂ + ⁴C₂ + ⁵C₂ is:",
              marks: 4, negativeMarks: 1, difficulty: "EASY",
              explanation: "3 + 6 + 10 = 19.",
              options: [
                { text: "19", isCorrect: true },
                { text: "15", isCorrect: false },
                { text: "20", isCorrect: false },
                { text: "18", isCorrect: false },
              ],
            },
            {
              text: "If A is a 3×3 matrix with |A| = 5, then |3A| equals:",
              marks: 4, negativeMarks: 1, difficulty: "MEDIUM",
              explanation: "|kA| = k^n × |A| for n×n matrix. |3A| = 3³ × 5 = 135.",
              options: [
                { text: "135", isCorrect: true },
                { text: "15", isCorrect: false },
                { text: "45", isCorrect: false },
                { text: "27", isCorrect: false },
              ],
            },
            {
              text: "The distance between the parallel lines 3x + 4y = 7 and 3x + 4y = 12 is:",
              marks: 4, negativeMarks: 1, difficulty: "EASY",
              explanation: "d = |c₁ - c₂|/√(a² + b²) = |7 - 12|/√(9 + 16) = 5/5 = 1.",
              options: [
                { text: "1", isCorrect: true },
                { text: "5", isCorrect: false },
                { text: "5/7", isCorrect: false },
                { text: "7/5", isCorrect: false },
              ],
            },
          ],
        },
      ],
    },
    {
      slug: "jee-main-mock-2",
      title: "JEE Main Mock Test #2",
      description:
        "<p>Second full-length NTA-pattern mock with slightly higher difficulty. Focus on application-based problems.</p>",
      instructions: [
        "Total duration: 3 hours (180 minutes).",
        "+4 for each correct answer, -1 for each incorrect answer.",
        "No penalty for unattempted questions.",
      ],
      durationMinutes: 180,
      totalMarks: 300,
      passingMarks: 100,
      isFree: false,
      sections: [
        {
          name: "Physics",
          displayOrder: 1,
          totalMarks: 100,
          questions: [
            {
              text: "A particle moves in a circle of radius 2 m with constant speed 4 m/s. The centripetal acceleration is:",
              marks: 4, negativeMarks: 1, difficulty: "EASY",
              explanation: "a = v²/r = 16/2 = 8 m/s².",
              options: [
                { text: "8 m/s²", isCorrect: true },
                { text: "2 m/s²", isCorrect: false },
                { text: "4 m/s²", isCorrect: false },
                { text: "16 m/s²", isCorrect: false },
              ],
            },
            {
              text: "The work function of a metal is 4.2 eV. The threshold wavelength for photoelectric emission is:",
              marks: 4, negativeMarks: 1, difficulty: "MEDIUM",
              explanation: "λ₀ = hc/φ = (6.63×10⁻³⁴ × 3×10⁸)/(4.2 × 1.6×10⁻¹⁹) ≈ 2955 Å ≈ 295.5 nm.",
              options: [
                { text: "295.5 nm", isCorrect: true },
                { text: "590 nm", isCorrect: false },
                { text: "420 nm", isCorrect: false },
                { text: "150 nm", isCorrect: false },
              ],
            },
            {
              text: "A ball is thrown vertically up with velocity 30 m/s. The maximum height reached is (g = 10 m/s²):",
              marks: 4, negativeMarks: 1, difficulty: "EASY",
              explanation: "H = u²/2g = 900/20 = 45 m.",
              options: [
                { text: "45 m", isCorrect: true },
                { text: "30 m", isCorrect: false },
                { text: "90 m", isCorrect: false },
                { text: "60 m", isCorrect: false },
              ],
            },
            {
              text: "The magnetic flux through a coil is changing at rate 0.05 Wb/s. The induced EMF is:",
              marks: 4, negativeMarks: 1, difficulty: "EASY",
              explanation: "By Faraday's law, |EMF| = dΦ/dt = 0.05 V = 50 mV.",
              options: [
                { text: "50 mV", isCorrect: true },
                { text: "5 mV", isCorrect: false },
                { text: "500 mV", isCorrect: false },
                { text: "0.5 mV", isCorrect: false },
              ],
            },
            {
              text: "A transformer has 200 primary turns and 1000 secondary turns. For 220 V input, the output voltage is:",
              marks: 4, negativeMarks: 1, difficulty: "MEDIUM",
              explanation: "V_s/V_p = N_s/N_p → V_s = 220 × 1000/200 = 1100 V.",
              options: [
                { text: "1100 V", isCorrect: true },
                { text: "44 V", isCorrect: false },
                { text: "550 V", isCorrect: false },
                { text: "2200 V", isCorrect: false },
              ],
            },
            {
              text: "The moment of inertia of a solid sphere about its diameter is:",
              marks: 4, negativeMarks: 1, difficulty: "EASY",
              explanation: "I = (2/5)MR² for a solid sphere about diameter.",
              options: [
                { text: "2MR²/5", isCorrect: true },
                { text: "MR²/2", isCorrect: false },
                { text: "2MR²/3", isCorrect: false },
                { text: "MR²", isCorrect: false },
              ],
            },
            {
              text: "In an AC circuit with only an inductor, the current:",
              marks: 4, negativeMarks: 1, difficulty: "MEDIUM",
              explanation: "In a purely inductive circuit, current lags voltage by π/2.",
              options: [
                { text: "Lags the voltage by π/2", isCorrect: true },
                { text: "Leads the voltage by π/2", isCorrect: false },
                { text: "Is in phase with voltage", isCorrect: false },
                { text: "Leads the voltage by π", isCorrect: false },
              ],
            },
            {
              text: "The refractive index of glass is 1.5. The critical angle for total internal reflection is:",
              marks: 4, negativeMarks: 1, difficulty: "MEDIUM",
              explanation: "sin(C) = 1/μ = 1/1.5 = 2/3 → C ≈ 41.8°.",
              options: [
                { text: "41.8°", isCorrect: true },
                { text: "30°", isCorrect: false },
                { text: "45°", isCorrect: false },
                { text: "60°", isCorrect: false },
              ],
            },
          ],
        },
        {
          name: "Chemistry",
          displayOrder: 2,
          totalMarks: 100,
          questions: [
            {
              text: "The bond angle in H₂O is approximately:",
              marks: 4, negativeMarks: 1, difficulty: "EASY",
              explanation: "Due to 2 lone pairs repelling the bonding pairs, the angle is 104.5°.",
              options: [
                { text: "104.5°", isCorrect: true },
                { text: "109.5°", isCorrect: false },
                { text: "120°", isCorrect: false },
                { text: "90°", isCorrect: false },
              ],
            },
            {
              text: "Which of the following shows a positive Tollen's test?",
              marks: 4, negativeMarks: 1, difficulty: "MEDIUM",
              explanation: "Tollen's test detects aldehydes. Acetaldehyde is an aldehyde.",
              options: [
                { text: "Acetaldehyde", isCorrect: true },
                { text: "Acetone", isCorrect: false },
                { text: "Acetic acid", isCorrect: false },
                { text: "Ethanol", isCorrect: false },
              ],
            },
            {
              text: "The quantum numbers for the outermost electron in sodium (Z=11) are:",
              marks: 4, negativeMarks: 1, difficulty: "MEDIUM",
              explanation: "Na: 1s²2s²2p⁶3s¹ → last electron: n=3, l=0, ml=0, ms=+1/2.",
              options: [
                { text: "n=3, l=0, ml=0, ms=+½", isCorrect: true },
                { text: "n=3, l=1, ml=0, ms=+½", isCorrect: false },
                { text: "n=2, l=1, ml=1, ms=-½", isCorrect: false },
                { text: "n=3, l=2, ml=0, ms=+½", isCorrect: false },
              ],
            },
            {
              text: "The electrode potential of SHE (Standard Hydrogen Electrode) is defined as:",
              marks: 4, negativeMarks: 1, difficulty: "EASY",
              explanation: "By convention, the SHE potential is defined as 0.00 V.",
              options: [
                { text: "0.00 V", isCorrect: true },
                { text: "1.00 V", isCorrect: false },
                { text: "-1.00 V", isCorrect: false },
                { text: "0.50 V", isCorrect: false },
              ],
            },
            {
              text: "Which reaction represents the Friedel-Crafts acylation?",
              marks: 4, negativeMarks: 1, difficulty: "MEDIUM",
              explanation: "FC acylation uses RCOCl with AlCl₃ catalyst on benzene.",
              options: [
                { text: "C₆H₆ + CH₃COCl → C₆H₅COCH₃ + HCl (AlCl₃ catalyst)", isCorrect: true },
                { text: "C₆H₆ + CH₃Cl → C₆H₅CH₃ + HCl (AlCl₃ catalyst)", isCorrect: false },
                { text: "C₆H₆ + HNO₃ → C₆H₅NO₂ + H₂O (H₂SO₄ catalyst)", isCorrect: false },
                { text: "C₆H₆ + Br₂ → C₆H₅Br + HBr (FeBr₃ catalyst)", isCorrect: false },
              ],
            },
            {
              text: "The shape of SF₆ molecule is:",
              marks: 4, negativeMarks: 1, difficulty: "EASY",
              explanation: "SF₆ has 6 bond pairs and 0 lone pairs → octahedral.",
              options: [
                { text: "Octahedral", isCorrect: true },
                { text: "Trigonal bipyramidal", isCorrect: false },
                { text: "Square planar", isCorrect: false },
                { text: "Tetrahedral", isCorrect: false },
              ],
            },
            {
              text: "The number of unpaired electrons in Fe²⁺ (Z=26) is:",
              marks: 4, negativeMarks: 1, difficulty: "MEDIUM",
              explanation: "Fe²⁺: [Ar]3d⁶ → high spin has 4 unpaired electrons.",
              options: [
                { text: "4", isCorrect: true },
                { text: "2", isCorrect: false },
                { text: "5", isCorrect: false },
                { text: "0", isCorrect: false },
              ],
            },
            {
              text: "The colligative property that depends on the number of solute particles is:",
              marks: 4, negativeMarks: 1, difficulty: "EASY",
              explanation: "All colligative properties depend on solute particles. Boiling point elevation is one such property.",
              options: [
                { text: "All of the above", isCorrect: true },
                { text: "Boiling point elevation only", isCorrect: false },
                { text: "Osmotic pressure only", isCorrect: false },
                { text: "Freezing point depression only", isCorrect: false },
              ],
            },
          ],
        },
        {
          name: "Mathematics",
          displayOrder: 3,
          totalMarks: 100,
          questions: [
            {
              text: "The value of det(A) where A = [[1,2],[3,4]] is:",
              marks: 4, negativeMarks: 1, difficulty: "EASY",
              explanation: "det(A) = 1×4 - 2×3 = 4 - 6 = -2.",
              options: [
                { text: "-2", isCorrect: true },
                { text: "2", isCorrect: false },
                { text: "10", isCorrect: false },
                { text: "-10", isCorrect: false },
              ],
            },
            {
              text: "The number of real roots of x⁴ + x² + 1 = 0 is:",
              marks: 4, negativeMarks: 1, difficulty: "MEDIUM",
              explanation: "Let t = x². Then t² + t + 1 = 0 → discriminant = 1 - 4 = -3 < 0. No real roots for t, hence no real roots for x.",
              options: [
                { text: "0", isCorrect: true },
                { text: "2", isCorrect: false },
                { text: "4", isCorrect: false },
                { text: "1", isCorrect: false },
              ],
            },
            {
              text: "The vector projection of a = 2i + 3j + k onto b = i + j + k is:",
              marks: 4, negativeMarks: 1, difficulty: "MEDIUM",
              explanation: "Scalar projection = (a·b)/|b| = (2+3+1)/√3 = 6/√3 = 2√3.",
              options: [
                { text: "2√3", isCorrect: true },
                { text: "√3", isCorrect: false },
                { text: "6", isCorrect: false },
                { text: "6/√3", isCorrect: false },
              ],
            },
            {
              text: "If P(A) = 0.4 and P(B) = 0.3 and A, B are independent, then P(A ∩ B) is:",
              marks: 4, negativeMarks: 1, difficulty: "EASY",
              explanation: "For independent events: P(A ∩ B) = P(A) × P(B) = 0.4 × 0.3 = 0.12.",
              options: [
                { text: "0.12", isCorrect: true },
                { text: "0.7", isCorrect: false },
                { text: "0.1", isCorrect: false },
                { text: "0.3", isCorrect: false },
              ],
            },
            {
              text: "The area bounded by y = x², x-axis, x = 0, and x = 3 is:",
              marks: 4, negativeMarks: 1, difficulty: "EASY",
              explanation: "A = ∫₀³ x² dx = [x³/3]₀³ = 27/3 = 9.",
              options: [
                { text: "9", isCorrect: true },
                { text: "27", isCorrect: false },
                { text: "3", isCorrect: false },
                { text: "18", isCorrect: false },
              ],
            },
            {
              text: "The equation of tangent to y = x² at (1, 1) is:",
              marks: 4, negativeMarks: 1, difficulty: "EASY",
              explanation: "dy/dx = 2x. At (1,1), slope = 2. Tangent: y - 1 = 2(x - 1) → y = 2x - 1.",
              options: [
                { text: "y = 2x - 1", isCorrect: true },
                { text: "y = x", isCorrect: false },
                { text: "y = 2x + 1", isCorrect: false },
                { text: "y = x - 1", isCorrect: false },
              ],
            },
            {
              text: "The radius of convergence of Σ xⁿ/n! is:",
              marks: 4, negativeMarks: 1, difficulty: "HARD",
              explanation: "By ratio test: lim|a_{n+1}/a_n| = lim|x/(n+1)| = 0 for all x → R = ∞.",
              options: [
                { text: "∞", isCorrect: true },
                { text: "1", isCorrect: false },
                { text: "0", isCorrect: false },
                { text: "e", isCorrect: false },
              ],
            },
            {
              text: "The inverse of the function f(x) = (2x+3)/(x-1) is:",
              marks: 4, negativeMarks: 1, difficulty: "MEDIUM",
              explanation: "y = (2x+3)/(x-1) → y(x-1) = 2x+3 → yx - y = 2x + 3 → x(y-2) = y+3 → x = (y+3)/(y-2).",
              options: [
                { text: "f⁻¹(x) = (x+3)/(x-2)", isCorrect: true },
                { text: "f⁻¹(x) = (x-3)/(x+2)", isCorrect: false },
                { text: "f⁻¹(x) = (2x-3)/(x+1)", isCorrect: false },
                { text: "f⁻¹(x) = (x-1)/(2x+3)", isCorrect: false },
              ],
            },
          ],
        },
      ],
    },
    {
      slug: "jee-main-mock-3",
      title: "JEE Main Mock Test #3 — Advanced Level",
      description:
        "<p>Challenging mock test with emphasis on multi-concept and application-based problems for advanced JEE preparation.</p>",
      instructions: [
        "Total duration: 3 hours (180 minutes).",
        "+4 for correct, -1 for incorrect. No negative marking for unattempted.",
        "This test has higher difficulty than regular mocks.",
      ],
      durationMinutes: 180,
      totalMarks: 300,
      passingMarks: 110,
      isFree: false,
      sections: [
        {
          name: "Physics",
          displayOrder: 1,
          totalMarks: 100,
          questions: [
            {
              text: "A satellite orbits Earth at height h = R (R = Earth's radius). Its orbital velocity is:",
              marks: 4, negativeMarks: 1, difficulty: "MEDIUM",
              explanation: "v = √(gR²/(R+h)) = √(gR/2). With g = 10, R = 6400 km: v ≈ 5.6 km/s.",
              options: [
                { text: "v₀/√2 where v₀ is orbital velocity at surface", isCorrect: true },
                { text: "v₀/2", isCorrect: false },
                { text: "v₀", isCorrect: false },
                { text: "2v₀", isCorrect: false },
              ],
            },
            {
              text: "Two masses 3 kg and 5 kg are connected by a string over a frictionless pulley. The acceleration of the system is (g = 10 m/s²):",
              marks: 4, negativeMarks: 1, difficulty: "MEDIUM",
              explanation: "a = (m₂ - m₁)g/(m₁ + m₂) = (5-3)×10/(5+3) = 20/8 = 2.5 m/s².",
              options: [
                { text: "2.5 m/s²", isCorrect: true },
                { text: "5 m/s²", isCorrect: false },
                { text: "1.25 m/s²", isCorrect: false },
                { text: "10 m/s²", isCorrect: false },
              ],
            },
            {
              text: "The rms speed of gas molecules at temperature T is proportional to:",
              marks: 4, negativeMarks: 1, difficulty: "EASY",
              explanation: "v_rms = √(3kT/m) ∝ √T.",
              options: [
                { text: "√T", isCorrect: true },
                { text: "T", isCorrect: false },
                { text: "T²", isCorrect: false },
                { text: "1/T", isCorrect: false },
              ],
            },
            {
              text: "A convex lens of focal length 20 cm forms a real image at 60 cm from the lens. The object distance is:",
              marks: 4, negativeMarks: 1, difficulty: "MEDIUM",
              explanation: "1/f = 1/v - 1/u → 1/20 = 1/60 - 1/u → 1/u = 1/60 - 1/20 = -2/60 → u = -30 cm.",
              options: [
                { text: "30 cm", isCorrect: true },
                { text: "20 cm", isCorrect: false },
                { text: "40 cm", isCorrect: false },
                { text: "60 cm", isCorrect: false },
              ],
            },
            {
              text: "The time period of a simple pendulum of length 1 m on a planet where g = 5 m/s² is:",
              marks: 4, negativeMarks: 1, difficulty: "EASY",
              explanation: "T = 2π√(L/g) = 2π√(1/5) = 2π/√5 ≈ 2.81 s.",
              options: [
                { text: "2π/√5 s", isCorrect: true },
                { text: "2π s", isCorrect: false },
                { text: "π s", isCorrect: false },
                { text: "π/√5 s", isCorrect: false },
              ],
            },
            {
              text: "A conducting loop of resistance 10 Ω is placed in a magnetic field. If the flux changes from 5 Wb to 2 Wb in 0.1 s, the induced current is:",
              marks: 4, negativeMarks: 1, difficulty: "MEDIUM",
              explanation: "EMF = |ΔΦ/Δt| = |(-3)/0.1| = 30 V. I = EMF/R = 30/10 = 3 A.",
              options: [
                { text: "3 A", isCorrect: true },
                { text: "30 A", isCorrect: false },
                { text: "0.3 A", isCorrect: false },
                { text: "10 A", isCorrect: false },
              ],
            },
          ],
        },
        {
          name: "Chemistry",
          displayOrder: 2,
          totalMarks: 100,
          questions: [
            {
              text: "The correct order of first ionization energy is:",
              marks: 4, negativeMarks: 1, difficulty: "MEDIUM",
              explanation: "B < Be < N < O follows periodic trend with the anomaly at N (half-filled stability).",
              options: [
                { text: "B < Be < C < N", isCorrect: true },
                { text: "N < C < Be < B", isCorrect: false },
                { text: "Be < B < C < N", isCorrect: false },
                { text: "C < B < N < Be", isCorrect: false },
              ],
            },
            {
              text: "How many stereoisomers does 2-bromo-3-chlorobutane have?",
              marks: 4, negativeMarks: 1, difficulty: "HARD",
              explanation: "2 chiral centers, no meso form → 2² = 4 stereoisomers (2 pairs of enantiomers).",
              options: [
                { text: "4", isCorrect: true },
                { text: "2", isCorrect: false },
                { text: "3", isCorrect: false },
                { text: "8", isCorrect: false },
              ],
            },
            {
              text: "The standard Gibbs free energy change for a spontaneous reaction at equilibrium is:",
              marks: 4, negativeMarks: 1, difficulty: "EASY",
              explanation: "At equilibrium, ΔG = 0 (not ΔG°). At equilibrium ΔG° = -RTlnK.",
              options: [
                { text: "ΔG = 0", isCorrect: true },
                { text: "ΔG° = 0", isCorrect: false },
                { text: "ΔG > 0", isCorrect: false },
                { text: "ΔG < 0", isCorrect: false },
              ],
            },
            {
              text: "Which reagent converts a carboxylic acid to an acyl chloride?",
              marks: 4, negativeMarks: 1, difficulty: "EASY",
              explanation: "SOCl₂ (thionyl chloride) converts RCOOH → RCOCl + SO₂ + HCl.",
              options: [
                { text: "SOCl₂", isCorrect: true },
                { text: "NaOH", isCorrect: false },
                { text: "H₂SO₄", isCorrect: false },
                { text: "KMnO₄", isCorrect: false },
              ],
            },
            {
              text: "Which of the following is a biodegradable polymer?",
              marks: 4, negativeMarks: 1, difficulty: "EASY",
              explanation: "PHBV (Poly-β-hydroxybutyrate-co-β-hydroxyvalerate) is biodegradable.",
              options: [
                { text: "PHBV", isCorrect: true },
                { text: "PVC", isCorrect: false },
                { text: "Polystyrene", isCorrect: false },
                { text: "Teflon", isCorrect: false },
              ],
            },
            {
              text: "The ore of aluminum that is purified by Bayer's process is:",
              marks: 4, negativeMarks: 1, difficulty: "EASY",
              explanation: "Bayer's process is used to purify bauxite (Al₂O₃·2H₂O).",
              options: [
                { text: "Bauxite", isCorrect: true },
                { text: "Cryolite", isCorrect: false },
                { text: "Corundum", isCorrect: false },
                { text: "Feldspar", isCorrect: false },
              ],
            },
          ],
        },
        {
          name: "Mathematics",
          displayOrder: 3,
          totalMarks: 100,
          questions: [
            {
              text: "The number of onto functions from a set of 4 elements to a set of 2 elements is:",
              marks: 4, negativeMarks: 1, difficulty: "MEDIUM",
              explanation: "Total functions = 2⁴ = 16. Non-onto = 2 (all to one element). Onto = 16 - 2 = 14.",
              options: [
                { text: "14", isCorrect: true },
                { text: "16", isCorrect: false },
                { text: "8", isCorrect: false },
                { text: "12", isCorrect: false },
              ],
            },
            {
              text: "The angle between vectors a = i + j and b = j + k is:",
              marks: 4, negativeMarks: 1, difficulty: "MEDIUM",
              explanation: "cos θ = (a·b)/(|a||b|) = 1/(√2 × √2) = 1/2 → θ = 60°.",
              options: [
                { text: "60°", isCorrect: true },
                { text: "90°", isCorrect: false },
                { text: "45°", isCorrect: false },
                { text: "30°", isCorrect: false },
              ],
            },
            {
              text: "The maximum value of sin x + cos x is:",
              marks: 4, negativeMarks: 1, difficulty: "EASY",
              explanation: "sin x + cos x = √2 sin(x + π/4). Maximum = √2.",
              options: [
                { text: "√2", isCorrect: true },
                { text: "2", isCorrect: false },
                { text: "1", isCorrect: false },
                { text: "√3", isCorrect: false },
              ],
            },
            {
              text: "The locus of the midpoint of chords of the circle x² + y² = 25 that subtend 90° at the origin is:",
              marks: 4, negativeMarks: 1, difficulty: "HARD",
              explanation: "For a chord subtending 90° at center of circle r²: midpoint lies on x² + y² = r²/2 = 25/2.",
              options: [
                { text: "x² + y² = 25/2", isCorrect: true },
                { text: "x² + y² = 25", isCorrect: false },
                { text: "x² + y² = 50", isCorrect: false },
                { text: "x² + y² = 12.5", isCorrect: false },
              ],
            },
            {
              text: "If f(x) = |x - 1| + |x - 2|, the minimum value of f(x) is:",
              marks: 4, negativeMarks: 1, difficulty: "MEDIUM",
              explanation: "For 1 ≤ x ≤ 2: f(x) = (x-1) + (2-x) = 1. Minimum = 1.",
              options: [
                { text: "1", isCorrect: true },
                { text: "0", isCorrect: false },
                { text: "2", isCorrect: false },
                { text: "3", isCorrect: false },
              ],
            },
            {
              text: "The coefficient of x³ in (1 + x)¹⁰ is:",
              marks: 4, negativeMarks: 1, difficulty: "EASY",
              explanation: "C(10,3) = 10!/(3!7!) = 120.",
              options: [
                { text: "120", isCorrect: true },
                { text: "210", isCorrect: false },
                { text: "45", isCorrect: false },
                { text: "252", isCorrect: false },
              ],
            },
          ],
        },
      ],
    },
  ],
};

// ==================== NEET TEST SERIES ====================

const NEET_TEST_SERIES: TestSeriesSeed = {
  slug: "neet-2026-mocks",
  title: "NEET 2026 Full-Length Mocks",
  description:
    "<p>NTA-pattern NEET mock tests with Physics, Chemistry, and Biology. 200 questions, 720 marks, 200 minutes per test. Detailed solutions and performance analysis included.</p>",
  exam: "NEET",
  totalPrice: 1499,
  discountPercentage: 40,
  isFree: false,
  durationDays: 365,
  tests: [
    {
      slug: "neet-mock-1",
      title: "NEET Mock Test #1",
      description:
        "<p>Full-length NEET mock with balanced coverage across Physics, Chemistry, and Biology (Botany + Zoology).</p>",
      instructions: [
        "Total duration: 200 minutes (3 hours 20 minutes).",
        "+4 for each correct answer.",
        "-1 for each incorrect answer.",
        "No penalty for unattempted questions.",
        "Physics: 45 Qs | Chemistry: 45 Qs | Biology: 90 Qs (Botany 45 + Zoology 45).",
      ],
      durationMinutes: 200,
      totalMarks: 720,
      passingMarks: 300,
      isFree: true,
      sections: [
        {
          name: "Physics",
          displayOrder: 1,
          totalMarks: 180,
          questions: [
            {
              text: "The SI unit of electric current is:",
              marks: 4, negativeMarks: 1, difficulty: "EASY",
              explanation: "Ampere (A) is the SI base unit of electric current.",
              options: [
                { text: "Ampere", isCorrect: true },
                { text: "Volt", isCorrect: false },
                { text: "Coulomb", isCorrect: false },
                { text: "Ohm", isCorrect: false },
              ],
            },
            {
              text: "A body falls freely from rest. The distance covered in the 3rd second is (g = 10 m/s²):",
              marks: 4, negativeMarks: 1, difficulty: "MEDIUM",
              explanation: "Distance in nth second = u + g(2n-1)/2 = 0 + 10(5)/2 = 25 m.",
              options: [
                { text: "25 m", isCorrect: true },
                { text: "30 m", isCorrect: false },
                { text: "20 m", isCorrect: false },
                { text: "15 m", isCorrect: false },
              ],
            },
            {
              text: "The power of a lens with focal length 25 cm is:",
              marks: 4, negativeMarks: 1, difficulty: "EASY",
              explanation: "P = 1/f(m) = 1/0.25 = +4 D.",
              options: [
                { text: "+4 D", isCorrect: true },
                { text: "+0.25 D", isCorrect: false },
                { text: "-4 D", isCorrect: false },
                { text: "+25 D", isCorrect: false },
              ],
            },
            {
              text: "The kinetic energy of a body is doubled. Its momentum becomes:",
              marks: 4, negativeMarks: 1, difficulty: "MEDIUM",
              explanation: "KE = p²/2m → p = √(2mKE). If KE doubles, p becomes √2 times.",
              options: [
                { text: "√2 times", isCorrect: true },
                { text: "2 times", isCorrect: false },
                { text: "4 times", isCorrect: false },
                { text: "½ times", isCorrect: false },
              ],
            },
            {
              text: "Bernoulli's theorem is based on conservation of:",
              marks: 4, negativeMarks: 1, difficulty: "EASY",
              explanation: "Bernoulli's equation is derived from conservation of energy for flowing fluids.",
              options: [
                { text: "Energy", isCorrect: true },
                { text: "Mass", isCorrect: false },
                { text: "Momentum", isCorrect: false },
                { text: "Angular momentum", isCorrect: false },
              ],
            },
            {
              text: "The wavelength of maximum energy in the radiation from the Sun (T = 6000 K) is approximately:",
              marks: 4, negativeMarks: 1, difficulty: "MEDIUM",
              explanation: "By Wien's law: λ_max = b/T = 2.898×10⁻³/6000 ≈ 483 nm ≈ 500 nm.",
              options: [
                { text: "500 nm", isCorrect: true },
                { text: "600 nm", isCorrect: false },
                { text: "300 nm", isCorrect: false },
                { text: "700 nm", isCorrect: false },
              ],
            },
            {
              text: "A wire of length L and resistance R is stretched to double its length. Its new resistance is:",
              marks: 4, negativeMarks: 1, difficulty: "MEDIUM",
              explanation: "R ∝ L²/V (volume constant). Doubling length → R' = 4R.",
              options: [
                { text: "4R", isCorrect: true },
                { text: "2R", isCorrect: false },
                { text: "R/2", isCorrect: false },
                { text: "R/4", isCorrect: false },
              ],
            },
            {
              text: "The unit of magnetic flux is:",
              marks: 4, negativeMarks: 1, difficulty: "EASY",
              explanation: "Magnetic flux Φ = BA, unit is Weber (Wb) = Volt × second.",
              options: [
                { text: "Weber", isCorrect: true },
                { text: "Tesla", isCorrect: false },
                { text: "Henry", isCorrect: false },
                { text: "Gauss", isCorrect: false },
              ],
            },
          ],
        },
        {
          name: "Chemistry",
          displayOrder: 2,
          totalMarks: 180,
          questions: [
            {
              text: "The most electronegative element is:",
              marks: 4, negativeMarks: 1, difficulty: "EASY",
              explanation: "Fluorine has the highest electronegativity (3.98 on Pauling scale).",
              options: [
                { text: "Fluorine", isCorrect: true },
                { text: "Oxygen", isCorrect: false },
                { text: "Nitrogen", isCorrect: false },
                { text: "Chlorine", isCorrect: false },
              ],
            },
            {
              text: "The number of moles of CO₂ in 44 g is:",
              marks: 4, negativeMarks: 1, difficulty: "EASY",
              explanation: "Molar mass of CO₂ = 12 + 32 = 44 g/mol. Moles = 44/44 = 1.",
              options: [
                { text: "1", isCorrect: true },
                { text: "2", isCorrect: false },
                { text: "0.5", isCorrect: false },
                { text: "44", isCorrect: false },
              ],
            },
            {
              text: "Which of the following is the weakest acid?",
              marks: 4, negativeMarks: 1, difficulty: "MEDIUM",
              explanation: "HF is the weakest halogen acid due to high bond dissociation energy.",
              options: [
                { text: "HF", isCorrect: true },
                { text: "HCl", isCorrect: false },
                { text: "HBr", isCorrect: false },
                { text: "HI", isCorrect: false },
              ],
            },
            {
              text: "The oxidation state of Mn in KMnO₄ is:",
              marks: 4, negativeMarks: 1, difficulty: "EASY",
              explanation: "K(+1) + Mn(x) + 4×O(-2) = 0 → 1 + x - 8 = 0 → x = +7.",
              options: [
                { text: "+7", isCorrect: true },
                { text: "+6", isCorrect: false },
                { text: "+5", isCorrect: false },
                { text: "+4", isCorrect: false },
              ],
            },
            {
              text: "Glucose on reduction with HI gives:",
              marks: 4, negativeMarks: 1, difficulty: "MEDIUM",
              explanation: "Prolonged heating of glucose with HI reduces all functional groups to give n-hexane.",
              options: [
                { text: "n-Hexane", isCorrect: true },
                { text: "Sorbitol", isCorrect: false },
                { text: "Gluconic acid", isCorrect: false },
                { text: "Fructose", isCorrect: false },
              ],
            },
            {
              text: "The catalyst used in Haber's process is:",
              marks: 4, negativeMarks: 1, difficulty: "EASY",
              explanation: "Finely divided iron (Fe) with Mo as promoter is used in Haber's process for NH₃.",
              options: [
                { text: "Iron", isCorrect: true },
                { text: "Platinum", isCorrect: false },
                { text: "Nickel", isCorrect: false },
                { text: "Vanadium pentoxide", isCorrect: false },
              ],
            },
            {
              text: "Markovnikov's rule is applicable to:",
              marks: 4, negativeMarks: 1, difficulty: "MEDIUM",
              explanation: "Markovnikov's rule applies to electrophilic addition to unsymmetrical alkenes.",
              options: [
                { text: "Addition reactions of unsymmetrical alkenes", isCorrect: true },
                { text: "Substitution reactions of alkanes", isCorrect: false },
                { text: "Elimination reactions", isCorrect: false },
                { text: "Free radical reactions", isCorrect: false },
              ],
            },
            {
              text: "Which vitamin is water-soluble?",
              marks: 4, negativeMarks: 1, difficulty: "EASY",
              explanation: "Vitamin C (ascorbic acid) and B-complex vitamins are water-soluble.",
              options: [
                { text: "Vitamin C", isCorrect: true },
                { text: "Vitamin A", isCorrect: false },
                { text: "Vitamin D", isCorrect: false },
                { text: "Vitamin K", isCorrect: false },
              ],
            },
          ],
        },
        {
          name: "Biology (Botany)",
          displayOrder: 3,
          totalMarks: 180,
          questions: [
            {
              text: "The powerhouse of the cell is:",
              marks: 4, negativeMarks: 1, difficulty: "EASY",
              explanation: "Mitochondria produce ATP through oxidative phosphorylation — the cell's energy currency.",
              options: [
                { text: "Mitochondria", isCorrect: true },
                { text: "Nucleus", isCorrect: false },
                { text: "Ribosome", isCorrect: false },
                { text: "Golgi apparatus", isCorrect: false },
              ],
            },
            {
              text: "Crossing over occurs during which stage of meiosis?",
              marks: 4, negativeMarks: 1, difficulty: "MEDIUM",
              explanation: "Crossing over occurs during Pachytene stage of Prophase I in meiosis.",
              options: [
                { text: "Pachytene", isCorrect: true },
                { text: "Leptotene", isCorrect: false },
                { text: "Diplotene", isCorrect: false },
                { text: "Zygotene", isCorrect: false },
              ],
            },
            {
              text: "The C4 pathway is also known as:",
              marks: 4, negativeMarks: 1, difficulty: "EASY",
              explanation: "The C4 pathway is called the Hatch and Slack pathway.",
              options: [
                { text: "Hatch and Slack pathway", isCorrect: true },
                { text: "Calvin cycle", isCorrect: false },
                { text: "Krebs cycle", isCorrect: false },
                { text: "EMP pathway", isCorrect: false },
              ],
            },
            {
              text: "Which plant hormone promotes cell elongation?",
              marks: 4, negativeMarks: 1, difficulty: "EASY",
              explanation: "Auxin (IAA) is the primary hormone responsible for cell elongation.",
              options: [
                { text: "Auxin", isCorrect: true },
                { text: "Abscisic acid", isCorrect: false },
                { text: "Ethylene", isCorrect: false },
                { text: "Cytokinin", isCorrect: false },
              ],
            },
            {
              text: "The first stable product of the Calvin cycle is:",
              marks: 4, negativeMarks: 1, difficulty: "MEDIUM",
              explanation: "CO₂ fixation produces 3-PGA (3-phosphoglyceric acid) as the first stable 3C compound.",
              options: [
                { text: "3-PGA (3-phosphoglyceric acid)", isCorrect: true },
                { text: "G3P (glyceraldehyde-3-phosphate)", isCorrect: false },
                { text: "Oxaloacetate", isCorrect: false },
                { text: "RuBP", isCorrect: false },
              ],
            },
            {
              text: "Which of the following is a monocot plant?",
              marks: 4, negativeMarks: 1, difficulty: "EASY",
              explanation: "Wheat (Triticum aestivum) is a monocot with parallel venation and fibrous roots.",
              options: [
                { text: "Wheat", isCorrect: true },
                { text: "Pea", isCorrect: false },
                { text: "Mango", isCorrect: false },
                { text: "Rose", isCorrect: false },
              ],
            },
            {
              text: "DNA replication is:",
              marks: 4, negativeMarks: 1, difficulty: "EASY",
              explanation: "DNA replication is semi-conservative — each new molecule has one old and one new strand.",
              options: [
                { text: "Semi-conservative", isCorrect: true },
                { text: "Conservative", isCorrect: false },
                { text: "Dispersive", isCorrect: false },
                { text: "Non-conservative", isCorrect: false },
              ],
            },
            {
              text: "The enzyme that unwinds DNA during replication is:",
              marks: 4, negativeMarks: 1, difficulty: "MEDIUM",
              explanation: "Helicase unwinds the double-stranded DNA at the replication fork.",
              options: [
                { text: "Helicase", isCorrect: true },
                { text: "DNA polymerase", isCorrect: false },
                { text: "Ligase", isCorrect: false },
                { text: "Primase", isCorrect: false },
              ],
            },
          ],
        },
        {
          name: "Biology (Zoology)",
          displayOrder: 4,
          totalMarks: 180,
          questions: [
            {
              text: "The functional unit of the kidney is:",
              marks: 4, negativeMarks: 1, difficulty: "EASY",
              explanation: "Nephron is the structural and functional unit of the kidney.",
              options: [
                { text: "Nephron", isCorrect: true },
                { text: "Neuron", isCorrect: false },
                { text: "Glomerulus", isCorrect: false },
                { text: "Alveolus", isCorrect: false },
              ],
            },
            {
              text: "Blood group O is considered the universal donor because it has:",
              marks: 4, negativeMarks: 1, difficulty: "EASY",
              explanation: "Blood group O has no A or B antigens on RBCs, so it doesn't trigger immune response.",
              options: [
                { text: "No A or B antigens", isCorrect: true },
                { text: "Both A and B antigens", isCorrect: false },
                { text: "No antibodies", isCorrect: false },
                { text: "Rh factor", isCorrect: false },
              ],
            },
            {
              text: "The pacemaker of the heart is:",
              marks: 4, negativeMarks: 1, difficulty: "EASY",
              explanation: "The SA node (sinoatrial node) initiates cardiac impulses and sets heart rhythm.",
              options: [
                { text: "SA node", isCorrect: true },
                { text: "AV node", isCorrect: false },
                { text: "Bundle of His", isCorrect: false },
                { text: "Purkinje fibers", isCorrect: false },
              ],
            },
            {
              text: "Which hormone regulates blood glucose levels by lowering it?",
              marks: 4, negativeMarks: 1, difficulty: "EASY",
              explanation: "Insulin (from β-cells of pancreas) lowers blood glucose by promoting glucose uptake.",
              options: [
                { text: "Insulin", isCorrect: true },
                { text: "Glucagon", isCorrect: false },
                { text: "Cortisol", isCorrect: false },
                { text: "Adrenaline", isCorrect: false },
              ],
            },
            {
              text: "Down's syndrome is caused by trisomy of chromosome:",
              marks: 4, negativeMarks: 1, difficulty: "EASY",
              explanation: "Down's syndrome (47 chromosomes) is caused by trisomy of chromosome 21.",
              options: [
                { text: "21", isCorrect: true },
                { text: "18", isCorrect: false },
                { text: "13", isCorrect: false },
                { text: "X", isCorrect: false },
              ],
            },
            {
              text: "The largest gland in the human body is:",
              marks: 4, negativeMarks: 1, difficulty: "EASY",
              explanation: "The liver is the largest gland weighing about 1.5 kg in adults.",
              options: [
                { text: "Liver", isCorrect: true },
                { text: "Pancreas", isCorrect: false },
                { text: "Thyroid", isCorrect: false },
                { text: "Pituitary", isCorrect: false },
              ],
            },
            {
              text: "Hardy-Weinberg equilibrium requires all of the following EXCEPT:",
              marks: 4, negativeMarks: 1, difficulty: "MEDIUM",
              explanation: "Natural selection disrupts HW equilibrium. HW requires no selection, no mutation, random mating, large population, no gene flow.",
              options: [
                { text: "Natural selection", isCorrect: true },
                { text: "Random mating", isCorrect: false },
                { text: "No mutation", isCorrect: false },
                { text: "Large population size", isCorrect: false },
              ],
            },
            {
              text: "The cranial nerve responsible for vision is:",
              marks: 4, negativeMarks: 1, difficulty: "EASY",
              explanation: "Optic nerve (CN II) carries visual information from the retina to the brain.",
              options: [
                { text: "Optic nerve (CN II)", isCorrect: true },
                { text: "Oculomotor nerve (CN III)", isCorrect: false },
                { text: "Trigeminal nerve (CN V)", isCorrect: false },
                { text: "Vagus nerve (CN X)", isCorrect: false },
              ],
            },
          ],
        },
      ],
    },
    {
      slug: "neet-mock-2",
      title: "NEET Mock Test #2 — NCERT Focused",
      description:
        "<p>NCERT-focused NEET mock test with questions directly from NCERT textbook concepts and diagrams.</p>",
      instructions: [
        "Total duration: 200 minutes.",
        "+4 correct, -1 incorrect. No penalty for unattempted.",
        "Focus: NCERT concepts and line-by-line coverage.",
      ],
      durationMinutes: 200,
      totalMarks: 720,
      passingMarks: 320,
      isFree: false,
      sections: [
        {
          name: "Physics",
          displayOrder: 1,
          totalMarks: 180,
          questions: [
            {
              text: "Dimensional formula of angular momentum is:",
              marks: 4, negativeMarks: 1, difficulty: "EASY",
              explanation: "L = mvr → [M][LT⁻¹][L] = [ML²T⁻¹].",
              options: [
                { text: "[ML²T⁻¹]", isCorrect: true },
                { text: "[MLT⁻¹]", isCorrect: false },
                { text: "[ML²T⁻²]", isCorrect: false },
                { text: "[MLT⁻²]", isCorrect: false },
              ],
            },
            {
              text: "The Young's modulus of a perfectly rigid body is:",
              marks: 4, negativeMarks: 1, difficulty: "EASY",
              explanation: "A perfectly rigid body has zero strain for any stress → Y = stress/strain = ∞.",
              options: [
                { text: "Infinite", isCorrect: true },
                { text: "Zero", isCorrect: false },
                { text: "1", isCorrect: false },
                { text: "Unity", isCorrect: false },
              ],
            },
            {
              text: "The velocity of sound in air at NTP is approximately:",
              marks: 4, negativeMarks: 1, difficulty: "EASY",
              explanation: "Speed of sound in air at NTP (0°C, 1 atm) ≈ 332 m/s.",
              options: [
                { text: "332 m/s", isCorrect: true },
                { text: "220 m/s", isCorrect: false },
                { text: "440 m/s", isCorrect: false },
                { text: "560 m/s", isCorrect: false },
              ],
            },
            {
              text: "In a series LCR circuit at resonance:",
              marks: 4, negativeMarks: 1, difficulty: "MEDIUM",
              explanation: "At resonance, XL = XC and impedance Z = R (minimum). Current is maximum.",
              options: [
                { text: "Impedance equals resistance", isCorrect: true },
                { text: "Current is minimum", isCorrect: false },
                { text: "Impedance is maximum", isCorrect: false },
                { text: "Power factor is zero", isCorrect: false },
              ],
            },
            {
              text: "The phenomenon of total internal reflection is used in:",
              marks: 4, negativeMarks: 1, difficulty: "EASY",
              explanation: "Optical fibers use total internal reflection to transmit light signals.",
              options: [
                { text: "Optical fibers", isCorrect: true },
                { text: "Microscope", isCorrect: false },
                { text: "Telescope", isCorrect: false },
                { text: "Camera", isCorrect: false },
              ],
            },
            {
              text: "A body at temperature T radiates energy proportional to (Stefan's law):",
              marks: 4, negativeMarks: 1, difficulty: "EASY",
              explanation: "Stefan-Boltzmann law: E ∝ T⁴.",
              options: [
                { text: "T⁴", isCorrect: true },
                { text: "T²", isCorrect: false },
                { text: "T", isCorrect: false },
                { text: "T³", isCorrect: false },
              ],
            },
          ],
        },
        {
          name: "Chemistry",
          displayOrder: 2,
          totalMarks: 180,
          questions: [
            {
              text: "The electronic configuration of Cu (Z = 29) is:",
              marks: 4, negativeMarks: 1, difficulty: "MEDIUM",
              explanation: "Cu has an anomalous configuration: [Ar]3d¹⁰4s¹ (fully filled d-subshell is more stable).",
              options: [
                { text: "[Ar]3d¹⁰4s¹", isCorrect: true },
                { text: "[Ar]3d⁹4s²", isCorrect: false },
                { text: "[Ar]3d¹⁰4s²", isCorrect: false },
                { text: "[Ar]3d⁸4s²", isCorrect: false },
              ],
            },
            {
              text: "The hybridization of carbon in ethylene (C₂H₄) is:",
              marks: 4, negativeMarks: 1, difficulty: "EASY",
              explanation: "Each C in C₂H₄ forms 3 σ bonds (2 C-H + 1 C-C) + 1 π bond → sp².",
              options: [
                { text: "sp²", isCorrect: true },
                { text: "sp³", isCorrect: false },
                { text: "sp", isCorrect: false },
                { text: "sp³d", isCorrect: false },
              ],
            },
            {
              text: "Le Chatelier's principle applies to systems at:",
              marks: 4, negativeMarks: 1, difficulty: "EASY",
              explanation: "Le Chatelier's principle applies to systems in chemical equilibrium.",
              options: [
                { text: "Equilibrium", isCorrect: true },
                { text: "Any state", isCorrect: false },
                { text: "Only gaseous reactions", isCorrect: false },
                { text: "Only exothermic reactions", isCorrect: false },
              ],
            },
            {
              text: "Which of the following is an example of a lyophilic colloid?",
              marks: 4, negativeMarks: 1, difficulty: "MEDIUM",
              explanation: "Starch solution is a lyophilic (solvent-loving) colloid that forms easily.",
              options: [
                { text: "Starch solution", isCorrect: true },
                { text: "Gold sol", isCorrect: false },
                { text: "Sulphur sol", isCorrect: false },
                { text: "As₂S₃ sol", isCorrect: false },
              ],
            },
            {
              text: "The functional group present in an ester is:",
              marks: 4, negativeMarks: 1, difficulty: "EASY",
              explanation: "Esters have the -COOR functional group (acyl group bonded to alkoxy).",
              options: [
                { text: "-COOR", isCorrect: true },
                { text: "-COOH", isCorrect: false },
                { text: "-CHO", isCorrect: false },
                { text: "-OH", isCorrect: false },
              ],
            },
            {
              text: "Cannizzaro reaction is given by aldehydes that have:",
              marks: 4, negativeMarks: 1, difficulty: "MEDIUM",
              explanation: "Cannizzaro reaction is given by aldehydes without α-hydrogen atoms (e.g., HCHO, C₆H₅CHO).",
              options: [
                { text: "No α-hydrogen", isCorrect: true },
                { text: "α-hydrogen", isCorrect: false },
                { text: "Both α and β hydrogens", isCorrect: false },
                { text: "A carbonyl group only", isCorrect: false },
              ],
            },
          ],
        },
        {
          name: "Biology (Botany)",
          displayOrder: 3,
          totalMarks: 180,
          questions: [
            {
              text: "The site of dark reactions in photosynthesis is:",
              marks: 4, negativeMarks: 1, difficulty: "EASY",
              explanation: "Dark reactions (Calvin cycle) occur in the stroma of chloroplasts.",
              options: [
                { text: "Stroma", isCorrect: true },
                { text: "Thylakoid", isCorrect: false },
                { text: "Cytoplasm", isCorrect: false },
                { text: "Nucleus", isCorrect: false },
              ],
            },
            {
              text: "Mendel's law of segregation is also known as:",
              marks: 4, negativeMarks: 1, difficulty: "EASY",
              explanation: "Law of segregation = Law of purity of gametes (alleles separate during gamete formation).",
              options: [
                { text: "Law of purity of gametes", isCorrect: true },
                { text: "Law of dominance", isCorrect: false },
                { text: "Law of independent assortment", isCorrect: false },
                { text: "Law of inheritance", isCorrect: false },
              ],
            },
            {
              text: "Which tissue provides mechanical support in plants?",
              marks: 4, negativeMarks: 1, difficulty: "EASY",
              explanation: "Sclerenchyma cells have thick, lignified walls providing mechanical support.",
              options: [
                { text: "Sclerenchyma", isCorrect: true },
                { text: "Parenchyma", isCorrect: false },
                { text: "Phloem", isCorrect: false },
                { text: "Epidermis", isCorrect: false },
              ],
            },
            {
              text: "The net gain of ATP in glycolysis per glucose molecule is:",
              marks: 4, negativeMarks: 1, difficulty: "MEDIUM",
              explanation: "Glycolysis produces 4 ATP but uses 2 ATP. Net gain = 2 ATP.",
              options: [
                { text: "2 ATP", isCorrect: true },
                { text: "4 ATP", isCorrect: false },
                { text: "36 ATP", isCorrect: false },
                { text: "38 ATP", isCorrect: false },
              ],
            },
            {
              text: "Nitrogen fixation in leguminous plants is done by:",
              marks: 4, negativeMarks: 1, difficulty: "EASY",
              explanation: "Rhizobium bacteria in root nodules fix atmospheric N₂ into ammonia.",
              options: [
                { text: "Rhizobium", isCorrect: true },
                { text: "Azotobacter", isCorrect: false },
                { text: "Nitrobacter", isCorrect: false },
                { text: "Nitrosomonas", isCorrect: false },
              ],
            },
            {
              text: "The largest flower in the world is:",
              marks: 4, negativeMarks: 1, difficulty: "EASY",
              explanation: "Rafflesia arnoldii produces the largest individual flower (up to 1 meter diameter).",
              options: [
                { text: "Rafflesia", isCorrect: true },
                { text: "Sunflower", isCorrect: false },
                { text: "Lotus", isCorrect: false },
                { text: "Amorphophallus", isCorrect: false },
              ],
            },
          ],
        },
        {
          name: "Biology (Zoology)",
          displayOrder: 4,
          totalMarks: 180,
          questions: [
            {
              text: "The hormone responsible for the fight-or-flight response is:",
              marks: 4, negativeMarks: 1, difficulty: "EASY",
              explanation: "Adrenaline (epinephrine) from adrenal medulla triggers fight-or-flight response.",
              options: [
                { text: "Adrenaline", isCorrect: true },
                { text: "Insulin", isCorrect: false },
                { text: "Thyroxine", isCorrect: false },
                { text: "Oxytocin", isCorrect: false },
              ],
            },
            {
              text: "The longest bone in the human body is:",
              marks: 4, negativeMarks: 1, difficulty: "EASY",
              explanation: "Femur (thigh bone) is the longest and strongest bone in the body.",
              options: [
                { text: "Femur", isCorrect: true },
                { text: "Tibia", isCorrect: false },
                { text: "Humerus", isCorrect: false },
                { text: "Fibula", isCorrect: false },
              ],
            },
            {
              text: "Haemoglobin is present in:",
              marks: 4, negativeMarks: 1, difficulty: "EASY",
              explanation: "Haemoglobin is present inside red blood cells (RBCs/erythrocytes).",
              options: [
                { text: "RBCs", isCorrect: true },
                { text: "WBCs", isCorrect: false },
                { text: "Platelets", isCorrect: false },
                { text: "Plasma", isCorrect: false },
              ],
            },
            {
              text: "The theory of natural selection was proposed by:",
              marks: 4, negativeMarks: 1, difficulty: "EASY",
              explanation: "Charles Darwin proposed the theory of natural selection in 'On the Origin of Species' (1859).",
              options: [
                { text: "Charles Darwin", isCorrect: true },
                { text: "Lamarck", isCorrect: false },
                { text: "Hugo de Vries", isCorrect: false },
                { text: "Mendel", isCorrect: false },
              ],
            },
            {
              text: "The process of formation of urine involves:",
              marks: 4, negativeMarks: 1, difficulty: "MEDIUM",
              explanation: "Urine formation involves ultrafiltration, selective reabsorption, and tubular secretion.",
              options: [
                { text: "All three: filtration, reabsorption, and secretion", isCorrect: true },
                { text: "Only filtration", isCorrect: false },
                { text: "Filtration and reabsorption only", isCorrect: false },
                { text: "Secretion only", isCorrect: false },
              ],
            },
            {
              text: "The term 'ecosystem' was coined by:",
              marks: 4, negativeMarks: 1, difficulty: "MEDIUM",
              explanation: "A.G. Tansley coined the term 'ecosystem' in 1935.",
              options: [
                { text: "A.G. Tansley", isCorrect: true },
                { text: "Odum", isCorrect: false },
                { text: "Haeckel", isCorrect: false },
                { text: "Warming", isCorrect: false },
              ],
            },
          ],
        },
      ],
    },
  ],
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

  console.log("\nJEE Test Series (3 tests)");
  await seedTestSeries(org.id, JEE_TEST_SERIES);

  console.log("\nNEET Test Series (2 tests)");
  await seedTestSeries(org.id, NEET_TEST_SERIES);

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
