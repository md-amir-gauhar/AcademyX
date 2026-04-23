import { Router, Request, Response } from "express";
import bodyParser from "body-parser";
import {
  getAllSchedules,
  getScheduleById,
  getSchedulesByTopicId,
  getSchedulesByBatchId,
} from "../../services/client/schedule.service";
import { asyncHandler } from "../../middlewares/async-handler";
import { authenticate } from "../../middlewares/auth.middleware";
import {
  validateParams,
  validateQuery,
} from "../../middlewares/validate.middleware";
import {
  scheduleQuerySchema,
  scheduleIdParamSchema,
  topicIdParamSchema,
  batchIdParamSchema,
} from "../../validators/schedule.validator";
import { HTTP_STATUS } from "../../common/constants";

const router = Router();
router.use(bodyParser.json());

/**
 * @openapi
 * /api/schedules:
 *   get:
 *     tags:
 *       - Schedules (Client)
 *     summary: Get all schedules for purchased batches (STUDENT)
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
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [SCHEDULED, LIVE, COMPLETED, CANCELLED]
 *         description: Filter by status
 *       - in: query
 *         name: batchId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by batch ID (only purchased batches)
 *       - in: query
 *         name: upcoming
 *         schema:
 *           type: boolean
 *         description: Show only upcoming schedules
 *     responses:
 *       200:
 *         description: List of schedules
 */
router.get(
  "/",
  authenticate,
  validateQuery(scheduleQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const organizationId = req.user?.organizationId;

    if (!userId || !organizationId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "User or organization ID not found",
      });
    }

    const result = await getAllSchedules(
      userId,
      organizationId,
      req.query as any
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result.schedules,
      pagination: result.pagination,
    });
  })
);

/**
 * @openapi
 * /api/schedules/{id}:
 *   get:
 *     tags:
 *       - Schedules (Client)
 *     summary: Get a schedule by ID (STUDENT)
 *     description: Only accessible if user has purchased the batch
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Schedule ID
 *     responses:
 *       200:
 *         description: Schedule details
 *       403:
 *         description: You have not purchased this batch
 *       404:
 *         description: Schedule not found
 */
router.get(
  "/:id",
  authenticate,
  validateParams(scheduleIdParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;
    const organizationId = req.user?.organizationId;

    if (!userId || !organizationId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "User or organization ID not found",
      });
    }

    const schedule = await getScheduleById(id, userId, organizationId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: schedule,
    });
  })
);

/**
 * @openapi
 * /api/schedules/topic/{topicId}:
 *   get:
 *     tags:
 *       - Schedules (Client)
 *     summary: Get all schedules for a topic (STUDENT)
 *     description: Only accessible if user has purchased the batch
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: topicId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Topic ID
 *     responses:
 *       200:
 *         description: List of schedules for the topic
 *       403:
 *         description: You have not purchased this batch
 *       404:
 *         description: Topic not found
 */
router.get(
  "/topic/:topicId",
  authenticate,
  validateParams(topicIdParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { topicId } = req.params;
    const userId = req.user?.id;
    const organizationId = req.user?.organizationId;

    if (!userId || !organizationId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "User or organization ID not found",
      });
    }

    const schedules = await getSchedulesByTopicId(
      topicId,
      userId,
      organizationId
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: schedules,
    });
  })
);

/**
 * @openapi
 * /api/schedules/batch/{batchId}:
 *   get:
 *     tags:
 *       - Schedules (Client)
 *     summary: Get all schedules for a batch (STUDENT)
 *     description: Only accessible if user has purchased the batch
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
 *       403:
 *         description: You have not purchased this batch
 *       404:
 *         description: Batch not found
 */
router.get(
  "/batch/:batchId",
  authenticate,
  validateParams(batchIdParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { batchId } = req.params;
    const userId = req.user?.id;
    const organizationId = req.user?.organizationId;

    if (!userId || !organizationId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "User or organization ID not found",
      });
    }

    const schedules = await getSchedulesByBatchId(
      batchId,
      userId,
      organizationId
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: schedules,
    });
  })
);

export default router;
