import { Router, Request, Response } from "express";
import { z } from "zod";
import {
  startAttempt,
  getAttempt,
  submitAnswer,
  submitTest,
  getResults,
  getSolutions,
  getUserAttempts,
  getLeaderboard,
  getRecentCompletedTests,
  getTestAttemptStats,
} from "../../services/test-series/test-attempt.service";
import { authenticate } from "../../middlewares/auth.middleware";
import { asyncHandler } from "../../middlewares/async-handler";

const router = Router();

// Zod Validators
const uuidSchema = z.string().uuid();

const submitAnswerSchema = z.object({
  questionId: z.string().uuid(),
  selectedOptionId: z.string().uuid().optional(),
  textAnswer: z.string().optional(),
  timeSpentSeconds: z.number().int().min(0).optional(),
  isMarkedForReview: z.boolean().optional(),
});

const paginationSchema = z.object({
  page: z.string().optional().default("1"),
  limit: z.string().optional().default("10"),
});

const recentTestsQuerySchema = z.object({
  page: z.string().optional().default("1"),
  limit: z.string().optional().default("20"),
  testSeriesId: z
    .uuid()
    .optional()
    .or(z.literal(""))
    .transform((val) => (val === "" ? undefined : val)),
  isPassed: z
    .string()
    .optional()
    .transform((val) => {
      if (val === "true") return true;
      if (val === "false") return false;
      return undefined;
    }),
});

const statsQuerySchema = z.object({
  testSeriesId: z
    .uuid()
    .optional()
    .or(z.literal(""))
    .transform((val) => (val === "" ? undefined : val)),
});

// ==================== ATTEMPT ROUTES ====================

/**
 * @openapi
 * /api/attempts/start/{testId}:
 *   post:
 *     tags:
 *       - Test Attempts (Client)
 *     summary: Start a new test attempt
 *     description: Start a new attempt for a test. Validates enrollment before starting.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       201:
 *         description: Test attempt started successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/TestAttempt'
 *                 message:
 *                   type: string
 *       403:
 *         description: Not enrolled in test series
 *       404:
 *         description: Test not found
 */
router.post(
  "/start/:testId",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { testId } = req.params;
    uuidSchema.parse(testId);
    const userId = req.user!.id;

    const attempt = await startAttempt({ userId, testId });

    res.status(201).json({
      success: true,
      data: attempt,
      message: "Test attempt started successfully",
    });
  })
);

/**
 * @openapi
 * /api/attempts/{attemptId}:
 *   get:
 *     tags:
 *       - Test Attempts (Client)
 *     summary: Get attempt details with questions
 *     description: Get all questions and current progress for an active attempt
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: attemptId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Attempt details retrieved successfully
 *       403:
 *         description: Not authorized to access this attempt
 *       404:
 *         description: Attempt not found
 */
router.get(
  "/:attemptId",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { attemptId } = req.params;
    uuidSchema.parse(attemptId);
    const userId = req.user!.id;

    const attempt = await getAttempt(attemptId, userId);

    res.json({
      success: true,
      data: attempt,
    });
  })
);

/**
 * @openapi
 * /api/attempts/{attemptId}/answer:
 *   post:
 *     tags:
 *       - Test Attempts (Client)
 *     summary: Submit answer for a question
 *     description: Save or update answer for a question during test attempt
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: attemptId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - questionId
 *             properties:
 *               questionId:
 *                 type: string
 *                 format: uuid
 *               selectedOptionId:
 *                 type: string
 *                 format: uuid
 *                 description: For MCQ/TRUE_FALSE questions
 *               textAnswer:
 *                 type: string
 *                 description: For FILL_BLANK/NUMERICAL questions
 *               timeSpentSeconds:
 *                 type: integer
 *                 minimum: 0
 *               isMarkedForReview:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Answer saved successfully
 *       400:
 *         description: Invalid answer data or test already submitted
 */
