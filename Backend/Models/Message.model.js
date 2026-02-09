import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Conversation",
        required: true,
    },
    text: {
        type: String,
        trim: true,
    },
    sharedPost: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
    },
    sharedStory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Story",
    },
    read: {
        type: Boolean,
        default: false,
    },
    deletedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }],
    isDeletedForEveryone: {
        type: Boolean,
        default: false,
    },
    isStoryReply: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

// Custom validation: either text or sharedPost or sharedStory must be present
messageSchema.path('text').validate(function (value) {
    // If text is empty/undefined, sharedPost or sharedStory must exist
    if (!value && !this.sharedPost && !this.sharedStory) {
        return false;
    }
    return true;
}, 'Message must have either text, a shared post, or a shared story');

// Index for efficient message queries
messageSchema.index({ conversationId: 1, createdAt: -1 });

export default mongoose.model("Message", messageSchema);

