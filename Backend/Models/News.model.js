import mongoose from "mongoose";

const newsSchema = new mongoose.Schema({
    headline: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        trim: true
    },
    isNew: {
        type: Boolean,
        default: true
    },
    // Auto-delete news 24 hours after creation
    expiresAt: {
        type: Date,
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, { timestamps: true });

// TTL index: remove document when expiresAt is reached
newsSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const News = mongoose.model("News", newsSchema);
export default News;
