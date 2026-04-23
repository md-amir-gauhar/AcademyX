import { Router, Request, Response } from "express";
import {
  getTopicsByChapterId,
  getTopicById,
} from "../../services/client/topic.service";
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
 * /api/topics/chapter/{chapterId}:
 *   get:
 *     tags:
 *       - Topics (Client)
 *     summary: Get all topics for a chapter
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chapterId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Topics retrieved successfully
 */
router.get(
  "/chapter/:chapterId",
  authenticate,
  validateParams(z.object({ chapterId: z.string().uuid() })),
  cache(CacheTTL.MEDIUM, (req) => {
    const chapterId = req.params.chapterId;
    const userId = req.user?.id;
    return `topic:chapter:${chapterId}:user:${userId}`;
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const { chapterId } = req.params;
    const userId = req.user?.id!;
    const organizationId = req.user?.organizationId!;

    const topics = await getTopicsByChapterId(
      chapterId,
      userId,
      organizationId
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: topics,
      message: "Topics retrieved successfully",
    });
  })
);

/**
 * @openapi
 * /api/topics/{id}:
 *   get:
 *     tags:
 *       - Topics (Client)
 *     summary: Get topic by ID
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
 *         description: Topic retrieved successfully
 */
router.get(
  "/:id",
  authenticate,
  validateParams(uuidParamSchema),
  cache(CacheTTL.MEDIUM, (req) => `topic:${req.params.id}`),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id!;
    const organizationId = req.user?.organizationId!;

    const topic = await getTopicById(id, userId, organizationId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: topic,
      message: "Topic retrieved successfully",
    });
  })
);

export default router;
