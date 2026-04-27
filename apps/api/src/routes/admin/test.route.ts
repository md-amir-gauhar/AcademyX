import { Router, Request, Response } from "express";
import bodyParser from "body-parser";
import { z } from "zod";
import {
  createTest,
  getTest,
  updateTest,
  deleteTest,
  publishTest,
  getTestWithDetails,
} from "../../services/admin/test.service";
import { getTestsInSeries } from "../../services/admin/test-series.service";
import {
  createSection,
  getSection,
  getSectionsInTest,
  updateSection,
  deleteSection,
  reorderSections,
} from "../../services/admin/section.service";
import {
  createQuestion,
  getQuestion,
  getQuestionsInSection,
  updateQuestion,
  deleteQuestion,
  createOption,
  updateOption,
  deleteOption,
  reorderQuestions,
  createBulkQuestions,
} from "../../services/admin/question.service";
import { authenticate, authorize } from "../../middlewares/auth.middleware";
import { asyncHandler } from "../../middlewares/async-handler";

const router = Router();
router.use(bodyParser.json());

// Zod Validators
const uuidSchema = z.string().uuid();

const createTestSchema = z.object({
  testSeriesId: z.string().uuid(),
  title: z.string().min(1).max(500),
  description: z.any().optional(),
  // Optional — backend auto-generates from `title` when not provided.
  slug: z.string().min(1).max(255).optional(),
  instructions: z.any().optional(),
  durationMinutes: z.number().int().positive(),
  totalMarks: z.number().positive(),
  passingMarks: z.number().positive().optional(),
  isFree: z.boolean().optional(),
  showAnswersAfterSubmit: z.boolean().optional(),
  allowReview: z.boolean().optional(),
  shuffleQuestions: z.boolean().optional(),
});

const updateTestSchema = createTestSchema
  .partial()
  .omit({ testSeriesId: true })
  .extend({
    isPublished: z.boolean().optional(),
  });

const createSectionSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  displayOrder: z.number().int().positive().optional(),
});

const updateSectionSchema = createSectionSchema.partial();

const reorderSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().uuid(),
      displayOrder: z.number().int(),
    })
  ),
});

const createQuestionSchema = z.object({
  text: z.string().min(1),
  imageUrl: z.string().url().optional(),
  type: z.enum(["MCQ", "TRUE_FALSE", "FILL_BLANK", "NUMERICAL"]),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  marks: z.number().positive(),
  negativeMarks: z.number().min(0).optional(),
  explanation: z.string().optional(),
  explanationImageUrl: z.string().url().optional(),
  displayOrder: z.number().int().positive().optional(),
  options: z
    .array(
      z.object({
        text: z.string().min(1),
        imageUrl: z.string().url().optional(),
        isCorrect: z.boolean(),
      })
    )
    .optional(),
});

const createBulkQuestionsSchema = z.object({
  questions: z.array(createQuestionSchema).min(1).max(100),
});

const updateQuestionSchema = createQuestionSchema.partial();

const createOptionSchema = z.object({
  text: z.string().min(1),
  imageUrl: z.string().url().optional(),
  isCorrect: z.boolean(),
});

const updateOptionSchema = createOptionSchema
  .partial()
  .extend({ displayOrder: z.number().int().positive().optional() });

// ==================== TEST ROUTES ====================

