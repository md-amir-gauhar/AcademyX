import { db } from "../db";
import { user } from "../db/schema";
import { eq } from "drizzle-orm";
import { ApiError } from "../common/response";
import {
  HTTP_STATUS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
} from "../common/constants";

export async function getAllUsers(organizationId: string) {
  const users = await db
    .select({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    })
    .from(user)
    .where(eq(user.organizationId, organizationId));

  return users;
}

export async function deleteUser(userId: string) {
  const [existingUser] = await db
    .select()
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (!existingUser) {
    throw new ApiError(ERROR_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  await db.delete(user).where(eq(user.id, userId));

  return {
    message: SUCCESS_MESSAGES.USER_DELETED,
  };
}
