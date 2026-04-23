import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { db } from "../db";
import { user } from "../db/schema";
import { eq } from "drizzle-orm";
import { ApiError } from "../common/response";
import { HTTP_STATUS, ERROR_MESSAGES } from "../common/constants";
import type { UserRole } from "@academyx/shared";

const JWT_SECRET = process.env.JWT_SECRET || "queztlearn_secret";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string | null;
        role: UserRole;
        organizationId: string;
      };
    }
  }
}

/**
 * Middleware to verify JWT token and attach user to request
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new ApiError(
        ERROR_MESSAGES.AUTHENTICATION_REQUIRED,
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as {
        userId: string;
        email: string;
        type: string;
      };
    } catch (error) {
      throw new ApiError(
        ERROR_MESSAGES.INVALID_TOKEN,
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    // Check if it's a session token
    if (decoded.type !== "session") {
      throw new ApiError(
        "Invalid token type. Please use a session token.",
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    // Fetch user from database
    const [userData] = await db
      .select()
      .from(user)
      .where(eq(user.id, decoded.userId))
      .limit(1);

    if (!userData) {
      throw new ApiError(ERROR_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    // Check if user is verified
    if (!userData.isVerified) {
      throw new ApiError(
        ERROR_MESSAGES.EMAIL_NOT_VERIFIED,
        HTTP_STATUS.FORBIDDEN
      );
    }

    // Attach user to request
    req.user = {
      id: userData.id,
      email: userData.email,
      role: userData.role as UserRole,
      organizationId: userData.organizationId,
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if user has required role
 */
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new ApiError(
          ERROR_MESSAGES.AUTHENTICATION_REQUIRED,
          HTTP_STATUS.UNAUTHORIZED
        );
      }

      if (!allowedRoles.includes(req.user.role)) {
        throw new ApiError(
          "You do not have permission to access this resource",
          HTTP_STATUS.FORBIDDEN
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check if user belongs to the specified organization
 */
export const checkOrganization = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new ApiError(
        ERROR_MESSAGES.AUTHENTICATION_REQUIRED,
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    const organizationId = req.params.organizationId || req.body.organizationId;

    if (!organizationId) {
      throw new ApiError(
        "Organization ID is required",
        HTTP_STATUS.BAD_REQUEST
      );
    }

    if (req.user.organizationId !== organizationId) {
      throw new ApiError(
        "You do not have access to this organization",
        HTTP_STATUS.FORBIDDEN
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication - adds user to request if token is present, but doesn't fail if not
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // No token provided, continue without user
      return next();
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        userId: string;
        email: string;
        type: string;
      };

      if (decoded.type === "session") {
        const [userData] = await db
          .select()
          .from(user)
          .where(eq(user.id, decoded.userId))
          .limit(1);

        if (userData && userData.isVerified) {
          req.user = {
            id: userData.id,
            email: userData.email,
            role: userData.role as UserRole,
            organizationId: userData.organizationId,
          };
        }
      }
    } catch (error) {
      // Invalid token, but we don't throw error for optional auth
      // Just continue without user
    }

    next();
  } catch (error) {
    next(error);
  }
};
