import { Router, Request, Response } from "express";
import bodyParser from "body-parser";
import { z } from "zod";
import {
  getOTP,
  verifyOTPAndLogin,
  refreshAccessToken,
} from "../services/otp-auth.service";
import { asyncHandler } from "../middlewares/async-handler";
import { publicRateLimiter } from "../middlewares/rate-limiter.middleware";
import { HTTP_STATUS } from "../common/constants";

const router = Router();
router.use(bodyParser.json());

// Validators
const getOTPSchema = z.object({
  countryCode: z
    .string()
    .min(1)
    .max(5)
    .regex(/^\+?\d+$/, "Invalid country code"),
  phoneNumber: z
    .string()
    .min(10)
    .max(15)
    .regex(/^\d+$/, "Phone number must contain only digits"),
  organizationId: z.uuid("Invalid organization ID"),
});

const verifyOTPSchema = z.object({
  countryCode: z
    .string()
    .min(1)
    .max(5)
    .regex(/^\+?\d+$/, "Invalid country code"),
  phoneNumber: z
    .string()
    .min(10)
    .max(15)
    .regex(/^\d+$/, "Phone number must contain only digits"),
  otp: z.string().length(6, "OTP must be 6 digits"),
  organizationId: z.uuid("Invalid organization ID"),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

/**
 * @openapi
 * /api/auth/get-otp:
 *   post:
 *     tags:
 *       - Authentication (Client - OTP)
 *     summary: Send OTP to mobile number
 *     description: Sends OTP to the provided mobile number. Returns different messages for existing and new users.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - countryCode
 *               - phoneNumber
 *               - organizationId
 *             properties:
 *               countryCode:
 *                 type: string
 *                 example: "+91"
 *                 description: Country code with or without + prefix
 *               phoneNumber:
 *                 type: string
 *                 example: "9876543210"
 *                 description: Mobile number without country code
 *               organizationId:
 *                 type: string
 *                 format: uuid
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: OTP sent successfully (existing user)
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
 *                     isExistingUser:
 *                       type: boolean
 *                       example: true
 *                 message:
 *                   type: string
 *                   example: OTP sent successfully to your registered mobile number
 *       400:
 *         description: Invalid request or OTP sent for new user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 data:
 *                   type: object
 *                   properties:
 *                     isExistingUser:
 *                       type: boolean
 *                       example: false
 *                 message:
 *                   type: string
 *                   example: OTP sent successfully. You will be registered as a new user
 *       429:
 *         description: Too many requests
 *       503:
 *         description: OTP service unavailable
 */
router.post(
  "/get-otp",
  publicRateLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    // Validate request body
    const validatedData = getOTPSchema.parse(req.body);

    const result = await getOTP({
      countryCode: validatedData.countryCode,
      phoneNumber: validatedData.phoneNumber,
      organizationId: validatedData.organizationId,
    });

    // Return 200 for existing users, 400 for new users as per requirement
    const statusCode = result.isExistingUser
      ? HTTP_STATUS.OK
      : HTTP_STATUS.BAD_REQUEST;

    res.status(statusCode).json({
      success: result.isExistingUser,
      data: {
        isExistingUser: result.isExistingUser,
      },
      message: result.message,
    });
  })
);

/**
 * @openapi
 * /api/auth/verify-otp:
 *   post:
 *     tags:
 *       - Authentication (Client - OTP)
 *     summary: Verify OTP and login/register
 *     description: Verifies the OTP and either logs in existing user or creates new user account with STUDENT role
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - countryCode
 *               - phoneNumber
 *               - otp
 *               - organizationId
 *             properties:
 *               countryCode:
 *                 type: string
 *                 example: "+91"
 *               phoneNumber:
 *                 type: string
 *                 example: "9876543210"
 *               otp:
 *                 type: string
 *                 example: "123456"
 *                 description: 6-digit OTP received via SMS
 *               organizationId:
 *                 type: string
 *                 format: uuid
 *               username:
 *                 type: string
 *                 example: "johndoe"
 *                 description: Required only for new user registration
 *     responses:
 *       200:
 *         description: OTP verified successfully
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
 *                     accessToken:
 *                       type: string
 *                       description: JWT access token (7 days validity)
 *                     refreshToken:
 *                       type: string
 *                       description: JWT refresh token (30 days validity)
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         phoneNumber:
 *                           type: string
 *                         countryCode:
 *                           type: string
 *                         username:
 *                           type: string
 *                         role:
 *                           type: string
 *                           example: STUDENT
 *                         organizationId:
 *                           type: string
 *                           format: uuid
 *                         isVerified:
 *                           type: boolean
 *                           example: true
 *                 message:
 *                   type: string
 *                   example: Login successful
 *       400:
 *         description: Invalid OTP or missing username for new user
 *       404:
 *         description: User not found
 */
router.post(
  "/verify-otp",
  publicRateLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    // Validate request body
    const validatedData = verifyOTPSchema.parse(req.body);

    const result = await verifyOTPAndLogin({
      countryCode: validatedData.countryCode,
      phoneNumber: validatedData.phoneNumber,
      otp: validatedData.otp,
      organizationId: validatedData.organizationId,
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result,
      message: "Login successful",
    });
  })
);

/**
 * @openapi
 * /api/auth/refresh-token:
 *   post:
 *     tags:
 *       - Authentication (Client - OTP)
 *     summary: Refresh access token
 *     description: Generate a new access token using refresh token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Valid refresh token
 *     responses:
 *       200:
 *         description: Access token refreshed successfully
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
 *                     accessToken:
 *                       type: string
 *                     user:
 *                       type: object
 *                 message:
 *                   type: string
 *       401:
 *         description: Invalid or expired refresh token
 */
router.post(
  "/refresh-token",
  publicRateLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const validatedData = refreshTokenSchema.parse(req.body);

    const result = await refreshAccessToken(validatedData.refreshToken);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result,
      message: "Access token refreshed successfully",
    });
  })
);

export default router;