/**
 * @openapi
 * /admin/tests:
 *   post:
 *     tags:
 *       - Tests (Admin)
 *     summary: Create a new test
 *     description: Create a new test within a test series
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - testSeriesId
 *               - title
 *               - slug
 *               - durationMinutes
 *               - totalMarks
 *             properties:
 *               testSeriesId:
 *                 type: string
 *                 format: uuid
 *               title:
 *                 type: string
 *               slug:
 *                 type: string
 *               description:
 *                 type: object
 *               instructions:
 *                 type: object
 *               durationMinutes:
 *                 type: integer
 *               totalMarks:
 *                 type: number
 *               passingMarks:
 *                 type: number
 *               isFree:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Test created successfully
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post(
  "/",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  asyncHandler(async (req: Request, res: Response) => {
    const data = createTestSchema.parse(req.body);
    const organizationId = req.user!.organizationId;

    const test = await createTest({
      ...data,
      organizationId,
    });

    res.status(201).json({
      success: true,
      data: test,
    });
  })
);

/**
 * @openapi
 * /admin/tests/test-series/{testSeriesId}:
 *   get:
 *     tags:
 *       - Tests (Admin)
 *     summary: Get all tests in a test series
 *     description: Retrieve all tests for a specific test series
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testSeriesId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Test Series ID
 *     responses:
 *       200:
 *         description: Tests retrieved successfully
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
 *                     $ref: '#/components/schemas/Test'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get(
  "/test-series/:testSeriesId",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  asyncHandler(async (req: Request, res: Response) => {
    const { testSeriesId } = req.params;
    uuidSchema.parse(testSeriesId);
    const organizationId = req.user!.organizationId;

    const tests = await getTestsInSeries(testSeriesId, organizationId);

    res.json({
      success: true,
      data: tests,
    });
  })
);

/**
 * @openapi
 * /admin/tests/{identifier}:
 *   get:
 *     tags:
 *       - Tests (Admin)
 *     summary: Get test by ID or slug
 *     description: Retrieve test details by ID or slug
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: identifier
 *         required: true
 *         schema:
 *           type: string
 *         description: Test ID (UUID) or slug
 *     responses:
 *       200:
 *         description: Test retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Test'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get(
  "/:identifier",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  asyncHandler(async (req: Request, res: Response) => {
    const { identifier } = req.params;
    const organizationId = req.user!.organizationId;

    const test = await getTest(identifier, organizationId);

    res.json({
      success: true,
      data: test,
    });
  })
);

/**
 * @openapi
 * /admin/tests/{testId}/details:
 *   get:
 *     tags:
 *       - Tests (Admin)
 *     summary: Get test with full details
 *     description: Retrieve test with all sections and questions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Test ID
 *     responses:
 *       200:
 *         description: Test details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Test'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get(
  "/:testId/details",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  asyncHandler(async (req: Request, res: Response) => {
    const { testId } = req.params;
    uuidSchema.parse(testId);
    const organizationId = req.user!.organizationId;

    const test = await getTestWithDetails(testId, organizationId);

    res.json({
      success: true,
      data: test,
    });
  })
);

/**
 * @openapi
 * /admin/tests/{testId}:
 *   put:
 *     tags:
 *       - Tests (Admin)
 *     summary: Update test
 *     description: Update an existing test
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: object
 *               instructions:
 *                 type: object
 *               slug:
 *                 type: string
 *               durationMinutes:
 *                 type: integer
 *               totalMarks:
 *                 type: number
 *               passingMarks:
 *                 type: number
 *               isFree:
 *                 type: boolean
 *               showAnswersAfterSubmit:
 *                 type: boolean
 *               allowReview:
 *                 type: boolean
 *               shuffleQuestions:
 *                 type: boolean
 *               isPublished:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Test updated successfully
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *   delete:
 *     tags:
 *       - Tests (Admin)
 *     summary: Delete test
 *     description: Delete a test
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
 *         description: Test deleted successfully
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put(
  "/:testId",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  asyncHandler(async (req: Request, res: Response) => {
    const { testId } = req.params;
    uuidSchema.parse(testId);
    const data = updateTestSchema.parse(req.body);
    const organizationId = req.user!.organizationId;

    const updated = await updateTest(testId, organizationId, data);

    res.json({
      success: true,
      data: updated,
    });
  })
);

/**
 * DELETE /admin/tests/:testId
 * Delete test - already documented above in PUT section
 */
router.delete(
  "/:testId",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  asyncHandler(async (req: Request, res: Response) => {
    const { testId } = req.params;
    uuidSchema.parse(testId);
    const organizationId = req.user!.organizationId;

    await deleteTest(testId, organizationId);

    res.json({
      success: true,
      message: "Test deleted successfully",
    });
  })
);

