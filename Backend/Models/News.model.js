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
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, { timestamps: true });

const News = mongoose.model("News", newsSchema);
export default News;
