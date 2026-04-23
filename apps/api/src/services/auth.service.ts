import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { db } from "../db";
import { organization, user, verificationToken } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { ApiError } from "../common/response";
import { sendVerificationEmail, sendPasswordResetEmail } from "./email.service";
import {
  HTTP_STATUS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  TOKEN_CONFIG,
  VALIDATION_RULES,
} from "../common/constants";

const JWT_SECRET = process.env.JWT_SECRET || "queztlearn_secret";
const TOKEN_EXPIRY_HOURS = TOKEN_CONFIG.VERIFICATION_EXPIRY_HOURS;

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Resolve an org identifier (UUID or slug) to an organization id.
 * Returns null when no identifier was supplied. Throws 404 when an identifier
 * was supplied but did not match any organization.
 */
async function resolveOrganizationId(
  orgIdentifier?: string | null
): Promise<string | null> {
  if (!orgIdentifier) return null;
  const isUuid = UUID_REGEX.test(orgIdentifier);
  const [org] = await db
    .select({ id: organization.id })
    .from(organization)
    .where(
      isUuid
        ? eq(organization.id, orgIdentifier)
        : eq(organization.slug, orgIdentifier)
    )
    .limit(1);
  if (!org) {
    throw new ApiError(
      ERROR_MESSAGES.ORGANIZATION_NOT_FOUND,
      HTTP_STATUS.NOT_FOUND
    );
  }
  return org.id;
}

export async function registerUser(
  organizationId: string,
  email: string,
  username: string
) {
  // Email uniqueness is per-organization (matches the user_org_email_unique
  // composite index on the user table). The same email may exist under a
  // different tenant.
  const existingUser = await db
    .select()
    .from(user)
    .where(and(eq(user.email, email), eq(user.organizationId, organizationId)))
    .limit(1);

  if (existingUser.length > 0) {
    throw new ApiError(
      ERROR_MESSAGES.EMAIL_ALREADY_REGISTERED,
      HTTP_STATUS.CONFLICT
    );
  }

  const [newUser] = await db
    .insert(user)
    .values({
      organizationId,
      email,
      username,
      role: "ADMIN",
      isVerified: false,
    })
    .returning();

  const token = jwt.sign(
    { userId: newUser.id, email, type: "email_verification" },
    JWT_SECRET,
    { expiresIn: `${TOKEN_EXPIRY_HOURS}h` }
  );

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + TOKEN_EXPIRY_HOURS);

  await db.insert(verificationToken).values({
    userId: newUser.id,
    token,
    expiresAt,
  });

  await sendVerificationEmail(email, token, username);

  return {
    id: newUser.id,
    email: newUser.email,
    username: newUser.username,
    message: SUCCESS_MESSAGES.VERIFICATION_EMAIL_SENT,
  };
}

export async function verifyEmail(token: string) {
  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      type: string;
    };
  } catch (error) {
    throw new ApiError(ERROR_MESSAGES.INVALID_TOKEN, HTTP_STATUS.BAD_REQUEST);
  }

  if (decoded.type !== "email_verification") {
    throw new ApiError(
      ERROR_MESSAGES.INVALID_TOKEN_TYPE,
      HTTP_STATUS.BAD_REQUEST
    );
  }

  const [tokenRecord] = await db
    .select()
    .from(verificationToken)
    .where(
      and(
        eq(verificationToken.token, token),
        eq(verificationToken.isUsed, false)
      )
    )
    .limit(1);

  if (!tokenRecord) {
    throw new ApiError(ERROR_MESSAGES.TOKEN_USED, HTTP_STATUS.BAD_REQUEST);
  }

  if (new Date() > tokenRecord.expiresAt) {
    throw new ApiError(ERROR_MESSAGES.TOKEN_EXPIRED, HTTP_STATUS.BAD_REQUEST);
  }

  await db
    .update(user)
    .set({ isVerified: true })
    .where(eq(user.id, decoded.userId));

  await db
    .update(verificationToken)
    .set({ isUsed: true })
    .where(eq(verificationToken.id, tokenRecord.id));

  return {
    message: SUCCESS_MESSAGES.EMAIL_VERIFIED,
    userId: decoded.userId,
  };
}

