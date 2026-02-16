import express from "express";
import { protect } from "../Middleware/token.js";
import { createEvent, getEvents, deleteEvent, updateEvent } from "../Controllers/Event.controller.js";

const router = express.Router();

router.post("/create", protect, createEvent);
router.get("/", protect, getEvents); // Fetch upcoming events
router.delete("/:id", protect, deleteEvent);
router.put("/:id", protect, updateEvent);

export default router;
