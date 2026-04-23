import { db } from "../../db";
import {
  tests,
  testAttempts,
  testAttemptAnswers,
  testQuestions,
  testQuestionOptions,
  userTestSeriesMapping,
} from "../../db/schema";
import { eq, and, sql, desc, asc, count } from "drizzle-orm";

interface StartAttemptParams {
  userId: string;
  testId: string;
}

interface SubmitAnswerParams {
  attemptId: string;
  questionId: string;
  userId: string;
  selectedOptionId?: string;
  textAnswer?: string;
  timeSpentSeconds?: number;
  isMarkedForReview?: boolean;
}

/**
 * Start a new test attempt
 */
export async function startAttempt(data: StartAttemptParams) {
  const { userId, testId } = data;

  // Get test details
  const test = await db.query.tests.findFirst({
    where: eq(tests.id, testId),
    with: {
      testSeries: true,
    },
  });

  if (!test) {
    throw new Error("Test not found");
  }

  if (!test.isPublished) {
    throw new Error("Test is not published yet");
  }

  // Check if test is part of a paid series
  if (test.testSeries && !test.isFree) {
    // Verify enrollment in test series
    const enrollment = await db.query.userTestSeriesMapping.findFirst({
      where: and(
        eq(userTestSeriesMapping.userId, userId),
        eq(userTestSeriesMapping.testSeriesId, test.testSeriesId!)
      ),
    });

    if (!enrollment) {
      throw new Error(
        "You must be enrolled in the test series to attempt this test"
      );
    }

    // Check if access period has expired
    if (enrollment.endDate && new Date() > enrollment.endDate) {
      throw new Error("Your access to this test series has expired");
    }
  }

  // Get previous attempts count
  const previousAttempts = await db
    .select({ count: count() })
    .from(testAttempts)
    .where(
      and(eq(testAttempts.userId, userId), eq(testAttempts.testId, testId))
    )
    .execute();

  const attemptNumber = (previousAttempts[0]?.count || 0) + 1;

  // Create new attempt
  const [attempt] = await db
    .insert(testAttempts)
    .values({
      userId,
      testId,
      attemptNumber,
      startedAt: new Date(),
      isCompleted: false,
    })
    .returning();

  return attempt;
}

/**
 * Get attempt details
 */
export async function getAttempt(attemptId: string, userId: string) {
  const attempt = await db.query.testAttempts.findFirst({
    where: and(eq(testAttempts.id, attemptId), eq(testAttempts.userId, userId)),
    with: {
      test: {
        with: {
          sections: {
            orderBy: [sql`display_order ASC`],
            with: {
              questions: {
                orderBy: [sql`display_order ASC`],
                with: {
                  options: {
                    orderBy: [sql`display_order ASC`],
                  },
                },
              },
            },
          },
        },
      },
      answers: true,
    },
  });

  if (!attempt) {
    throw new Error("Attempt not found");
  }

  return attempt;
}

/**
 * Submit answer for a question
 */
export async function submitAnswer(data: SubmitAnswerParams) {
  const {
    attemptId,
    questionId,
    userId,
    selectedOptionId,
    textAnswer,
    timeSpentSeconds,
    isMarkedForReview,
  } = data;

  // Verify attempt belongs to user and is not completed
  const attempt = await db.query.testAttempts.findFirst({
    where: and(eq(testAttempts.id, attemptId), eq(testAttempts.userId, userId)),
  });

  if (!attempt) {
    throw new Error("Attempt not found");
  }

  if (attempt.isCompleted) {
    throw new Error("Cannot modify answers after test submission");
  }

  // Check if answer already exists
  const existingAnswer = await db.query.testAttemptAnswers.findFirst({
    where: and(
      eq(testAttemptAnswers.attemptId, attemptId),
      eq(testAttemptAnswers.questionId, questionId)
    ),
  });

  const isSkipped = !selectedOptionId && !textAnswer;

  if (existingAnswer) {
    // Update existing answer
    const [updated] = await db
      .update(testAttemptAnswers)
      .set({
        selectedOptionId,
        textAnswer,
        timeSpentSeconds,
        isMarkedForReview: isMarkedForReview || false,
        isSkipped,
        answeredAt: new Date(),
      })
      .where(eq(testAttemptAnswers.id, existingAnswer.id))
      .returning();

    return updated;
  } else {
    // Create new answer
    const [answer] = await db
      .insert(testAttemptAnswers)
      .values({
        attemptId,
        questionId,
        selectedOptionId,
        textAnswer,
        timeSpentSeconds: timeSpentSeconds || 0,
        isMarkedForReview: isMarkedForReview || false,
        isSkipped,
        answeredAt: new Date(),
      })
      .returning();

    return answer;
  }
}

