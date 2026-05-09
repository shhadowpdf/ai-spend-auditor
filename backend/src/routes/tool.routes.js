import {Router} from 'express';
import {getSupportedTools, getUserAudit} from "../controller/tool.controller.js";
const router = Router();

router.get("/", getSupportedTools);
router.post("/audit", getUserAudit)

export default router;