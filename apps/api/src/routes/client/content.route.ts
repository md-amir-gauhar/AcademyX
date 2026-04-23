import { Router, Request, Response } from "express";
import {
  getContentsByTopicId,
  getContentById,
} from "../../services/client/content.service";
import { asyncHandler } from "../../middlewares/async-handler";
import { authenticate } from "../../middlewares/auth.middleware";
import { validateParams } from "../../middlewares/validate.middleware";
import { cache } from "../../middlewares/cache.middleware";
import { CacheTTL } from "../../services/cache.service";
import { HTTP_STATUS } from "../../common/constants";
import { z } from "zod";

const router = Router();

const uuidParamSchema = z.object({
  id: z.uuid(),
});

/**
 * @openapi
 * /api/contents/topic/{topicId}:
 *   get:
 *     tags:
 *       - Contents (Client)
 *     summary: Get all contents for a topic
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: topicId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Contents retrieved successfully
 */
router.get(
  "/topic/:topicId",
  authenticate,
  validateParams(z.object({ topicId: z.string().uuid() })),
  cache(CacheTTL.MEDIUM, (req) => {
    const topicId = req.params.topicId;
    const userId = req.user?.id;
    return `content:topic:${topicId}:user:${userId}`;
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const { topicId } = req.params;
    const userId = req.user?.id!;
    const organizationId = req.user?.organizationId!;

    const contents = await getContentsByTopicId(
      topicId,
      userId,
      organizationId
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: contents,
      message: "Contents retrieved successfully",
    });
  })
);

/**
 * @openapi
 * /api/contents/{id}:
 *   get:
 *     tags:
 *       - Contents (Client)
 *     summary: Get content by ID
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
 *         description: Content retrieved successfully
 */
router.get(
  "/:id",
  authenticate,
  validateParams(uuidParamSchema),
  cache(CacheTTL.MEDIUM, (req) => `content:${req.params.id}`),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id!;
    const organizationId = req.user?.organizationId!;

    const content = await getContentById(id, userId, organizationId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: content,
      message: "Content retrieved successfully",
    });
  })
);

export default router;
