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

export const Event = mongoose.model("Event", eventSchema);