export async function setPassword(userId: string, password: string) {
  if (!password || password.length < VALIDATION_RULES.PASSWORD_MIN_LENGTH) {
    throw new ApiError(
      ERROR_MESSAGES.PASSWORD_TOO_SHORT,
      HTTP_STATUS.BAD_REQUEST
    );
  }

  const [existingUser] = await db
    .select()
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (!existingUser) {
    throw new ApiError(ERROR_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  if (!existingUser.isVerified) {
    throw new ApiError(
      ERROR_MESSAGES.EMAIL_NOT_VERIFIED,
      HTTP_STATUS.FORBIDDEN
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await db
    .update(user)
    .set({
      password: hashedPassword,
      updatedAt: new Date(),
    })
    .where(eq(user.id, userId));

  return {
    message: SUCCESS_MESSAGES.PASSWORD_SET,
  };
}

export async function resendVerificationEmail(
  email: string,
  orgIdentifier?: string | null
) {
  const organizationId = await resolveOrganizationId(orgIdentifier);

  // When the caller supplies an org we scope strictly to it. Otherwise we do
  // a global lookup and refuse to act if more than one tenant has this email,
  // since picking one would be non-deterministic.
  const matches = await db
    .select()
    .from(user)
    .where(
      organizationId
        ? and(eq(user.email, email), eq(user.organizationId, organizationId))
        : eq(user.email, email)
    )
    .limit(2);

  if (matches.length === 0) {
    throw new ApiError(ERROR_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }
  if (matches.length > 1) {
    throw new ApiError(
      ERROR_MESSAGES.MULTIPLE_ACCOUNTS_FOR_EMAIL,
      HTTP_STATUS.CONFLICT
    );
  }
  const existingUser = matches[0];

  if (existingUser.isVerified) {
    throw new ApiError(
      ERROR_MESSAGES.EMAIL_ALREADY_VERIFIED,
      HTTP_STATUS.BAD_REQUEST
    );
  }

  const token = jwt.sign(
    { userId: existingUser.id, email, type: "email_verification" },
    JWT_SECRET,
    { expiresIn: `${TOKEN_EXPIRY_HOURS}h` }
  );

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + TOKEN_EXPIRY_HOURS);

  await db.insert(verificationToken).values({
    userId: existingUser.id,
    token,
    expiresAt,
  });

  await sendVerificationEmail(email, token, existingUser.username || "User");

  return {
    message: SUCCESS_MESSAGES.VERIFICATION_EMAIL_RESENT,
  };
}

export async function loginUser(
  email: string,
  password: string,
  orgIdentifier?: string | null
) {
  const organizationId = await resolveOrganizationId(orgIdentifier);

  // Email is unique per organization. If the caller didn't pass an org we
  // attempt a global lookup; if the email exists in more than one tenant we
  // demand the caller specify which one to log into.
  const matches = await db
    .select()
    .from(user)
    .where(
      organizationId
        ? and(eq(user.email, email), eq(user.organizationId, organizationId))
        : eq(user.email, email)
    )
    .limit(2);

  if (matches.length > 1) {
    throw new ApiError(
      ERROR_MESSAGES.MULTIPLE_ACCOUNTS_FOR_EMAIL,
      HTTP_STATUS.CONFLICT
    );
  }
  const existingUser = matches[0];

  if (!existingUser) {
    throw new ApiError(
      ERROR_MESSAGES.INVALID_CREDENTIALS,
      HTTP_STATUS.UNAUTHORIZED
    );
  }

  if (!existingUser.isVerified) {
    throw new ApiError(
      ERROR_MESSAGES.EMAIL_NOT_VERIFIED,
      HTTP_STATUS.FORBIDDEN
    );
  }

  if (!existingUser.password) {
    throw new ApiError(ERROR_MESSAGES.PASSWORD_NOT_SET, HTTP_STATUS.FORBIDDEN);
  }

  const isPasswordValid = await bcrypt.compare(password, existingUser.password);

  if (!isPasswordValid) {
    throw new ApiError(
      ERROR_MESSAGES.INVALID_CREDENTIALS,
      HTTP_STATUS.UNAUTHORIZED
    );
  }

  const sessionToken = jwt.sign(
    {
      userId: existingUser.id,
      email: existingUser.email,
      organizationId: existingUser.organizationId,
      type: "session",
    },
    JWT_SECRET,
    { expiresIn: `${TOKEN_CONFIG.SESSION_EXPIRY_DAYS}d` }
  );

  return {
    token: sessionToken,
    user: {
      id: existingUser.id,
      email: existingUser.email,
      username: existingUser.username,
      role: existingUser.role,
      organizationId: existingUser.organizationId,
    },
  };
}

export async function inviteUser(
  organizationId: string,
  email: string,
  username: string
) {
  // Per-org uniqueness only. The same email may legitimately exist as a
  // teacher/admin in another tenant.
  const existingUser = await db
    .select()
    .from(user)
    .where(and(eq(user.email, email), eq(user.organizationId, organizationId)))
    .limit(1);

  if (existingUser.length > 0) {
    throw new ApiError(
      ERROR_MESSAGES.EMAIL_ALREADY_REGISTERED,
      HTTP_STATUS.CONFLICT
    );
  }

  const [newUser] = await db
    .insert(user)
    .values({
      organizationId,
      email,
      username,
      role: "TEACHER",
      isVerified: false,
    })
    .returning();

  const token = jwt.sign(
    { userId: newUser.id, email, type: "email_verification" },
    JWT_SECRET,
    { expiresIn: `${TOKEN_EXPIRY_HOURS}h` }
  );

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + TOKEN_EXPIRY_HOURS);

  await db.insert(verificationToken).values({
    userId: newUser.id,
    token,
    expiresAt,
  });

  await sendVerificationEmail(email, token, username);

  return {
    id: newUser.id,
    email: newUser.email,
    username: newUser.username,
    role: newUser.role,
    organizationId: newUser.organizationId,
    message: SUCCESS_MESSAGES.USER_INVITED,
  };
}
