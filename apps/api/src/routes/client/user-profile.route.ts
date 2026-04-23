import { Router, Request, Response } from "express";
import bodyParser from "body-parser";
import {
  getUserProfile,
  updateUserProfile,
} from "../../services/client/user-profile.service";
import { asyncHandler } from "../../middlewares/async-handler";
import { authenticate } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { updateUserProfileSchema } from "../../validators/user-profile.validator";
import { HTTP_STATUS } from "../../common/constants";

const router = Router();
router.use(bodyParser.json());

/**
 * @openapi
 * /api/profile:
 *   get:
 *     tags:
 *       - User Profile (Client)
 *     summary: Get user profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 */
router.get(
  "/",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id!;

    const profile = await getUserProfile(userId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: profile,
      message: "Profile retrieved successfully",
    });
  })
);

/**
 * @openapi
 * /api/profile:
 *   put:
 *     tags:
 *       - User Profile (Client)
 *     summary: Update user profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               profileImg:
 *                 type: string
 *                 format: uri
 *               gender:
 *                 type: string
 *                 enum: [Male, Female, Other, Prefer not to say]
 *               phoneNumber:
 *                 type: string
 *               address:
 *                 type: object
 *                 properties:
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   pincode:
 *                     type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.put(
  "/",
  authenticate,
  validate(updateUserProfileSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id!;
    const { username, profileImg, gender, phoneNumber, address } = req.body;

    const updatedProfile = await updateUserProfile({
      userId,
      username,
      profileImg,
      gender,
      phoneNumber,
      address,
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: updatedProfile,
      message: "Profile updated successfully",
    });
  })
);

export default router;
