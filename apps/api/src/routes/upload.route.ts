import { Router, Request, Response } from "express";
import bodyParser from "body-parser";
import {
  generateUploadUrl,
  uploadFile,
  initiateMultipartUpload,
  generatePartUploadUrls,
  completeMultipartUpload,
  abortMultipartUpload,
} from "../services/upload.service";
import { asyncHandler } from "../middlewares/async-handler";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { HTTP_STATUS } from "../common/constants";
import multer from "multer";

const router = Router();
router.use(bodyParser.json());

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
});

/**
 * @openapi
 * /admin/upload/signed-url:
 *   post:
 *     tags:
 *       - Upload
 *     summary: Generate S3 presigned URL for file upload (ADMIN/TEACHER)
 *     description: Generates a presigned URL for uploading files directly to S3. Supports images, PDFs, and videos up to 100MB.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fileName
 *               - fileType
 *               - fileSize
 *             properties:
 *               fileName:
 *                 type: string
 *                 description: Original file name
 *                 example: lecture-notes.pdf
 *               fileType:
 *                 type: string
 *                 description: MIME type of the file
 *                 example: application/pdf
 *                 enum:
 *                   - image/jpeg
 *                   - image/jpg
 *                   - image/png
 *                   - image/webp
 *                   - image/gif
 *                   - application/pdf
 *                   - video/mp4
 *                   - video/webm
 *                   - video/quicktime
 *               fileSize:
 *                 type: integer
 *                 description: File size in bytes (max 100MB)
 *                 example: 1048576
 *               folder:
 *                 type: string
 *                 description: S3 folder path (optional)
 *                 example: course-materials
 *                 default: uploads
 *     responses:
 *       200:
 *         description: Presigned URL generated successfully
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
 *                     uploadUrl:
 *                       type: string
 *                       description: Presigned URL for uploading (expires in 5 minutes)
 *                     publicUrl:
 *                       type: string
 *                       description: Public S3 URL after upload
 *                     cdnUrl:
 *                       type: string
 *                       description: CloudFront CDN URL (if configured)
 *                     key:
 *                       type: string
 *                       description: S3 object key
 *                     expiresIn:
 *                       type: integer
 *                       description: URL expiration in seconds
 *                       example: 300
 *                     bucket:
 *                       type: string
 *                       description: S3 bucket name
 *                 message:
 *                   type: string
 *                   example: Upload URL generated successfully
 *       400:
 *         description: Invalid request (file too large or invalid type)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Only ADMIN/TEACHER can upload
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  "/signed-url",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  asyncHandler(async (req: Request, res: Response) => {
    const { fileName, fileType, fileSize, folder } = req.body;
    const organizationId = req.user?.organizationId;

    if (!fileName || !fileType || !fileSize) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "fileName, fileType, and fileSize are required",
      });
    }

    if (!organizationId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Organization ID not found",
      });
    }

    const result = await generateUploadUrl({
      fileName,
      fileType,
      fileSize,
      organizationId,
      folder,
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result,
      message: "Upload URL generated successfully",
    });
  })
);

/**
 * @openapi
 * /admin/upload/batch-signed-urls:
 *   post:
 *     tags:
 *       - Upload
 *     summary: Generate multiple S3 presigned URLs for batch file upload (ADMIN/TEACHER)
 *     description: Generates multiple presigned URLs for uploading multiple files directly to S3. Supports images, PDFs, and videos up to 100MB each.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - files
 *             properties:
 *               files:
 *                 type: array
 *                 description: Array of file metadata for which to generate signed URLs
 *                 items:
 *                   type: object
 *                   required:
 *                     - fileName
 *                     - fileType
 *                     - fileSize
 *                   properties:
 *                     fileName:
 *                       type: string
 *                       description: Original file name
 *                       example: lecture-video-01.mp4
 *                     fileType:
 *                       type: string
 *                       description: MIME type of the file
 *                       example: video/mp4
 *                     fileSize:
 *                       type: integer
 *                       description: File size in bytes (max 100MB)
 *                       example: 10485760
 *                     folder:
 *                       type: string
 *                       description: S3 folder path (optional)
 *                       example: course-videos
 *     responses:
 *       200:
 *         description: Batch presigned URLs generated successfully
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
 *                       uploadUrl:
 *                         type: string
 *                         description: Presigned URL for uploading (expires in 5 minutes)
 *                       publicUrl:
 *                         type: string
 *                         description: Public S3 URL after upload
 *                       cdnUrl:
 *                         type: string
 *                         description: CloudFront CDN URL (if configured)
 *                       key:
 *                         type: string
 *                         description: S3 object key
 *                       fileName:
 *                         type: string
 *                         description: Original file name
 *                       expiresIn:
 *                         type: integer
 *                         description: URL expiration in seconds
 *                         example: 300
 *                 message:
 *                   type: string
 *                   example: Batch upload URLs generated successfully
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  "/batch-signed-urls",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  asyncHandler(async (req: Request, res: Response) => {
    const { files } = req.body;
    const organizationId = req.user?.organizationId;

    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "files array is required and must not be empty",
      });
    }

    if (!organizationId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Organization ID not found",
      });
    }

    const results = await Promise.all(
      files.map(async (fileData) => {
        const { fileName, fileType, fileSize, folder } = fileData;

        if (!fileName || !fileType || !fileSize) {
          throw new Error(
            `Invalid file data: fileName, fileType, and fileSize are required for each file`
          );
        }

        const result = await generateUploadUrl({
          fileName,
          fileType,
          fileSize,
          organizationId,
          folder,
        });

        return {
          ...result,
          fileName,
        };
      })
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: results,
      message: "Batch upload URLs generated successfully",
    });
  })
);

/**
 * @openapi
 * /admin/upload/direct:
 *   post:
 *     tags:
 *       - Upload
 *     summary: Direct file upload to S3 using Multer (ADMIN/TEACHER)
 *     description: Upload a single file directly through the server to S3. Files are automatically organized by organization ID.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: File to upload (max 100MB)
 *     responses:
 *       200:
 *         description: File uploaded successfully
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
 *                     key:
 *                       type: string
 *                       description: S3 object key
 *                       example: org-123/images/1234567890-photo.jpg
 *                     location:
 *                       type: string
 *                       description: S3 file URL
 *                     cdnUrl:
 *                       type: string
 *                       description: CloudFront CDN URL
 *                     bucket:
 *                       type: string
 *                       description: S3 bucket name
 *                     originalName:
 *                       type: string
 *                       description: Original file name
 *                     size:
 *                       type: integer
 *                       description: File size in bytes
 *                     mimeType:
 *                       type: string
 *                       description: File MIME type
 *                 message:
 *                   type: string
 *                   example: File uploaded successfully
 *       400:
 *         description: Invalid file or missing file
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  "/",
  authenticate,
  authorize("ADMIN", "TEACHER", "STUDENT"),
  upload.single("file"),
  asyncHandler(async (req: Request, res: Response) => {
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Organization ID not found",
      });
    }

    const file = req.file;

    if (!file) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const result = await uploadFile(organizationId, file);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result,
      message: "File uploaded successfully",
    });
  })
);

// ============================================
// Multipart Upload Routes
// ============================================

/**
 * @openapi
 * /admin/upload/multipart/initiate:
 *   post:
 *     tags:
 *       - Upload
 *     summary: Initiate multipart upload for large files (ADMIN/TEACHER)
 *     description: Starts a multipart upload session for large files. Returns uploadId and key needed for subsequent operations.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fileName
 *               - fileType
 *               - fileSize
 *             properties:
 *               fileName:
 *                 type: string
 *                 description: Original file name
 *                 example: lecture-video.mp4
 *               fileType:
 *                 type: string
 *                 description: MIME type of the file
 *                 example: video/mp4
 *               fileSize:
 *                 type: integer
 *                 description: Total file size in bytes
 *                 example: 524288000
 *               folder:
 *                 type: string
 *                 description: S3 folder path (optional)
 *                 example: course-videos
 *     responses:
 *       200:
 *         description: Multipart upload initiated successfully
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
 *                     uploadId:
 *                       type: string
 *                       description: Unique upload session identifier
 *                     key:
 *                       type: string
 *                       description: S3 object key
 *                     bucket:
 *                       type: string
 *                       description: S3 bucket name
 *                 message:
 *                   type: string
 *                   example: Multipart upload initiated successfully
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  "/multipart/initiate",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  asyncHandler(async (req: Request, res: Response) => {
    const { fileName, fileType, fileSize, folder } = req.body;
    const organizationId = req.user?.organizationId;

    if (!fileName || !fileType || !fileSize) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "fileName, fileType, and fileSize are required",
      });
    }

    if (!organizationId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Organization ID not found",
      });
    }

    const result = await initiateMultipartUpload({
      fileName,
      fileType,
      fileSize,
      organizationId,
      folder,
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result,
      message: "Multipart upload initiated successfully",
    });
  })
);

/**
 * @openapi
 * /admin/upload/multipart/signed-urls:
 *   post:
 *     tags:
 *       - Upload
 *     summary: Get presigned URLs for multipart upload parts (ADMIN/TEACHER)
 *     description: Generates presigned URLs for uploading individual parts/chunks of a multipart upload.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - uploadId
 *               - key
 *               - totalParts
 *             properties:
 *               uploadId:
 *                 type: string
 *                 description: Upload ID from initiate endpoint
 *                 example: abc123xyz
 *               key:
 *                 type: string
 *                 description: S3 object key from initiate endpoint
 *                 example: org-123/videos/1234567890-lecture.mp4
 *               totalParts:
 *                 type: integer
 *                 description: Total number of parts (max 10000)
 *                 example: 100
 *                 minimum: 1
 *                 maximum: 10000
 *     responses:
 *       200:
 *         description: Presigned URLs generated successfully
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
 *                     urls:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           partNumber:
 *                             type: integer
 *                             description: Part number (1-based)
 *                           uploadUrl:
 *                             type: string
 *                             description: Presigned URL for this part
 *                     expiresIn:
 *                       type: integer
 *                       description: URL expiration in seconds
 *                       example: 300
 *                 message:
 *                   type: string
 *                   example: Part upload URLs generated successfully
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  "/multipart/signed-urls",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  asyncHandler(async (req: Request, res: Response) => {
    const { uploadId, key, totalParts } = req.body;

    if (!uploadId || !key || !totalParts) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "uploadId, key, and totalParts are required",
      });
    }

    const result = await generatePartUploadUrls(uploadId, key, totalParts);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result,
      message: "Part upload URLs generated successfully",
    });
  })
);

/**
 * @openapi
 * /admin/upload/multipart/complete:
 *   post:
 *     tags:
 *       - Upload
 *     summary: Complete multipart upload (ADMIN/TEACHER)
 *     description: Finalizes a multipart upload by combining all uploaded parts into the final file.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - uploadId
 *               - key
 *               - parts
 *             properties:
 *               uploadId:
 *                 type: string
 *                 description: Upload ID from initiate endpoint
 *                 example: abc123xyz
 *               key:
 *                 type: string
 *                 description: S3 object key from initiate endpoint
 *                 example: org-123/videos/1234567890-lecture.mp4
 *               parts:
 *                 type: array
 *                 description: Array of uploaded parts with their ETags
 *                 items:
 *                   type: object
 *                   required:
 *                     - partNumber
 *                     - ETag
 *                   properties:
 *                     partNumber:
 *                       type: integer
 *                       description: Part number (1-based)
 *                       example: 1
 *                     ETag:
 *                       type: string
 *                       description: ETag from S3 upload response
 *                       example: "\"abc123def456\""
 *     responses:
 *       200:
 *         description: Multipart upload completed successfully
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
 *                     key:
 *                       type: string
 *                       description: S3 object key
 *                     publicUrl:
 *                       type: string
 *                       description: Public S3 URL
 *                     cdnUrl:
 *                       type: string
 *                       description: CloudFront CDN URL
 *                     bucket:
 *                       type: string
 *                       description: S3 bucket name
 *                 message:
 *                   type: string
 *                   example: Multipart upload completed successfully
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  "/multipart/complete",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  asyncHandler(async (req: Request, res: Response) => {
    const { uploadId, key, parts } = req.body;

    if (!uploadId || !key || !parts) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "uploadId, key, and parts are required",
      });
    }

    const result = await completeMultipartUpload(uploadId, key, parts);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result,
      message: "Multipart upload completed successfully",
    });
  })
);

/**
 * @openapi
 * /admin/upload/multipart/abort:
 *   post:
 *     tags:
 *       - Upload
 *     summary: Abort multipart upload (ADMIN/TEACHER)
 *     description: Cancels a multipart upload and cleans up any uploaded parts.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - uploadId
 *               - key
 *             properties:
 *               uploadId:
 *                 type: string
 *                 description: Upload ID from initiate endpoint
 *                 example: abc123xyz
 *               key:
 *                 type: string
 *                 description: S3 object key from initiate endpoint
 *                 example: org-123/videos/1234567890-lecture.mp4
 *     responses:
 *       200:
 *         description: Multipart upload aborted successfully
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
 *                       example: Multipart upload aborted successfully
 *                 message:
 *                   type: string
 *                   example: Upload aborted successfully
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  "/multipart/abort",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  asyncHandler(async (req: Request, res: Response) => {
    const { uploadId, key } = req.body;

    if (!uploadId || !key) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "uploadId and key are required",
      });
    }

    const result = await abortMultipartUpload(uploadId, key);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result,
      message: "Upload aborted successfully",
    });
  })
);

export default router;
