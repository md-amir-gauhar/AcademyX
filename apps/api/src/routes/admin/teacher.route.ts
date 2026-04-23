import { Router, Request, Response } from "express";
import bodyParser from "body-parser";
import {
  createTeacher,
  getAllTeachers,
  getTeacherById,
  getTeachersByBatchId,
  updateTeacher,
  deleteTeacher,
  assignTeacherToBatch,
  removeTeacherFromBatch,
} from "../../services/admin/teacher.service";
import { asyncHandler } from "../../middlewares/async-handler";
import { authenticate, authorize } from "../../middlewares/auth.middleware";
import {
  validate,
  validateParams,
} from "../../middlewares/validate.middleware";
import {
  createTeacherSchema,
  updateTeacherSchema,
  teacherIdParamSchema,
  batchIdParamSchema,
  teacherBatchParamSchema,
} from "../../validators/teacher.validator";
import { HTTP_STATUS } from "../../common/constants";

const router = Router();
router.use(bodyParser.json());

/**
 * @openapi
 * /admin/teachers:
 *   post:
 *     tags:
 *       - Teachers (Admin)
 *     summary: Create a new teacher (ADMIN & Teacher)
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
 *             properties:
 *               name:
 *                 type: string
 *                 description: Teacher's full name
 *               batchIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 description: Optional array of batch IDs to assign teacher to
 *               highlights:
 *                 type: object
 *                 description: HTML content as JSONB
 *               imageUrl:
 *                 type: string
 *                 description: Teacher's profile image URL
 *               subjects:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of subjects taught
 *               subjectIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 description: Optional array of subject IDs to assign teacher to
 *     responses:
 *       201:
 *         description: Teacher created successfully
 *       404:
 *         description: One or more batches not found
 */
router.post(
  "/",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  validate(createTeacherSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Organization ID not found",
      });
    }

    const teacher = await createTeacher({
      organizationId,
      ...req.body,
    });

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: teacher,
      message: "Teacher created successfully",
    });
  })
);

/**
 * @openapi
 * /admin/teachers:
 *   get:
 *     tags:
 *       - Teachers (Admin)
 *     summary: Get all teachers (ADMIN & Teacher)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all teachers with their subjects
 */
router.get(
  "/",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  asyncHandler(async (req: Request, res: Response) => {
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Organization ID not found",
      });
    }

    const teachers = await getAllTeachers(organizationId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: teachers,
      message: "Teachers retrieved successfully",
    });
  })
);

/**
 * @openapi
 * /admin/teachers/{id}:
 *   get:
 *     tags:
 *       - Teachers (Admin)
 *     summary: Get teacher by ID with subjects (ADMIN & Teacher)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Teacher ID
 *     responses:
 *       200:
 *         description: Teacher details with subjects
 *       404:
 *         description: Teacher not found
 */
router.get(
  "/:id",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  validateParams(teacherIdParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Organization ID not found",
      });
    }

    const teacher = await getTeacherById(id, organizationId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: teacher,
      message: "Teacher retrieved successfully",
    });
  })
);

/**
 * @openapi
 * /admin/teachers/batch/{batchId}:
 *   get:
 *     tags:
 *       - Teachers (Admin)
 *     summary: Get all teachers assigned to a batch (ADMIN & Teacher)
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
 *         description: List of teachers
 *       404:
 *         description: Batch not found
 */
router.get(
  "/batch/:batchId",
  authenticate,
  authorize("ADMIN", "TEACHER"),
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

    const teachers = await getTeachersByBatchId(batchId, organizationId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: teachers,
      message: "Teachers retrieved successfully",
    });
  })
);

/**
 * @openapi
 * /admin/teachers/{id}:
 *   put:
 *     tags:
 *       - Teachers (Admin)
 *     summary: Update teacher by ID (ADMIN & Teacher)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Teacher ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               highlights:
 *                 type: object
 *               imageUrl:
 *                 type: string
 *               subjects:
 *                 type: array
 *                 items:
 *                   type: string
 *               subjectIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 description: Optional array of subject IDs to assign/update
 *               batchId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Teacher updated successfully
 *       404:
 *         description: Teacher not found
 */
router.put(
  "/:id",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  validateParams(teacherIdParamSchema),
  validate(updateTeacherSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Organization ID not found",
      });
    }

    const teacher = await updateTeacher(id, organizationId, req.body);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: teacher,
      message: "Teacher updated successfully",
    });
  })
);

/**
 * @openapi
 * /admin/teachers/{id}:
 *   delete:
 *     tags:
 *       - Teachers (Admin)
 *     summary: Delete teacher by ID (ADMIN & Teacher)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Teacher ID
 *     responses:
 *       200:
 *         description: Teacher deleted successfully
 *       404:
 *         description: Teacher not found
 */
router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  validateParams(teacherIdParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Organization ID not found",
      });
    }

    await deleteTeacher(id, organizationId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Teacher deleted successfully",
    });
  })
);

/**
 * @openapi
 * /admin/teachers/{teacherId}/batches/{batchId}:
 *   post:
 *     tags:
 *       - Teachers (Admin)
 *     summary: Assign teacher to a batch (ADMIN & Teacher)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teacherId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: batchId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       201:
 *         description: Teacher assigned to batch successfully
 *       409:
 *         description: Teacher already assigned to this batch
 */
router.post(
  "/:teacherId/batches/:batchId",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  validateParams(teacherBatchParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { teacherId, batchId } = req.params;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Organization ID not found",
      });
    }

    const assignment = await assignTeacherToBatch({
      teacherId,
      batchId,
      organizationId,
    });

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: assignment,
      message: "Teacher assigned to batch successfully",
    });
  })
);

/**
 * @openapi
 * /admin/teachers/{teacherId}/batches/{batchId}:
 *   delete:
 *     tags:
 *       - Teachers (Admin)
 *     summary: Remove teacher from a batch (ADMIN & Teacher)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teacherId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: batchId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Teacher removed from batch successfully
 *       404:
 *         description: Teacher not assigned to this batch
 */
router.delete(
  "/:teacherId/batches/:batchId",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  validateParams(teacherBatchParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { teacherId, batchId } = req.params;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Organization ID not found",
      });
    }

    await removeTeacherFromBatch(teacherId, batchId, organizationId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Teacher removed from batch successfully",
    });
  })
);

export default router;
