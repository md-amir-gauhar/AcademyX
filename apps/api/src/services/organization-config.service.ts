import { db } from "../db";
import { organizationConfig } from "../db/schema";
import { eq } from "drizzle-orm";
import { ApiError } from "../common/response";
import { HTTP_STATUS } from "../common/constants";
import { CacheManager } from "./cache.service";
import {
  encryptRazorpayKey,
  decryptRazorpayKey,
  isEncrypted,
} from "../utils/encryption";

// Sensitive fields that should never be exposed to clients
const SENSITIVE_FIELDS = [
  "razorpayKeySecret",
  "smtpConfig",
  "isActive",
  "disabledReason",
  "disabledAt",
  "reactivatedAt",
];

// Admin-only fields that should not be in client response
const ADMIN_ONLY_FIELDS = [
  ...SENSITIVE_FIELDS,
  "razorpayKeyId",
  "taxPercentage",
  "invoicePrefix",
];

interface CreateOrganizationConfigInput {
  organizationId: string;
  name?: string;
  slug?: string;
  domain?: string;
  contactEmail?: string;
  contactPhone?: string;
  razorpayKeyId?: string;
  razorpayKeySecret?: string;
  currency?: string;
  taxPercentage?: string;
  invoicePrefix?: string;
  logoUrl?: string;
  faviconUrl?: string;
  bannerUrls?: string[];
  motto?: string;
  description?: string;
  theme?: {
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
  };
  heroTitle?: string;
  heroSubtitle?: string;
  ctaText?: string;
  ctaUrl?: string;
  features?: { title: string; description: string; icon?: string }[];
  testimonials?: { name: string; message: string; avatar?: string }[];
  faq?: { question: string; answer: string }[];
  socialLinks?: Record<string, string>;
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
  smtpConfig?: {
    host: string;
    port: number;
    user: string;
    pass: string;
    from: string;
  };
  supportEmail?: string;
  featuresEnabled?: Record<string, boolean>;
  maintenanceMode?: boolean;
  customCSS?: string;
  customJS?: string;
}

type UpdateOrganizationConfigInput = Partial<CreateOrganizationConfigInput>;

/**
 * Remove sensitive fields from config object
 */
function sanitizeConfigForClient(config: any) {
  const sanitized = { ...config };
  ADMIN_ONLY_FIELDS.forEach((field) => {
    delete sanitized[field];
  });
  return sanitized;
}

/**
 * Create organization configuration
 */
export const createOrganizationConfig = async (
  input: CreateOrganizationConfigInput
) => {
  // Check if config already exists
  const existing = await db.query.organizationConfig.findFirst({
    where: eq(organizationConfig.organizationId, input.organizationId),
  });

  if (existing) {
    throw new ApiError(
      "Organization configuration already exists",
      HTTP_STATUS.CONFLICT
    );
  }

  // Encrypt Razorpay credentials before storing
  const dataToInsert = {
    ...input,
    razorpayKeyId: input.razorpayKeyId
      ? encryptRazorpayKey(input.razorpayKeyId)
      : undefined,
    razorpayKeySecret: input.razorpayKeySecret
      ? encryptRazorpayKey(input.razorpayKeySecret)
      : undefined,
    updatedAt: new Date(),
  };

  const [newConfig] = await db
    .insert(organizationConfig)
    .values(dataToInsert)
    .returning();

  // Invalidate cache
  await CacheManager.del(`org-config:${input.organizationId}`);
  await CacheManager.del(`org-config:slug:${input.slug}`);

  return newConfig;
};

/**
 * Get organization configuration by organization ID (Admin - full data)
 */
export const getOrganizationConfigByOrgId = async (organizationId: string) => {
  const config = await db.query.organizationConfig.findFirst({
    where: eq(organizationConfig.organizationId, organizationId),
  });

  if (!config) {
    throw new ApiError(
      "Organization configuration not found",
      HTTP_STATUS.NOT_FOUND
    );
  }

  return config;
};

/**
 * Get organization configuration by slug (Client - sanitized data)
 */
export const getOrganizationConfigBySlug = async (slug: string) => {
  const config = await db.query.organizationConfig.findFirst({
    where: eq(organizationConfig.slug, slug),
  });

  if (!config) {
    throw new ApiError(
      "Organization configuration not found",
      HTTP_STATUS.NOT_FOUND
    );
  }

  // Return sanitized config without sensitive data
  return sanitizeConfigForClient(config);
};

/**
 * Update organization configuration
 */
export const updateOrganizationConfig = async (
  organizationId: string,
  input: UpdateOrganizationConfigInput
) => {
  // Verify config exists
  const existing = await db.query.organizationConfig.findFirst({
    where: eq(organizationConfig.organizationId, organizationId),
  });

  if (!existing) {
    throw new ApiError(
      "Organization configuration not found",
      HTTP_STATUS.NOT_FOUND
    );
  }

  // Encrypt Razorpay credentials if being updated (only if not already encrypted)
  const dataToUpdate = {
    ...input,
    razorpayKeyId: input.razorpayKeyId
      ? isEncrypted(input.razorpayKeyId)
        ? input.razorpayKeyId
        : encryptRazorpayKey(input.razorpayKeyId)
      : undefined,
    razorpayKeySecret: input.razorpayKeySecret
      ? isEncrypted(input.razorpayKeySecret)
        ? input.razorpayKeySecret
        : encryptRazorpayKey(input.razorpayKeySecret)
      : undefined,
    updatedAt: new Date(),
  };

  // Update config
  const [updatedConfig] = await db
    .update(organizationConfig)
    .set(dataToUpdate)
    .where(eq(organizationConfig.organizationId, organizationId))
    .returning();

  // Invalidate cache
  await CacheManager.del(`org-config:${organizationId}`);
  await CacheManager.del(`org-config:slug:${existing.slug}`);
  if (input.slug && input.slug !== existing.slug) {
    await CacheManager.del(`org-config:slug:${input.slug}`);
  }

  return updatedConfig;
};

/**
 * Delete organization configuration
 */
export const deleteOrganizationConfig = async (organizationId: string) => {
  const existing = await db.query.organizationConfig.findFirst({
    where: eq(organizationConfig.organizationId, organizationId),
  });

  if (!existing) {
    throw new ApiError(
      "Organization configuration not found",
      HTTP_STATUS.NOT_FOUND
    );
  }

  await db
    .delete(organizationConfig)
    .where(eq(organizationConfig.organizationId, organizationId));

  // Invalidate cache
  await CacheManager.del(`org-config:${organizationId}`);
  await CacheManager.del(`org-config:slug:${existing.slug}`);

  return { message: "Organization configuration deleted successfully" };
};

/**
 * Toggle maintenance mode
 */
export const toggleMaintenanceMode = async (
  organizationId: string,
  enabled: boolean
) => {
  const [updatedConfig] = await db
    .update(organizationConfig)
    .set({
      maintenanceMode: enabled,
      updatedAt: new Date(),
    })
    .where(eq(organizationConfig.organizationId, organizationId))
    .returning();

  // Invalidate cache
  await CacheManager.del(`org-config:${organizationId}`);

  return updatedConfig;
};
