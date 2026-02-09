import Message from "../Models/Message.model.js";
import Conversation from "../Models/Conversation.model.js";
import User from "../Models/User.model.js";
import Post from "../Models/Post.model.js";
import { emitToUser } from "../Socket/SocketManager.js";

/**
 * Helper function to check if two users are friends
 */
const areFriends = async (userId1, userId2) => {
    const user = await User.findById(userId1);
    if (!user || !user.friends) return false;
    return user.friends.some(friendId => friendId.toString() === userId2.toString());
};

/**
 * Get or create a conversation between two users
 */
const getOrCreateConversation = async (userId1, userId2) => {
    // Sort participant IDs to ensure consistent ordering
    const participants = [userId1, userId2].sort();

    let conversation = await Conversation.findOne({
        participants: { $all: participants, $size: 2 }
    });

    if (!conversation) {
        conversation = await Conversation.create({ participants });
    }

    return conversation;
};

/**
 * Send a message to a friend
 * @route POST /api/chat/send/:userId
 */
export const sendMessage = async (req, res) => {
    try {
        const senderId = req.user._id;
        const receiverId = req.params.userId;
        const { text, isStoryReply, sharedStory } = req.body;

        // Validate input
        if ((!text || !text.trim()) && !sharedStory) {
            return res.status(400).json({
                success: false,
                message: "Message text or shared content is required",
            });
        }

        // Check if receiver exists
        const receiver = await User.findById(receiverId);
        if (!receiver) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Check if they are friends
        const friendshipValid = await areFriends(senderId, receiverId);
        if (!friendshipValid) {
            return res.status(403).json({
                success: false,
                message: "You can only send messages to friends",
            });
        }

        // Get or create conversation
        const conversation = await getOrCreateConversation(senderId, receiverId);

        // Create message
        const message = await Message.create({
            sender: senderId,
            receiver: receiverId,
            conversationId: conversation._id,
            text: text?.trim(),
            isStoryReply: isStoryReply || false,
            sharedStory: sharedStory || undefined,
        });

        // Update conversation with last message
        conversation.lastMessage = message._id;
        await conversation.save();

        // Populate sender info for the response
        await message.populate("sender", "username avatar");

        // Emit real-time event to receiver
        emitToUser(receiverId, "new-message", {
            message: {
                _id: message._id,
                text: message.text,
                sender: message.sender,
                receiver: receiverId,
                conversationId: conversation._id,
                isStoryReply: message.isStoryReply,
                sharedStory: message.sharedStory,
                createdAt: message.createdAt,
            },
            conversationId: conversation._id,
        });

        res.status(201).json({
            success: true,
            message: "Message sent successfully",
            data: message,
        });
    } catch (error) {
        console.error("Send Message Error:", error);
        res.status(500).json({
            success: false,
            message: "Server error while sending message",
            error: error.message,
        });
    }
};

/**
 * Get all conversations for the current user
 * @route GET /api/chat/conversations
 */
export const getConversations = async (req, res) => {
    try {
        const userId = req.user._id;

        // 1. Fetch conversations with basic population
        const conversations = await Conversation.find({
            participants: userId,
        })
            .populate({
                path: "lastMessage",
                populate: [
                    {
                        path: "sharedPost",
                        select: "_id caption media author"
                    },
                    {
                        path: "sharedStory",
                        select: "_id media author"
                    }
                ]
            })
            .sort({ updatedAt: -1 });

        // 2. Extract all other participant IDs
        const otherUserIds = new Set();
        conversations.forEach(conv => {
            const otherId = conv.participants.find(p => p.toString() !== userId.toString());
            if (otherId) otherUserIds.add(otherId);
        });

        // 3. Fetch enhanced details for these users (User + Profile)
        const enhancedUsers = await User.aggregate([
            {
                $match: {
                    _id: { $in: Array.from(otherUserIds) }
                }
            },
            {
                $lookup: {
                    from: "profiles",
                    localField: "_id",
                    foreignField: "user",
                    as: "profile"
                }
            },
            {
                $unwind: {
                    path: "$profile",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    _id: 1,
                    username: 1,
                    email: 1,
                    avatar: { $ifNull: ["$profile.avatar", "$avatar"] },
                    firstname: "$profile.firstname",
                    lastname: "$profile.lastname",
                    isVerified: 1
                }
            }
        ]);

        // Create a map for quick lookup
        const userMap = new Map();
        enhancedUsers.forEach(u => userMap.set(u._id.toString(), u));

        // 4. Map back to conversations
        const formattedConversations = conversations.map(conv => {
            const otherId = conv.participants.find(p => p.toString() !== userId.toString());
            const friendDetails = userMap.get(otherId?.toString()) || null;

            // If for some reason user not found (deleted?), handle gracefully
            if (!friendDetails && otherId) {
                // Return basic structure if enhanced fetch failed for this user
                return {
                    _id: conv._id,
                    friend: { _id: otherId, username: "Unknown User" },
                    lastMessage: conv.lastMessage,
                    updatedAt: conv.updatedAt,
                };
            }

            return {
                _id: conv._id,
                friend: friendDetails,
                lastMessage: conv.lastMessage,
                updatedAt: conv.updatedAt,
            };
        }).filter(c => c.friend); // Remove invalid ones

        res.status(200).json({
            success: true,
            count: formattedConversations.length,
            data: formattedConversations,
        });
    } catch (error) {
        console.error("Get Conversations Error:", error);
        res.status(500).json({
            success: false,
            message: "Server error while fetching conversations",
            error: error.message,
        });
    }
};

