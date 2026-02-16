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
 * Send a message to a friend or group
 * @route POST /api/chat/send/:id
 */
export const sendMessage = async (req, res) => {
    try {
        const senderId = req.user._id;
        const targetId = req.params.userId; // This can be a userId or conversationId for groups
        const { text, isStoryReply, sharedStory, conversationId, encryptedKey, encryptionIV } = req.body;

        // Validate input
        if ((!text || !text.trim()) && !sharedStory) {
            return res.status(400).json({
                success: false,
                message: "Message text or shared content is required",
            });
        }

        let conversation;
        let receiverId = null;

        if (conversationId) {
            // If conversationId is provided, it's either an existing 1-on-1 or a group
            conversation = await Conversation.findOne({
                _id: conversationId,
                participants: senderId,
            });
        } else {
            // Legacy support or fallback to find/create 1-on-1
            receiverId = targetId;
            const receiver = await User.findById(receiverId);
            if (!receiver) {
                return res.status(404).json({
                    success: false,
                    message: "User not found",
                });
            }
            conversation = await getOrCreateConversation(senderId, receiverId);
        }

        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: "Conversation not found",
            });
        }

        // Create message
        const message = await Message.create({
            sender: senderId,
            receiver: conversation.isGroup ? undefined : (receiverId || conversation.participants.find(p => p.toString() !== senderId.toString())),
            conversationId: conversation._id,
            text: text?.trim(),
            isStoryReply: isStoryReply || false,
            sharedStory: sharedStory || undefined,
            encryptedKey,
            encryptionIV,
        });

        // Update conversation with last message
        conversation.lastMessage = message._id;
        await conversation.save();

        // Populate sender info for the response
        await message.populate("sender", "username avatar");

        // Emit real-time event
        if (conversation.isGroup) {
            // For groups, emit to all participants except sender
            const otherParticipants = conversation.participants.filter(p => p.toString() !== senderId.toString());
            const emitData = {
                message: message,
                conversationId: conversation._id,
            };

            // We need a way to emit to multiple users
            // Using a helper from SocketManager
            const { emitToUsers } = await import("../Socket/SocketManager.js");
            emitToUsers(otherParticipants, "new-message", emitData);
        } else {
            // For 1-on-1
            const otherParticipantId = conversation.participants.find(p => p.toString() !== senderId.toString());
            emitToUser(otherParticipantId, "new-message", {
                message: message,
                conversationId: conversation._id,
            });
        }

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

        // Fetch conversations
        const conversations = await Conversation.find({
            participants: userId,
        })
            .populate({
                path: "lastMessage",
                populate: [
                    { path: "sharedPost", select: "_id caption media author" },
                    { path: "sharedStory", select: "_id media author" },
                    { path: "sender", select: "username" }
                ]
            })
            .populate("participants", "username avatar publicKey")
            .populate("groupAdmin", "username avatar")
            .sort({ updatedAt: -1 });

        // Fetch user profiles for enhanced details (avatars)
        const participantsIds = new Set();
        conversations.forEach(conv => {
            conv.participants.forEach(p => participantsIds.add(p._id.toString()));
        });

        const profiles = await (await import("../Models/Profile.model.js")).default.find({
            user: { $in: Array.from(participantsIds) }
        }).select("user avatar firstname lastname");

        const profileMap = new Map();
        profiles.forEach(p => profileMap.set(p.user.toString(), p));

        // Format conversations
        const formattedConversations = conversations.map(conv => {
            if (conv.isGroup) {
                return {
                    _id: conv._id,
                    isGroup: true,
                    groupName: conv.groupName,
                    groupAvatar: conv.groupAvatar,
                    // Ensure groupAdmin is an array for legacy data
                    groupAdmin: Array.isArray(conv.groupAdmin)
                        ? conv.groupAdmin
                        : (conv.groupAdmin ? [conv.groupAdmin] : []),
                    lastMessage: conv.lastMessage,
                    updatedAt: conv.updatedAt,
                    participants: conv.participants.map(p => ({
                        ...p._doc,
                        avatar: profileMap.get(p._id.toString())?.avatar || p.avatar
                    }))
                };
            } else {
                const otherUser = conv.participants.find(p => p._id.toString() !== userId.toString());
                if (!otherUser) return null;

                const profile = profileMap.get(otherUser._id.toString());
                return {
                    _id: conv._id,
                    isGroup: false,
                    friend: {
                        _id: otherUser._id,
                        username: otherUser.username,
                        avatar: profile?.avatar || otherUser.avatar,
                        publicKey: otherUser.publicKey,
                        firstname: profile?.firstname,
                        lastname: profile?.lastname
                    },
                    lastMessage: conv.lastMessage,
                    updatedAt: conv.updatedAt,
                };
            }
        }).filter(c => c !== null);

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
 * Create a new group conversation
 * @route POST /api/chat/create-group
 */
