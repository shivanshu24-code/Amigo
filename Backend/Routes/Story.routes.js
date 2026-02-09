import express from "express";
import { createStory, getStories, deleteStory, viewStory, getStoryViewers } from "../Controllers/Story.controller.js";
import { protect } from "../Middleware/token.js";
import upload from "../Middleware/Upload.js";

const router = express.Router();

// Story CRUD
router.post("/story", protect, upload.single("media"), createStory);
router.get("/story", protect, getStories);
router.delete("/story/:storyId", protect, deleteStory);

// Story views
router.post("/story/:storyId/view", protect, viewStory);
router.get("/story/:storyId/viewers", protect, getStoryViewers);

export default router;
