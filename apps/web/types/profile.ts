import type { AuthUser, Gender } from "./auth";

export interface Address {
  id?: string;
  userId?: string;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserProfile extends AuthUser {
  createdAt?: string;
  updatedAt?: string;
  address?: Address | null;
}

export interface UpdateProfilePayload {
  username?: string;
  profileImg?: string | null;
  gender?: Gender | null;
  phoneNumber?: string | null;
  address?: {
    city?: string | null;
    state?: string | null;
    pincode?: string | null;
  };
}
