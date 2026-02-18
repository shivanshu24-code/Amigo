import mongoose from "mongoose";

const storySchema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    media: [
        {
            type: String,
            required: true
        }
    ],
    caption: {
        type: String,
        maxlength: 500
    },
    // Track who viewed this story
    viewers: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        viewedAt: {
            type: Date,
            default: Date.now
        }
    }],
    // Mentioned users in the story with positioning
    mentions: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        x: { type: Number, default: 50 },
        y: { type: Number, default: 70 }
    }],
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 1 }
    },
    isArchived: {
        type: Boolean,
        default: false
    },
    visibility: {
        type: String,
        enum: ["Everyone", "CloseFriends"],
        default: "Everyone"
    }
}, { timestamps: true });

// Index for efficient viewer queries
storySchema.index({ "viewers.user": 1 });

export default mongoose.model("Story", storySchema);
