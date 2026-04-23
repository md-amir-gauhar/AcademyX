import { Router, Request, Response } from "express";
import bodyParser from "body-parser";
import {
  registerUser,
  verifyEmail,
  setPassword,
  resendVerificationEmail,
  loginUser,
  inviteUser,
} from "../services/auth.service";
import { asyncHandler } from "../middlewares/async-handler";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import {
  publicRateLimiter,
  authenticatedRateLimiter,
} from "../middlewares/rate-limiter.middleware";
import {
  HTTP_STATUS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
} from "../common/constants";

const router = Router();
router.use(bodyParser.json());

/**
 * @openapi
 * /admin/auth/register:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Register a new user
 *     description: Creates a new user account and sends a verification email. User will have ADMIN role by default.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - organizationId
 *               - email
 *               - username
 *             properties:
 *               organizationId:
 *                 type: string
 *                 format: uuid
 *                 description: UUID of the organization the user belongs to
 *                 example: 123e4567-e89b-12d3-a456-426614174000
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Unique email address
 *                 example: user@example.com
 *               username:
 *                 type: string
 *                 description: Username for the account
 *                 example: johndoe
 *     responses:
 *       201:
 *         description: User registered successfully
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
 *                     email:
 *                       type: string
 *                     username:
 *                       type: string
 *                     message:
 *                       type: string
 *                 message:
 *                   type: string
 *                   example: User registered successfully. Please verify your email.
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Email already registered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  "/register",
  publicRateLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { organizationId, email, username } = req.body;

    if (!organizationId || !email || !username) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: ERROR_MESSAGES.REQUIRED_FIELDS.ORGANIZATION_ID_EMAIL_USERNAME,
      });
    }

    const result = await registerUser(organizationId, email, username);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: result,
      message: SUCCESS_MESSAGES.REGISTRATION_SUCCESS,
    });
  })
);

/**
 * @openapi
 * /admin/auth/verify-email:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Verify email address
 *     description: Verifies user's email address using the token sent via email. Token is valid for 24 hours.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: JWT verification token from email
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: Email verified successfully
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
 *                     message:
 *                       type: string
 *                       example: Email verified successfully. You can now set your password.
 *                     userId:
 *                       type: string
 *                       format: uuid
 *       400:
 *         description: Invalid or expired token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  "/verify-email",
  publicRateLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.body;

    if (!token) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: ERROR_MESSAGES.REQUIRED_FIELDS.TOKEN,
      });
    }

    const result = await verifyEmail(token);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result,
    });
  })
);

/**
 * @openapi
 * /admin/auth/set-password:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Set user password
 *     description: Sets password for a verified user account. Password must be at least 8 characters long.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - password
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *                 description: User ID obtained from email verification
 *                 example: 123e4567-e89b-12d3-a456-426614174001
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 description: New password (min 8 characters)
 *                 example: SecurePassword123!
 *     responses:
 *       200:
 *         description: Password set successfully
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
 *                     message:
 *                       type: string
 *                       example: Password set successfully. You can now login.
 *       400:
 *         description: Invalid request or password too short
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Email not verified
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  "/set-password",
  publicRateLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { userId, password } = req.body;

    if (!userId || !password) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: ERROR_MESSAGES.REQUIRED_FIELDS.USER_ID_PASSWORD,
      });
    }

    const result = await setPassword(userId, password);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result,
    });
  })
);

/**
 * @openapi
 * /admin/auth/resend-verification:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Resend verification email
 *     description: Sends a new verification email if the previous one expired or was lost. Only works for unverified users.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address of the user
 *                 example: user@example.com
 *               organizationId:
 *                 type: string
 *                 format: uuid
 *                 description: Optional organization UUID. Required only if the email exists in more than one organization.
 *               orgSlug:
 *                 type: string
 *                 description: Optional organization slug. Alternative to organizationId.
 *                 example: acme-academy
 *     responses:
 *       200:
 *         description: Verification email resent successfully
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
 *                     message:
 *                       type: string
 *                       example: Verification email resent. Please check your inbox.
 *       400:
 *         description: Email already verified or invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User or organization not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Email exists in multiple organizations - specify organizationId or orgSlug
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  "/resend-verification",
  publicRateLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { email, organizationId, orgSlug } = req.body;

    if (!email) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: ERROR_MESSAGES.REQUIRED_FIELDS.EMAIL,
      });
    }

    const result = await resendVerificationEmail(
      email,
      organizationId || orgSlug
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result,
    });
  })
);

/**
 * @openapi
 * /admin/auth/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: User login
 *     description: Authenticates a user and returns a JWT token valid for 7 days. User must have verified email and set password.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 description: User's password
 *                 example: SecurePassword123!
 *               organizationId:
 *                 type: string
 *                 format: uuid
 *                 description: Optional organization UUID. Required only if the email exists in more than one organization.
 *               orgSlug:
 *                 type: string
 *                 description: Optional organization slug. Alternative to organizationId.
 *                 example: acme-academy
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Email not verified or password not set
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Organization not found (when orgSlug or organizationId is supplied)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Email exists in multiple organizations - specify organizationId or orgSlug
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  "/login",
  publicRateLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password, organizationId, orgSlug } = req.body;

    if (!email || !password) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: ERROR_MESSAGES.REQUIRED_FIELDS.EMAIL_PASSWORD,
      });
    }

    const result = await loginUser(email, password, organizationId || orgSlug);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result,
      message: SUCCESS_MESSAGES.LOGIN_SUCCESS,
    });
  })
);

/**
 * @openapi
 * /admin/auth/invite-user:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Invite a new teacher (ADMIN only)
 *     description: Allows ADMIN users to invite a new teacher to their organization. Creates a user with TEACHER role and sends verification email.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - username
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address of the teacher to invite
 *                 example: teacher@example.com
 *               username:
 *                 type: string
 *                 description: Username for the teacher account
 *                 example: janedoe
 *     responses:
 *       201:
 *         description: Teacher invited successfully
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
 *                     email:
 *                       type: string
 *                     username:
 *                       type: string
 *                     role:
 *                       type: string
 *                       example: TEACHER
 *                     organizationId:
 *                       type: string
 *                       format: uuid
 *                     message:
 *                       type: string
 *                 message:
 *                   type: string
 *                   example: User invited successfully. Verification email sent.
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Only ADMIN users can invite teachers
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Email already registered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  "/invite-user",
  authenticate,
  authorize("ADMIN"),
  authenticatedRateLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { email, username } = req.body;

    if (!email || !username) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Email and username are required",
      });
    }

    // Use the authenticated user's organizationId
    const organizationId = req.user!.organizationId;

    const result = await inviteUser(organizationId, email, username);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: result,
      message: SUCCESS_MESSAGES.USER_INVITED,
    });
  })
);

export default router;
