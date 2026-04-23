import { Router, Request, Response } from "express";
import bodyParser from "body-parser";
import {
  createSchedule,
  getAllSchedules,
  getSchedulesByTopicId,
  getScheduleById,
  updateSchedule,
  updateScheduleStatus,
  deleteSchedule,
  getSchedulesByBatchId,
} from "../../services/admin/schedule.service";
import { asyncHandler } from "../../middlewares/async-handler";
import { authenticate, authorize } from "../../middlewares/auth.middleware";
import {
  validate,
  validateParams,
  validateQuery,
} from "../../middlewares/validate.middleware";
import {
  createScheduleSchema,
  updateScheduleSchema,
  updateScheduleStatusSchema,
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
 * /admin/schedules:
 *   post:
 *     tags:
 *       - Schedules (Admin)
 *     summary: Create a new live class schedule (ADMIN & TEACHER)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - topicId
 *               - batchId
 *               - subjectId
 *               - title
 *               - subjectName
 *               - youtubeLink
 *               - scheduledAt
 *               - duration
 *             properties:
 *               topicId:
 *                 type: string
 *                 format: uuid
 *                 description: Topic ID
 *               batchId:
 *                 type: string
 *                 format: uuid
 *                 description: Batch ID
 *               subjectId:
 *                 type: string
 *                 format: uuid
 *                 description: Subject ID
 *               title:
 *                 type: string
 *                 description: Schedule title
 *                 minLength: 3
 *                 maxLength: 255
 *               description:
 *                 type: string
 *                 description: Schedule description
 *               subjectName:
 *                 type: string
 *                 description: Subject name for display
 *                 minLength: 1
 *                 maxLength: 255
 *               youtubeLink:
 *                 type: string
 *                 description: YouTube embed URL (https://www.youtube.com/embed/VIDEO_ID)
 *               scheduledAt:
 *                 type: string
 *                 format: date-time
 *                 description: Scheduled date and time (must be in future)
 *               duration:
 *                 type: integer
 *                 description: Duration in minutes
 *                 minimum: 1
 *               teacherId:
 *                 type: string
 *                 format: uuid
 *                 description: Teacher ID (optional)
 *               thumbnailUrl:
 *                 type: string
 *                 description: Thumbnail URL
 *               notifyBeforeMinutes:
 *                 type: integer
 *                 description: Send reminder before X minutes
 *                 default: 30
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Tags (e.g., ["doubt-session", "important"])
 *     responses:
 *       201:
 *         description: Schedule created successfully
 *       404:
 *         description: Topic not found
 */
router.post(
  "/",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  validate(createScheduleSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Organization ID not found",
      });
    }

    const schedule = await createSchedule({
      organizationId,
      ...req.body,
    });

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: schedule,
      message: "Schedule created successfully",
    });
  })
);

/**
 * @openapi
 * /admin/schedules:
 *   get:
 *     tags:
 *       - Schedules (Admin)
 *     summary: Get all schedules with filters
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
 *         description: Filter by batch ID
 *       - in: query
 *         name: teacherId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by teacher ID
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by date (YYYY-MM-DD)
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
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Organization ID not found",
      });
    }

    const result = await getAllSchedules(organizationId, req.query as any);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result.schedules,
      pagination: result.pagination,
    });
  })
);

/**
 * @openapi
 * /admin/schedules/topic/{topicId}:
 *   get:
 *     tags:
 *       - Schedules (Admin)
 *     summary: Get all schedules for a topic
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
 *       404:
 *         description: Topic not found
 */
router.get(
  "/topic/:topicId",
  authenticate,
  validateParams(topicIdParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { topicId } = req.params;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Organization ID not found",
      });
    }

    const schedules = await getSchedulesByTopicId(topicId, organizationId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: schedules,
    });
  })
);

/**
 * @openapi
 * /admin/schedules/batch/{batchId}:
 *   get:
 *     tags:
 *       - Schedules (Admin)
 *     summary: Get all schedules for a batch
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
 *       404:
 *         description: Batch not found
 */
router.get(
  "/batch/:batchId",
  authenticate,
  validateParams(batchIdParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { batchId } = req.params;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Organization ID not found",
      });
    }

    const schedules = await getSchedulesByBatchId(batchId, organizationId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: schedules,
    });
  })
);

/**
 * @openapi
 * /admin/schedules/{id}:
 *   get:
 *     tags:
 *       - Schedules (Admin)
 *     summary: Get a schedule by ID
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
 *       404:
 *         description: Schedule not found
 */
router.get(
  "/:id",
  authenticate,
  validateParams(scheduleIdParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Organization ID not found",
      });
    }

    const schedule = await getScheduleById(id, organizationId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: schedule,
    });
  })
);

/**
 * @openapi
 * /admin/schedules/{id}:
 *   patch:
 *     tags:
 *       - Schedules (Admin)
 *     summary: Update a schedule (ADMIN & TEACHER)
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 255
 *               description:
 *                 type: string
 *               subjectName:
 *                 type: string
 *                 description: Subject name for display
 *                 minLength: 1
 *                 maxLength: 255
 *               youtubeLink:
 *                 type: string
 *               scheduledAt:
 *                 type: string
 *                 format: date-time
 *               duration:
 *                 type: integer
 *               teacherId:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *               thumbnailUrl:
 *                 type: string
 *               notifyBeforeMinutes:
 *                 type: integer
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Schedule updated successfully
 *       404:
 *         description: Schedule not found
 */
router.patch(
  "/:id",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  validateParams(scheduleIdParamSchema),
  validate(updateScheduleSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Organization ID not found",
      });
    }

    const schedule = await updateSchedule(id, organizationId, req.body);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: schedule,
      message: "Schedule updated successfully",
    });
  })
);

/**
 * @openapi
 * /admin/schedules/{id}/status:
 *   patch:
 *     tags:
 *       - Schedules (Admin)
 *     summary: Update schedule status (ADMIN & TEACHER)
 *     description: Change status manually. When changed to COMPLETED, automatically creates a Content entity.
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [SCHEDULED, LIVE, COMPLETED, CANCELLED]
 *     responses:
 *       200:
 *         description: Status updated successfully
 *       404:
 *         description: Schedule not found
 */
router.patch(
  "/:id/status",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  validateParams(scheduleIdParamSchema),
  validate(updateScheduleStatusSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Organization ID not found",
      });
    }

    const schedule = await updateScheduleStatus(id, organizationId, status);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: schedule,
      message: "Schedule status updated successfully",
    });
  })
);

/**
 * @openapi
 * /admin/schedules/{id}:
 *   delete:
 *     tags:
 *       - Schedules (Admin)
 *     summary: Delete a schedule (ADMIN & TEACHER)
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
 *         description: Schedule deleted successfully
 *       404:
 *         description: Schedule not found
 */
router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  validateParams(scheduleIdParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Organization ID not found",
      });
    }

    const result = await deleteSchedule(id, organizationId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: result.message,
    });
  })
);

export default router;
