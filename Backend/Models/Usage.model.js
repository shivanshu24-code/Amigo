import mongoose from "mongoose";

const usageSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    date: {
        type: String, // Format: YYYY-MM-DD
        required: true,
        index: true
    },
    secondsSpent: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

// Ensure unique record per user per day
usageSchema.index({ userId: 1, date: 1 }, { unique: true });

const Usage = mongoose.model("Usage", usageSchema);

export default Usage;
