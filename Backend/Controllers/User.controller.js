import User from "../Models/User.model.js";
import mongoose from "mongoose";
import FriendRequest from "../Models/FriendRequest.model.js";

/**
 * Fetch all users from the database
 * @route GET /api/users
 */
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.aggregate([
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
                    isVerified: 1,
                    avatar: { $ifNull: ["$profile.avatar", "$avatar"] },
                    firstname: "$profile.firstname",
                    lastname: "$profile.lastname",
                    bio: "$profile.bio",
                    course: "$profile.course",
                    year: "$profile.year",
                    interest: "$profile.interest",
                    friends: 1,
                    hasProfile: 1,
                    isPrivate: 1
                }
            }
        ]);

        res.status(200).json({
            success: true,
            count: users.length,
            data: users,
        });
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({
            success: false,
            message: "Server error while fetching users",
            error: error.message,
        });
    }
};

export const getUserById = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user?._id;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID"
            });
        }

        const targetUser = await User.findById(userId).select("isPrivate friends");
        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const isSelf = currentUserId && targetUser._id.toString() === currentUserId.toString();
        const isFriend = targetUser.friends?.some(
            (friendId) => friendId.toString() === currentUserId?.toString()
        );

        if (targetUser.isPrivate && !isSelf && !isFriend) {
            return res.status(403).json({
                success: false,
                message: "This account is private. Only friends can view this profile."
            });
        }

        const user = await User.aggregate([
            {
                $match: { _id: new mongoose.Types.ObjectId(userId) }
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
                    isVerified: 1,
                    avatar: { $ifNull: ["$profile.avatar", "$avatar"] },
                    firstname: "$profile.firstname",
                    lastname: "$profile.lastname",
                    bio: "$profile.bio",
                    course: "$profile.course",
                    year: "$profile.year",
                    interest: "$profile.interest",
                    friends: 1,
                    hasProfile: 1,
                    isPrivate: 1
                }
            }
        ]);

        if (!user || user.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).json(user[0]);
    } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({
            success: false,
            message: "Server error while fetching user",
            error: error.message
        });
    }
};

/**
 * Block a user
 * @route POST /api/users/block/:userId
 */
export const blockUser = async (req, res) => {
    try {
        const currentUserId = req.user._id;
        const targetUserId = req.params.userId;

        if (currentUserId.toString() === targetUserId) {
            return res.status(400).json({
                success: false,
                message: "You cannot block yourself"
            });
        }

        const currentUser = await User.findById(currentUserId).select("friends");
        const targetUser = await User.findById(targetUserId).select("friends");
        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const wasFriend = (currentUser?.friends || []).some(
            (friendId) => friendId.toString() === targetUserId
        );

        const blockerUpdate = {
            $addToSet: {
                blockedUsers: targetUserId,
                ...(wasFriend ? { blockedFormerFriends: targetUserId } : {})
            },
            $pull: {
                friends: targetUserId,
                closeFriends: targetUserId
            }
        };
        await User.findByIdAndUpdate(currentUserId, blockerUpdate);

        await User.findByIdAndUpdate(targetUserId, {
            $pull: {
                friends: currentUserId,
                closeFriends: currentUserId
            }
        });

        await FriendRequest.deleteMany({
            $or: [
                { sender: currentUserId, receiver: targetUserId },
                { sender: targetUserId, receiver: currentUserId }
            ]
        });

        return res.status(200).json({
            success: true,
            message: "User blocked successfully"
        });
    } catch (error) {
        console.error("BLOCK USER ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to block user"
        });
    }
};

/**
 * Unblock a user
 * @route DELETE /api/users/block/:userId
 */
export const unblockUser = async (req, res) => {
    try {
        const currentUserId = req.user._id;
        const targetUserId = req.params.userId;

        const currentUser = await User.findById(currentUserId).select("blockedFormerFriends");
        const wasFriendBeforeBlock = (currentUser?.blockedFormerFriends || []).some(
            (id) => id.toString() === targetUserId
        );

        await User.findByIdAndUpdate(currentUserId, {
            $pull: {
                blockedUsers: targetUserId,
                blockedFormerFriends: targetUserId
            }
        });

        // Restore friendship automatically if they were friends before block.
        if (wasFriendBeforeBlock) {
            await User.findByIdAndUpdate(currentUserId, {
                $addToSet: { friends: targetUserId }
            });
            await User.findByIdAndUpdate(targetUserId, {
                $addToSet: { friends: currentUserId }
            });
        }

        return res.status(200).json({
            success: true,
            message: wasFriendBeforeBlock
                ? "User unblocked and friendship restored"
                : "User unblocked successfully",
            restoredFriendship: wasFriendBeforeBlock
        });
    } catch (error) {
        console.error("UNBLOCK USER ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to unblock user"
        });
    }
};

/**
 * Get blocked users
 * @route GET /api/users/blocked
 */
export const getBlockedUsers = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .populate("blockedUsers", "username avatar email")
            .lean();

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: user.blockedUsers || []
        });
    } catch (error) {
        console.error("GET BLOCKED USERS ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch blocked users"
        });
    }
};
