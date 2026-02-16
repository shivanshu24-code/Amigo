import User from "../Models/User.model.js";
import Otp from "../Models/Otp.model.js";
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        message: "Email and OTP are required"
      });
    }

    const user = await User.findOne({ email });

    if (!user)
      return res.status(404).json({ message: "User not found" });

    if (user.isVerified) {
      return res.status(400).json({
        message: "User already verified"
      });
    }

    // 🔥 Find OTP record only by user + type
    const record = await Otp.findOne({
      userId: user._id,
      type: "EMAIL_VERIFY"
    });

    if (!record)
      return res.status(400).json({
        message: "OTP not found"
      });

    // 🔥 Check expiry
    if (record.expiresAt < new Date()) {
      await Otp.deleteMany({ userId: user._id });

      return res.status(400).json({
        message: "OTP expired"
      });
    }

    // 🔥 Validate OTP
    if (record.otp !== otp) {
      return res.status(400).json({
        message: "Invalid OTP"
      });
    }

    // 🔥 Mark verified
    user.isVerified = true;
    await user.save();

    // 🔥 Delete OTP after success
    await Otp.deleteMany({ userId: user._id });

    return res.json({
      success: true,
      message: "Email verified successfully"
    });

  } catch (error) {
    console.error("VERIFY OTP ERROR:", error);

    return res.status(500).json({
      message: "OTP verification failed"
    });
  }
};
