import { Request, Response, NextFunction } from "express";
import { z, ZodError, ZodIssue } from "zod";
import { HTTP_STATUS } from "../common/constants";

/**
 * Middleware to validate request body, query, or params against a Zod schema
 */
export const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((err: ZodIssue) => ({
          field: err.path.join("."),
          message: err.message,
        }));

        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "Validation failed",
          errors,
        });
      }
      next(error);
    }
  };
};

/**
 * Middleware to validate request query parameters
 */
export const validateQuery = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((err: ZodIssue) => ({
          field: err.path.join("."),
          message: err.message,
        }));

        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "Query validation failed",
          errors,
        });
      }
      next(error);
    }
  };
};

/**
 * Middleware to validate request params
 */
export const validateParams = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((err: ZodIssue) => ({
          field: err.path.join("."),
          message: err.message,
        }));

        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "Params validation failed",
          errors,
        });
      }
      next(error);
    }
  };
};
