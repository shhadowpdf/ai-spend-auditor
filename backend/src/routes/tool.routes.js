import { Router } from "express";
import {
  captureAuditLead,
  getSupportedTools,
  getUserAudit,
  detectPricingChanges,
} from "../controller/tool.controller.js";
import { rateLimiter } from "../middleware/rateLimiter.js";

const router = Router();

const auditLimiter = rateLimiter({ limit: 10, windowMs: 10 * 60 * 1000 }); // 10 req / 10 min
const leadLimiter  = rateLimiter({ limit: 5,  windowMs: 20 * 60 * 1000 }); // 5 req / 20 min

router.get("/", getSupportedTools);
router.post("/audit", auditLimiter, getUserAudit);
router.post("/audit/lead", leadLimiter, captureAuditLead);
router.post("/detect-changes", detectPricingChanges);
router.get("/detect-changes", detectPricingChanges);

export default router;
