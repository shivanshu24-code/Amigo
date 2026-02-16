import User from "../Models/User.model.js";
import mongoose from "mongoose";

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
                    hasProfile: 1
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
                    hasProfile: 1
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
