import { db } from "../../db";
import {
  testQuestions,
  testQuestionOptions,
  testSections,
  tests,
} from "../../db/schema";
import { eq, and, sql } from "drizzle-orm";
import { recalculateTestCounts } from "./test.service";
import { CacheManager } from "../cache.service";

type QuestionType = "MCQ" | "FILL_BLANK" | "NUMERICAL" | "TRUE_FALSE";
type DifficultyLevel = "EASY" | "MEDIUM" | "HARD";

interface CreateQuestionParams {
  sectionId: string;
  organizationId: string;
  text: string;
  imageUrl?: string;
  type: QuestionType;
  difficulty: DifficultyLevel;
  marks: number;
  negativeMarks?: number;
  explanation?: string;
  explanationImageUrl?: string;
  displayOrder?: number;
  // For MCQ
  options?: {
    text: string;
    imageUrl?: string;
    isCorrect: boolean;
  }[];
  // For numerical/fill-in-the-blank
  correctAnswer?: string;
}

interface UpdateQuestionParams {
  text?: string;
  imageUrl?: string;
  type?: QuestionType;
  difficulty?: DifficultyLevel;
  marks?: number;
  negativeMarks?: number;
  explanation?: string;
  explanationImageUrl?: string;
  displayOrder?: number;
}

/**
 * Create a new question in a section
 */
export async function createQuestion(data: CreateQuestionParams) {
  // Verify section exists and get test details
  const section = await db.query.testSections.findFirst({
    where: eq(testSections.id, data.sectionId),
    with: {
      test: true,
    },
  });

  if (!section || section.test.organizationId !== data.organizationId) {
    throw new Error("Section not found");
  }

  // Get next display order
  const lastQuestion = await db.query.testQuestions.findFirst({
    where: eq(testQuestions.sectionId, data.sectionId),
    orderBy: [sql`${testQuestions.displayOrder} DESC`],
  });

  const displayOrder =
    data.displayOrder ?? (lastQuestion?.displayOrder ?? 0) + 1;

  // Create question
  const [question] = await db
    .insert(testQuestions)
    .values({
      sectionId: data.sectionId,
      organizationId: data.organizationId,
      text: data.text,
      imageUrl: data.imageUrl,
      type: data.type,
      difficulty: data.difficulty,
      marks: data.marks,
      negativeMarks: data.negativeMarks || 0,
      explanation: data.explanation,
      explanationImageUrl: data.explanationImageUrl,
      displayOrder,
    })
    .returning();

  // If MCQ, create options
  if (data.type === "MCQ" && data.options && data.options.length > 0) {
    const optionsToInsert = data.options.map((opt, index) => ({
      questionId: question.id,
      text: opt.text,
      imageUrl: opt.imageUrl,
      isCorrect: opt.isCorrect,
      displayOrder: index + 1,
    }));

    await db.insert(testQuestionOptions).values(optionsToInsert);
  }

  // Recalculate counts
  await recalculateTestCounts(section.test.id);

  // Invalidate caches
  await CacheManager.invalidateQuestion(
    undefined,
    data.sectionId,
    section.test.id
  );
  await CacheManager.invalidateSection(data.sectionId, section.test.id);
  await CacheManager.invalidateTest(section.test.id);

  return question;
}

/**
 * Create multiple questions in a section (bulk)
 */
