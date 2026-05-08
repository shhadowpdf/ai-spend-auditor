import {Router} from 'express';
import {getSupportedTools} from "../controller/tool.controller.js";
const router = Router();

router.get("/", getSupportedTools);

export default router;