import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["EMAIL_VERIFY"],
    default: "EMAIL_VERIFY"
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 }
  },
}, { timestamps: true });

export default mongoose.model("Otp", otpSchema);