export async function createBulkQuestions(
  sectionId: string,
  organizationId: string,
  questionsData: Omit<CreateQuestionParams, "sectionId" | "organizationId">[]
) {
  // Verify section exists and get test details
  const section = await db.query.testSections.findFirst({
    where: eq(testSections.id, sectionId),
    with: {
      test: true,
    },
  });

  if (!section || section.test.organizationId !== organizationId) {
    throw new Error("Section not found");
  }

  // Get current max display order
  const lastQuestion = await db.query.testQuestions.findFirst({
    where: eq(testQuestions.sectionId, sectionId),
    orderBy: [sql`${testQuestions.displayOrder} DESC`],
  });

  let currentDisplayOrder = (lastQuestion?.displayOrder ?? 0) + 1;

  // Prepare all questions for batch insert
  const questionsToInsert = questionsData.map((questionData) => ({
    sectionId,
    organizationId,
    text: questionData.text,
    imageUrl: questionData.imageUrl,
    type: questionData.type,
    difficulty: questionData.difficulty,
    marks: questionData.marks,
    negativeMarks: questionData.negativeMarks || 0,
    explanation: questionData.explanation,
    explanationImageUrl: questionData.explanationImageUrl,
    displayOrder: questionData.displayOrder ?? currentDisplayOrder++,
  }));

  // Batch insert all questions
  const createdQuestions = await db
    .insert(testQuestions)
    .values(questionsToInsert)
    .returning();

  // Prepare all options for batch insert
  const allOptionsToInsert: {
    questionId: string;
    text: string;
    imageUrl?: string;
    isCorrect: boolean;
    displayOrder: number;
  }[] = [];

  createdQuestions.forEach((question, index) => {
    const questionData = questionsData[index];

    // If MCQ, collect options for batch insert
    if (
      questionData.type === "MCQ" &&
      questionData.options &&
      questionData.options.length > 0
    ) {
      const optionsToAdd = questionData.options.map((opt, optIndex) => ({
        questionId: question.id,
        text: opt.text,
        imageUrl: opt.imageUrl,
        isCorrect: opt.isCorrect,
        displayOrder: optIndex + 1,
      }));

      allOptionsToInsert.push(...optionsToAdd);
    }
  });

  // Batch insert all options at once
  if (allOptionsToInsert.length > 0) {
    await db.insert(testQuestionOptions).values(allOptionsToInsert);
  }

  // Recalculate counts once at the end
  await recalculateTestCounts(section.test.id);

  // Invalidate caches
  await CacheManager.invalidateQuestion(undefined, sectionId, section.test.id);
  await CacheManager.invalidateSection(sectionId, section.test.id);
  await CacheManager.invalidateTest(section.test.id);

  return {
    count: createdQuestions.length,
    questions: createdQuestions,
  };
}

/**
 * Get question by ID with options
 */
export async function getQuestion(id: string, organizationId: string) {
  const question = await db.query.testQuestions.findFirst({
    where: and(
      eq(testQuestions.id, id),
      eq(testQuestions.organizationId, organizationId)
    ),
    with: {
      options: {
        orderBy: [testQuestionOptions.displayOrder],
      },
    },
  });

  if (!question) {
    throw new Error("Question not found");
  }

  return question;
}

/**
 * Get all questions in a section
 */
export async function getQuestionsInSection(
  sectionId: string,
  organizationId: string
) {
  // Verify section access
  const section = await db.query.testSections.findFirst({
    where: eq(testSections.id, sectionId),
    with: {
      test: true,
    },
  });

  if (!section || section.test.organizationId !== organizationId) {
    throw new Error("Section not found");
  }

  const questions = await db.query.testQuestions.findMany({
    where: eq(testQuestions.sectionId, sectionId),
    orderBy: [testQuestions.displayOrder],
    with: {
      options: {
        orderBy: [testQuestionOptions.displayOrder],
      },
    },
  });

  return questions;
}

/**
 * Update question
 */
export async function updateQuestion(
  id: string,
  organizationId: string,
  data: UpdateQuestionParams
) {
  const [updated] = await db
    .update(testQuestions)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(testQuestions.id, id),
        eq(testQuestions.organizationId, organizationId)
      )
    )
    .returning();

  if (!updated) {
    throw new Error("Question not found");
  }

  // Recalculate if marks changed
  if (data.marks !== undefined) {
    const question = await db.query.testQuestions.findFirst({
      where: eq(testQuestions.id, id),
      with: {
        section: {
          with: {
            test: true,
          },
        },
      },
    });

    if (question) {
      await recalculateTestCounts(question.section.test.id);

      // Invalidate caches
      await CacheManager.invalidateQuestion(
        id,
        question.sectionId,
        question.section.test.id
      );
      await CacheManager.invalidateSection(
        question.sectionId,
        question.section.test.id
      );
      await CacheManager.invalidateTest(question.section.test.id);
    }
  } else {
    // Still invalidate question cache even if marks didn't change
    await CacheManager.invalidateQuestion(id);
  }

  return updated;
}

/**
 * Delete question
 */
