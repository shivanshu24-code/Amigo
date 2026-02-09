import express from "express";
import {
  addComment,
  getPostComments,
  reactToComment,
  pinComment,
  deleteComment
} from "../Controllers/Comment.controller.js";
import { protect } from "../Middleware/token.js";

const router = express.Router();

// 🔥 COMMENTS BELONG HERE
router.post("/:postId", protect, addComment);
router.get("/:postId", protect, getPostComments);
router.delete("/:commentId", protect, deleteComment);
router.post("/react/:commentId", protect, reactToComment);
router.post("/pin/:commentId", protect, pinComment);

export default router;
