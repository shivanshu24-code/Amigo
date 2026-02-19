import { Server } from "socket.io";
import User from "../Models/User.model.js";
import Message from "../Models/Message.model.js";
import Conversation from "../Models/Conversation.model.js";

let io = null;
const userSockets = new Map(); // userId -> socketId
const activeCalls = new Map(); // userId -> peerId (tracks active calls)

/**
 * Helper function to check if two users are friends
 */
const areFriends = async (userId1, userId2) => {
    try {
        const user = await User.findById(userId1);
        if (!user) {
            console.log(`[DEBUG] areFriends: User ${userId1} not found`);
            return false;
        }
        if (!user.friends) {
            console.log(`[DEBUG] areFriends: User ${userId1} has no friends list`);
            return false;
        }
        const isFriend = user.friends.some(friendId => friendId.toString() === userId2.toString());
        console.log(`[DEBUG] areFriends: Checking ${userId1} -> ${userId2} : ${isFriend}`);
        return isFriend;
    } catch (err) {
        console.error("[DEBUG] areFriends error:", err);
        return false;
    }
};

/**
 * Get or create a conversation between two users
 */
const getOrCreateConversation = async (userId1, userId2) => {
    const participants = [userId1, userId2].sort();

    let conversation = await Conversation.findOne({
        participants: { $all: participants, $size: 2 }
    });

    if (!conversation) {
        conversation = await Conversation.create({ participants });
    }

    return conversation;
};

