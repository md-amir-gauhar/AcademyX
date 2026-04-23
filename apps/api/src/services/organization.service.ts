import { organization } from "../db/schema";
import { db } from "../db";
import { ApiError } from "../common/response";
import {
  HTTP_STATUS,
  ERROR_MESSAGES,
  VALIDATION_RULES,
} from "../common/constants";

export async function createOrganization(name: string, slug: string) {
  if (
    !name ||
    typeof name !== "string" ||
    name.length < VALIDATION_RULES.NAME_MIN_LENGTH
  ) {
    throw new ApiError(ERROR_MESSAGES.NAME_TOO_SHORT, HTTP_STATUS.BAD_REQUEST);
  }

  if (
    !slug ||
    typeof slug !== "string" ||
    slug.length < VALIDATION_RULES.NAME_MIN_LENGTH
  ) {
    throw new ApiError(
      "Slug must be at least 3 characters long",
      HTTP_STATUS.BAD_REQUEST
    );
  }

  // Validate slug format (lowercase, alphanumeric, hyphens only)
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  if (!slugRegex.test(slug)) {
    throw new ApiError(
      "Slug must be lowercase, alphanumeric, and can contain hyphens",
      HTTP_STATUS.BAD_REQUEST
    );
  }

  try {
    const result = await db
      .insert(organization)
      .values({ name, slug })
      .returning();
    return result[0];
  } catch (err: any) {
    if (err.code === "23505") {
      throw new ApiError(
        "Organization name or slug already exists",
        HTTP_STATUS.CONFLICT
      );
    }
    throw new ApiError(
      ERROR_MESSAGES.FAILED_TO_CREATE_ORGANIZATION,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      err
    );
  }
}
