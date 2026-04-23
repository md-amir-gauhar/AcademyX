import { Router, Request, Response } from "express";
import bodyParser from "body-parser";
import {
  getTestSeries,
  getAllTestSeries,
  getEnrolledTestSeries,
  getTestsInSeries,
} from "../../services/client/test-series.service";
import {
  createTestSeriesOrder,
  verifyPayment,
  enrollInFreeTestSeries,
} from "../../services/order.service";
import { asyncHandler } from "../../middlewares/async-handler";
import { authenticate } from "../../middlewares/auth.middleware";
import {
  validateQuery,
  validateParams,
} from "../../middlewares/validate.middleware";
import { cache, cacheList } from "../../middlewares/cache.middleware";
import { CacheTTL } from "../../services/cache.service";
import { HTTP_STATUS } from "../../common/constants";
import { z } from "zod";

const router = Router();
router.use(bodyParser.json());

// Validators
const identifierParamSchema = z.object({
  identifier: z.string().min(1),
});

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

/**
 * @openapi
 * /api/test-series:
 *   get:
 *     tags:
 *       - Test Series (Client)
 *     summary: Get all ACTIVE test series
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
  validateQuery(paginationSchema),
  cache(CacheTTL.MEDIUM, (req) => {
    const userId = req.user?.id;
    const orgId = req.user?.organizationId;
    const page = req.query.page || "1";
    const limit = req.query.limit || "10";
    // CRITICAL: Must include userId because response contains user-specific isEnrolled field
    return `testSeries:list:${orgId}:${userId}:${page}:${limit}`;
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const organizationId = req.user?.organizationId!;
    const userId = req.user?.id!;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const result = await getAllTestSeries(organizationId, userId, page, limit);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      ...result,
      message: "Test series retrieved successfully",
    });
  })
);

/**
 * @openapi
 * /api/test-series/my-test-series:
 *   get:
 *     tags:
 *       - Test Series (Client)
 *     summary: Get enrolled test series
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
 *         description: Enrolled test series retrieved successfully
 */
router.get(
  "/my-test-series",
  authenticate,
  validateQuery(paginationSchema),
  cache(CacheTTL.SHORT, (req) => {
    const userId = req.user?.id;
    const orgId = req.user?.organizationId;
    const page = req.query.page || "1";
    const limit = req.query.limit || "10";
    return `testSeries:enrolled:${orgId}:${userId}:${page}:${limit}`;
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const organizationId = req.user?.organizationId!;
    const userId = req.user?.id!;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const result = await getEnrolledTestSeries(
      organizationId,
      userId,
      page,
      limit
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      ...result,
      message: "Enrolled test series retrieved successfully",
    });
  })
);

/**
 * @openapi
 * /api/test-series/{identifier}:
 *   get:
 *     tags:
 *       - Test Series (Client)
 *     summary: Get test series by ID or slug (ACTIVE only)
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
      ? `testSeries:${identifier}:user:${userId}`
      : `testSeries:slug:${identifier}:user:${userId}`;
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const { identifier } = req.params;
    const organizationId = req.user?.organizationId!;
    const userId = req.user?.id!;

    const series = await getTestSeries(identifier, userId, organizationId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: series,
      message: "Test series retrieved successfully",
    });
  })
);

/**
 * @openapi
 * /api/test-series/{id}/tests:
 *   get:
 *     tags:
 *       - Test Series (Client)
 *     summary: Get tests in series
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
  validateParams(z.object({ id: z.string().uuid() })),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId!;
    const userId = req.user?.id!;

    const tests = await getTestsInSeries(id, organizationId, userId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: tests,
      message: "Tests retrieved successfully",
    });
  })
);

/**
 * @openapi
 * /api/test-series/{testSeriesId}/checkout:
 *   post:
 *     tags:
 *       - Test Series (Client)
 *     summary: Create order for test series purchase
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testSeriesId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order created successfully
 */
router.post(
  "/:testSeriesId/checkout",
  authenticate,
  validateParams(z.object({ testSeriesId: z.string().uuid() })),
  asyncHandler(async (req: Request, res: Response) => {
    const { testSeriesId } = req.params;
    const userId = req.user?.id!;
    const organizationId = req.user?.organizationId!;

    const orderData = await createTestSeriesOrder({
      userId,
      testSeriesId,
      organizationId,
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: orderData,
      message: "Order created successfully",
    });
  })
);

/**
 * @openapi
 * /api/test-series/{testSeriesId}/enroll-free:
 *   post:
 *     tags:
 *       - Test Series (Client)
 *     summary: Enroll in free test series
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testSeriesId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Enrolled successfully
 */
router.post(
  "/:testSeriesId/enroll-free",
  authenticate,
  validateParams(z.object({ testSeriesId: z.string().uuid() })),
  asyncHandler(async (req: Request, res: Response) => {
    const { testSeriesId } = req.params;
    const userId = req.user?.id!;
    const organizationId = req.user?.organizationId!;

    const enrollmentData = await enrollInFreeTestSeries({
      userId,
      testSeriesId,
      organizationId,
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: enrollmentData,
      message: "Enrolled in free test series successfully",
    });
  })
);

/**
 * @openapi
 * /api/test-series/verify-payment:
 *   post:
 *     tags:
 *       - Test Series (Client)
 *     summary: Verify Razorpay payment
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - razorpayPaymentId
 *               - razorpayOrderId
 *               - razorpaySignature
 *     responses:
 *       200:
 *         description: Payment verified and enrollment completed
 */
router.post(
  "/verify-payment",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { orderId, razorpayPaymentId, razorpayOrderId, razorpaySignature } =
      req.body;
    const userId = req.user?.id!;

    const result = await verifyPayment({
      orderId,
      userId,
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result,
      message: "Payment verified and enrollment completed successfully",
    });
  })
);

export default router;