/**
 * Submit test and evaluate
 */
export async function submitTest(attemptId: string, userId: string) {
  // Verify attempt
  const attempt = await db.query.testAttempts.findFirst({
    where: and(eq(testAttempts.id, attemptId), eq(testAttempts.userId, userId)),
    with: {
      test: true,
    },
  });

  if (!attempt) {
    throw new Error("Attempt not found");
  }

  if (attempt.isCompleted) {
    throw new Error("Test already submitted");
  }

  // Calculate time spent
  const timeSpentSeconds = Math.floor(
    (new Date().getTime() - attempt.startedAt.getTime()) / 1000
  );

  // Evaluate the attempt
  await evaluateAttempt(attemptId);

  // Get updated attempt with scores
  const evaluated = await db.query.testAttempts.findFirst({
    where: eq(testAttempts.id, attemptId),
  });

  if (!evaluated) {
    throw new Error("Failed to retrieve evaluation results");
  }

  // Determine if passed
  const isPassed =
    (evaluated.totalScore || 0) >= (attempt.test.passingMarks || 0);

  // Update attempt as completed
  const [completed] = await db
    .update(testAttempts)
    .set({
      isCompleted: true,
      submittedAt: new Date(),
      timeSpentSeconds,
      isPassed,
      updatedAt: new Date(),
    })
    .where(eq(testAttempts.id, attemptId))
    .returning();

  // Calculate rank and percentile
  await calculateRank(attemptId, attempt.testId);

  return completed;
}

/**
 * Evaluate attempt (auto-grading)
 */
export async function evaluateAttempt(attemptId: string) {
  // Get all answers
  const answers = await db.query.testAttemptAnswers.findMany({
    where: eq(testAttemptAnswers.attemptId, attemptId),
    with: {
      question: {
        with: {
          options: true,
        },
      },
      selectedOption: true,
    },
  });

  let totalScore = 0;
  let correctCount = 0;
  let wrongCount = 0;
  let skippedCount = 0;

  // Evaluate each answer
  for (const answer of answers) {
    const question = answer.question;
    let isCorrect = false;
    let marksAwarded = 0;

    if (answer.isSkipped) {
      skippedCount++;
    } else {
      if (question.type === "MCQ") {
        // Check if selected option is correct
        const correctOption = question.options.find((opt) => opt.isCorrect);

        if (correctOption && answer.selectedOptionId === correctOption.id) {
          isCorrect = true;
          marksAwarded = question.marks;
          correctCount++;
        } else {
          isCorrect = false;
          marksAwarded = -(question.negativeMarks || 0);
          wrongCount++;
        }
      } else if (
        question.type === "NUMERICAL" ||
        question.type === "FILL_BLANK"
      ) {
        // For numerical and fill-blank, this needs manual evaluation
        // or you can implement exact match logic here
        // For now, mark as requiring manual review
        isCorrect = false;
        marksAwarded = 0;
        skippedCount++; // Count as skipped until manually graded
      }

      totalScore += marksAwarded;
    }

    // Update answer with evaluation
    await db
      .update(testAttemptAnswers)
      .set({
        isCorrect,
        marksAwarded,
      })
      .where(eq(testAttemptAnswers.id, answer.id));
  }

  // Get test total marks for percentage calculation
  const attempt = await db.query.testAttempts.findFirst({
    where: eq(testAttempts.id, attemptId),
    with: {
      test: true,
    },
  });

  const percentage = attempt ? (totalScore / attempt.test.totalMarks) * 100 : 0;

  // Update attempt with scores
  await db
    .update(testAttempts)
    .set({
      totalScore,
      percentage,
      correctCount,
      wrongCount,
      skippedCount,
      updatedAt: new Date(),
    })
    .where(eq(testAttempts.id, attemptId));

  return {
    totalScore,
    percentage,
    correctCount,
    wrongCount,
    skippedCount,
  };
}