export const initializeSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: [
                process.env.CLIENT_URL,
                "https://localhost:5173",
                "http://localhost:5173",
            ],
            credentials: true,
        },
    });

    io.on("connection", (socket) => {
        console.log("🟢 User connected:", socket.id);

        let currentUserId = null;

        // Register user with their userId
        socket.on("register", (userId) => {
            if (userId) {
                const normalizedUserId = userId.toString();
                currentUserId = normalizedUserId;
                userSockets.set(normalizedUserId, socket.id);
                console.log(`[socket] User ${normalizedUserId} registered with socket ${socket.id}`);

                socket.emit("active-users", {
                    userIds: Array.from(userSockets.keys()),
                });
                socket.broadcast.emit("user-online", { userId: normalizedUserId });
            }
        });

        // Handle real-time message sending
        socket.on("send-message", async (data) => {
            try {
                const { receiverId, text } = data;

                if (!currentUserId || !receiverId || !text) {
                    socket.emit("error", { message: "Invalid message data" });
                    return;
                }

                // Check if they are friends
                const friendshipValid = await areFriends(currentUserId, receiverId);
                if (!friendshipValid) {
                    socket.emit("error", { message: "You can only send messages to friends" });
                    return;
                }

                // Get or create conversation
                const conversation = await getOrCreateConversation(currentUserId, receiverId);

                // Create message
                const message = await Message.create({
                    sender: currentUserId,
                    receiver: receiverId,
                    conversationId: conversation._id,
                    text: text.trim(),
                });

                // Update conversation with last message
                conversation.lastMessage = message._id;
                await conversation.save();

                // Populate sender info
                await message.populate("sender", "username avatar");

                const messageData = {
                    _id: message._id,
                    text: message.text,
                    sender: message.sender,
                    receiver: receiverId,
                    conversationId: conversation._id,
                    createdAt: message.createdAt,
                };

                // Send to receiver
                emitToUser(receiverId, "new-message", { message: messageData, conversationId: conversation._id });

                // Confirm to sender
                socket.emit("message-sent", { message: messageData, conversationId: conversation._id });

                console.log(`💬 Message sent from ${currentUserId} to ${receiverId}`);
            } catch (error) {
                console.error("Socket send-message error:", error);
                socket.emit("error", { message: "Failed to send message" });
            }
        });

        // Handle typing indicator
        socket.on("typing", (data) => {
            const { receiverId } = data;
            if (currentUserId && receiverId) {
                emitToUser(receiverId, "user-typing", { userId: currentUserId });
            }
        });

        // Handle stop typing
        socket.on("stop-typing", (data) => {
            const { receiverId } = data;
            if (currentUserId && receiverId) {
                emitToUser(receiverId, "user-stop-typing", { userId: currentUserId });
            }
        });

        // ===================== VIDEO CALL EVENTS =====================

        // Initiate a video call
        socket.on("initiate-call", async (data) => {
            try {
                const { receiverId, callerName, callerAvatar, callType = "video" } = data;

                if (!currentUserId || !receiverId) {
                    socket.emit("call-error", { message: "Invalid call data" });
                    return;
                }

                // Check if they are friends
                const friendshipValid = await areFriends(currentUserId, receiverId);
                if (!friendshipValid) {
                    socket.emit("call-error", { message: "You can only call friends" });
                    return;
                }

                // Check if receiver is online
                const receiverSocketId = getSocketId(receiverId);
                if (!receiverSocketId) {
                    socket.emit("call-error", { message: "User is offline" });
                    return;
                }

                // Check if receiver is already in a call
                if (activeCalls.has(receiverId)) {
                    socket.emit("call-busy", { userId: receiverId });
                    return;
                }

                // Mark both users as in a call
                activeCalls.set(currentUserId, receiverId);
                activeCalls.set(receiverId, currentUserId);

                // Notify receiver about incoming call
                emitToUser(receiverId, "incoming-call", {
                    callerId: currentUserId,
                    callerName,
                    callerAvatar,
                    callType,
                });

                // Notify caller that call is ringing
                socket.emit("call-ringing", { receiverId, callType });

                console.log(`📞 Call initiated from ${currentUserId} to ${receiverId}`);
            } catch (error) {
                console.error("Initiate call error:", error);
                socket.emit("call-error", { message: "Failed to initiate call" });
            }
        });

        // Accept an incoming call
        socket.on("accept-call", async (data) => {
            try {
                const { callerId, receiverName, receiverAvatar, callType = "video" } = data;

                if (!currentUserId || !callerId) {
                    return;
                }

                // Notify caller that call was accepted
                emitToUser(callerId, "call-accepted", {
                    oderId: currentUserId,
                    receiverName,
                    receiverAvatar,
                    callType,
                });

                console.log(`✅ Call accepted by ${currentUserId} from ${callerId}`);
            } catch (error) {
                console.error("Accept call error:", error);
            }
        });

        // Reject an incoming call
        socket.on("reject-call", async (data) => {
            try {
                const { callerId } = data;

                if (!currentUserId || !callerId) {
                    return;
                }

                // Remove from active calls
                activeCalls.delete(currentUserId);
                activeCalls.delete(callerId);

                // Notify caller that call was rejected
                emitToUser(callerId, "call-rejected", {
                    oderId: currentUserId,
                });

                console.log(`❌ Call rejected by ${currentUserId} from ${callerId}`);
            } catch (error) {
                console.error("Reject call error:", error);
            }
        });

        // End a call
        socket.on("end-call", async (data) => {
            try {
                const { oderId } = data;

                if (!currentUserId) {
                    return;
                }

                const otherUserId = oderId || activeCalls.get(currentUserId);

                // Remove from active calls
                activeCalls.delete(currentUserId);
                if (otherUserId) {
                    activeCalls.delete(otherUserId);

                    // Notify other user that call ended
                    emitToUser(otherUserId, "call-ended", {
                        userId: currentUserId,
                    });
                }

                console.log(`📴 Call ended by ${currentUserId}`);
            } catch (error) {
                console.error("End call error:", error);
            }
        });

        // WebRTC Signaling: Offer
        socket.on("webrtc-offer", (data) => {
            const { receiverId, offer } = data;
            if (currentUserId && receiverId) {
                emitToUser(receiverId, "webrtc-offer", {
                    callerId: currentUserId,
                    offer,
                });
            }
        });

        // WebRTC Signaling: Answer
        socket.on("webrtc-answer", (data) => {
            const { callerId, answer } = data;
            if (currentUserId && callerId) {
                emitToUser(callerId, "webrtc-answer", {
                    oderId: currentUserId,
                    answer,
                });
            }
        });

        // WebRTC Signaling: ICE Candidate
        socket.on("webrtc-ice-candidate", (data) => {
            const { targetId, candidate } = data;
            if (currentUserId && targetId) {
                emitToUser(targetId, "webrtc-ice-candidate", {
                    senderId: currentUserId,
                    candidate,
                });
            }
        });

        // Handle disconnect
        socket.on("disconnect", () => {
            // End any active call
            const otherUserId = activeCalls.get(currentUserId);
            if (otherUserId) {
                activeCalls.delete(currentUserId);
                activeCalls.delete(otherUserId);
                emitToUser(otherUserId, "call-ended", { userId: currentUserId });
            }

            // Remove user from map
            for (const [userId, socketId] of userSockets.entries()) {
                if (socketId === socket.id) {
                    userSockets.delete(userId);
                    console.log(`[socket] User ${userId} disconnected`);
                    socket.broadcast.emit("user-offline", { userId });
                    break;
                }
            }
        });
    });

    return io;
};

// Get io instance
export const getIO = () => io;

// Get socket ID for a user
export const getSocketId = (userId) => userSockets.get(userId?.toString());

// Emit event to a specific user
export const emitToUser = (userId, event, data) => {
    const socketId = getSocketId(userId);
    if (socketId && io) {
        io.to(socketId).emit(event, data);
        console.log(`📤 Emitted ${event} to user ${userId}`);
    }
};

// Emit event to multiple users
export const emitToUsers = (userIds, event, data) => {
    userIds.forEach((userId) => emitToUser(userId, event, data));
};
