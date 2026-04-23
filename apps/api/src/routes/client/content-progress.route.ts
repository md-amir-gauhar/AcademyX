import { Router, Request, Response } from "express";
import bodyParser from "body-parser";
import {
  trackVideoProgress,
  getRecentlyWatchedVideos,
  getContentProgress,
  getWatchStats,
  markAsCompleted,
  getBatchProgressOverview,
} from "../../services/client/content-progress.service";
import { asyncHandler } from "../../middlewares/async-handler";
import { authenticate } from "../../middlewares/auth.middleware";
import {
  validate,
  validateParams,
  validateQuery,
} from "../../middlewares/validate.middleware";
import {
  trackProgressSchema,
  recentlyWatchedQuerySchema,
  batchProgressQuerySchema,
  contentIdParamSchema,
} from "../../validators/content-progress.validator";
import { HTTP_STATUS } from "../../common/constants";
import { cache } from "../../middlewares/cache.middleware";
import { CacheTTL } from "../../services/cache.service";

const router = Router();
router.use(bodyParser.json());

/**
 * @openapi
 * /api/content/recently-watched:
 *   get:
 *     tags:
 *       - Content Progress (Client)
 *     summary: Get recently watched videos with progress (STUDENT)
 *     description: Returns a list of recently watched videos with watch progress and statistics
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
 *           default: 20
 *           maximum: 50
 *         description: Items per page (max 50)
 *       - in: query
 *         name: batchId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by batch ID (only purchased batches)
 *       - in: query
 *         name: completedOnly
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Show only completed videos
 *     responses:
 *       200:
 *         description: List of recently watched videos with progress
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     videos:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           content:
 *                             type: object
 *                             description: Full content object with nested relations
 *                           progress:
 *                             type: object
 *                             properties:
 *                               watchedSeconds:
 *                                 type: integer
 *                               totalDuration:
 *                                 type: integer
 *                               watchPercentage:
 *                                 type: number
 *                               isCompleted:
 *                                 type: boolean
 *                               completedAt:
 *                                 type: string
 *                                 format: date-time
 *                                 nullable: true
 *                               watchCount:
 *                                 type: integer
 *                               lastWatchedAt:
 *                                 type: string
 *                                 format: date-time
 *                     stats:
 *                       type: object
 *                       properties:
 *                         totalVideosWatched:
 *                           type: integer
 *                         completedVideosCount:
 *                           type: integer
 *                         totalWatchTimeSeconds:
 *                           type: integer
 *                         totalWatchTimeFormatted:
 *                           type: string
 *                         averageCompletionRate:
 *                           type: number
 *                 pagination:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Batch not purchased
 */
router.get(
  "/recently-watched",
  authenticate,
  validateQuery(recentlyWatchedQuerySchema),
  cache(CacheTTL.SHORT, (req) => {
    const userId = req.user?.id;
    const orgId = req.user?.organizationId;
    const page = req.query.page || "1";
    const limit = req.query.limit || "20";
    const batchId = req.query.batchId || "all";
    const completedOnly = req.query.completedOnly || "false";
    return `recently-watched:${orgId}:${userId}:${page}:${limit}:${batchId}:${completedOnly}`;
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id!;
    const organizationId = req.user?.organizationId!;

    const result = await getRecentlyWatchedVideos(
      userId,
      organizationId,
      req.query as any
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result.videos,
      pagination: result.pagination,
      stats: result.stats,
      message: "Recently watched videos retrieved successfully",
    });
  })
);

/**
 * @openapi
 * /api/content/{contentId}/progress:
 *   post:
 *     tags:
 *       - Content Progress (Client)
 *     summary: Track video watch progress (STUDENT)
 *     description: Updates watch progress for a video. Auto-completes when watch percentage >= 95%
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contentId
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
 *             required:
 *               - watchedSeconds
 *               - totalDuration
 *             properties:
 *               watchedSeconds:
 *                 type: integer
 *                 minimum: 0
 *                 description: Current watch position in seconds
 *               totalDuration:
 *                 type: integer
 *                 minimum: 1
 *                 description: Total video duration in seconds
 *     responses:
 *       200:
 *         description: Progress tracked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   description: Progress record
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Batch not purchased
 *       404:
 *         description: Content not found
 */
router.post(
  "/:contentId/progress",
  authenticate,
  validateParams(contentIdParamSchema),
  validate(trackProgressSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id!;
    const organizationId = req.user?.organizationId!;
    const { contentId } = req.params;
    const { watchedSeconds, totalDuration } = req.body;

    const progress = await trackVideoProgress({
      userId,
      contentId,
      organizationId,
      watchedSeconds,
      totalDuration,
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: progress,
      message: "Progress tracked successfully",
    });
  })
);