/**
 * Calculate rank and percentile for an attempt
 */
export async function calculateRank(attemptId: string, testId: string) {
  // Get all completed attempts for this test, ordered by score and time
  const allAttempts = await db.query.testAttempts.findMany({
    where: and(
      eq(testAttempts.testId, testId),
      eq(testAttempts.isCompleted, true)
    ),
    orderBy: [desc(testAttempts.totalScore), asc(testAttempts.submittedAt)],
  });

  const totalAttempts = allAttempts.length;

  // Find rank
  const attemptIndex = allAttempts.findIndex((a) => a.id === attemptId);

  if (attemptIndex === -1) {
    return; // Attempt not found in completed attempts
  }

  const rank = attemptIndex + 1;
  const percentile =
    totalAttempts > 0 ? ((totalAttempts - rank) / totalAttempts) * 100 : 0;

  // Update attempt with rank and percentile
  await db
    .update(testAttempts)
    .set({
      rank,
      percentile,
      updatedAt: new Date(),
    })
    .where(eq(testAttempts.id, attemptId));

  return { rank, percentile };
}

/**
 * Get results for an attempt
 */
export async function getResults(attemptId: string, userId: string) {
  const attempt = await db.query.testAttempts.findFirst({
    where: and(eq(testAttempts.id, attemptId), eq(testAttempts.userId, userId)),
    with: {
      test: {
        with: {
          sections: {
            orderBy: [sql`display_order ASC`],
          },
        },
      },
      answers: {
        with: {
          question: {
            with: {
              options: true,
            },
          },
          selectedOption: true,
        },
      },
    },
  });

  if (!attempt) {
    throw new Error("Attempt not found");
  }

  if (!attempt.isCompleted) {
    throw new Error("Test not yet submitted");
  }

  return attempt;
}

/**
 * Get solutions (with explanations)
 */
export async function getSolutions(attemptId: string, userId: string) {
  const attempt = await db.query.testAttempts.findFirst({
    where: and(eq(testAttempts.id, attemptId), eq(testAttempts.userId, userId)),
    with: {
      test: true,
    },
  });

  if (!attempt) {
    throw new Error("Attempt not found");
  }

  if (!attempt.isCompleted) {
    throw new Error("Solutions available only after test submission");
  }

  // Check if test allows showing answers
  if (!attempt.test.showAnswersAfterSubmit) {
    throw new Error("Solutions not available for this test");
  }

  const answers = await db.query.testAttemptAnswers.findMany({
    where: eq(testAttemptAnswers.attemptId, attemptId),
    with: {
      question: {
        with: {
          options: true,
        },
      },
      selectedOption: true,
    },
  });

  return answers;
}

/**
 * Get user's attempts for a test
 */
export async function getUserAttempts(userId: string, testId: string) {
  const attempts = await db.query.testAttempts.findMany({
    where: and(
      eq(testAttempts.userId, userId),
      eq(testAttempts.testId, testId)
    ),
    orderBy: [desc(testAttempts.attemptNumber)],
  });

  return attempts;
}

/**
 * Get leaderboard for a test
 */
export async function getLeaderboard(
  testId: string,
  limit: number = 100,
  offset: number = 0
) {
  const leaderboard = await db.query.testAttempts.findMany({
    where: and(
      eq(testAttempts.testId, testId),
      eq(testAttempts.isCompleted, true)
    ),
    orderBy: [desc(testAttempts.totalScore), asc(testAttempts.submittedAt)],
    limit,
    offset,
    with: {
      user: {
        columns: {
          id: true,
          username: true,
          // Don't expose sensitive data like email, password
        },
      },
    },
  });

  return leaderboard;
}

/**
 * Get all recent completed test attempts for a user (Dashboard)
 */
