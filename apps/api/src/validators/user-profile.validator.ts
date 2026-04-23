import { z } from "zod";

export const updateUserProfileSchema = z.object({
  username: z.string().min(1, "Username is required").max(255).optional(),
  profileImg: z.string().url("Invalid profile image URL").optional().nullable(),
  gender: z
    .enum(["Male", "Female", "Other", "Prefer not to say"])
    .optional()
    .nullable(),
  phoneNumber: z.string().max(20).optional().nullable(),
  address: z
    .object({
      city: z.string().max(255).optional().nullable(),
      state: z.string().max(255).optional().nullable(),
      pincode: z.string().max(10).optional().nullable(),
    })
    .optional(),
});
