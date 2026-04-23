import { Router, Request, Response } from "express";
import { db } from "../../db";
import {
  tests,
  testSections,
  testQuestions,
  testQuestionOptions,
  userTestSeriesMapping,
} from "../../db/schema";
import { eq, and } from "drizzle-orm";
import { asyncHandler } from "../../middlewares/async-handler";
import { authenticate } from "../../middlewares/auth.middleware";
import { validateParams } from "../../middlewares/validate.middleware";
import { cache } from "../../middlewares/cache.middleware";
import { CacheTTL } from "../../services/cache.service";
import { HTTP_STATUS } from "../../common/constants";
import { z } from "zod";

const router = Router();

const identifierParamSchema = z.object({
  identifier: z.string().min(1),
});

/**
 * @openapi
 * /api/tests/{identifier}:
 *   get:
 *     tags:
 *       - Tests (Client)
 *     summary: Get published test details (preview only, no answers)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: identifier
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Test details retrieved successfully
 */
router.get(
  "/:identifier",
  authenticate,
  validateParams(identifierParamSchema),
  cache(CacheTTL.MEDIUM, (req) => {
    const identifier = req.params.identifier;
    const userId = req.user?.id;
    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        identifier
      );
    // CRITICAL: Must include userId because response contains user-specific isEnrolled field
    return isUUID
      ? `test:client:${identifier}:user:${userId}`
      : `test:client:slug:${identifier}:user:${userId}`;
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const { identifier } = req.params;
    const userId = req.user?.id!;
    const organizationId = req.user?.organizationId!;

    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        identifier
      );

    // Get test
    const test = await db.query.tests.findFirst({
      where: and(
        isUUID ? eq(tests.id, identifier) : eq(tests.slug, identifier),
        eq(tests.organizationId, organizationId)
      ),
      with: {
        testSeries: true,
      },
    });

    if (!test) {
      throw new Error("Test not found");
    }

    // Only show published tests to clients
    if (!test.isPublished) {
      throw new Error("Test is not published yet");
    }

    // Check enrollment if test is part of a paid series
    let isEnrolled = false;
    if (test.testSeriesId && !test.isFree) {
      const enrollment = await db.query.userTestSeriesMapping.findFirst({
        where: and(
          eq(userTestSeriesMapping.userId, userId),
          eq(userTestSeriesMapping.testSeriesId, test.testSeriesId)
        ),
      });

      isEnrolled = !!enrollment;

      if (!isEnrolled) {
        // Return basic test info but no questions
        res.status(HTTP_STATUS.OK).json({
          success: true,
          data: {
            ...test,
            isEnrolled: false,
            message:
              "You must be enrolled in the test series to access this test",
          },
          message: "Test details retrieved successfully",
        });
        return;
      }
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        ...test,
        isEnrolled: test.isFree || isEnrolled,
      },
      message: "Test details retrieved successfully",
    });
  })
);

/**
 * @openapi
 * /api/tests/{testId}/preview:
 *   get:
 *     tags:
 *       - Tests (Client)
 *     summary: Get test structure with questions (no answers) for enrolled users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Test preview retrieved successfully
 */
router.get(
  "/:testId/preview",
  authenticate,
  validateParams(z.object({ testId: z.string().uuid() })),
  cache(CacheTTL.MEDIUM, (req) => {
    const testId = req.params.testId;
    const userId = req.user?.id;
    // CRITICAL: Must include userId because enrollment check affects response
    return `test:preview:${testId}:user:${userId}`;
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const { testId } = req.params;
    const userId = req.user?.id!;
    const organizationId = req.user?.organizationId!;

    // Get test with full structure
    const test = await db.query.tests.findFirst({
      where: and(
        eq(tests.id, testId),
        eq(tests.organizationId, organizationId)
      ),
      with: {
        testSeries: true,
        sections: {
          orderBy: [testSections.displayOrder],
          with: {
            questions: {
              orderBy: [testQuestions.displayOrder],
              with: {
                options: {
                  orderBy: [testQuestionOptions.displayOrder],
                },
              },
            },
          },
        },
      },
    });

    if (!test) {
      throw new Error("Test not found");
    }

    if (!test.isPublished) {
      throw new Error("Test is not published yet");
    }

    // Check enrollment for paid tests
    if (test.testSeriesId && !test.isFree) {
      const enrollment = await db.query.userTestSeriesMapping.findFirst({
        where: and(
          eq(userTestSeriesMapping.userId, userId),
          eq(userTestSeriesMapping.testSeriesId, test.testSeriesId)
        ),
      });

      if (!enrollment) {
        throw new Error(
          "You must be enrolled in the test series to preview this test"
        );
      }
    }

    // Remove correct answers from options
    const sanitizedTest = {
      ...test,
      sections: test.sections.map((section: any) => ({
        ...section,
        questions: section.questions.map((question: any) => ({
          ...question,
          // Remove explanation and correct answer info
          explanation: undefined,
          explanationImageUrl: undefined,
          options: question.options?.map((option: any) => ({
            id: option.id,
            text: option.text,
            imageUrl: option.imageUrl,
            displayOrder: option.displayOrder,
            // Hide isCorrect for preview
          })),
        })),
      })),
    };

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: sanitizedTest,
      message: "Test preview retrieved successfully",
    });
  })
);

export default router;
