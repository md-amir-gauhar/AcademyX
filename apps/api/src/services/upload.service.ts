import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import multer from "multer";
import multerS3 from "multer-s3";
import { ApiError } from "../common/response";
import { HTTP_STATUS } from "../common/constants";

// Initialize S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || "queztlearn-uploads";
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const URL_EXPIRATION = 300; // 5 minutes

// Allowed file types
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];
const ALLOWED_PDF_TYPES = ["application/pdf"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

interface UploadUrlRequest {
  fileName: string;
  fileType: string;
  fileSize: number;
  organizationId: string;
  folder?: string;
}

export async function generateUploadUrl(params: UploadUrlRequest) {
  const {
    fileName,
    fileType,
    fileSize,
    organizationId,
    folder = "uploads",
  } = params;

  if (fileSize > MAX_FILE_SIZE) {
    throw new ApiError(
      `File size exceeds maximum limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      HTTP_STATUS.BAD_REQUEST
    );
  }

  const allowedTypes = [
    ...ALLOWED_IMAGE_TYPES,
    ...ALLOWED_PDF_TYPES,
    ...ALLOWED_VIDEO_TYPES,
  ];

  if (!allowedTypes.includes(fileType)) {
    throw new ApiError(
      "Invalid file type. Allowed: images (jpg, png, webp, gif), PDFs, and videos (mp4, webm, mov)",
      HTTP_STATUS.BAD_REQUEST
    );
  }

  const timestamp = Date.now();
  const currentDate = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");

  // Folder structure: orgId/videos/YYYY-MM-DD/timestamp-filename
  const key = `${organizationId}/${folder}/${currentDate}/${timestamp}-${sanitizedFileName}`;
  const sanitizedOriginalName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  const uploadTimestamp = timestamp.toString();

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: fileType,
    CacheControl: "public, max-age=31536000",
    Metadata: {
      originalname: sanitizedOriginalName,
      uploadedat: uploadTimestamp,
      organizationid: organizationId,
    },
  });

  try {
    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: URL_EXPIRATION,
    });

    const publicUrl = `https://${BUCKET_NAME}.s3.${
      process.env.AWS_REGION || "us-east-1"
    }.amazonaws.com/${key}`;

    const cdnUrl = process.env.AWS_CLOUDFRONT_DOMAIN
      ? `https://${process.env.AWS_CLOUDFRONT_DOMAIN}/${key}`
      : publicUrl;

    return {
      uploadUrl,
      publicUrl,
      cdnUrl,
      key,
      expiresIn: URL_EXPIRATION,
      bucket: BUCKET_NAME,
    };
  } catch (error) {
    console.error("Error generating upload URL:", error);
    throw new ApiError(
      "Failed to generate upload URL",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

export async function uploadFile(
  organizationId: string,
  file: Express.Multer.File
) {
  if (file.size > MAX_FILE_SIZE) {
    throw new ApiError(
      `File size exceeds maximum limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      HTTP_STATUS.BAD_REQUEST
    );
  }

  const allowedTypes = [
    ...ALLOWED_IMAGE_TYPES,
    ...ALLOWED_PDF_TYPES,
    ...ALLOWED_VIDEO_TYPES,
  ];

  if (!allowedTypes.includes(file.mimetype)) {
    throw new ApiError(
      "Invalid file type. Allowed: images (jpg, png, webp, gif), PDFs, and videos (mp4, webm, mov)",
      HTTP_STATUS.BAD_REQUEST
    );
  }
  const timestamp = Date.now();
  const currentDate = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
  const sanitizedFileName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");

  let folder = "uploads";

  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    folder = "images";
  } else if (ALLOWED_PDF_TYPES.includes(file.mimetype)) {
    folder = "pdfs";
  } else if (ALLOWED_VIDEO_TYPES.includes(file.mimetype)) {
    folder = "videos";
  }

  // Folder structure: orgId/videos/YYYY-MM-DD/timestamp-filename
  const key = `${organizationId}/${folder}/${currentDate}/${timestamp}-${sanitizedFileName}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    CacheControl: "public, max-age=31536000",
    Metadata: {
      originalname: sanitizedFileName,
      uploadedat: timestamp.toString(),
      organizationid: organizationId,
    },
  });

  try {
    await s3Client.send(command);

    const cdnUrl = `https://${process.env.AWS_CLOUDFRONT_DOMAIN}/${key}`;

    return {
      key,
      url: cdnUrl,
    };
  } catch (error) {
    console.error("Error uploading file to S3:", error);
    throw new ApiError(
      "Failed to upload file",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

export async function generateSignedDownloadUrl(
  key: string,
  expiresIn: number = 7 * 24 * 60 * 60
) {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  const signedUrl = await getSignedUrl(s3Client, command, {
    expiresIn,
  });

  return signedUrl;
}

// ============================================
// Multipart Upload Functions
// ============================================

interface InitiateMultipartUploadParams {
  fileName: string;
  fileType: string;
  fileSize: number;
  organizationId: string;
  folder?: string;
}

interface MultipartUploadPart {
  partNumber: number;
  ETag: string;
}

/**
 * Initiate a multipart upload session
 * @returns uploadId and key for subsequent operations
 */
export async function initiateMultipartUpload(
  params: InitiateMultipartUploadParams
) {
  const {
    fileName,
    fileType,
    fileSize,
    organizationId,
    folder = "videos",
  } = params;

  // Validate file type
  const allowedTypes = [
    ...ALLOWED_IMAGE_TYPES,
    ...ALLOWED_PDF_TYPES,
    ...ALLOWED_VIDEO_TYPES,
  ];

  if (!allowedTypes.includes(fileType)) {
    throw new ApiError(
      "Invalid file type. Allowed: images (jpg, png, webp, gif), PDFs, and videos (mp4, webm, mov)",
      HTTP_STATUS.BAD_REQUEST
    );
  }

  const timestamp = Date.now();
  const currentDate = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");

  // Folder structure: orgId/videos/YYYY-MM-DD/timestamp-filename
  const key = `${organizationId}/${folder}/${currentDate}/${timestamp}-${sanitizedFileName}`;

  const command = new CreateMultipartUploadCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: fileType,
    CacheControl: "public, max-age=31536000",
    Metadata: {
      originalname: sanitizedFileName,
      uploadedat: timestamp.toString(),
      organizationid: organizationId,
      filesize: fileSize.toString(),
    },
  });

  try {
    const response = await s3Client.send(command);

    if (!response.UploadId) {
      throw new ApiError(
        "Failed to initiate multipart upload",
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }

    return {
      uploadId: response.UploadId,
      key,
      bucket: BUCKET_NAME,
    };
  } catch (error) {
    console.error("Error initiating multipart upload:", error);
    throw new ApiError(
      "Failed to initiate multipart upload",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

/**
 * Generate presigned URLs for uploading individual parts
 * @param uploadId The upload ID from initiate
 * @param key The S3 object key
 * @param totalParts Total number of parts to upload
 * @returns Array of presigned URLs with part numbers
 */
export async function generatePartUploadUrls(
  uploadId: string,
  key: string,
  totalParts: number
) {
  if (totalParts < 1 || totalParts > 10000) {
    throw new ApiError(
      "Total parts must be between 1 and 10000",
      HTTP_STATUS.BAD_REQUEST
    );
  }

  try {
    const urls = await Promise.all(
      Array.from({ length: totalParts }, async (_, index) => {
        const partNumber = index + 1;
        const command = new UploadPartCommand({
          Bucket: BUCKET_NAME,
          Key: key,
          UploadId: uploadId,
          PartNumber: partNumber,
        });

        const uploadUrl = await getSignedUrl(s3Client, command, {
          expiresIn: URL_EXPIRATION,
        });

        return {
          partNumber,
          uploadUrl,
        };
      })
    );

    return {
      urls,
      expiresIn: URL_EXPIRATION,
    };
  } catch (error) {
    console.error("Error generating part upload URLs:", error);
    throw new ApiError(
      "Failed to generate part upload URLs",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

/**
 * Complete a multipart upload by combining all parts
 * @param uploadId The upload ID from initiate
 * @param key The S3 object key
 * @param parts Array of part numbers and their ETags
 * @returns Final file URLs
 */
export async function completeMultipartUpload(
  uploadId: string,
  key: string,
  parts: MultipartUploadPart[]
) {
  if (!parts || parts.length === 0) {
    throw new ApiError(
      "Parts array is required and must not be empty",
      HTTP_STATUS.BAD_REQUEST
    );
  }

  // Sort parts by part number to ensure correct order
  const sortedParts = parts
    .sort((a, b) => a.partNumber - b.partNumber)
    .map((part) => ({
      PartNumber: part.partNumber,
      ETag: part.ETag,
    }));

  const command = new CompleteMultipartUploadCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    UploadId: uploadId,
    MultipartUpload: {
      Parts: sortedParts,
    },
  });

  try {
    await s3Client.send(command);

    const publicUrl = `https://${BUCKET_NAME}.s3.${
      process.env.AWS_REGION || "us-east-1"
    }.amazonaws.com/${key}`;

    const cdnUrl = process.env.AWS_CLOUDFRONT_DOMAIN
      ? `https://${process.env.AWS_CLOUDFRONT_DOMAIN}/${key}`
      : publicUrl;

    return {
      key,
      publicUrl,
      cdnUrl,
      bucket: BUCKET_NAME,
    };
  } catch (error) {
    console.error("Error completing multipart upload:", error);
    throw new ApiError(
      "Failed to complete multipart upload",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

/**
 * Abort a multipart upload and clean up partial data
 * @param uploadId The upload ID from initiate
 * @param key The S3 object key
 */
export async function abortMultipartUpload(uploadId: string, key: string) {
  const command = new AbortMultipartUploadCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    UploadId: uploadId,
  });

  try {
    await s3Client.send(command);
    return {
      message: "Multipart upload aborted successfully",
    };
  } catch (error) {
    console.error("Error aborting multipart upload:", error);
    throw new ApiError(
      "Failed to abort multipart upload",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}