/**
 * @openapi
 * /admin/tests/{testId}/publish:
 *   post:
 *     tags:
 *       - Tests (Admin)
 *     summary: Publish test
 *     description: Mark test as published
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
 *         description: Test published successfully
 *       400:
 *         description: Cannot publish test without sections and questions
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post(
  "/:testId/publish",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  asyncHandler(async (req: Request, res: Response) => {
    const { testId } = req.params;
    uuidSchema.parse(testId);
    const organizationId = req.user!.organizationId;

    const published = await publishTest(testId, organizationId);

    res.json({
      success: true,
      data: published,
    });
  })
);

// ==================== SECTION ROUTES ====================

/**
 * @openapi
 * /admin/tests/{testId}/sections:
 *   post:
 *     tags:
 *       - Tests (Admin)
 *     summary: Create section in test
 *     description: Add a new section to a test
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
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
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               displayOrder:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Section created successfully
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *   get:
 *     tags:
 *       - Tests (Admin)
 *     summary: Get all sections in test
 *     description: Retrieve all sections for a test
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
 *         description: Sections retrieved successfully
 */
router.post(
  "/:testId/sections",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  asyncHandler(async (req: Request, res: Response) => {
    const { testId } = req.params;
    uuidSchema.parse(testId);
    const data = createSectionSchema.parse(req.body);
    const organizationId = req.user!.organizationId;

    const section = await createSection({
      testId,
      organizationId,
      ...data,
    });

    res.status(201).json({
      success: true,
      data: section,
    });
  })
);

/**
 * GET /admin/tests/:testId/sections - Already documented in POST above
 */
router.get(
  "/:testId/sections",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  asyncHandler(async (req: Request, res: Response) => {
    const { testId } = req.params;
    uuidSchema.parse(testId);
    const organizationId = req.user!.organizationId;

    const sections = await getSectionsInTest(testId, organizationId);

    res.json({
      success: true,
      data: sections,
    });
  })
);

/**
 * @openapi
 * /admin/tests/sections/{sectionId}:
 *   get:
 *     tags:
 *       - Tests (Admin)
 *     summary: Get section with questions
 *     description: Retrieve section details with all questions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sectionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Section retrieved successfully
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *   put:
 *     tags:
 *       - Tests (Admin)
 *     summary: Update section
 *     description: Update section details
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sectionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               displayOrder:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Section updated successfully
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *   delete:
 *     tags:
 *       - Tests (Admin)
 *     summary: Delete section
 *     description: Delete a section and all its questions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sectionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Section deleted successfully
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get(
  "/sections/:sectionId",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  asyncHandler(async (req: Request, res: Response) => {
    const { sectionId } = req.params;
    uuidSchema.parse(sectionId);
    const organizationId = req.user!.organizationId;

    const section = await getSection(sectionId, organizationId);

    res.json({
      success: true,
      data: section,
    });
  })
);

/**
 * PUT /admin/tests/sections/:sectionId
 * Update section
 */
router.put(
  "/sections/:sectionId",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  asyncHandler(async (req: Request, res: Response) => {
    const { sectionId } = req.params;
    uuidSchema.parse(sectionId);
    const data = updateSectionSchema.parse(req.body);
    const organizationId = req.user!.organizationId;

    const updated = await updateSection(sectionId, organizationId, data);

    res.json({
      success: true,
      data: updated,
    });
  })
);

/**
 * DELETE /admin/tests/sections/:sectionId
 * Delete section
 */
router.delete(
  "/sections/:sectionId",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  asyncHandler(async (req: Request, res: Response) => {
    const { sectionId } = req.params;
    uuidSchema.parse(sectionId);
    const organizationId = req.user!.organizationId;

    await deleteSection(sectionId, organizationId);

    res.json({
      success: true,
      message: "Section deleted successfully",
    });
  })
);

/**
 * PUT /admin/tests/:testId/sections/reorder
 * Reorder sections
 */
