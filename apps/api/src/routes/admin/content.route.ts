import { Router, Request, Response } from "express";
import bodyParser from "body-parser";
import {
  createContent,
  getContentsByTopicId,
  getContentById,
  updateContent,
  deleteContent,
} from "../../services/admin/content.service";
import { asyncHandler } from "../../middlewares/async-handler";
import { authenticate, authorize } from "../../middlewares/auth.middleware";
import {
  validate,
  validateParams,
} from "../../middlewares/validate.middleware";
import {
  createContentSchema,
  updateContentSchema,
  topicIdParamSchema,
  contentIdParamSchema,
} from "../../validators/content.validator";
import { HTTP_STATUS } from "../../common/constants";

const router = Router();
router.use(bodyParser.json());

/**
 * @openapi
 * /admin/contents:
 *   post:
 *     tags:
 *       - Contents (Admin)
 *     summary: Create a new content (ADMIN & TEACHER)
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
 *               - topicId
 *               - type
 *             properties:
 *               name:
 *                 type: string
 *                 description: Content name
 *               topicId:
 *                 type: string
 *                 format: uuid
 *                 description: Topic ID
 *               type:
 *                 type: string
 *                 enum: [Lecture, PDF]
 *                 description: Content type
 *               pdfUrl:
 *                 type: string
 *                 description: PDF URL (if type is PDF)
 *               videoUrl:
 *                 type: string
 *                 description: Video URL (if type is Lecture)
 *               videoType:
 *                 type: string
 *                 enum: [HLS, YOUTUBE]
 *                 description: Video source type
 *               videoThumbnail:
 *                 type: string
 *                 description: Video thumbnail URL
 *               videoDuration:
 *                 type: number
 *                 description: Video duration in seconds/minutes
 *               isCompleted:
 *                 type: boolean
 *                 description: Whether content is completed
 *                 default: false
 *     responses:
 *       201:
 *         description: Content created successfully
 *       404:
 *         description: Topic not found
 */
router.post(
  "/",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  validate(createContentSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Organization ID not found",
      });
    }

    const content = await createContent({
      organizationId,
      ...req.body,
    });

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: content,
      message: "Content created successfully",
    });
  })
);

/**
 * @openapi
 * /admin/contents/topic/{topicId}:
 *   get:
 *     tags:
 *       - Contents
 *     summary: Get all contents for a topic
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
 *         description: List of contents
 *       404:
 *         description: Topic not found
 */
router.get(
  "/topic/:topicId",
  authenticate,
  authorize("ADMIN", "TEACHER"),
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

    const contents = await getContentsByTopicId(topicId, organizationId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: contents,
      message: "Contents retrieved successfully",
    });
  })
);

/**
 * @openapi
 * /admin/contents/{id}:
 *   get:
 *     tags:
 *       - Contents
 *     summary: Get content by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Content ID
 *     responses:
 *       200:
 *         description: Content details
 *       404:
 *         description: Content not found
 */
router.get(
  "/:id",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  validateParams(contentIdParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Organization ID not found",
      });
    }

    const content = await getContentById(id, organizationId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: content,
      message: "Content retrieved successfully",
    });
  })
);

/**
 * @openapi
 * /admin/contents/{id}:
 *   put:
 *     tags:
 *       - Contents (Admin)
 *     summary: Update content by ID (ADMIN & TEACHER)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Content ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [Lecture, PDF]
 *               pdfUrl:
 *                 type: string
 *               videoUrl:
 *                 type: string
 *               videoType:
 *                 type: string
 *                 enum: [HLS, YOUTUBE]
 *               videoThumbnail:
 *                 type: string
 *               videoDuration:
 *                 type: number
 *               isCompleted:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Content updated successfully
 *       404:
 *         description: Content not found
 */
router.put(
  "/:id",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  validateParams(contentIdParamSchema),
  validate(updateContentSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Organization ID not found",
      });
    }

    const content = await updateContent(id, organizationId, req.body);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: content,
      message: "Content updated successfully",
    });
  })
);

/**
 * @openapi
 * /admin/contents/{id}:
 *   delete:
 *     tags:
 *       - Contents (Admin)
 *     summary: Delete content by ID (ADMIN & TEACHER)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Content ID
 *     responses:
 *       200:
 *         description: Content deleted successfully
 *       404:
 *         description: Content not found
 */
router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  validateParams(contentIdParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Organization ID not found",
      });
    }

    await deleteContent(id, organizationId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Content deleted successfully",
    });
  })
);

export default router;
