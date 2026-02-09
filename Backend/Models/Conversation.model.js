import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    }],
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
    },
}, { timestamps: true });

// Index for finding conversations by participants
conversationSchema.index({ participants: 1 });

// Ensure unique conversation between two users
conversationSchema.index(
    { participants: 1 },
    {
        unique: true,
        partialFilterExpression: { "participants.1": { $exists: true } }
    }
);

export default mongoose.model("Conversation", conversationSchema);
