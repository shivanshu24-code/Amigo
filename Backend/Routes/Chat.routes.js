import express from "express";
import { protect } from "../Middleware/token.js";
import {
    sendMessage,
    getConversations,
    getMessages,
    markAsRead,
    getUnreadCount,
    sharePostToFriend,
    shareStoryToFriend,
    deleteMessage,
} from "../Controllers/Chat.controller.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Send a message to a friend
router.post("/send/:userId", sendMessage);

// Share a post with a friend
router.post("/share/:postId/:userId", sharePostToFriend);
router.post("/share-story/:storyId/:userId", shareStoryToFriend);

// Get all conversations
router.get("/conversations", getConversations);

// Get messages with a specific friend
router.get("/messages/:friendId", getMessages);

// Mark messages as read in a conversation
router.put("/read/:conversationId", markAsRead);

// Delete a message
router.post("/message/delete/:messageId", deleteMessage);

// Get unread message count
router.get("/unread", getUnreadCount);

export default router;