export async function deleteQuestion(id: string, organizationId: string) {
  // Get question to find test
  const question = await db.query.testQuestions.findFirst({
    where: and(
      eq(testQuestions.id, id),
      eq(testQuestions.organizationId, organizationId)
    ),
    with: {
      section: {
        with: {
          test: true,
        },
      },
    },
  });

  if (!question) {
    throw new Error("Question not found");
  }

  const testId = question.section.test.id;

  // Delete question (cascade will handle options)
  await db
    .delete(testQuestions)
    .where(
      and(
        eq(testQuestions.id, id),
        eq(testQuestions.organizationId, organizationId)
      )
    );

  // Recalculate counts
  await recalculateTestCounts(testId);

  // Invalidate caches
  await CacheManager.invalidateQuestion(id, question.sectionId, testId);
  await CacheManager.invalidateSection(question.sectionId, testId);
  await CacheManager.invalidateTest(testId);

  return { success: true };
}

/**
 * Create option for an MCQ question
 */
export async function createOption(
  questionId: string,
  organizationId: string,
  data: {
    text: string;
    imageUrl?: string;
    isCorrect: boolean;
  }
) {
  // Verify question exists and is MCQ
  const question = await db.query.testQuestions.findFirst({
    where: and(
      eq(testQuestions.id, questionId),
      eq(testQuestions.organizationId, organizationId)
    ),
    with: {
      options: true,
    },
  });

  if (!question) {
    throw new Error("Question not found");
  }

  if (question.type !== "MCQ") {
    throw new Error("Options can only be added to MCQ questions");
  }

  // Get next display order
  const displayOrder = (question.options?.length || 0) + 1;

  const [option] = await db
    .insert(testQuestionOptions)
    .values({
      questionId,
      text: data.text,
      imageUrl: data.imageUrl,
      isCorrect: data.isCorrect,
      displayOrder,
    })
    .returning();

  // Invalidate question cache
  await CacheManager.invalidateQuestion(questionId);

  return option;
}

/**
 * Update option
 */
export async function updateOption(
  optionId: string,
  questionId: string,
  organizationId: string,
  data: {
    text?: string;
    imageUrl?: string;
    isCorrect?: boolean;
    displayOrder?: number;
  }
) {
  // Verify question exists
  const question = await db.query.testQuestions.findFirst({
    where: and(
      eq(testQuestions.id, questionId),
      eq(testQuestions.organizationId, organizationId)
    ),
  });

  if (!question) {
    throw new Error("Question not found");
  }

  const [updated] = await db
    .update(testQuestionOptions)
    .set(data)
    .where(
      and(
        eq(testQuestionOptions.id, optionId),
        eq(testQuestionOptions.questionId, questionId)
      )
    )
    .returning();

  if (!updated) {
    throw new Error("Option not found");
  }

  // Invalidate question cache
  await CacheManager.invalidateQuestion(questionId);

  return updated;
}

/**
 * Delete option
 */
export async function deleteOption(
  optionId: string,
  questionId: string,
  organizationId: string
) {
  // Verify question exists
  const question = await db.query.testQuestions.findFirst({
    where: and(
      eq(testQuestions.id, questionId),
      eq(testQuestions.organizationId, organizationId)
    ),
  });

  if (!question) {
    throw new Error("Question not found");
  }

  await db
    .delete(testQuestionOptions)
    .where(
      and(
        eq(testQuestionOptions.id, optionId),
        eq(testQuestionOptions.questionId, questionId)
      )
    );

  // Invalidate question cache
  await CacheManager.invalidateQuestion(questionId);

  return { success: true };
}

/**
 * Reorder questions in a section
 */
export async function reorderQuestions(
  sectionId: string,
  organizationId: string,
  questionOrders: { id: string; displayOrder: number }[]
) {
  // Verify section access
  const section = await db.query.testSections.findFirst({
    where: eq(testSections.id, sectionId),
    with: {
      test: true,
    },
  });

  if (!section || section.test.organizationId !== organizationId) {
    throw new Error("Section not found");
  }

  // Update each question's display order
  for (const { id, displayOrder } of questionOrders) {
    await db
      .update(testQuestions)
      .set({
        displayOrder,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(testQuestions.id, id),
          eq(testQuestions.sectionId, sectionId),
          eq(testQuestions.organizationId, organizationId)
        )
      );
  }

  // Invalidate section cache
  await CacheManager.invalidateQuestion(undefined, sectionId);
  await CacheManager.invalidateSection(sectionId, section.testId);

  return { success: true };
}
