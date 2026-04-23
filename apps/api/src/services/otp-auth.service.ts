import { db } from "../db";
import { user } from "../db/schema";
import { eq, and } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { ApiError } from "../common/response";
import { HTTP_STATUS } from "../common/constants";
import { generateAndSendOTP, verifyOTP } from "./otp.service";

const JWT_SECRET = process.env.JWT_SECRET || "queztlearn_secret";
const ACCESS_TOKEN_EXPIRY = "7d"; // 7 days
const REFRESH_TOKEN_EXPIRY = "30d"; // 30 days

interface GetOTPParams {
  countryCode: string;
  phoneNumber: string;
  organizationId: string;
}

interface VerifyOTPParams {
  countryCode: string;
  phoneNumber: string;
  otp: string;
  organizationId: string;
}

/**
 * Generate and send OTP to user's phone number
 */
export async function getOTP({
  countryCode,
  phoneNumber,
  organizationId,
}: GetOTPParams) {
  // Check if user exists with this phone number in the organization
  const existingUser = await db
    .select()
    .from(user)
    .where(
      and(
        eq(user.phoneNumber, phoneNumber),
        eq(user.organizationId, organizationId)
      )
    )
    .limit(1);

  const isExistingUser = existingUser.length > 0;

  // Generate and send OTP
  await generateAndSendOTP(countryCode, phoneNumber, isExistingUser);

  return {
    isExistingUser,
    message: isExistingUser
      ? "OTP sent successfully to your registered mobile number"
      : "OTP sent successfully. You will be registered as a new user",
  };
}

/**
 * Verify OTP and create/login user
 */
export async function verifyOTPAndLogin({
  countryCode,
  phoneNumber,
  otp,
  organizationId,
}: VerifyOTPParams) {
  // Verify OTP
  await verifyOTP(countryCode, phoneNumber, otp);

  // Check if user exists
  let existingUser = await db
    .select()
    .from(user)
    .where(
      and(
        eq(user.phoneNumber, phoneNumber),
        eq(user.organizationId, organizationId)
      )
    )
    .limit(1);

  let userData;

  if (existingUser.length === 0) {
    try {
      const [newUser] = await db
        .insert(user)
        .values({
          organizationId,
          countryCode,
          phoneNumber,
          role: "STUDENT",
          isVerified: true, // Auto-verify since OTP is verified
        })
        .returning();

      userData = newUser;
    } catch (err: any) {
      // 23505 = unique_violation. With the new (organization_id, phone_number)
      // composite unique this should be unreachable, but keep a friendly error
      // as a defence-in-depth so we never bubble a raw 500 to the client.
      if (err?.code === "23505" || err?.cause?.code === "23505") {
        throw new ApiError(
          "This phone number is already registered with another organization",
          HTTP_STATUS.CONFLICT
        );
      }
      throw err;
    }
  } else {
    userData = existingUser[0];

    // Update user verification status if not verified
    if (!userData.isVerified) {
      const [updatedUser] = await db
        .update(user)
        .set({ isVerified: true })
        .where(eq(user.id, userData.id))
        .returning();

      userData = updatedUser;
    }
  }

  // Generate access token
  const accessToken = jwt.sign(
    {
      userId: userData.id,
      phoneNumber: userData.phoneNumber,
      organizationId: userData.organizationId,
      type: "session",
    },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );

  // Generate refresh token
  const refreshToken = jwt.sign(
    {
      userId: userData.id,
      type: "refresh",
    },
    JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );

  return {
    accessToken,
    refreshToken,
    user: {
      id: userData.id,
      phoneNumber: userData.phoneNumber,
      countryCode: userData.countryCode,
      username: userData.username,
      role: userData.role,
      organizationId: userData.organizationId,
      isVerified: userData.isVerified,
      profileImg: userData.profileImg,
      gender: userData.gender,
    },
  };
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string) {
  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET) as {
      userId: string;
      type: string;
    };

    if (decoded.type !== "refresh") {
      throw new ApiError("Invalid token type", HTTP_STATUS.UNAUTHORIZED);
    }

    // Get user details
    const [userData] = await db
      .select()
      .from(user)
      .where(eq(user.id, decoded.userId))
      .limit(1);

    if (!userData) {
      throw new ApiError("User not found", HTTP_STATUS.NOT_FOUND);
    }

    // Generate new access token
    const accessToken = jwt.sign(
      {
        userId: userData.id,
        phoneNumber: userData.phoneNumber,
        organizationId: userData.organizationId,
        type: "session",
      },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    return {
      accessToken,
      user: {
        id: userData.id,
        phoneNumber: userData.phoneNumber,
        countryCode: userData.countryCode,
        username: userData.username,
        role: userData.role,
        organizationId: userData.organizationId,
      },
    };
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      throw new ApiError("Refresh token expired", HTTP_STATUS.UNAUTHORIZED);
    }
    throw new ApiError("Invalid refresh token", HTTP_STATUS.UNAUTHORIZED);
  }
}
