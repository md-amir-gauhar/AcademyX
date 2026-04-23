import { Router, Request, Response } from "express";
import bodyParser from "body-parser";
import { createOrganization } from "../services/organization.service";
import { asyncHandler } from "../middlewares/async-handler";
import { SUCCESS_MESSAGES } from "../common/constants";
import { publicRateLimiter } from "../middlewares/rate-limiter.middleware";

const router = Router();
router.use(bodyParser.json());

/**
 * @openapi
 * /admin/organizations:
 *   post:
 *     tags:
 *       - Organizations
 *     summary: Create a new organization
 *     description: Creates a new organization with a unique name and slug. The name and slug must be at least 3 characters long.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - slug
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 255
 *                 description: Unique organization name
 *                 example: Acme Corporation
 *               slug:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 255
 *                 pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$'
 *                 description: Unique URL-friendly slug (lowercase, alphanumeric, hyphens only)
 *                 example: acme-corporation
 *     responses:
 *       201:
 *         description: Organization created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Organization'
 *                 message:
 *                   type: string
 *                   example: Organization created successfully
 *       400:
 *         description: Invalid request (name/slug too short or invalid format)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Organization name or slug already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  "/",
  publicRateLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { name, slug } = req.body;
    const org = await createOrganization(name, slug);

    res.status(201).json({
      success: true,
      data: org,
      message: SUCCESS_MESSAGES.ORGANIZATION_CREATED,
    });
  })
);

export default router;
