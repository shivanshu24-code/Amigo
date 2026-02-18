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
    encryptedKey: {
        type: String, // AES key encrypted with recipient's public key
    },
    encryptedKeys: {
        type: Map,
        of: String, // per-user encrypted AES keys for group E2EE (keyed by userId)
    },
    encryptionIV: {
        type: String, // IV for AES decryption
    },
    attachment: {
        url: { type: String },
        fileName: { type: String },
        mimeType: { type: String },
        fileSize: { type: Number },
        resourceType: { type: String, enum: ["image", "video", "audio", "raw"] },
    }
}, { timestamps: true });

// Custom validation: either text or sharedPost or sharedStory must be present
messageSchema.path('text').validate(function (value) {
    // If text is empty/undefined, one of sharedPost/sharedStory/attachment must exist
    if (!value && !this.sharedPost && !this.sharedStory && !this.attachment?.url) {
        return false;
    }
    return true;
}, 'Message must have either text, a shared post, a shared story, or an attachment');

// Index for efficient message queries
messageSchema.index({ conversationId: 1, createdAt: -1 });

export default mongoose.model("Message", messageSchema);
