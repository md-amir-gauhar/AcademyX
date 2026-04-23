import { Router, Request, Response } from "express";
import bodyParser from "body-parser";
import {
  verifyEmail,
  setPassword,
  resendVerificationEmail,
  loginUser,
} from "../services/auth.service";
import { db } from "../db";
import { user, verificationToken } from "../db/schema";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { asyncHandler } from "../middlewares/async-handler";
import { publicRateLimiter } from "../middlewares/rate-limiter.middleware";
import {
  HTTP_STATUS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  TOKEN_CONFIG,
} from "../common/constants";
import { ApiError } from "../common/response";
import { sendVerificationEmail } from "../services/email.service";

const router = Router();
router.use(bodyParser.json());

const JWT_SECRET = process.env.JWT_SECRET || "queztlearn_secret";
const TOKEN_EXPIRY_HOURS = TOKEN_CONFIG.VERIFICATION_EXPIRY_HOURS;

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags:
 *       - Authentication (Client)
 *     summary: Register a new student
 *     description: Creates a new student account and sends a verification email. User will have STUDENT role automatically.
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
 *                 description: UUID of the organization
 *                 example: 123e4567-e89b-12d3-a456-426614174000
 *               email:
 *                 type: string
 *                 format: email
 *                 example: student@example.com
 *               username:
 *                 type: string
 *                 example: johndoe
 *     responses:
 *       201:
 *         description: Student registered successfully
 *       409:
 *         description: Email already registered
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

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      throw new ApiError(
        ERROR_MESSAGES.EMAIL_ALREADY_REGISTERED,
        HTTP_STATUS.CONFLICT
      );
    }

    // Create user with STUDENT role
    const [newUser] = await db
      .insert(user)
      .values({
        organizationId,
        email,
        username,
        role: "STUDENT", // Automatically set to STUDENT for client registration
        isVerified: false,
      })
      .returning();

    // Generate verification token
    const token = jwt.sign(
      { userId: newUser.id, email, type: "email_verification" },
      JWT_SECRET,
      { expiresIn: `${TOKEN_EXPIRY_HOURS}h` }
    );

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + TOKEN_EXPIRY_HOURS);

    await db.insert(verificationToken).values({
      userId: newUser.id,
      token,
      expiresAt,
    });

    // Send verification email
    await sendVerificationEmail(email, token, username);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        role: newUser.role,
        message: SUCCESS_MESSAGES.VERIFICATION_EMAIL_SENT,
      },
      message: SUCCESS_MESSAGES.REGISTRATION_SUCCESS,
    });
  })
);

/**
 * @openapi
 * /api/auth/verify-email:
 *   post:
 *     tags:
 *       - Authentication (Client)
 *     summary: Verify email address
 *     description: Verifies student's email address using the token sent via email
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
 *     responses:
 *       200:
 *         description: Email verified successfully
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
 * /api/auth/set-password:
 *   post:
 *     tags:
 *       - Authentication (Client)
 *     summary: Set student password
 *     description: Sets password for a verified student account
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
 *               password:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password set successfully
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
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Authentication (Client)
 *     summary: Student login
 *     description: Login for students and get JWT token
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
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
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
 *                     token:
 *                       type: string
 *                     user:
 *                       type: object
 */
router.post(
  "/login",
  publicRateLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: ERROR_MESSAGES.REQUIRED_FIELDS.EMAIL_PASSWORD,
      });
    }

    const result = await loginUser(email, password);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result,
      message: SUCCESS_MESSAGES.LOGIN_SUCCESS,
    });
  })
);

/**
 * @openapi
 * /api/auth/resend-verification:
 *   post:
 *     tags:
 *       - Authentication (Client)
 *     summary: Resend verification email
 *     description: Resends verification email to student
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
 *     responses:
 *       200:
 *         description: Verification email sent
 */
router.post(
  "/resend-verification",
  publicRateLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: ERROR_MESSAGES.REQUIRED_FIELDS.EMAIL,
      });
    }

    const result = await resendVerificationEmail(email);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result,
    });
  })
);

export default router;
