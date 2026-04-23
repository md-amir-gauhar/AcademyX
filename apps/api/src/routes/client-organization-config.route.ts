import { Router, Request, Response } from "express";
import bodyParser from "body-parser";
import { getOrganizationConfigBySlug } from "../services/organization-config.service";
import { asyncHandler } from "../middlewares/async-handler";
import { cache } from "../middlewares/cache.middleware";
import { CacheTTL } from "../services/cache.service";
import { HTTP_STATUS } from "../common/constants";
import { publicRateLimiter } from "../middlewares/rate-limiter.middleware";

const router = Router();
router.use(bodyParser.json());

/**
 * @openapi
 * /api/organization-config/{slug}:
 *   get:
 *     tags:
 *       - Organization Config (Client)
 *     summary: Get public organization configuration by slug
 *     description: Returns public organization configuration without sensitive data (payment credentials, SMTP config, admin settings).
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Organization slug
 *     responses:
 *       200:
 *         description: Organization configuration retrieved successfully
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
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     organizationId:
 *                       type: string
 *                       format: uuid
 *                     name:
 *                       type: string
 *                     slug:
 *                       type: string
 *                     domain:
 *                       type: string
 *                     contactEmail:
 *                       type: string
 *                     contactPhone:
 *                       type: string
 *                     currency:
 *                       type: string
 *                     logoUrl:
 *                       type: string
 *                     faviconUrl:
 *                       type: string
 *                     bannerUrls:
 *                       type: array
 *                       items:
 *                         type: string
 *                     motto:
 *                       type: string
 *                     description:
 *                       type: string
 *                     theme:
 *                       type: object
 *                     heroTitle:
 *                       type: string
 *                     heroSubtitle:
 *                       type: string
 *                     ctaText:
 *                       type: string
 *                     ctaUrl:
 *                       type: string
 *                     features:
 *                       type: array
 *                     testimonials:
 *                       type: array
 *                     faq:
 *                       type: array
 *                     socialLinks:
 *                       type: object
 *                     metaTitle:
 *                       type: string
 *                     metaDescription:
 *                       type: string
 *                     ogImage:
 *                       type: string
 *                     supportEmail:
 *                       type: string
 *                     featuresEnabled:
 *                       type: object
 *                     maintenanceMode:
 *                       type: boolean
 *                     customCSS:
 *                       type: string
 *                     customJS:
 *                       type: string
 *       404:
 *         description: Organization configuration not found
 */
router.get(
  "/:slug",
  publicRateLimiter,
  cache(CacheTTL.LONG, (req) => {
    const { slug } = req.params;
    return `org-config:slug:${slug}`;
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const { slug } = req.params;

    const config = await getOrganizationConfigBySlug(slug);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: config,
      message: "Organization configuration retrieved successfully",
    });
  })
);

export default router;
