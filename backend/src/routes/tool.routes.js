import {Router} from 'express';
import {
  captureAuditLead,
  getSupportedTools,
  getUserAudit,
} from "../controller/tool.controller.js";
const router = Router();

router.get("/", getSupportedTools);
router.post("/audit", getUserAudit)
router.post("/audit/lead", captureAuditLead)

export default router;