export async function getRecentCompletedTests(
  userId: string,
  filters: {
    page?: number;
    limit?: number;
    testSeriesId?: string;
    isPassed?: boolean;
  } = {}
) {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const offset = (page - 1) * limit;

  // Build base conditions
  const conditions: any[] = [
    eq(testAttempts.userId, userId),
    eq(testAttempts.isCompleted, true),
  ];

  if (filters.isPassed !== undefined) {
    conditions.push(eq(testAttempts.isPassed, filters.isPassed));
  }

  // Get completed attempts with test details
  let attempts = await db.query.testAttempts.findMany({
    where: and(...conditions),
    with: {
      test: {
        with: {
          testSeries: true,
        },
      },
    },
    orderBy: [desc(testAttempts.submittedAt)],
  });

  // Filter by test series if specified (post-query filter since it's a relation)
  if (filters.testSeriesId) {
    attempts = attempts.filter(
      (attempt) => attempt.test.testSeriesId === filters.testSeriesId
    );
  }

  // Apply pagination to filtered results
  const total = attempts.length;
  const paginatedAttempts = attempts.slice(offset, offset + limit);

  // Get statistics
  const stats = await getTestAttemptStats(userId, filters.testSeriesId);

  return {
    attempts: paginatedAttempts,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
    },
    stats,
  };
}

/**
 * Get test attempt statistics for a user
 */
export async function getTestAttemptStats(
  userId: string,
  testSeriesId?: string
) {
  const conditions: any[] = [eq(testAttempts.userId, userId)];

  // Get all attempts
  const allAttempts = await db.query.testAttempts.findMany({
    where: and(...conditions),
    with: {
      test: true,
    },
  });

  // Filter by test series if specified
  let filteredAttempts = allAttempts;
  if (testSeriesId) {
    filteredAttempts = allAttempts.filter(
      (attempt) => attempt.test.testSeriesId === testSeriesId
    );
  }

  const completedAttempts = filteredAttempts.filter((a) => a.isCompleted);
  const passedAttempts = completedAttempts.filter((a) => a.isPassed);

  // Calculate statistics
  const totalAttempts = filteredAttempts.length;
  const totalCompleted = completedAttempts.length;
  const totalPassed = passedAttempts.length;

  const avgScore =
    totalCompleted > 0
      ? completedAttempts.reduce((sum, a) => sum + (a.totalScore || 0), 0) /
        totalCompleted
      : 0;

  const avgPercentage =
    totalCompleted > 0
      ? completedAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0) /
        totalCompleted
      : 0;

  const passRate =
    totalCompleted > 0 ? (totalPassed / totalCompleted) * 100 : 0;

  const totalTimeSpent = completedAttempts.reduce(
    (sum, a) => sum + (a.timeSpentSeconds || 0),
    0
  );
  const totalTimeHours = totalTimeSpent / 3600;

  // Find best performances
  const bestScore = Math.max(
    ...completedAttempts.map((a) => a.totalScore || 0),
    0
  );
  const bestPercentage = Math.max(
    ...completedAttempts.map((a) => a.percentage || 0),
    0
  );

  // Calculate recent trend (last 5 completed tests)
  const recentTests = completedAttempts
    .sort((a, b) => {
      const dateA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
      const dateB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 5);

  let trend = "stable";
  if (recentTests.length >= 3) {
    const firstHalf = recentTests
      .slice(0, Math.ceil(recentTests.length / 2))
      .reduce((sum, a) => sum + (a.percentage || 0), 0);
    const secondHalf = recentTests
      .slice(Math.ceil(recentTests.length / 2))
      .reduce((sum, a) => sum + (a.percentage || 0), 0);

    if (firstHalf > secondHalf * 1.1) {
      trend = "improving";
    } else if (secondHalf > firstHalf * 1.1) {
      trend = "declining";
    }
  }

  return {
    totalTestsAttempted: totalAttempts,
    totalTestsCompleted: totalCompleted,
    totalTestsPassed: totalPassed,
    averageScore: Math.round(avgScore * 100) / 100,
    averagePercentage: Math.round(avgPercentage * 100) / 100,
    passRate: Math.round(passRate * 100) / 100,
    totalTimeSpentSeconds: totalTimeSpent,
    totalTimeSpentHours: Math.round(totalTimeHours * 100) / 100,
    bestScore,
    bestPercentage: Math.round(bestPercentage * 100) / 100,
    recentTrend: trend,
  };
}
