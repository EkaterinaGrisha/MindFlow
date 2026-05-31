import type { RequestHandler } from "express";
import { config } from "../config";
import { requireAuth } from "./requireAuth";

// fail-closed: пустой ADMIN_USER_IDS = всем 403. Иначе один забытый env-var
// открывает /admin/feedback.csv (PII) любому залогиненному. Для локалки
// нужно явно положить свой UUID в .env.
export const requireAdmin: RequestHandler = (req, res, next) => {
  requireAuth(req, res, (err) => {
    if (err) return next(err);

    const adminIds = config.auth.adminUserIds;
    const userId = req.user?.id;

    if (adminIds.length === 0) {
      console.error("[requireAdmin] ADMIN_USER_IDS is empty — denying access");
      res.status(403).json({ error: "Admin access not configured" });
      return;
    }

    if (!userId || !adminIds.includes(userId)) {
      res.status(403).json({ error: "Admin access required" });
      return;
    }

    next();
  });
};