router.post(
  "/:attemptId/answer",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { attemptId } = req.params;
    uuidSchema.parse(attemptId);
    const data = submitAnswerSchema.parse(req.body);
    const userId = req.user!.id;

    const answer = await submitAnswer({
      attemptId,
      userId,
      ...data,
    });

    res.json({
      success: true,
      data: answer,
      message: "Answer saved successfully",
    });
  })
);

/**
 * @openapi
 * /api/attempts/{attemptId}/submit:
 *   post:
 *     tags:
 *       - Test Attempts (Client)
 *     summary: Submit test and get evaluated
 *     description: Final submission of test attempt with automatic evaluation
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: attemptId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Test submitted and evaluated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     attemptId:
 *                       type: string
 *                       format: uuid
 *                     totalScore:
 *                       type: number
 *                     percentage:
 *                       type: number
 *                     rank:
 *                       type: integer
 *                     percentile:
 *                       type: number
 *       400:
 *         description: Test already submitted
 */
router.post(
  "/:attemptId/submit",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { attemptId } = req.params;
    uuidSchema.parse(attemptId);
    const userId = req.user!.id;

    const result = await submitTest(attemptId, userId);

    res.json({
      success: true,
      data: result,
      message: "Test submitted successfully",
    });
  })
);

/**
 * @openapi
 * /api/attempts/{attemptId}/results:
 *   get:
 *     tags:
 *       - Test Attempts (Client)
 *     summary: Get results of completed attempt
 *     description: Get comprehensive results with score breakdown and analysis
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: attemptId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Results retrieved successfully
 *       400:
 *         description: Test not yet submitted
 *       404:
 *         description: Attempt not found
 */
router.get(
  "/:attemptId/results",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { attemptId } = req.params;
    uuidSchema.parse(attemptId);
    const userId = req.user!.id;

    const results = await getResults(attemptId, userId);

    res.json({
      success: true,
      data: results,
    });
  })
);

/**
 * @openapi
 * /api/attempts/{attemptId}/solutions:
 *   get:
 *     tags:
 *       - Test Attempts (Client)
 *     summary: Get solutions with explanations
 *     description: Get correct answers and detailed explanations for all questions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: attemptId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Solutions retrieved successfully
 *       400:
 *         description: Solutions not available yet
 */
router.get(
  "/:attemptId/solutions",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { attemptId } = req.params;
    uuidSchema.parse(attemptId);
    const userId = req.user!.id;

    const solutions = await getSolutions(attemptId, userId);

    res.json({
      success: true,
      data: solutions,
    });
  })
);

/**
 * @openapi
 * /api/attempts/test/{testId}/my-attempts:
 *   get:
 *     tags:
 *       - Test Attempts (Client)
 *     summary: Get user's all attempts for a test
 *     description: Retrieve all attempts made by the user for a specific test
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Attempts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TestAttempt'
 */
router.get(
  "/test/:testId/my-attempts",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { testId } = req.params;
    uuidSchema.parse(testId);
    const userId = req.user!.id;

    const attempts = await getUserAttempts(userId, testId);

    res.json({
      success: true,
      data: attempts,
    });
  })
);

/**
 * @openapi
 * /api/attempts/test/{testId}/leaderboard:
 *   get:
 *     tags:
 *       - Test Attempts (Client)
 *     summary: Get leaderboard for a test
 *     description: View test rankings showing top performers
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 100
 *     responses:
 *       200:
 *         description: Leaderboard retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     leaderboard:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           rank:
 *                             type: integer
 *                           userId:
 *                             type: string
 *                           username:
 *                             type: string
 *                           score:
 *                             type: number
 *                           percentage:
 *                             type: number
 *                     userRank:
 *                       type: object
 *                       properties:
 *                         rank:
 *                           type: integer
 *                         percentile:
 *                           type: number
 */