router.put(
  "/:testId/sections/reorder",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  asyncHandler(async (req: Request, res: Response) => {
    const { testId } = req.params;
    uuidSchema.parse(testId);
    const { items } = reorderSchema.parse(req.body);
    const organizationId = req.user!.organizationId;

    await reorderSections(testId, organizationId, items);

    res.json({
      success: true,
      message: "Sections reordered successfully",
    });
  })
);

// ==================== QUESTION ROUTES ====================

/**
 * @openapi
 * /admin/tests/sections/{sectionId}/questions:
 *   post:
 *     tags:
 *       - Tests (Admin)
 *     summary: Create question in section
 *     description: Add a new question to a section
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sectionId
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
 *               - text
 *               - type
 *               - difficulty
 *               - marks
 *             properties:
 *               text:
 *                 type: string
 *               imageUrl:
 *                 type: string
 *                 format: uri
 *               type:
 *                 type: string
 *                 enum: [MCQ, TRUE_FALSE, FILL_BLANK, NUMERICAL]
 *               difficulty:
 *                 type: string
 *                 enum: [EASY, MEDIUM, HARD]
 *               marks:
 *                 type: number
 *               negativeMarks:
 *                 type: number
 *               explanation:
 *                 type: string
 *               options:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     text:
 *                       type: string
 *                     isCorrect:
 *                       type: boolean
 *     responses:
 *       201:
 *         description: Question created successfully
 *       400:
 *         description: Invalid question data
 *   get:
 *     tags:
 *       - Tests (Admin)
 *     summary: Get all questions in section
 *     description: Retrieve all questions for a section
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sectionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Questions retrieved successfully
 */
router.post(
  "/sections/:sectionId/questions",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  asyncHandler(async (req: Request, res: Response) => {
    const { sectionId } = req.params;
    uuidSchema.parse(sectionId);
    const data = createQuestionSchema.parse(req.body);
    const organizationId = req.user!.organizationId;

    const question = await createQuestion({
      sectionId,
      organizationId,
      ...data,
    });

    res.status(201).json({
      success: true,
      data: question,
    });
  })
);

/**
 * @openapi
 * /admin/tests/sections/{sectionId}/questions/bulk:
 *   post:
 *     tags:
 *       - Tests (Admin)
 *     summary: Create multiple questions in section (bulk)
 *     description: Add multiple questions to a section at once
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sectionId
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
 *               - questions
 *             properties:
 *               questions:
 *                 type: array
 *                 minItems: 1
 *                 maxItems: 100
 *                 items:
 *                   type: object
 *                   required:
 *                     - text
 *                     - type
 *                     - difficulty
 *                     - marks
 *                   properties:
 *                     text:
 *                       type: string
 *                     imageUrl:
 *                       type: string
 *                       format: uri
 *                     type:
 *                       type: string
 *                       enum: [MCQ, TRUE_FALSE, FILL_BLANK, NUMERICAL]
 *                     difficulty:
 *                       type: string
 *                       enum: [EASY, MEDIUM, HARD]
 *                     marks:
 *                       type: number
 *                     negativeMarks:
 *                       type: number
 *                     explanation:
 *                       type: string
 *                     options:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           text:
 *                             type: string
 *                           isCorrect:
 *                             type: boolean
 *     responses:
 *       201:
 *         description: Questions created successfully
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
 *                     count:
 *                       type: integer
 *                     questions:
 *                       type: array
 *       400:
 *         description: Invalid question data
 */
router.post(
  "/sections/:sectionId/questions/bulk",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  asyncHandler(async (req: Request, res: Response) => {
    const { sectionId } = req.params;
    uuidSchema.parse(sectionId);
    const { questions } = createBulkQuestionsSchema.parse(req.body);
    const organizationId = req.user!.organizationId;

    const result = await createBulkQuestions(
      sectionId,
      organizationId,
      questions
    );

    res.status(201).json({
      success: true,
      data: result,
      message: `${result.count} questions created successfully`,
    });
  })
);

/**
 * GET /admin/tests/sections/:sectionId/questions
 * Get all questions in section
 */
