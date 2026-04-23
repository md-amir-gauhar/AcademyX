import { Router, Request, Response } from "express";
import bodyParser from "body-parser";
import { getAllUsers, deleteUser } from "../services/user.service";
import { asyncHandler } from "../middlewares/async-handler";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { HTTP_STATUS, SUCCESS_MESSAGES } from "../common/constants";

const router = Router();
router.use(bodyParser.json());

/**
 * @openapi
 * /admin/users:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get all users in organization (ADMIN only)
 *     description: Retrieves all users belonging to the authenticated admin's organization. Excludes password field for security.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       email:
 *                         type: string
 *                         format: email
 *                       username:
 *                         type: string
 *                       role:
 *                         type: string
 *                         enum: [ADMIN, TEACHER, STUDENT, GUEST]
 *                       isVerified:
 *                         type: boolean
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                 message:
 *                   type: string
 *                   example: Users retrieved successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Only ADMIN users can view all users
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  "/",
  authenticate,
  authorize("ADMIN"),
  asyncHandler(async (req: Request, res: Response) => {
    // Get users from the authenticated admin's organization
    const organizationId = req.user!.organizationId;

    const users = await getAllUsers(organizationId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: users,
      message: "Users retrieved successfully",
    });
  })
);

/**
 * @openapi
 * /admin/users/{userId}:
 *   delete:
 *     tags:
 *       - Users
 *     summary: Delete a user (ADMIN only)
 *     description: Allows ADMIN users to delete any user in their organization. Cascades to delete all related data (progress, test attempts, verification tokens).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the user to delete
 *         example: 123e4567-e89b-12d3-a456-426614174001
 *     responses:
 *       200:
 *         description: User deleted successfully
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
 *                       example: User deleted successfully
 *                 message:
 *                   type: string
 *                   example: User deleted successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Only ADMIN users can delete users
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
router.delete(
  "/:userId",
  authenticate,
  authorize("ADMIN"),
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;

    if (!userId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "User ID is required",
      });
    }

    const result = await deleteUser(userId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result,
      message: SUCCESS_MESSAGES.USER_DELETED,
    });
  })
);

export default router;
