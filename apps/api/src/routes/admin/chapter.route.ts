import { Router, Request, Response } from "express";
import bodyParser from "body-parser";
import {
  createChapter,
  getChaptersBySubjectId,
  getChapterById,
  updateChapter,
  deleteChapter,
} from "../../services/admin/chapter.service";
import { asyncHandler } from "../../middlewares/async-handler";
import { authenticate, authorize } from "../../middlewares/auth.middleware";
import {
  validate,
  validateParams,
} from "../../middlewares/validate.middleware";
import {
  createChapterSchema,
  updateChapterSchema,
  subjectIdParamSchema,
  chapterIdParamSchema,
} from "../../validators/chapter.validator";
import { HTTP_STATUS } from "../../common/constants";

const router = Router();
router.use(bodyParser.json());

/**
 * @openapi
 * /admin/chapters:
 *   post:
 *     tags:
 *       - Chapters (Admin)
 *     summary: Create a new chapter (ADMIN & TEACHER)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - subjectId
 *             properties:
 *               name:
 *                 type: string
 *                 description: Chapter name
 *               subjectId:
 *                 type: string
 *                 format: uuid
 *                 description: Subject ID
 *               lectureCount:
 *                 type: integer
 *                 description: Number of lectures in chapter
 *                 default: 0
 *               lectureDuration:
 *                 type: string
 *                 description: Total lecture duration (e.g. "10+ hr")
 *     responses:
 *       201:
 *         description: Chapter created successfully
 *       404:
 *         description: Subject not found
 */
router.post(
  "/",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  validate(createChapterSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Organization ID not found",
      });
    }

    const chapter = await createChapter({
      organizationId,
      ...req.body,
    });

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: chapter,
      message: "Chapter created successfully",
    });
  })
);

/**
 * @openapi
 * /admin/chapters/subject/{subjectId}:
 *   get:
 *     tags:
 *       - Chapters (Admin)
 *     summary: Get all chapters for a subject
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: subjectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Subject ID
 *     responses:
 *       200:
 *         description: List of chapters
 *       404:
 *         description: Subject not found
 */
router.get(
  "/subject/:subjectId",
  authenticate,
  validateParams(subjectIdParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { subjectId } = req.params;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Organization ID not found",
      });
    }

    const chapters = await getChaptersBySubjectId(subjectId, organizationId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: chapters,
      message: "Chapters retrieved successfully",
    });
  })
);

/**
 * @openapi
 * /admin/chapters/{id}:
 *   get:
 *     tags:
 *       - Chapters (Admin)
 *     summary: Get chapter by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Chapter ID
 *     responses:
 *       200:
 *         description: Chapter details
 *       404:
 *         description: Chapter not found
 */
router.get(
  "/:id",
  authenticate,
  validateParams(chapterIdParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Organization ID not found",
      });
    }

    const chapter = await getChapterById(id, organizationId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: chapter,
      message: "Chapter retrieved successfully",
    });
  })
);

/**
 * @openapi
 * /admin/chapters/{id}:
 *   put:
 *     tags:
 *       - Chapters (Admin)
 *     summary: Update chapter by ID (ADMIN & TEACHER)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Chapter ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               lectureCount:
 *                 type: integer
 *               lectureDuration:
 *                 type: string
 *     responses:
 *       200:
 *         description: Chapter updated successfully
 *       404:
 *         description: Chapter not found
 */
router.put(
  "/:id",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  validateParams(chapterIdParamSchema),
  validate(updateChapterSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Organization ID not found",
      });
    }

    const chapter = await updateChapter(id, organizationId, req.body);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: chapter,
      message: "Chapter updated successfully",
    });
  })
);

/**
 * @openapi
 * /admin/chapters/{id}:
 *   delete:
 *     tags:
 *       - Chapters (Admin)
 *     summary: Delete chapter by ID (ADMIN & TEACHER)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Chapter ID
 *     responses:
 *       200:
 *         description: Chapter deleted successfully
 *       404:
 *         description: Chapter not found
 */
router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  validateParams(chapterIdParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Organization ID not found",
      });
    }

    await deleteChapter(id, organizationId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Chapter deleted successfully",
    });
  })
);

export default router;