router.get(
  "/sections/:sectionId/questions",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  asyncHandler(async (req: Request, res: Response) => {
    const { sectionId } = req.params;
    uuidSchema.parse(sectionId);
    const organizationId = req.user!.organizationId;

    const questions = await getQuestionsInSection(sectionId, organizationId);

    res.json({
      success: true,
      data: questions,
    });
  })
);

/**
 * GET /admin/tests/questions/:questionId
 * Get question with options
 */
router.get(
  "/questions/:questionId",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  asyncHandler(async (req: Request, res: Response) => {
    const { questionId } = req.params;
    uuidSchema.parse(questionId);
    const organizationId = req.user!.organizationId;

    const question = await getQuestion(questionId, organizationId);

    res.json({
      success: true,
      data: question,
    });
  })
);

/**
 * PUT /admin/tests/questions/:questionId
 * Update question
 */
router.put(
  "/questions/:questionId",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  asyncHandler(async (req: Request, res: Response) => {
    const { questionId } = req.params;
    uuidSchema.parse(questionId);
    const data = updateQuestionSchema.parse(req.body);
    const organizationId = req.user!.organizationId;

    const updated = await updateQuestion(questionId, organizationId, data);

    res.json({
      success: true,
      data: updated,
    });
  })
);

/**
 * DELETE /admin/tests/questions/:questionId
 * Delete question
 */
router.delete(
  "/questions/:questionId",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  asyncHandler(async (req: Request, res: Response) => {
    const { questionId } = req.params;
    uuidSchema.parse(questionId);
    const organizationId = req.user!.organizationId;

    await deleteQuestion(questionId, organizationId);

    res.json({
      success: true,
      message: "Question deleted successfully",
    });
  })
);

/**
 * PUT /admin/tests/sections/:sectionId/questions/reorder
 * Reorder questions in section
 */
router.put(
  "/sections/:sectionId/questions/reorder",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  asyncHandler(async (req: Request, res: Response) => {
    const { sectionId } = req.params;
    uuidSchema.parse(sectionId);
    const { items } = reorderSchema.parse(req.body);
    const organizationId = req.user!.organizationId;

    await reorderQuestions(sectionId, organizationId, items);

    res.json({
      success: true,
      message: "Questions reordered successfully",
    });
  })
);

// ==================== OPTION ROUTES ====================

/**
 * POST /admin/tests/questions/:questionId/options
 * Add option to MCQ question
 */
router.post(
  "/questions/:questionId/options",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  asyncHandler(async (req: Request, res: Response) => {
    const { questionId } = req.params;
    uuidSchema.parse(questionId);
    const data = createOptionSchema.parse(req.body);
    const organizationId = req.user!.organizationId;

    const option = await createOption(questionId, organizationId, data);

    res.status(201).json({
      success: true,
      data: option,
    });
  })
);

/**
 * PUT /admin/tests/questions/:questionId/options/:optionId
 * Update option
 */
router.put(
  "/questions/:questionId/options/:optionId",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  asyncHandler(async (req: Request, res: Response) => {
    const { questionId, optionId } = req.params;
    uuidSchema.parse(questionId);
    uuidSchema.parse(optionId);
    const data = updateOptionSchema.parse(req.body);
    const organizationId = req.user!.organizationId;

    const updated = await updateOption(
      optionId,
      questionId,
      organizationId,
      data
    );

    res.json({
      success: true,
      data: updated,
    });
  })
);

/**
 * DELETE /admin/tests/questions/:questionId/options/:optionId
 * Delete option
 */
router.delete(
  "/questions/:questionId/options/:optionId",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  asyncHandler(async (req: Request, res: Response) => {
    const { questionId, optionId } = req.params;
    uuidSchema.parse(questionId);
    uuidSchema.parse(optionId);
    const organizationId = req.user!.organizationId;

    await deleteOption(optionId, questionId, organizationId);

    res.json({
      success: true,
      message: "Option deleted successfully",
    });
  })
);

export default router;
