import type { Request } from "express";

declare module "express-serve-static-core" {
  interface Request {
    requestId?: string;
    user?: {
      id: string;
    };
  }
}

export type AuthenticatedRequest = Request & {
  user: {
    id: string;
  };
};
