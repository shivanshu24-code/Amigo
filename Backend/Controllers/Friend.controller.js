import FriendRequest from "../Models/FriendRequest.model.js";
import User from "../Models/User.model.js";
import { emitToUser } from "../Socket/SocketManager.js";

/**
 * Send a friend request to another user
 * @route POST /api/friends/request/:userId
 */
export const sendFriendRequest = async (req, res) => {
    try {
        const senderId = req.user._id;
        const receiverId = req.params.userId;

        // Can't send request to yourself
        if (senderId.toString() === receiverId) {
            return res.status(400).json({
                success: false,
                message: "You cannot send a friend request to yourself",
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

        // Check if a request already exists (in either direction)
        const existingRequest = await FriendRequest.findOne({
            $or: [
                { sender: senderId, receiver: receiverId },
                { sender: receiverId, receiver: senderId },
            ],
        });

        if (existingRequest) {
            if (existingRequest.status === "accepted") {
                return res.status(400).json({
                    success: false,
                    message: "You are already friends with this user",
                });
            }
            if (existingRequest.status === "pending") {
                return res.status(400).json({
                    success: false,
                    message: "Friend request already exists",
                });
            }
            // If rejected, allow resending by updating the existing request
            if (existingRequest.status === "rejected") {
                // Ensure the direction is correct for the new request (A -> B)
                // If previous was A -> B (rejected), we update status to pending
                // If previous was B -> A (rejected), and now A -> B, we still update/reset it to match current sender/receiver

                // However, simpler to just delete the old rejected one and let the create below handle it, 
                // OR update this one. Updating avoids index collision if directions match.

                if (existingRequest.sender.toString() === senderId.toString()) {
                    // A sent to B, B rejected. A sends again. Update A->B to pending.
                    existingRequest.status = "pending";
                    await existingRequest.save();

                    // Emit socket event
                    emitToUser(receiverId, "friend-request", {
                        requestId: existingRequest._id,
                        senderId: senderId,
                        senderName: req.user.username,
                        senderAvatar: req.user.avatar,
                        message: `${req.user.username} sent you a friend request`,
                    });

                    return res.status(201).json({
                        success: true,
                        message: "Friend request sent successfully",
                        data: existingRequest,
                    });
                } else {
                    // B sent to A, A rejected. Now A sends to B.
                    // Existing is B->A (rejected). New is A->B.
                    // Unique index {sender, receiver} won't conflict.
                    // We can just proceed to create new request below.
                    // But we might want to delete the old rejected B->A to clean up? 
                    // Let's leave it for history or allow flow to continue to create.
                }
            }
        }

        // Create new friend request
        const friendRequest = await FriendRequest.create({
            sender: senderId,
            receiver: receiverId,
            status: "pending",
        });

        // Emit socket event to receiver
        emitToUser(receiverId, "friend-request", {
            requestId: friendRequest._id,
            senderId: senderId,
            senderName: req.user.username,
            senderAvatar: req.user.avatar,
            message: `${req.user.username} sent you a friend request`,
        });

        res.status(201).json({
            success: true,
            message: "Friend request sent successfully",
            data: friendRequest,
        });
    } catch (error) {
        console.error("Send Friend Request Error:", error);
        res.status(500).json({
            success: false,
            message: "Server error while sending friend request",
            error: error.message,
        });
    }
};

/**
 * Accept a friend request
 * @route PUT /api/friends/accept/:requestId
 */
export const acceptFriendRequest = async (req, res) => {
    try {
        const userId = req.user._id;
        const requestId = req.params.requestId;

        const friendRequest = await FriendRequest.findById(requestId);

        if (!friendRequest) {
            return res.status(404).json({
                success: false,
                message: "Friend request not found",
            });
        }

        // Only the receiver can accept
        if (friendRequest.receiver.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: "You can only accept requests sent to you",
            });
        }

        if (friendRequest.status !== "pending") {
            return res.status(400).json({
                success: false,
                message: `Request has already been ${friendRequest.status}`,
            });
        }

        friendRequest.status = "accepted";
        await friendRequest.save();

        // Add each user to the other's friends array
        await User.findByIdAndUpdate(friendRequest.sender, {
            $addToSet: { friends: friendRequest.receiver }
        });
        await User.findByIdAndUpdate(friendRequest.receiver, {
            $addToSet: { friends: friendRequest.sender }
        });

        // Emit socket event to sender that request was accepted
        emitToUser(friendRequest.sender, "friend-accepted", {
            requestId: friendRequest._id,
            accepterId: userId,
            accepterName: req.user.username,
            message: `${req.user.username} accepted your friend request`,
        });

        res.status(200).json({
            success: true,
            message: "Friend request accepted",
            data: friendRequest,
        });
    } catch (error) {
        console.error("Accept Friend Request Error:", error);
        res.status(500).json({
            success: false,
            message: "Server error while accepting friend request",
            error: error.message,
        });
    }
};

/**
 * Reject a friend request
 * @route PUT /api/friends/reject/:requestId
 */
export const rejectFriendRequest = async (req, res) => {
    try {
        const userId = req.user._id;
        const requestId = req.params.requestId;

        const friendRequest = await FriendRequest.findById(requestId);

        if (!friendRequest) {
            return res.status(404).json({
                success: false,
                message: "Friend request not found",
            });
        }

        // Only the receiver can reject
        if (friendRequest.receiver.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: "You can only reject requests sent to you",
            });
        }

        if (friendRequest.status !== "pending") {
            return res.status(400).json({
                success: false,
                message: `Request has already been ${friendRequest.status}`,
            });
        }

        friendRequest.status = "rejected";
        await friendRequest.save();

        res.status(200).json({
            success: true,
            message: "Friend request rejected",
            data: friendRequest,
        });
    } catch (error) {
        console.error("Reject Friend Request Error:", error);
        res.status(500).json({
            success: false,
            message: "Server error while rejecting friend request",
            error: error.message,
        });
    }
};

