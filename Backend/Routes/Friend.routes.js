import express from "express";
import { protect } from "../Middleware/token.js";
import {
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    getFriendRequests,
    getFriends,
    removeFriend,
    getSentRequests,
    getCloseFriends,
    toggleCloseFriend,
} from "../Controllers/Friend.controller.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Friend request operations
router.post("/request/:userId", sendFriendRequest);
router.put("/accept/:requestId", acceptFriendRequest);
router.put("/reject/:requestId", rejectFriendRequest);

// Get requests and friends
router.get("/requests", getFriendRequests);
router.get("/sent", getSentRequests);
router.get("/", getFriends);
router.get("/close-friend", getCloseFriends);

// Toggle Close Friend
router.post("/close-friend/:userId", toggleCloseFriend);

// Remove friend
router.delete("/:userId", removeFriend);

export default router;
