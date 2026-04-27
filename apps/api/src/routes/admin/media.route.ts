import { Router, Request, Response } from "express";
import bodyParser from "body-parser";
import { z } from "zod";
import {
  createMediaJob,
  getMediaJob,
  listMediaJobs,
} from "../../services/admin/media-job.service";
import { authenticate, authorize } from "../../middlewares/auth.middleware";
import { asyncHandler } from "../../middlewares/async-handler";
import { HTTP_STATUS } from "../../common/constants";

const router = Router();
router.use(bodyParser.json());

const createSchema = z.object({
  sourceKey: z.string().min(1).max(500),
  sourceContentType: z.string().max(100).optional(),
});

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

/**
 * @openapi
 * /admin/media/transcode:
 *   post:
 *     tags:
 *       - Media (Admin)
 *     summary: Start an HLS transcode job for a previously-uploaded source
 *     description: |
 *       Given an S3 `sourceKey` (the result of an earlier
 *       `/admin/upload/signed-url` upload), enqueues a background job that
 *       transcodes the source into 480p/720p/1080p HLS variants and writes a
 *       master.m3u8 playlist back to S3. Renditions larger than the source
 *       are skipped.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sourceKey]
 *             properties:
 *               sourceKey:
 *                 type: string
 *                 example: org-123/uploads/2026-04-27/lecture.mp4
 *               sourceContentType:
 *                 type: string
 *                 example: video/mp4
 *     responses:
 *       201:
 *         description: Job created and queued
 */
router.post(
  "/transcode",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  asyncHandler(async (req: Request, res: Response) => {
    const data = createSchema.parse(req.body);
    const organizationId = req.user!.organizationId;
    const userId = req.user!.id;

    const job = await createMediaJob({
      organizationId,
      userId,
      sourceKey: data.sourceKey,
      sourceContentType: data.sourceContentType,
    });

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: job,
      message: "Transcode job queued",
    });
  }),
);

/**
 * @openapi
 * /admin/media/jobs/{id}:
 *   get:
 *     tags:
 *       - Media (Admin)
 *     summary: Get a single media job (status / progress / hlsUrl)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Media job state
 */
router.get(
  "/jobs/:id",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  asyncHandler(async (req: Request, res: Response) => {
    const id = z.string().uuid().parse(req.params.id);
    const organizationId = req.user!.organizationId;
    const job = await getMediaJob(id, organizationId);
    res.status(HTTP_STATUS.OK).json({ success: true, data: job });
  }),
);

/**
 * @openapi
 * /admin/media/jobs:
 *   get:
 *     tags:
 *       - Media (Admin)
 *     summary: List media jobs for the organization
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 */
router.get(
  "/jobs",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = paginationSchema.parse(req.query);
    const organizationId = req.user!.organizationId;
    const result = await listMediaJobs({ organizationId, page, limit });
    res.status(HTTP_STATUS.OK).json({ success: true, ...result });
  }),
);

export default router;
