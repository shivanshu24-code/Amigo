import Profile from "../Models/Profile.model.js";
import User from "../Models/User.model.js";

/* ================= CREATE PROFILE ================= */
export const createProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    const {
      firstname,
      lastname,
      bio,
      course,
      year,
      avatar,
      interest,
      username,
    } = req.body;

    // 🔒 Username required
    if (!username) {
      return res.status(400).json({ message: "Username is required" });
    }

    // 🔒 Check username uniqueness (excluding self)
    const taken = await User.findOne({
      username,
      _id: { $ne: userId },
    });

    if (taken) {
      return res.status(400).json({ message: "Username already taken" });
    }

    // 🔒 Prevent duplicate profiles
    const existingProfile = await Profile.findOne({ user: userId });
    if (existingProfile) {
      return res.status(400).json({
        message: "Profile already exists",
      });
    }

    // ✅ Create profile
    const profile = await Profile.create({
      user: userId,
      firstname,
      lastname,
      bio,
      course,
      year,
      avatar,
      interest,
    });

    // ✅ Update User (THIS WAS MISSING)
    await User.findByIdAndUpdate(userId, {
      hasProfile: true,
      username,
      avatar: avatar
    });

    res.status(201).json(profile);
  } catch (error) {
    console.error("CREATE PROFILE ERROR:", error);
    res.status(500).json({
      message: "Failed to create profile",
    });
  }
};

/* ================= GET MY PROFILE ================= */
export const getMyProfile = async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user._id })
      .populate("user", "email username avatar");

    if (!profile) {
      return res.status(404).json({
        message: "Profile not found",
      });
    }

    const responseData = {
      ...profile.toObject(),
      userId: profile.user._id,
      email: profile.user.email,
      username: profile.user.username,
      avatar: profile.avatar || profile.user.avatar,
    };

    res.json(responseData);
  } catch (error) {
    console.error("GET PROFILE ERROR:", error);
    res.status(500).json({
      message: "Failed to fetch profile",
    });
  }
};

/* ================= UPDATE PROFILE ================= */
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { username, avatar, ...otherUpdates } = req.body;

    // 1. Handle User updates (username, avatar)
    const userUpdates = {};

    if (username) {
      // Check if username is taken by another user
      const taken = await User.findOne({ username, _id: { $ne: userId } });
      if (taken) {
        return res.status(400).json({ message: "Username already taken" });
      }
      userUpdates.username = username;
    }

    if (avatar) {
      userUpdates.avatar = avatar;
    }

    // Update User model if there are changes
    if (Object.keys(userUpdates).length > 0) {
      await User.findByIdAndUpdate(userId, userUpdates);
    }

    // 2. Handle Profile updates
    // If avatar is updated, update it in Profile too
    const profileUpdates = { ...otherUpdates };
    if (avatar) profileUpdates.avatar = avatar;

    const profile = await Profile.findOneAndUpdate(
      { user: userId },
      profileUpdates,
      { new: true }
    ).populate("user", "email username avatar");

    if (!profile) {
      return res.status(404).json({
        message: "Profile not found",
      });
    }

    res.json(profile);
  } catch (error) {
    console.error("UPDATE PROFILE ERROR:", error);
    res.status(500).json({
      message: "Failed to update profile",
    });
  }
};
