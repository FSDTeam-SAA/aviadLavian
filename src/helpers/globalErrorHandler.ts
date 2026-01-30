import type { Request, Response, NextFunction } from "express";

/**
 * Custom error interface (matches your CustomError structure)
 */
interface AppError extends Error {
  statusCode?: number;
  status?: string;
  isOperationalError?: boolean;
  data?: unknown;
}

/**
 * Development error response
 */
const developmentError = (error: AppError, res: Response): Response => {
  return res.status(error.statusCode || 500).json({
    message: error.message,
    status: error.status,
    statusCode: error.statusCode,
    isOperationalError: error.isOperationalError,
    data: error.data,
    stack: error.stack,
  });
};

/**
 * Production error response
 */
const productionError = (error: AppError, res: Response): Response => {
  if (error.isOperationalError) {
    return res.status(error.statusCode || 500).json({
      success: false,
      status: error.status,
      message: error.message,
    });
  }

  return res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
};

/**
 * Global error handler middleware
 */
export const globalErrorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): Response | void => {
  if (process.env.NODE_ENV === "development" || true) {
    return developmentError(error, res);
  } else {
    return productionError(error, res);
  }
};
