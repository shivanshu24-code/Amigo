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
    createGroup,
    getSharedMedia,
    leaveGroup,
    makeAdmin,
    removeAdmin,
    clearChat,
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

// Get messages by conversation ID (must come before :friendId to avoid "v" being matched as friendId)
router.get("/messages/v/:conversationId", getMessages);

// Get messages with a specific friend
router.get("/messages/:friendId", getMessages);

// Create a new group
router.post("/create-group", createGroup);

// Get shared media for a conversation
router.get("/media/:conversationId", getSharedMedia);

// Leave a group
router.post("/leave-group/:conversationId", leaveGroup);

// Make/remove admin
router.post("/make-admin/:conversationId/:userId", makeAdmin);
router.post("/remove-admin/:conversationId/:userId", removeAdmin);

// Mark messages as read in a conversation
router.put("/read/:conversationId", markAsRead);

// Clear message history for current user
router.post("/clear/:conversationId", clearChat);

// Delete a message
router.post("/message/delete/:messageId", deleteMessage);

// Get unread message count
router.get("/unread", getUnreadCount);

export default router;
