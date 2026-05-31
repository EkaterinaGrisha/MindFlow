import type { ErrorRequestHandler } from "express";

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  const details = error instanceof Error ? error : new Error(String(error));

  console.error({
    requestId: req.requestId,
    path: req.path,
    stack: details.stack,
  });

  const status = res.statusCode >= 400 ? res.statusCode : 500;
  res.status(status).json({
    error: details.message || "Internal Server Error",
    requestId: req.requestId,
    timestamp: new Date().toISOString(),
  });
};
