import { Router, Request, Response } from "express";
import bodyParser from "body-parser";
import {
  createOrganizationConfig,
  getOrganizationConfigByOrgId,
  updateOrganizationConfig,
  deleteOrganizationConfig,
  toggleMaintenanceMode,
} from "../services/organization-config.service";
import { asyncHandler } from "../middlewares/async-handler";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { HTTP_STATUS } from "../common/constants";

const router = Router();
router.use(bodyParser.json());

/**
 * @openapi
 * /admin/organization-config:
 *   post:
 *     tags:
 *       - Organization Config (Admin)
 *     summary: Create organization configuration (ADMIN only)
 *     description: Creates a new organization configuration with all settings including sensitive payment and email credentials.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - organizationId
 *             properties:
 *               organizationId:
 *                 type: string
 *                 format: uuid
 *               name:
 *                 type: string
 *               slug:
 *                 type: string
 *               domain:
 *                 type: string
 *               contactEmail:
 *                 type: string
 *               contactPhone:
 *                 type: string
 *               razorpayKeyId:
 *                 type: string
 *               razorpayKeySecret:
 *                 type: string
 *               currency:
 *                 type: string
 *                 default: INR
 *               logoUrl:
 *                 type: string
 *               faviconUrl:
 *                 type: string
 *               bannerUrls:
 *                 type: array
 *                 items:
 *                   type: string
 *               motto:
 *                 type: string
 *               description:
 *                 type: string
 *               theme:
 *                 type: object
 *                 properties:
 *                   primaryColor:
 *                     type: string
 *                   secondaryColor:
 *                     type: string
 *                   fontFamily:
 *                     type: string
 *               heroTitle:
 *                 type: string
 *               heroSubtitle:
 *                 type: string
 *               features:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                     description:
 *                       type: string
 *                     icon:
 *                       type: string
 *               supportEmail:
 *                 type: string
 *               maintenanceMode:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Organization configuration created successfully
 *       409:
 *         description: Configuration already exists
 */
router.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  asyncHandler(async (req: Request, res: Response) => {
    const config = await createOrganizationConfig(req.body);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: config,
      message: "Organization configuration created successfully",
    });
  })
);

/**
 * @openapi
 * /admin/organization-config:
 *   get:
 *     tags:
 *       - Organization Config (Admin)
 *     summary: Get organization configuration (ADMIN only)
 *     description: Returns the full organization configuration including sensitive data like payment credentials.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Organization configuration retrieved successfully
 *       404:
 *         description: Configuration not found
 */
router.get(
  "/",
  authenticate,
  authorize("ADMIN"),
  asyncHandler(async (req: Request, res: Response) => {
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Organization ID not found",
      });
    }

    const config = await getOrganizationConfigByOrgId(organizationId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: config,
      message: "Organization configuration retrieved successfully",
    });
  })
);

/**
 * @openapi
 * /admin/organization-config:
 *   put:
 *     tags:
 *       - Organization Config (Admin)
 *     summary: Update organization configuration (ADMIN only)
 *     description: Updates organization configuration. All fields are optional.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               slug:
 *                 type: string
 *               domain:
 *                 type: string
 *               contactEmail:
 *                 type: string
 *               razorpayKeyId:
 *                 type: string
 *               razorpayKeySecret:
 *                 type: string
 *               logoUrl:
 *                 type: string
 *               theme:
 *                 type: object
 *               maintenanceMode:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Organization configuration updated successfully
 *       404:
 *         description: Configuration not found
 */
router.put(
  "/",
  authenticate,
  authorize("ADMIN"),
  asyncHandler(async (req: Request, res: Response) => {
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Organization ID not found",
      });
    }

    const config = await updateOrganizationConfig(organizationId, req.body);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: config,
      message: "Organization configuration updated successfully",
    });
  })
);

/**
 * @openapi
 * /admin/organization-config:
 *   delete:
 *     tags:
 *       - Organization Config (Admin)
 *     summary: Delete organization configuration (ADMIN only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Organization configuration deleted successfully
 *       404:
 *         description: Configuration not found
 */
router.delete(
  "/",
  authenticate,
  authorize("ADMIN"),
  asyncHandler(async (req: Request, res: Response) => {
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Organization ID not found",
      });
    }

    await deleteOrganizationConfig(organizationId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Organization configuration deleted successfully",
    });
  })
);

/**
 * @openapi
 * /admin/organization-config/maintenance:
 *   post:
 *     tags:
 *       - Organization Config (Admin)
 *     summary: Toggle maintenance mode (ADMIN only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - enabled
 *             properties:
 *               enabled:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Maintenance mode updated successfully
 */
router.post(
  "/maintenance",
  authenticate,
  authorize("ADMIN"),
  asyncHandler(async (req: Request, res: Response) => {
    const organizationId = req.user?.organizationId;
    const { enabled } = req.body;

    if (!organizationId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Organization ID not found",
      });
    }

    const config = await toggleMaintenanceMode(organizationId, enabled);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: config,
      message: `Maintenance mode ${
        enabled ? "enabled" : "disabled"
      } successfully`,
    });
  })
);

export default router;
