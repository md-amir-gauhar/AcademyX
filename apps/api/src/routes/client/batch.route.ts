import { Router, Request, Response } from "express";
import bodyParser from "body-parser";
import {
  getBatch,
  getAllBatches,
  getPurchasedBatches,
} from "../../services/client/batch.service";
import { getSchedulesByBatchId } from "../../services/client/schedule.service";
import {
  createBatchOrder,
  verifyPayment,
  enrollInFreeBatch,
} from "../../services/order.service";
import { asyncHandler } from "../../middlewares/async-handler";
import { authenticate } from "../../middlewares/auth.middleware";
import {
  validateQuery,
  validateParams,
} from "../../middlewares/validate.middleware";
import { cache, cacheList } from "../../middlewares/cache.middleware";
import { CacheTTL } from "../../services/cache.service";
import {
  paginationSchema,
  identifierParamSchema,
  uuidParamSchema,
} from "../../validators/batch.validator";
import { HTTP_STATUS } from "../../common/constants";
import { z } from "zod";

const router = Router();
router.use(bodyParser.json());

/**
 * @openapi
 * /api/batches:
 *   get:
 *     tags:
 *       - Batches (Client)
 *     summary: Get all ACTIVE batches
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
 *         description: List of all active batches with isPurchased status
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
    // CRITICAL: Must include userId because response contains user-specific isPurchased field
    return `batch:list:${orgId}:${userId}:${page}:${limit}`;
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const organizationId = req.user?.organizationId!;
    const userId = req.user?.id!;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const result = await getAllBatches(organizationId, userId, page, limit);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      ...result,
      message: "Batches retrieved successfully",
    });
  })
);

/**
 * @openapi
 * /api/batches/my-batches:
 *   get:
 *     tags:
 *       - Batches (Client)
 *     summary: Get all purchased batches
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
 *         description: List of purchased batches
 */
router.get(
  "/my-batches",
  authenticate,
  validateQuery(paginationSchema),
  cache(CacheTTL.SHORT, (req) => {
    const userId = req.user?.id;
    const orgId = req.user?.organizationId;
    const page = req.query.page || "1";
    const limit = req.query.limit || "10";
    return `batch:purchased:${orgId}:${userId}:${page}:${limit}`;
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const organizationId = req.user?.organizationId!;
    const userId = req.user?.id!;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const result = await getPurchasedBatches(
      organizationId,
      userId,
      page,
      limit
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      ...result,
      message: "Purchased batches retrieved successfully",
    });
  })
);

/**
 * @openapi
 * /api/batches/{identifier}:
 *   get:
 *     tags:
 *       - Batches (Client)
 *     summary: Get batch by ID or slug (ACTIVE only)
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
 *         description: Batch details with isPurchased status
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
    // CRITICAL: Must include userId because response contains user-specific isPurchased field
    return isUUID
      ? `batch:${identifier}:user:${userId}`
      : `batch:slug:${identifier}:user:${userId}`;
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const { identifier } = req.params;
    const organizationId = req.user?.organizationId!;
    const userId = req.user?.id!;

    const batchData = await getBatch(identifier, userId, organizationId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: batchData,
      message: "Batch retrieved successfully",
    });
  })
);

/**
 * @openapi
 * /api/batches/{batchId}/schedules:
 *   get:
 *     tags:
 *       - Batches (Client)
 *     summary: Get all schedules for a batch (STUDENT)
 *     description: Get all live class schedules for a purchased batch with subject name
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: batchId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Batch ID
 *     responses:
 *       200:
 *         description: List of schedules for the batch
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
 *                     $ref: '#/components/schemas/Schedule'
 *       403:
 *         description: You have not purchased this batch
 *       404:
 *         description: Batch not found
 */
router.get(
  "/:batchId/schedules",
  authenticate,
  validateParams(z.object({ batchId: z.string().uuid() })),
  asyncHandler(async (req: Request, res: Response) => {
    const { batchId } = req.params;
    const userId = req.user?.id!;
    const organizationId = req.user?.organizationId!;

    const schedules = await getSchedulesByBatchId(
      batchId,
      userId,
      organizationId
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: schedules,
      message: "Schedules retrieved successfully",
    });
  })
);

/**
 * @openapi
 * /api/batches/{id}/checkout:
 *   post:
 *     tags:
 *       - Batches (Client)
 *     summary: Create order for batch purchase
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
 *         description: Order created successfully
 */
router.post(
  "/:id/checkout",
  authenticate,
  validateParams(uuidParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id: batchId } = req.params;
    const userId = req.user?.id!;
    const organizationId = req.user?.organizationId!;

    const orderData = await createBatchOrder({
      userId,
      batchId,
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
 * /api/batches/{batchId}/enroll-free:
 *   post:
 *     tags:
 *       - Batches (Client)
 *     summary: Enroll in free batch
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: batchId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Enrolled successfully
 */
router.post(
  "/:batchId/enroll-free",
  authenticate,
  validateParams(z.object({ batchId: z.string().uuid() })),
  asyncHandler(async (req: Request, res: Response) => {
    const { batchId } = req.params;
    const userId = req.user?.id!;
    const organizationId = req.user?.organizationId!;

    const enrollmentData = await enrollInFreeBatch({
      userId,
      batchId,
      organizationId,
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: enrollmentData,
      message: "Enrolled in free batch successfully",
    });
  })
);

/**
 * @openapi
 * /api/batches/verify-payment:
 *   post:
 *     tags:
 *       - Batches (Client)
 *     summary: Verify Razorpay payment and complete enrollment
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
 *         description: Payment verified successfully
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
