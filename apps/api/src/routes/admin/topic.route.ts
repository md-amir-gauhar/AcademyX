import { Router, Request, Response } from "express";
import bodyParser from "body-parser";
import {
  createTopic,
  getTopicsByChapterId,
  getTopicById,
  updateTopic,
  deleteTopic,
} from "../../services/admin/topic.service";
import { asyncHandler } from "../../middlewares/async-handler";
import { authenticate, authorize } from "../../middlewares/auth.middleware";
import {
  validate,
  validateParams,
} from "../../middlewares/validate.middleware";
import {
  createTopicSchema,
  updateTopicSchema,
  chapterIdParamSchema,
  topicIdParamSchema,
} from "../../validators/topic.validator";
import { HTTP_STATUS } from "../../common/constants";

const router = Router();
router.use(bodyParser.json());

/**
 * @openapi
 * /admin/topics:
 *   post:
 *     tags:
 *       - Topics (Admin)
 *     summary: Create a new topic (ADMIN & TEACHER)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - chapterId
 *             properties:
 *               name:
 *                 type: string
 *                 description: Topic name
 *               chapterId:
 *                 type: string
 *                 format: uuid
 *                 description: Chapter ID
 *     responses:
 *       201:
 *         description: Topic created successfully
 *       404:
 *         description: Chapter not found
 */
router.post(
  "/",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  validate(createTopicSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Organization ID not found",
      });
    }

    const topic = await createTopic({
      organizationId,
      ...req.body,
    });

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: topic,
      message: "Topic created successfully",
    });
  })
);

/**
 * @openapi
 * /admin/topics/chapter/{chapterId}:
 *   get:
 *     tags:
 *       - Topics (Admin)
 *     summary: Get all topics for a chapter
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chapterId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Chapter ID
 *     responses:
 *       200:
 *         description: List of topics
 *       404:
 *         description: Chapter not found
 */
router.get(
  "/chapter/:chapterId",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  validateParams(chapterIdParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { chapterId } = req.params;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Organization ID not found",
      });
    }

    const topics = await getTopicsByChapterId(chapterId, organizationId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: topics,
      message: "Topics retrieved successfully",
    });
  })
);

/**
 * @openapi
 * /admin/topics/{id}:
 *   get:
 *     tags:
 *       - Topics (Admin)
 *     summary: Get topic by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Topic ID
 *     responses:
 *       200:
 *         description: Topic details
 *       404:
 *         description: Topic not found
 */
router.get(
  "/:id",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  validateParams(topicIdParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Organization ID not found",
      });
    }

    const topic = await getTopicById(id, organizationId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: topic,
      message: "Topic retrieved successfully",
    });
  })
);

/**
 * @openapi
 * /admin/topics/{id}:
 *   put:
 *     tags:
 *       - Topics (Admin)
 *     summary: Update topic by ID (ADMIN & TEACHER)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Topic ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Topic updated successfully
 *       404:
 *         description: Topic not found
 */
router.put(
  "/:id",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  validateParams(topicIdParamSchema),
  validate(updateTopicSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Organization ID not found",
      });
    }

    const topic = await updateTopic(id, organizationId, req.body);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: topic,
      message: "Topic updated successfully",
    });
  })
);

/**
 * @openapi
 * /admin/topics/{id}:
 *   delete:
 *     tags:
 *       - Topics (Admin)
 *     summary: Delete topic by ID (ADMIN & TEACHER)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Topic ID
 *     responses:
 *       200:
 *         description: Topic deleted successfully
 *       404:
 *         description: Topic not found
 */
router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  validateParams(topicIdParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Organization ID not found",
      });
    }

    await deleteTopic(id, organizationId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Topic deleted successfully",
    });
  })
);

export default router;
