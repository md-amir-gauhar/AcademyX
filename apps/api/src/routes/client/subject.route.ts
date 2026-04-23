import { Router, Request, Response } from "express";
import {
  getSubjectsByBatchId,
  getSubjectById,
} from "../../services/client/subject.service";
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
 * /api/subjects/batch/{batchId}:
 *   get:
 *     tags:
 *       - Subjects (Client)
 *     summary: Get all subjects for a purchased batch
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
 *         description: Subjects retrieved successfully
 */
router.get(
  "/batch/:batchId",
  authenticate,
  validateParams(z.object({ batchId: z.string().uuid() })),
  cache(CacheTTL.MEDIUM, (req) => {
    const batchId = req.params.batchId;
    const userId = req.user?.id;
    return `subject:batch:${batchId}:user:${userId}`;
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const { batchId } = req.params;
    const userId = req.user?.id!;
    const organizationId = req.user?.organizationId!;

    const subjects = await getSubjectsByBatchId(
      batchId,
      userId,
      organizationId
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: subjects,
      message: "Subjects retrieved successfully",
    });
  })
);

/**
 * @openapi
 * /api/subjects/{id}:
 *   get:
 *     tags:
 *       - Subjects (Client)
 *     summary: Get subject by ID
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
 *         description: Subject retrieved successfully
 */
router.get(
  "/:id",
  authenticate,
  validateParams(uuidParamSchema),
  cache(CacheTTL.MEDIUM, (req) => `subject:${req.params.id}`),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id!;
    const organizationId = req.user?.organizationId!;

    const subject = await getSubjectById(id, userId, organizationId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: subject,
      message: "Subject retrieved successfully",
    });
  })
);

export default router;
