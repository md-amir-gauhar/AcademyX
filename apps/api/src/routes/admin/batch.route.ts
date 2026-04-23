import { Router, Request, Response } from "express";
import bodyParser from "body-parser";
import {
  createBatch,
  updateBatch,
  getBatch,
  getAllBatches,
  deleteBatch,
  getBatchStats,
} from "../../services/admin/batch.service";
import { asyncHandler } from "../../middlewares/async-handler";
import { authenticate, authorize } from "../../middlewares/auth.middleware";
import {
  validate,
  validateQuery,
  validateParams,
} from "../../middlewares/validate.middleware";
import {
  createBatchSchema,
  updateBatchSchema,
  paginationSchema,
  identifierParamSchema,
  uuidParamSchema,
} from "../../validators/batch.validator";
import { HTTP_STATUS } from "../../common/constants";

const router = Router();
router.use(bodyParser.json());

/**
 * @openapi
 * /admin/batches:
 *   get:
 *     tags:
 *       - Batches (Admin)
 *     summary: Get all batches (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of all batches with pagination and enrollment counts
 */
router.get(
  "/",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  validateQuery(paginationSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const organizationId = req.user?.organizationId!;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const result = await getAllBatches(organizationId, page, limit);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      ...result,
      message: "Batches retrieved successfully",
    });
  })
);

/**
 * @openapi
 * /admin/batches/{identifier}:
 *   get:
 *     tags:
 *       - Batches (Admin)
 *     summary: Get batch by ID or slug (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: identifier
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Batch details
 */
router.get(
  "/:identifier",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  validateParams(identifierParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { identifier } = req.params;
    const organizationId = req.user?.organizationId!;

    const batchData = await getBatch(identifier, organizationId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: batchData,
      message: "Batch retrieved successfully",
    });
  })
);

/**
 * @openapi
 * /admin/batches:
 *   post:
 *     tags:
 *       - Batches (Admin)
 *     summary: Create a new batch
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
 *               - class
 *               - exam
 *               - startDate
 *               - endDate
 *               - language
 *               - totalPrice
 *     responses:
 *       201:
 *         description: Batch created successfully
 */
router.post(
  "/",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  validate(createBatchSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const organizationId = req.user?.organizationId!;

    const batchData = await createBatch({
      ...req.body,
      organizationId,
    });

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: batchData,
      message: "Batch created successfully",
    });
  })
);

/**
 * @openapi
 * /admin/batches/{id}:
 *   put:
 *     tags:
 *       - Batches (Admin)
 *     summary: Update a batch
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Batch updated successfully
 */
router.put(
  "/:id",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  validateParams(uuidParamSchema),
  validate(updateBatchSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId!;

    const batchData = await updateBatch(id, organizationId, req.body);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: batchData,
      message: "Batch updated successfully",
    });
  })
);

/**
 * @openapi
 * /admin/batches/{id}:
 *   delete:
 *     tags:
 *       - Batches (Admin)
 *     summary: Delete a batch
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Batch deleted successfully
 */
router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  validateParams(uuidParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId!;

    await deleteBatch(id, organizationId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Batch deleted successfully",
    });
  })
);

/**
 * @openapi
 * /admin/batches/{id}/stats:
 *   get:
 *     tags:
 *       - Batches (Admin)
 *     summary: Get batch statistics
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Batch statistics
 */
router.get(
  "/:id/stats",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  validateParams(uuidParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId!;

    const stats = await getBatchStats(id, organizationId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: stats,
      message: "Batch statistics retrieved successfully",
    });
  })
);

export default router;
