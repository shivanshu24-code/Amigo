import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../Models/User.model.js";
import Otp from "../Models/Otp.model.js";
import crypto from "crypto";
// import sendEmail from "../Utils/Sendemail.js"
import Profile from "../Models/Profile.model.js";
/* ===================== LOGIN ===================== */
export const login = async (req, res) => {
  console.log("LOGIN BODY:", req.body);

  try {
    console.log("🔥 REAL LOGIN CONTROLLER HIT");

    const { identifier, password } = req.body;

    const user = await User.findOne({
      $or: [
        { email: identifier },
        { username: identifier }
      ]
    }).select("+password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // If user has a profile, we might want to get the avatar from there too
    let userAvatar = user.avatar;
    if (user.hasProfile && !userAvatar) {
      const profile = await Profile.findOne({ user: user._id }).select("avatar");
      userAvatar = profile?.avatar || null;
    }

    return res.json({
      success: true,
      token, // 🔥 MUST BE PRESENT
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        hasProfile: user.hasProfile,
        isPrivate: user.isPrivate,
        readReceiptsEnabled: user.readReceiptsEnabled !== false,
        tagInStoryPermission: user.tagInStoryPermission || "anyone",
        mentionPermission: user.mentionPermission || "anyone",
        avatar: userAvatar,
        savedPosts: user.savedPosts || [],
      },
    });

  } catch (error) {
    console.error("LOGIN ERROR:", error);
    res.status(500).json({ message: "Login failed" });
  }
};


/* SIGNUP  */
export const signup = async (req, res) => {
  try {
    console.log("SIGNUP HIT");

    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    if (!email.endsWith("@bennett.edu.in")) {
      return res.status(403).json({ message: "Only Bennett users allowed" });
    }

    let user = await User.findOne({ email });

    if (user && user.isVerified) {
      return res.status(409).json({
        message: "User already exists. Please login.",
      });
    }

    if (!user) {
      user = await User.create({
        email,
        isVerified: false,
      });
    }
    // localStorage.setItem("pending Email",email)
    const otpCode = crypto.randomInt(100000, 999999).toString();

    // Keep only the latest OTP for this user to avoid stale-code conflicts
    await Otp.deleteMany({ userId: user._id });

    await Otp.create({
      userId: user._id,
      otp: otpCode,
      type: "EMAIL_VERIFY",
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    console.log("OTP CREATED:", otpCode);

    return res.status(200).json({
      success: true,
      message: "Signup passed (OTP created)",
    });

  } catch (error) {
    console.error("SIGNUP ERROR:", error);
    return res.status(500).json({
      message: "Signup failed",
      error: error.message,
    });
  }
};
export const setPassword = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1️⃣ Validate
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters"
      });
    }

    // 2️⃣ Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        message: "Email not verified"
      });
    }

    if (user.password) {
      return res.status(400).json({
        message: "Password already set"
      });
    }

    // 3️⃣ Set password
    user.password = await bcrypt.hash(password, 10);
    user.isVerified = true;
    await user.save();

    // 4️⃣ Issue JWT
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      message: "Password set successfully",
      token,
      user: {
        id: user._id,
        email: user.email
      }
    });

  } catch (err) {
    console.error("SET PASSWORD ERROR:", err);
    res.status(500).json({
      message: "Failed to set password"
    });
  }
};







//   await sendEmail({
//     to: email,
//     subject: "Amigo Verification Code",
//     text: `Your verification code is ${otpCode}. It expires in 5 minutes.`,
//   });

//   res.status(200).json({
//     success: true,
//     message: "OTP sent to email",
//   });
// } catch (error) {
//   res.status(500).json({ message: "Signup failed", error: error.message });


/* ===================== CHECK AUTH ===================== */
export const checkAuth = async (req, res) => {
  const user = await User.findById(req.user._id).select(
    "_id email username hasProfile savedPosts isPrivate readReceiptsEnabled tagInStoryPermission mentionPermission"
  );

  let avatar = null;

  if (user.hasProfile) {
    const profile = await Profile.findOne({ user: user._id }).select("avatar");
    avatar = profile?.avatar || null;
  }

  res.json({
    success: true,
    user: {
      ...user.toObject(),
      avatar, // ✅ attach avatar
    },
  });
};
export const logout = async (req, res) => {
  try {
    // 🔥 Nothing to invalidate on server for JWT
    return res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Logout failed",
    });
  }
};

export const updatePrivacy = async (req, res) => {
  try {
    const userId = (req.user?._id || req.user?.id);
    const { isPrivate } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { isPrivate },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: `Account is now ${isPrivate ? "private" : "public"}`,
      isPrivate: user.isPrivate,
    });
  } catch (error) {
    console.error("UPDATE PRIVACY ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to update privacy" });
  }
};

export const updateTagsAndMentions = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { tagInStoryPermission, mentionPermission } = req.body;
    const allowedValues = ["anyone", "friends"];
    const updates = {};

    if (tagInStoryPermission !== undefined) {
      if (!allowedValues.includes(tagInStoryPermission)) {
        return res.status(400).json({
          success: false,
          message: "Invalid tagInStoryPermission value"
        });
      }
      updates.tagInStoryPermission = tagInStoryPermission;
    }

    if (mentionPermission !== undefined) {
      if (!allowedValues.includes(mentionPermission)) {
        return res.status(400).json({
          success: false,
          message: "Invalid mentionPermission value"
        });
      }
      updates.mentionPermission = mentionPermission;
    }

    const user = await User.findByIdAndUpdate(userId, updates, { new: true });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      tagInStoryPermission: user.tagInStoryPermission,
      mentionPermission: user.mentionPermission
    });
  } catch (error) {
    console.error("UPDATE TAGS AND MENTIONS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update tags and mentions settings"
    });
  }
};

export const updateReadReceipts = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { readReceiptsEnabled } = req.body;

    if (typeof readReceiptsEnabled !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "readReceiptsEnabled must be a boolean",
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { readReceiptsEnabled },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      readReceiptsEnabled: user.readReceiptsEnabled,
    });
  } catch (error) {
    console.error("UPDATE READ RECEIPTS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update read receipts setting",
    });
  }
};
