import { Router, Request, Response } from "express";
import {
  getChaptersBySubjectId,
  getChapterById,
} from "../../services/client/chapter.service";
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
 * /api/chapters/subject/{subjectId}:
 *   get:
 *     tags:
 *       - Chapters (Client)
 *     summary: Get all chapters for a subject
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: subjectId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chapters retrieved successfully
 */
router.get(
  "/subject/:subjectId",
  authenticate,
  validateParams(z.object({ subjectId: z.string().uuid() })),
  cache(CacheTTL.MEDIUM, (req) => {
    const subjectId = req.params.subjectId;
    const userId = req.user?.id;
    return `chapter:subject:${subjectId}:user:${userId}`;
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const { subjectId } = req.params;
    const userId = req.user?.id!;
    const organizationId = req.user?.organizationId!;

    const chapters = await getChaptersBySubjectId(
      subjectId,
      userId,
      organizationId
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: chapters,
      message: "Chapters retrieved successfully",
    });
  })
);

/**
 * @openapi
 * /api/chapters/{id}:
 *   get:
 *     tags:
 *       - Chapters (Client)
 *     summary: Get chapter by ID
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
 *         description: Chapter retrieved successfully
 */
router.get(
  "/:id",
  authenticate,
  validateParams(uuidParamSchema),
  cache(CacheTTL.MEDIUM, (req) => `chapter:${req.params.id}`),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id!;
    const organizationId = req.user?.organizationId!;

    const chapter = await getChapterById(id, userId, organizationId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: chapter,
      message: "Chapter retrieved successfully",
    });
  })
);

export default router;
