import { Router, Request, Response } from "express";
import bodyParser from "body-parser";
import { getOrderHistory } from "../../services/order.service";
import { asyncHandler } from "../../middlewares/async-handler";
import { authenticate } from "../../middlewares/auth.middleware";
import { validateQuery } from "../../middlewares/validate.middleware";
import { cache } from "../../middlewares/cache.middleware";
import { CacheTTL } from "../../services/cache.service";
import { orderHistoryQuerySchema } from "../../validators/order.validator";
import { HTTP_STATUS } from "../../common/constants";

const router = Router();
router.use(bodyParser.json());

/**
 * @openapi
 * /api/orders/history:
 *   get:
 *     tags:
 *       - Orders (Client)
 *     summary: Get user's order history with pagination
 *     description: Retrieves complete order history including successful and failed orders for both batches and test series
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 100
 *         description: Number of records per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [SUCCESS, FAILED, PENDING, PROCESSING, REFUNDED]
 *         description: Filter orders by payment status
 *     responses:
 *       200:
 *         description: Order history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       entityType:
 *                         type: string
 *                         enum: [BATCH, TEST_SERIES]
 *                       entityId:
 *                         type: string
 *                         format: uuid
 *                       amount:
 *                         type: number
 *                       currency:
 *                         type: string
 *                       paymentProvider:
 *                         type: string
 *                       paymentStatus:
 *                         type: string
 *                         enum: [PENDING, PROCESSING, SUCCESS, FAILED, REFUNDED]
 *                       providerOrderId:
 *                         type: string
 *                       providerPaymentId:
 *                         type: string
 *                       receiptId:
 *                         type: string
 *                       failureReason:
 *                         type: string
 *                       refundId:
 *                         type: string
 *                       refundAmount:
 *                         type: number
 *                       refundedAt:
 *                         type: string
 *                         format: date-time
 *                       initiatedAt:
 *                         type: string
 *                         format: date-time
 *                       completedAt:
 *                         type: string
 *                         format: date-time
 *                       failedAt:
 *                         type: string
 *                         format: date-time
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       entityDetails:
 *                         type: object
 *                         description: Details of the batch or test series
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     totalCount:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     hasNextPage:
 *                       type: boolean
 *                     hasPreviousPage:
 *                       type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid query parameters
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/history",
  authenticate,
  validateQuery(orderHistoryQuerySchema),
  cache(CacheTTL.SHORT, (req) => {
    const userId = req.user?.id;
    const orgId = req.user?.organizationId;
    const page = req.query.page || "1";
    const limit = req.query.limit || "10";
    const status = req.query.status || "all";
    return `order:history:${orgId}:${userId}:${page}:${limit}:${status}`;
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id!;
    const organizationId = req.user?.organizationId!;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const status = req.query.status as
      | "SUCCESS"
      | "FAILED"
      | "PENDING"
      | "PROCESSING"
      | "REFUNDED"
      | undefined;

    const result = await getOrderHistory(
      userId,
      organizationId,
      page,
      limit,
      status
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      ...result,
      message: "Order history retrieved successfully",
    });
  })
);

export default router;
