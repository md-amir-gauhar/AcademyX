import { Router, Request, Response } from "express";
import bodyParser from "body-parser";
import {
  createTestSeries,
  getTestSeries,
  getAllTestSeries,
  updateTestSeries,
  deleteTestSeries,
  getTestsInSeries,
  getTestSeriesStats,
} from "../../services/admin/test-series.service";
import { asyncHandler } from "../../middlewares/async-handler";
import { authenticate, authorize } from "../../middlewares/auth.middleware";
import {
  validate,
  validateQuery,
  validateParams,
} from "../../middlewares/validate.middleware";
import { HTTP_STATUS } from "../../common/constants";
import { z } from "zod";

const router = Router();
router.use(bodyParser.json());

// Validators
const uuidParamSchema = z.object({
  id: z.uuid(),
});

const identifierParamSchema = z.object({
  identifier: z.string().min(1),
});

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

const createTestSeriesSchema = z.object({
  exam: z.enum([
    "JEE",
    "NEET",
    "UPSC",
    "BANK",
    "SSC",
    "GATE",
    "CAT",
    "NDA",
    "CLAT",
    "OTHER",
  ]),
  title: z.string().min(3).max(255),
  description: z.any().optional(),
  // Optional — backend auto-generates from `title` when not provided.
  slug: z.string().min(3).max(255).optional(),
  imageUrl: z.string().url().optional(),
  faq: z.any().optional(),
  totalPrice: z.number().min(0),
  discountPercentage: z.number().min(0).max(100).default(0),
  isFree: z.boolean().default(false),
  durationDays: z.number().int().positive().default(365),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

const updateTestSeriesSchema = createTestSeriesSchema.partial();

/**
 * @openapi
 * /admin/test-series:
 *   get:
 *     tags:
 *       - Test Series (Admin)
 *     summary: Get all test series (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *     responses:
 *       200:
 *         description: Test series retrieved successfully
 */
router.get(
  "/",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  validateQuery(paginationSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const organizationId = req.user?.organizationId!;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const result = await getAllTestSeries(organizationId, page, limit);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      ...result,
      message: "Test series retrieved successfully",
    });
  })
);

/**
 * @openapi
 * /admin/test-series/{identifier}:
 *   get:
 *     tags:
 *       - Test Series (Admin)
 *     summary: Get test series by ID or slug (Admin)
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
 *         description: Test series details
 */
router.get(
  "/:identifier",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  validateParams(identifierParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { identifier } = req.params;
    const organizationId = req.user?.organizationId!;

    const series = await getTestSeries(identifier, organizationId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: series,
      message: "Test series retrieved successfully",
    });
  })
);

/**
 * @openapi
 * /admin/test-series/{id}/tests:
 *   get:
 *     tags:
 *       - Test Series (Admin)
 *     summary: Get tests in series (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tests retrieved successfully
 */
router.get(
  "/:id/tests",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  validateParams(uuidParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId!;

    const tests = await getTestsInSeries(id, organizationId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: tests,
      message: "Tests retrieved successfully",
    });
  })
);

/**
 * @openapi
 * /admin/test-series:
 *   post:
 *     tags:
 *       - Test Series (Admin)
 *     summary: Create test series (Admin)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Test series created successfully
 */
router.post(
  "/",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  validate(createTestSeriesSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const organizationId = req.user?.organizationId!;

    const series = await createTestSeries({
      ...req.body,
      organizationId,
    });

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: series,
      message: "Test series created successfully",
    });
  })
);

/**
 * @openapi
 * /admin/test-series/{id}:
 *   put:
 *     tags:
 *       - Test Series (Admin)
 *     summary: Update test series (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Test series updated successfully
 */
router.put(
  "/:id",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  validateParams(uuidParamSchema),
  validate(updateTestSeriesSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId!;

    const series = await updateTestSeries(id, organizationId, req.body);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: series,
      message: "Test series updated successfully",
    });
  })
);

/**
 * @openapi
 * /admin/test-series/{id}:
 *   delete:
 *     tags:
 *       - Test Series (Admin)
 *     summary: Delete test series (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Test series deleted successfully
 */
router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  validateParams(uuidParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId!;

    await deleteTestSeries(id, organizationId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Test series deleted successfully",
    });
  })
);

/**
 * @openapi
 * /admin/test-series/{id}/stats:
 *   get:
 *     tags:
 *       - Test Series (Admin)
 *     summary: Get test series statistics (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 */
router.get(
  "/:id/stats",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  validateParams(uuidParamSchema.extend({ id: z.string().uuid() })),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId!;

    const stats = await getTestSeriesStats(id, organizationId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: stats,
      message: "Test series statistics retrieved successfully",
    });
  })
);

export default router;
