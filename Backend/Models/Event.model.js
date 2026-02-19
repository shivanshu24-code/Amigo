import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    date: {
        type: Date,
        required: true
    },
    // Event is removed 24h after the event day ends
    expiresAt: {
        type: Date,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['festival', 'competition', 'cultural', 'academic', 'other'],
        default: 'other'
    },
    color: {
        type: String,
        enum: ['purple', 'blue', 'pink', 'green', 'orange'],
        default: 'blue'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, { timestamps: true });

// MongoDB TTL cleanup (removes docs when expiresAt is reached)
eventSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Event = mongoose.model("Event", eventSchema);