/**
 * @openapi
 * /api/content/{contentId}/progress:
 *   get:
 *     tags:
 *       - Content Progress (Client)
 *     summary: Get progress for specific content (STUDENT)
 *     description: Returns watch progress for a specific video or null if not watched yet
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Content ID
 *     responses:
 *       200:
 *         description: Progress retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   nullable: true
 *                   type: object
 *                   properties:
 *                     watchedSeconds:
 *                       type: integer
 *                     totalDuration:
 *                       type: integer
 *                     watchPercentage:
 *                       type: number
 *                     isCompleted:
 *                       type: boolean
 *                     completedAt:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Batch not purchased
 *       404:
 *         description: Content not found
 */
router.get(
  "/:contentId/progress",
  authenticate,
  validateParams(contentIdParamSchema),
  cache(CacheTTL.SHORT, (req) => {
    const userId = req.user?.id;
    const { contentId } = req.params;
    return `content-progress:${userId}:${contentId}`;
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id!;
    const organizationId = req.user?.organizationId!;
    const { contentId } = req.params;

    const progress = await getContentProgress(
      userId,
      contentId,
      organizationId
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: progress,
      message: progress
        ? "Progress retrieved successfully"
        : "No progress found for this content",
    });
  })
);

/**
 * @openapi
 * /api/content/watch-stats:
 *   get:
 *     tags:
 *       - Content Progress (Client)
 *     summary: Get overall watch statistics (STUDENT)
 *     description: Returns aggregated watch statistics for the user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: batchId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter stats by batch ID
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalVideosWatched:
 *                       type: integer
 *                     completedVideosCount:
 *                       type: integer
 *                     totalWatchTimeSeconds:
 *                       type: integer
 *                     totalWatchTimeFormatted:
 *                       type: string
 *                     averageCompletionRate:
 *                       type: number
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/watch-stats",
  authenticate,
  cache(CacheTTL.MEDIUM, (req) => {
    const userId = req.user?.id;
    const orgId = req.user?.organizationId;
    const batchId = req.query.batchId || "all";
    return `watch-stats:${orgId}:${userId}:${batchId}`;
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id!;
    const organizationId = req.user?.organizationId!;
    const { batchId } = req.query;

    const stats = await getWatchStats(
      userId,
      organizationId,
      batchId as string | undefined
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: stats,
      message: "Watch statistics retrieved successfully",
    });
  })
);

/**
 * @openapi
 * /api/content/{contentId}/complete:
 *   post:
 *     tags:
 *       - Content Progress (Client)
 *     summary: Mark content as completed manually (STUDENT)
 *     description: Manually mark a video as completed (100% watched)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Content ID
 *     responses:
 *       200:
 *         description: Content marked as completed
 *       400:
 *         description: Already completed or no progress found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Batch not purchased
 *       404:
 *         description: Content or progress not found
 */
router.post(
  "/:contentId/complete",
  authenticate,
  validateParams(contentIdParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id!;
    const organizationId = req.user?.organizationId!;
    const { contentId } = req.params;

    const progress = await markAsCompleted(userId, contentId, organizationId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: progress,
      message: "Content marked as completed",
    });
  })
);

/**
 * @openapi
 * /api/content/batch-progress:
 *   get:
 *     tags:
 *       - Content Progress (Client)
 *     summary: Get batch progress overview (STUDENT)
 *     description: Returns overview of how many videos completed vs total in a batch
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: batchId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Batch ID
 *     responses:
 *       200:
 *         description: Batch progress retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalVideos:
 *                       type: integer
 *                     completedVideos:
 *                       type: integer
 *                     progressPercentage:
 *                       type: number
 *                     totalWatchTimeSeconds:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Batch not purchased
 */
router.get(
  "/batch-progress",
  authenticate,
  validateQuery(batchProgressQuerySchema),
  cache(CacheTTL.MEDIUM, (req) => {
    const userId = req.user?.id;
    const batchId = req.query.batchId;
    return `batch-progress:${userId}:${batchId}`;
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id!;
    const organizationId = req.user?.organizationId!;
    const { batchId } = req.query;

    const progress = await getBatchProgressOverview(
      userId,
      batchId as string,
      organizationId
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: progress,
      message: "Batch progress retrieved successfully",
    });
  })
);

export default router;