/**
 * Get messages with a specific friend
 * @route GET /api/chat/messages/:friendId
 */
export const getMessages = async (req, res) => {
    try {
        const userId = req.user._id;
        const friendId = req.params.friendId;
        const { page = 1, limit = 50 } = req.query;

        // Find conversation first
        const participants = [userId, friendId].sort();
        const conversation = await Conversation.findOne({
            participants: { $all: participants, $size: 2 }
        });

        // If no conversation exists AND they are not friends, deny access
        if (!conversation) {
            const friendshipValid = await areFriends(userId, friendId);
            if (!friendshipValid) {
                return res.status(200).json({ // Return empty instead of 403 to prevent UI error
                    success: true,
                    count: 0,
                    data: [],
                });
            }

            return res.status(200).json({
                success: true,
                count: 0,
                data: [],
            });
        }

        // Get messages with pagination
        const messages = await Message.find({
            conversationId: conversation._id,
            deletedBy: { $ne: userId }, // Exclude messages deleted by the user
        })
            .populate("sender", "username avatar")
            .populate({
                path: "sharedPost",
                populate: {
                    path: "author",
                    select: "username avatar"
                }
            })
            .populate({
                path: "sharedStory",
                populate: {
                    path: "author",
                    select: "username avatar"
                }
            })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        // Mark unread messages as read
        await Message.updateMany(
            {
                conversationId: conversation._id,
                receiver: userId,
                read: false,
                deletedBy: { $ne: userId }
            },
            { read: true }
        );

        res.status(200).json({
            success: true,
            count: messages.length,
            conversationId: conversation._id,
            data: messages.reverse(), // Return in chronological order
        });
    } catch (error) {
        console.error("Get Messages Error:", error);
        res.status(500).json({
            success: false,
            message: "Server error while fetching messages",
            error: error.message,
        });
    }
};

/**
 * Delete a message
 * @route DELETE /api/chat/message/:messageId
 */
export const deleteMessage = async (req, res) => {
    try {
        const userId = req.user._id;
        const { messageId } = req.params;
        const { deleteForEveryone } = req.body;

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({
                success: false,
                message: "Message not found",
            });
        }

        // Verify user is part of the message
        if (message.sender.toString() !== userId.toString() && message.receiver.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to delete this message",
            });
        }

        if (deleteForEveryone) {
            // Only sender can delete for everyone
            if (message.sender.toString() !== userId.toString()) {
                return res.status(403).json({
                    success: false,
                    message: "Only the sender can delete the message for everyone",
                });
            }

            message.isDeletedForEveryone = true;
            await message.save();

            // Notify both participants via socket
            const participants = [message.sender, message.receiver];
            participants.forEach(pId => {
                emitToUser(pId, "message-deleted-everyone", {
                    messageId: message._id,
                    conversationId: message.conversationId,
                });
            });

            return res.status(200).json({
                success: true,
                message: "Message deleted for everyone",
            });
        } else {
            // Delete for me only
            if (!message.deletedBy.includes(userId)) {
                message.deletedBy.push(userId);
                await message.save();
            }

            return res.status(200).json({
                success: true,
                message: "Message deleted for you",
            });
        }
    } catch (error) {
        console.error("Delete Message Error:", error);
        res.status(500).json({
            success: false,
            message: "Server error while deleting message",
            error: error.message,
        });
    }
};

/**
 * Mark messages as read in a conversation
 * @route PUT /api/chat/read/:conversationId
 */
