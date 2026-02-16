import express from "express";
import { createNews, getAllNews, deleteNews, updateNews } from "../Controllers/News.controller.js";
import { protect } from "../Middleware/token.js";

const router = express.Router();

router.get("/", getAllNews);
router.post("/create", protect, createNews);
router.put("/:id", protect, updateNews);
router.delete("/:id", protect, deleteNews);

export default router;
