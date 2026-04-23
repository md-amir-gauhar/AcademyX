import { Router, Request, Response } from "express";
import bodyParser from "body-parser";
import { CacheManager } from "../services/cache.service";
import { asyncHandler } from "../middlewares/async-handler";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { HTTP_STATUS } from "../common/constants";

const router = Router();
router.use(bodyParser.json());

/**
 * @openapi
 * /admin/cache/clear:
 *   post:
 *     tags:
 *       - Cache Management (Admin)
 *     summary: Clear all cache for the organization (ADMIN only)
 *     description: Clears all cached data for the authenticated user's organization. This includes batches, subjects, chapters, topics, contents, teachers, and test series data.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cache cleared successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Cache cleared successfully for organization
 *                 data:
 *                   type: object
 *                   properties:
 *                     clearedKeys:
 *                       type: integer
 *                       example: 45
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post(
  "/clear",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  asyncHandler(async (req: Request, res: Response) => {
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Organization ID not found",
      });
    }

    // Clear all caches related to this organization
    const clearedKeys = await CacheManager.clearOrganizationCache(
      organizationId
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Cache cleared successfully for organization",
      data: {
        clearedKeys,
      },
    });
  })
);

/**
 * @openapi
 * /admin/cache/stats:
 *   get:
 *     tags:
 *       - Cache Management (Admin)
 *     summary: Get cache statistics (ADMIN only)
 *     description: Returns statistics about the current cache state including total keys and memory usage.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cache statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     isAvailable:
 *                       type: boolean
 *                       example: true
 *                     keyCount:
 *                       type: integer
 *                       example: 156
 *                     memoryUsed:
 *                       type: string
 *                       example: "2.45M"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get(
  "/stats",
  authenticate,
  authorize("ADMIN"),
  asyncHandler(async (req: Request, res: Response) => {
    const stats = await CacheManager.getStats();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: stats,
    });
  })
);

/**
 * @openapi
 * /admin/cache/flush:
 *   post:
 *     tags:
 *       - Cache Management (Admin)
 *     summary: Clear ALL cache in the system (ADMIN only - USE WITH CAUTION)
 *     description: Clears the entire cache database. This affects all organizations and should only be used in emergency situations or maintenance.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All cache cleared successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: All cache cleared successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post(
  "/flush",
  authenticate,
  authorize("ADMIN"),
  asyncHandler(async (req: Request, res: Response) => {
    await CacheManager.flush();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "All cache cleared successfully",
    });
  })
);

export default router;
