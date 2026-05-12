import { Router } from "express";
import {
  getPublicAudit,
  getPublicAuditOgImage,
  renderPublicAudit,
} from "../controller/public.controller.js";

const router = Router();

router.get(
  "/api/public/audits/:publicId",
  getPublicAudit
);
router.get(
  "/public/audits/:publicId/og-image.svg",
  getPublicAuditOgImage
);
router.get(
  "/public/audits/:publicId",
  renderPublicAudit
);

export default router;
