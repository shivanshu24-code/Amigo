import User from "../Models/User.model.js";
import Otp from "../Models/Otp.model.js";
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const record = await Otp.findOne({
      userId: user._id,
      otp,
      expiresAt: { $gt: Date.now() },
    });

    if (!record) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.isVerified = true;
    await user.save();

    await Otp.deleteMany({ userId: user._id });

    res.json({ success: true, message: "Email verified" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
