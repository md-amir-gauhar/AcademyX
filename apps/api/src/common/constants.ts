export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

export const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: "Invalid email or password",
  EMAIL_NOT_VERIFIED: "Please verify your email before logging in",
  PASSWORD_NOT_SET: "Please set your password first",
  EMAIL_ALREADY_VERIFIED: "Email already verified",
  INVALID_TOKEN: "Invalid or expired token",
  INVALID_TOKEN_TYPE: "Invalid token type",
  TOKEN_EXPIRED: "Token has expired",
  TOKEN_USED: "Token already used or does not exist",
  PASSWORD_TOO_SHORT: "Password must be at least 8 characters long",
  NAME_TOO_SHORT: "Name must be at least 3 characters long",
  USER_NOT_FOUND: "User not found",
  EMAIL_ALREADY_REGISTERED: "Email already registered",
  ORGANIZATION_NAME_DUPLICATE: "Organization name must be unique",
  ORGANIZATION_NOT_FOUND: "Organization not found",
  MULTIPLE_ACCOUNTS_FOR_EMAIL:
    "Multiple accounts found for this email. Please specify organizationId or orgSlug.",
  INTERNAL_SERVER_ERROR: "Internal server error",
  FAILED_TO_CREATE_ORGANIZATION: "Failed to create organization",
  FAILED_TO_SEND_EMAIL: "Failed to send email",
  AUTHENTICATION_REQUIRED:
    "Authentication required. Please provide a valid token.",
  REQUIRED_FIELDS: {
    ORGANIZATION_ID_EMAIL_USERNAME:
      "organizationId, email, and username are required",
    TOKEN: "Token is required",
    USER_ID_PASSWORD: "userId and password are required",
    EMAIL: "Email is required",
    EMAIL_PASSWORD: "Email and password are required",
    NAME: "Name is required",
  },
} as const;

export const SUCCESS_MESSAGES = {
  REGISTRATION_SUCCESS:
    "User registered successfully. Please verify your email.",
  VERIFICATION_EMAIL_SENT: "Verification email sent. Please check your inbox.",
  VERIFICATION_EMAIL_RESENT:
    "Verification email resent. Please check your inbox.",
  EMAIL_VERIFIED: "Email verified successfully",
  PASSWORD_SET: "Password set successfully. You can now login.",
  LOGIN_SUCCESS: "Login successful",
  ORGANIZATION_CREATED: "Organization created successfully",
  USER_INVITED: "User invited successfully. Verification email sent.",
  USER_DELETED: "User deleted successfully",
} as const;

export const TOKEN_CONFIG = {
  VERIFICATION_EXPIRY_HOURS: 24,
  SESSION_EXPIRY_DAYS: 7,
} as const;

export const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 8,
  NAME_MIN_LENGTH: 3,
  EMAIL_MAX_LENGTH: 255,
  USERNAME_MAX_LENGTH: 255,
  NAME_MAX_LENGTH: 255,
} as const;