export const markAsRead = async (req, res) => {
    try {
        const userId = req.user._id;
        const conversationId = req.params.conversationId;

        // Verify user is part of conversation
        const conversation = await Conversation.findOne({
            _id: conversationId,
            participants: userId,
        });

        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: "Conversation not found",
            });
        }

        // Mark all messages sent to user as read
        const result = await Message.updateMany(
            {
                conversationId: conversationId,
                receiver: userId,
                read: false,
            },
            { read: true }
        );

        // Notify sender that messages were read
        const otherParticipant = conversation.participants.find(
            p => p.toString() !== userId.toString()
        );

        emitToUser(otherParticipant, "messages-read", {
            conversationId: conversationId,
            readBy: userId,
        });

        res.status(200).json({
            success: true,
            message: "Messages marked as read",
            count: result.modifiedCount,
        });
    } catch (error) {
        console.error("Mark As Read Error:", error);
        res.status(500).json({
            success: false,
            message: "Server error while marking messages as read",
            error: error.message,
        });
    }
};

/**
 * Get unread message count
 * @route GET /api/chat/unread
 */
export const getUnreadCount = async (req, res) => {
    try {
        const userId = req.user._id;

        const count = await Message.countDocuments({
            receiver: userId,
            read: false,
        });

        res.status(200).json({
            success: true,
            unreadCount: count,
        });
    } catch (error) {
        console.error("Get Unread Count Error:", error);
        res.status(500).json({
            success: false,
            message: "Server error while fetching unread count",
            error: error.message,
        });
    }
};

/**
 * Share a post to a friend via message
 * @route POST /api/chat/share/:postId/:userId
 */
export const sharePostToFriend = async (req, res) => {
    try {
        const senderId = req.user._id;
        const { postId, userId: receiverId } = req.params;
        const { text } = req.body || {}; // Optional message with the share

        // Check if post exists
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post not found",
            });
        }

        // Check if receiver exists
        const receiver = await User.findById(receiverId);
        if (!receiver) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Check if they are friends
        const friendshipValid = await areFriends(senderId, receiverId);
        if (!friendshipValid) {
            return res.status(403).json({
                success: false,
                message: "You can only share posts with friends",
            });
        }

        // Get or create conversation
        const conversation = await getOrCreateConversation(senderId, receiverId);

        // Create message with shared post
        const message = await Message.create({
            sender: senderId,
            receiver: receiverId,
            conversationId: conversation._id,
            text: text?.trim() || undefined,
            sharedPost: postId,
        });

        // Update conversation with last message
        conversation.lastMessage = message._id;
        await conversation.save();

        // Populate sender and post info for the response
        await message.populate("sender", "username avatar");
        await message.populate({
            path: "sharedPost",
            populate: {
                path: "author",
                select: "username avatar"
            }
        });

        // Emit real-time event to receiver
        emitToUser(receiverId, "new-message", {
            message: {
                _id: message._id,
                text: message.text,
                sender: message.sender,
                receiver: receiverId,
                conversationId: conversation._id,
                sharedPost: message.sharedPost,
                createdAt: message.createdAt,
            },
            conversationId: conversation._id,
        });

        res.status(201).json({
            success: true,
            message: "Post shared successfully",
            data: message,
        });
    } catch (error) {
        console.error("Share Post Error:", error.message);
        res.status(500).json({
            success: false,
            message: "Server error while sharing post",
            error: error.message,
        });
    }
};

/**
 * Share a story to a friend via message
 * @route POST /api/chat/share-story/:storyId/:userId
 */
export const shareStoryToFriend = async (req, res) => {
    try {
        const senderId = req.user._id;
        const { storyId, userId: receiverId } = req.params;
        const { text } = req.body || {};

        const Story = (await import("../Models/Story.model.js")).default;

        const story = await Story.findById(storyId);
        if (!story) {
            return res.status(404).json({
                success: false,
                message: "Story not found",
            });
        }

        const receiver = await User.findById(receiverId);
        if (!receiver) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        const friendshipValid = await areFriends(senderId, receiverId);
        if (!friendshipValid) {
            return res.status(403).json({
                success: false,
                message: "You can only share stories with friends",
            });
        }

        const conversation = await getOrCreateConversation(senderId, receiverId);

        const message = await Message.create({
            sender: senderId,
            receiver: receiverId,
            conversationId: conversation._id,
            text: text?.trim() || undefined,
            sharedStory: storyId,
        });

        conversation.lastMessage = message._id;
        await conversation.save();

        await message.populate("sender", "username avatar");
        await message.populate({
            path: "sharedStory",
            populate: {
                path: "author",
                select: "username avatar"
            }
        });

        emitToUser(receiverId, "new-message", {
            message: {
                _id: message._id,
                text: message.text,
                sender: message.sender,
                receiver: receiverId,
                conversationId: conversation._id,
                sharedStory: message.sharedStory,
                createdAt: message.createdAt,
            },
            conversationId: conversation._id,
        });

        res.status(201).json({
            success: true,
            message: "Story shared successfully",
            data: message,
        });
    } catch (error) {
        console.error("Share Story Error:", error.message);
        res.status(500).json({
            success: false,
            message: "Server error while sharing story",
            error: error.message,
        });
    }
};


