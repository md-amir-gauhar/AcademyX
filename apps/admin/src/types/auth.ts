export type UserRole = "ADMIN" | "TEACHER" | "GUEST" | "STUDENT";

export interface AdminUser {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  organizationId: string;
  profileImage?: string | null;
  createdAt: string;
}

export interface LoginPayload {
  email: string;
  password: string;
  organizationId?: string;
  orgSlug?: string;
}

export interface RegisterPayload {
  organizationId: string;
  email: string;
  username: string;
}

export interface AuthResponse {
  token: string;
  user: AdminUser;
}
