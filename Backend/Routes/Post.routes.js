import express from "express";
import { protect, optionalProtect } from "../Middleware/token.js";
import {
  createPost,
  getFeedPosts,
  getPostById,
  deletePost,
  toggleLikePost,
  addComment,
  getUserPosts,
  getSharedPost,
  toggleSavePost,
  getSavedPosts,
  getArchivedPosts,
  unarchivePost
} from "../Controllers/Post.controller.js";

const router = express.Router();

router.post("/", protect, createPost);
router.get("/archived", protect, getArchivedPosts);
router.get("/", protect, getFeedPosts);
router.get("/saved", protect, getSavedPosts); // Static path before dynamic
router.get("/shared/:postId", optionalProtect, getSharedPost);
router.get("/user/:userId", protect, getUserPosts);
router.post("/save/:id", protect, toggleSavePost);

// Dynamic :id routes (Catch-all for IDs)
router.get("/:id", protect, getPostById);
router.delete("/:id", protect, deletePost);
router.put("/:id/like", protect, toggleLikePost);
router.put("/:id/unarchive", protect, unarchivePost);
router.post("/:id/comment", protect, addComment);

export default router;
