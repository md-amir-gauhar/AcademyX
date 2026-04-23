export type UserRole = "STUDENT" | "TEACHER" | "ADMIN";

export type Gender = "Male" | "Female" | "Other" | "Prefer not to say";

export interface AuthUser {
  id: string;
  phoneNumber: string;
  countryCode: string;
  username: string | null;
  role: UserRole;
  organizationId: string;
  isVerified: boolean;
  profileImg: string | null;
  gender: Gender | null;
  email?: string | null;
}

export interface GetOtpRequest {
  countryCode: string;
  phoneNumber: string;
  organizationId: string;
}

export interface GetOtpResponse {
  isExistingUser: boolean;
}

export interface VerifyOtpRequest {
  countryCode: string;
  phoneNumber: string;
  otp: string;
  organizationId: string;
}

export interface VerifyOtpResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface RefreshTokenResponse {
  accessToken: string;
  user: Pick<
    AuthUser,
    "id" | "phoneNumber" | "countryCode" | "username" | "role" | "organizationId"
  >;
}
