import { db } from "../../db";
import { user, address } from "../../db/schema";
import { eq } from "drizzle-orm";
import { ApiError } from "../../common/response";
import { HTTP_STATUS } from "../../common/constants";

export interface UpdateUserProfileParams {
  userId: string;
  username?: string;
  profileImg?: string;
  gender?: string;
  phoneNumber?: string;
  address?: {
    city?: string;
    state?: string;
    pincode?: string;
  };
}

/**
 * Get user profile (Client)
 */
export async function getUserProfile(userId: string) {
  const userProfile = await db.query.user.findFirst({
    where: eq(user.id, userId),
    columns: {
      password: false, // Exclude password
    },
    with: {
      address: true,
    },
  });

  if (!userProfile) {
    throw new ApiError("User not found", HTTP_STATUS.NOT_FOUND);
  }

  return userProfile;
}

/**
 * Update user profile (Client)
 */
export async function updateUserProfile(params: UpdateUserProfileParams) {
  const {
    userId,
    username,
    profileImg,
    gender,
    phoneNumber,
    address: addressData,
  } = params;

  // Update user fields
  const updateData: any = {};
  if (username !== undefined) updateData.username = username;
  if (profileImg !== undefined) updateData.profileImg = profileImg;
  if (gender !== undefined) updateData.gender = gender;
  if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
  updateData.updatedAt = new Date();

  if (Object.keys(updateData).length > 1) {
    // More than just updatedAt
    await db.update(user).set(updateData).where(eq(user.id, userId));
  }

  // Update or create address if provided
  if (addressData) {
    const existingAddress = await db.query.address.findFirst({
      where: eq(address.userId, userId),
    });

    const addressUpdateData = {
      ...addressData,
      updatedAt: new Date(),
    };

    if (existingAddress) {
      // Update existing address
      await db
        .update(address)
        .set(addressUpdateData)
        .where(eq(address.userId, userId));
    } else {
      // Create new address
      await db.insert(address).values({
        userId,
        ...addressData,
      });
    }
  }

  // Return updated profile
  return getUserProfile(userId);
}
