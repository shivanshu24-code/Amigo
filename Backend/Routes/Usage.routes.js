import express from "express";
import { logUsage, getUsageData } from "../Controllers/Usage.controller.js";
import { protect } from "../Middleware/token.js";

const router = express.Router();

router.post("/log", protect, logUsage);
router.get("/", protect, getUsageData);

export default router;
