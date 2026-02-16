import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    }],
    isGroup: {
        type: Boolean,
        default: false,
    },
    groupName: {
        type: String,
        trim: true,
    },
    groupAdmin: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }],
    groupAvatar: {
        type: String,
    },
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
    },
}, { timestamps: true });

// Index for finding conversations by participants
conversationSchema.index({ participants: 1 });

// Ensure unique conversation between two users for 1-on-1 chats
conversationSchema.index(
    { participants: 1 },
    {
        unique: true,
        partialFilterExpression: {
            "participants.1": { $exists: true },
            "isGroup": false
        }
    }
);

export default mongoose.model("Conversation", conversationSchema);
