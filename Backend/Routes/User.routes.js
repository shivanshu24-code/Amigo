import { getAllUsers, getUserById, blockUser, unblockUser, getBlockedUsers } from "../Controllers/User.controller.js";
import express from "express";
import { protect } from "../Middleware/token.js";

const router = express.Router();

router.get("/allUsers", getAllUsers);
router.get("/user/:userId", getUserById);
router.get("/blocked", protect, getBlockedUsers);
router.post("/block/:userId", protect, blockUser);
router.delete("/block/:userId", protect, unblockUser);

export default router;