export const createGroup = async (req, res) => {
    try {
        const { name, participants } = req.body;
        const adminId = req.user._id;

        if (!name || !participants || participants.length < 1) {
            return res.status(400).json({
                success: false,
                message: "Group name and at least one participant are required",
            });
        }

        // Include admin in participants if not already there
        const allParticipants = [...new Set([...participants, adminId.toString()])];

        const conversation = await Conversation.create({
            isGroup: true,
            groupName: name.trim(),
            groupAdmin: [adminId],
            participants: allParticipants,
        });

        // Add a welcome message
        const welcomeMessage = await Message.create({
            sender: adminId,
            conversationId: conversation._id,
            text: `Created group "${name}"`,
        });

        conversation.lastMessage = welcomeMessage._id;
        await conversation.save();

        res.status(201).json({
            success: true,
            message: "Group created successfully",
            data: conversation,
        });
    } catch (error) {
        console.error("Create Group Error:", error);
        res.status(500).json({
            success: false,
            message: "Server error while creating group",
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

        const conversationId = req.params.conversationId;

        let conversation;

        if (conversationId) {
            // Route: /messages/v/:conversationId — direct lookup by conversation ID
            conversation = await Conversation.findOne({
                _id: conversationId,
                participants: userId,
            });
        } else if (friendId) {
            // Route: /messages/:friendId — find 1-on-1 conversation with this friend
            conversation = await Conversation.findOne({
                participants: { $all: [userId, friendId] },
                isGroup: { $ne: true },
            });
        }

        if (!conversation) {
            return res.status(200).json({
                success: true,
                count: 0,
                data: [],
            });
        }

        return getMessagesWithConv(conversation._id, userId, page, limit, res);
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
 * Helper to fetch messages by conversation ID
 */
const getMessagesWithConv = async (conversationId, userId, page, limit, res) => {
    try {
        const messages = await Message.find({
            conversationId: conversationId,
            deletedBy: { $ne: userId },
        })
            .populate("sender", "username avatar")
            .populate({
                path: "sharedPost",
                populate: { path: "author", select: "username avatar" }
            })
            .populate({
                path: "sharedStory",
                populate: { path: "author", select: "username avatar" }
            })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        // Mark unread messages as read (for 1-on-1 mostly, or current user in group)
        await Message.updateMany(
            {
                conversationId: conversationId,
                receiver: userId,
                read: false,
                deletedBy: { $ne: userId }
            },
            { read: true }
        );

        res.status(200).json({
            success: true,
            count: messages.length,
            conversationId: conversationId,
            data: messages.reverse(),
        });
    } catch (err) {
        throw err;
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


/**
 * Get shared media for a conversation
 * @route GET /api/chat/media/:conversationId
 */
export const getSharedMedia = async (req, res) => {
    try {
        const userId = req.user._id;
        const { conversationId } = req.params;

        // Verify user is in the conversation
        const conversation = await Conversation.findOne({
            _id: conversationId,
            participants: userId,
        });
        if (!conversation) {
            return res.status(404).json({ success: false, message: "Conversation not found" });
        }

        // Find messages with shared posts that have media
        const messages = await Message.find({
            conversationId,
            sharedPost: { $exists: true, $ne: null },
            deletedBy: { $ne: userId },
            isDeletedForEveryone: { $ne: true },
        })
            .populate({
                path: "sharedPost",
                select: "media caption author",
                populate: { path: "author", select: "username avatar" },
            })
            .sort({ createdAt: -1 })
            .limit(50);

        const media = messages
            .filter(m => m.sharedPost?.media)
            .map(m => ({
                _id: m._id,
                media: m.sharedPost.media,
                caption: m.sharedPost.caption,
                author: m.sharedPost.author,
                postId: m.sharedPost._id,
                sentAt: m.createdAt,
            }));

        res.status(200).json({ success: true, count: media.length, data: media });
    } catch (error) {
        console.error("Get Shared Media Error:", error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

/**
 * Leave a group conversation
 * @route POST /api/chat/leave-group/:conversationId
 */
export const leaveGroup = async (req, res) => {
    try {
        const userId = req.user._id;
        const { conversationId } = req.params;

        const conversation = await Conversation.findOne({
            _id: conversationId,
            participants: userId,
            isGroup: true,
        });

        if (!conversation) {
            return res.status(404).json({ success: false, message: "Group not found" });
        }

        // Ensure groupAdmin is an array (handle legacy data)
        if (!Array.isArray(conversation.groupAdmin)) {
            conversation.groupAdmin = conversation.groupAdmin ? [conversation.groupAdmin] : [];
        }

        // Remove user from participants
        conversation.participants = conversation.participants.filter(
            p => p.toString() !== userId.toString()
        );

        // Remove from admin list if they were admin
        conversation.groupAdmin = conversation.groupAdmin.filter(
            a => a.toString() !== userId.toString()
        );

        // If no admins left but still has participants, promote the first participant
        if (conversation.groupAdmin.length === 0 && conversation.participants.length > 0) {
            conversation.groupAdmin.push(conversation.participants[0]);
        }

        // If no participants left, delete the conversation
        if (conversation.participants.length === 0) {
            await Conversation.findByIdAndDelete(conversationId);
            return res.status(200).json({ success: true, message: "Group deleted (no members left)" });
        }

        await conversation.save();

        // Add a system message
        const leaveMsg = await Message.create({
            sender: userId,
            conversationId: conversation._id,
            text: `left the group`,
        });
        conversation.lastMessage = leaveMsg._id;
        await conversation.save();

        res.status(200).json({ success: true, message: "Left group successfully" });
    } catch (error) {
        console.error("Leave Group Error:", error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

/**
 * Make a user admin
 * @route POST /api/chat/make-admin/:conversationId/:userId
 */
export const makeAdmin = async (req, res) => {
    try {
        const currentUserId = req.user._id;
        const { conversationId, userId } = req.params;

        console.log(`MakeAdmin Request: Conversation=${conversationId}, TargetUser=${userId}, Actor=${currentUserId}`);

        const conversation = await Conversation.findOne({
            _id: conversationId,
            isGroup: true,
        });

        if (!conversation) {
            return res.status(404).json({ success: false, message: "Group not found" });
        }

        // Ensure groupAdmin is an array (handle legacy data)
        if (!Array.isArray(conversation.groupAdmin)) {
            conversation.groupAdmin = conversation.groupAdmin ? [conversation.groupAdmin] : [];
        }

        // Filter out null/undefined values to prevent crashes
        conversation.groupAdmin = conversation.groupAdmin.filter(a => a);

        // Check if current user is admin
        const isAdmin = conversation.groupAdmin.some(a => a.toString() === currentUserId.toString());
        if (!isAdmin) {
            return res.status(403).json({ success: false, message: "Only admins can make others admin" });
        }

        // Check if target user is a participant
        const isParticipant = conversation.participants.some(p => p.toString() === userId);
        if (!isParticipant) {
            return res.status(400).json({ success: false, message: "User is not in this group" });
        }

        // Check if already admin
        const alreadyAdmin = conversation.groupAdmin.some(a => a.toString() === userId);
        if (alreadyAdmin) {
            return res.status(400).json({ success: false, message: "User is already an admin" });
        }

        conversation.groupAdmin.push(userId);
        await conversation.save();

        console.log("MakeAdmin Success");
        res.status(200).json({ success: true, message: "User is now an admin" });
    } catch (error) {
        console.error("Make Admin Error:", error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

/**
 * Remove admin status from a user
 * @route POST /api/chat/remove-admin/:conversationId/:userId
 */
export const removeAdmin = async (req, res) => {
    try {
        const currentUserId = req.user._id;
        const { conversationId, userId } = req.params;

        const conversation = await Conversation.findOne({
            _id: conversationId,
            isGroup: true,
        });

        if (!conversation) {
            return res.status(404).json({ success: false, message: "Group not found" });
        }

        // Ensure groupAdmin is an array (handle legacy data)
        if (!Array.isArray(conversation.groupAdmin)) {
            conversation.groupAdmin = conversation.groupAdmin ? [conversation.groupAdmin] : [];
        }

        // Check if current user is admin
        const isAdmin = conversation.groupAdmin.some(a => a.toString() === currentUserId.toString());
        if (!isAdmin) {
            return res.status(403).json({ success: false, message: "Only admins can remove admin status" });
        }

        // Must have at least one admin
        if (conversation.groupAdmin.length <= 1) {
            return res.status(400).json({ success: false, message: "Cannot remove the last admin" });
        }

        conversation.groupAdmin = conversation.groupAdmin.filter(
            a => a.toString() !== userId
        );
        await conversation.save();

        res.status(200).json({ success: true, message: "Admin status removed" });
    } catch (error) {
        console.error("Remove Admin Error:", error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

/**
 * Clear all messages in a conversation for the current user
 * @route POST /api/chat/clear/:conversationId
 */
export const clearChat = async (req, res) => {
    try {
        const userId = req.user._id;
        const { conversationId } = req.params;

        // Verify user is part of the conversation
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

        // Add userId to deletedBy array for all messages in this conversation
        await Message.updateMany(
            {
                conversationId: conversationId,
                deletedBy: { $ne: userId }
            },
            {
                $addToSet: { deletedBy: userId }
            }
        );

        res.status(200).json({
            success: true,
            message: "Chat cleared successfully",
        });
    } catch (error) {
        console.error("Clear Chat Error:", error);
        res.status(500).json({
            success: false,
            message: "Server error while clearing chat",
            error: error.message,
        });
    }
};