/**
 * Get all pending friend requests for the current user
 * @route GET /api/friends/requests
 */
/**
 * Get all pending friend requests for the current user
 * @route GET /api/friends/requests
 */
export const getFriendRequests = async (req, res) => {
    try {
        const userId = req.user._id;

        const requests = await FriendRequest.aggregate([
            {
                $match: {
                    receiver: userId,
                    status: "pending"
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "sender",
                    foreignField: "_id",
                    as: "sender"
                }
            },
            { $unwind: "$sender" },
            {
                $lookup: {
                    from: "profiles",
                    localField: "sender._id",
                    foreignField: "user",
                    as: "senderProfile"
                }
            },
            {
                $unwind: {
                    path: "$senderProfile",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    _id: 1,
                    status: 1,
                    createdAt: 1,
                    sender: {
                        _id: "$sender._id",
                        username: "$sender.username",
                        email: "$sender.email",
                        avatar: { $ifNull: ["$senderProfile.avatar", "$sender.avatar"] },
                        firstname: "$senderProfile.firstname",
                        lastname: "$senderProfile.lastname",
                        publicKey: "$sender.publicKey"
                    }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            count: requests.length,
            data: requests,
        });
    } catch (error) {
        console.error("Get Friend Requests Error:", error);
        res.status(500).json({
            success: false,
            message: "Server error while fetching friend requests",
            error: error.message,
        });
    }
};

/**
 * Get all friends of the current user
 * @route GET /api/friends
 */
export const getFriends = async (req, res) => {
    try {
        const userId = req.user._id;

        const friendships = await FriendRequest.aggregate([
            {
                $match: {
                    $or: [{ sender: userId }, { receiver: userId }],
                    status: "accepted"
                }
            },
            {
                $project: {
                    friendId: {
                        $cond: {
                            if: { $eq: ["$sender", userId] },
                            then: "$receiver",
                            else: "$sender"
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "friendId",
                    foreignField: "_id",
                    as: "friend"
                }
            },
            { $unwind: "$friend" },
            {
                $lookup: {
                    from: "profiles",
                    localField: "friend._id",
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
                    _id: "$friend._id",
                    username: "$friend.username",
                    email: "$friend.email",
                    avatar: { $ifNull: ["$profile.avatar", "$friend.avatar"] },
                    firstname: "$profile.firstname",
                    lastname: "$profile.lastname",
                    isVerified: "$friend.isVerified",
                    publicKey: "$friend.publicKey"
                }
            }
        ]);

        res.status(200).json({
            success: true,
            count: friendships.length,
            data: friendships,
        });
    } catch (error) {
        console.error("Get Friends Error:", error);
        res.status(500).json({
            success: false,
            message: "Server error while fetching friends",
            error: error.message,
        });
    }
};

/**
 * Remove a friend (unfriend)
 * @route DELETE /api/friends/:userId
 */
export const removeFriend = async (req, res) => {
    try {
        const userId = req.user._id;
        const friendId = req.params.userId;

        const friendship = await FriendRequest.findOneAndDelete({
            $or: [
                { sender: userId, receiver: friendId, status: "accepted" },
                { sender: friendId, receiver: userId, status: "accepted" },
            ],
        });

        if (!friendship) {
            return res.status(404).json({
                success: false,
                message: "Friendship not found",
            });
        }

        // Remove each user from the other's friends array
        await User.findByIdAndUpdate(userId, {
            $pull: { friends: friendId }
        });
        await User.findByIdAndUpdate(friendId, {
            $pull: { friends: userId }
        });

        res.status(200).json({
            success: true,
            message: "Friend removed successfully",
        });
    } catch (error) {
        console.error("Remove Friend Error:", error);
        res.status(500).json({
            success: false,
            message: "Server error while removing friend",
            error: error.message,
        });
    }
};

/**
 * Get sent friend requests (pending)
 * @route GET /api/friends/sent
 */
export const getSentRequests = async (req, res) => {
    try {
        const userId = req.user._id;

        const requests = await FriendRequest.aggregate([
            {
                $match: {
                    sender: userId,
                    status: "pending"
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "receiver",
                    foreignField: "_id",
                    as: "receiver"
                }
            },
            { $unwind: "$receiver" },
            {
                $lookup: {
                    from: "profiles",
                    localField: "receiver._id",
                    foreignField: "user",
                    as: "receiverProfile"
                }
            },
            {
                $unwind: {
                    path: "$receiverProfile",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    _id: 1,
                    status: 1,
                    createdAt: 1,
                    receiver: {
                        _id: "$receiver._id",
                        username: "$receiver.username",
                        email: "$receiver.email",
                        avatar: { $ifNull: ["$receiverProfile.avatar", "$receiver.avatar"] },
                        firstname: "$receiverProfile.firstname",
                        lastname: "$receiverProfile.lastname",
                        publicKey: "$receiver.publicKey"
                    }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            count: requests.length,
            data: requests,
        });
    } catch (error) {
        console.error("Get Sent Requests Error:", error);
        res.status(500).json({
            success: false,
            message: "Server error while fetching sent requests",
            error: error.message,
        });
    }
};
