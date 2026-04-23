import { Router, Request, Response } from "express";
import bodyParser from "body-parser";
import {
  createSubject,
  getSubjectsByBatchId,
  getSubjectById,
  updateSubject,
  deleteSubject,
} from "../../services/admin/subject.service";
import { asyncHandler } from "../../middlewares/async-handler";
import { authenticate, authorize } from "../../middlewares/auth.middleware";
import {
  validate,
  validateParams,
} from "../../middlewares/validate.middleware";
import {
  createSubjectSchema,
  updateSubjectSchema,
  batchIdParamSchema,
  subjectIdParamSchema,
} from "../../validators/subject.validator";
import { HTTP_STATUS } from "../../common/constants";

const router = Router();
router.use(bodyParser.json());

/**
 * @openapi
 * /admin/subjects:
 *   post:
 *     tags:
 *       - Subjects (Admin)
 *     summary: Create a new subject (ADMIN & TEACHER)
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
 *               - batchId
 *             properties:
 *               name:
 *                 type: string
 *                 description: Subject name
 *               batchId:
 *                 type: string
 *                 format: uuid
 *                 description: Batch ID
 *               thumbnailUrl:
 *                 type: string
 *                 description: Subject thumbnail URL
 *     responses:
 *       201:
 *         description: Subject created successfully
 *       404:
 *         description: Batch not found
 */
router.post(
  "/",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  validate(createSubjectSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Organization ID not found",
      });
    }

    const subject = await createSubject({
      organizationId,
      ...req.body,
    });

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: subject,
      message: "Subject created successfully",
    });
  })
);

/**
 * @openapi
 * /admin/subjects/batch/{batchId}:
 *   get:
 *     tags:
 *       - Subjects (Admin)
 *     summary: Get all subjects for a batch
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: batchId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Batch ID
 *     responses:
 *       200:
 *         description: List of subjects with assigned teachers
 *       404:
 *         description: Batch not found
 */
router.get(
  "/batch/:batchId",
  authenticate,
  validateParams(batchIdParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { batchId } = req.params;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Organization ID not found",
      });
    }

    const subjects = await getSubjectsByBatchId(batchId, organizationId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: subjects,
      message: "Subjects retrieved successfully",
    });
  })
);

/**
 * @openapi
 * /admin/subjects/{id}:
 *   get:
 *     tags:
 *       - Subjects (Admin)
 *     summary: Get subject by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Subject ID
 *     responses:
 *       200:
 *         description: Subject details
 *       404:
 *         description: Subject not found
 */
router.get(
  "/:id",
  authenticate,
  validateParams(subjectIdParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Organization ID not found",
      });
    }

    const subject = await getSubjectById(id, organizationId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: subject,
      message: "Subject retrieved successfully",
    });
  })
);

/**
 * @openapi
 * /admin/subjects/{id}:
 *   put:
 *     tags:
 *       - Subjects (Admin)
 *     summary: Update subject by ID (ADMIN & TEACHER)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Subject ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               thumbnailUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Subject updated successfully
 *       404:
 *         description: Subject not found
 */
router.put(
  "/:id",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  validateParams(subjectIdParamSchema),
  validate(updateSubjectSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Organization ID not found",
      });
    }

    const subject = await updateSubject(id, organizationId, req.body);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: subject,
      message: "Subject updated successfully",
    });
  })
);

/**
 * @openapi
 * /admin/subjects/{id}:
 *   delete:
 *     tags:
 *       - Subjects (Admin)
 *     summary: Delete subject by ID (ADMIN & TEACHER)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Subject ID
 *     responses:
 *       200:
 *         description: Subject deleted successfully
 *       404:
 *         description: Subject not found
 */
router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  validateParams(subjectIdParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Organization ID not found",
      });
    }

    await deleteSubject(id, organizationId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Subject deleted successfully",
    });
  })
);

export default router;