router.get(
  "/test/:testId/leaderboard",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { testId } = req.params;
    uuidSchema.parse(testId);

    const { page, limit } = paginationSchema.parse(req.query);
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    const leaderboard = await getLeaderboard(testId, limitNum, offset);

    res.json({
      success: true,
      data: leaderboard,
      pagination: {
        page: pageNum,
        limit: limitNum,
      },
    });
  })
);

/**
 * @openapi
 * /api/attempts/recent-completed:
 *   get:
 *     tags:
 *       - Test Attempts (Client)
 *     summary: Get all recent completed tests (Dashboard)
 *     description: Get user's recent completed test attempts with full results and statistics
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 50
 *         description: Items per page
 *       - in: query
 *         name: testSeriesId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by test series
 *       - in: query
 *         name: isPassed
 *         schema:
 *           type: boolean
 *         description: Filter by pass/fail status
 *     responses:
 *       200:
 *         description: Recent completed tests retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       attemptId:
 *                         type: string
 *                         format: uuid
 *                       attemptNumber:
 *                         type: integer
 *                       test:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           title:
 *                             type: string
 *                           slug:
 *                             type: string
 *                           totalMarks:
 *                             type: number
 *                           duration:
 *                             type: integer
 *                           testSeries:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                               title:
 *                                 type: string
 *                               exam:
 *                                 type: string
 *                       performance:
 *                         type: object
 *                         properties:
 *                           totalScore:
 *                             type: number
 *                           percentage:
 *                             type: number
 *                           rank:
 *                             type: integer
 *                           percentile:
 *                             type: number
 *                           isPassed:
 *                             type: boolean
 *                           correctCount:
 *                             type: integer
 *                           wrongCount:
 *                             type: integer
 *                           skippedCount:
 *                             type: integer
 *                           timeSpentSeconds:
 *                             type: integer
 *                       submittedAt:
 *                         type: string
 *                         format: date-time
 *                       startedAt:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   type: object
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalTestsAttempted:
 *                       type: integer
 *                     totalTestsCompleted:
 *                       type: integer
 *                     totalTestsPassed:
 *                       type: integer
 *                     averageScore:
 *                       type: number
 *                     averagePercentage:
 *                       type: number
 *                     passRate:
 *                       type: number
 *                     totalTimeSpentHours:
 *                       type: number
 *                     bestScore:
 *                       type: number
 *                     bestPercentage:
 *                       type: number
 *                     recentTrend:
 *                       type: string
 *                       enum: [improving, stable, declining]
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/recent-completed",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const query = recentTestsQuerySchema.parse(req.query);

    const result = await getRecentCompletedTests(userId, {
      page: parseInt(query.page),
      limit: parseInt(query.limit),
      testSeriesId: query.testSeriesId,
      isPassed: query.isPassed,
    });

    res.json({
      success: true,
      data: result.attempts,
      pagination: result.pagination,
      stats: result.stats,
      message: "Recent completed tests retrieved successfully",
    });
  })
);

/**
 * @openapi
 * /api/attempts/stats:
 *   get:
 *     tags:
 *       - Test Attempts (Client)
 *     summary: Get test attempt statistics
 *     description: Get aggregated statistics for user's test attempts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: testSeriesId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter stats by test series
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalTestsAttempted:
 *                       type: integer
 *                     totalTestsCompleted:
 *                       type: integer
 *                     totalTestsPassed:
 *                       type: integer
 *                     averageScore:
 *                       type: number
 *                     averagePercentage:
 *                       type: number
 *                     passRate:
 *                       type: number
 *                     totalTimeSpentSeconds:
 *                       type: integer
 *                     totalTimeSpentHours:
 *                       type: number
 *                     bestScore:
 *                       type: number
 *                     bestPercentage:
 *                       type: number
 *                     recentTrend:
 *                       type: string
 *                       enum: [improving, stable, declining]
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/stats",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const validated = statsQuerySchema.parse(req.query);

    const stats = await getTestAttemptStats(userId, validated.testSeriesId);

    res.json({
      success: true,
      data: stats,
      message: "Statistics retrieved successfully",
    });
  })
);

export default router;
