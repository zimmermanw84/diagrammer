import type { Request, Response, NextFunction } from "express";

export interface AppError extends Error {
  status?: number;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const status = err.status ?? 500;
  const detail = process.env["NODE_ENV"] === "production" ? undefined : err.stack;

  res.status(status).json({
    error: err.message || "Internal Server Error",
    detail,
  });
}
