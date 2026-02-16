import mongoose from "mongoose";
const userschema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        match: /@bennett\.edu\.in$/,

    },
    password: {

        type: String,
        select: false
    },
    username: {
        type: String,
        unique: true,
        sparse: true,
        minlength: 3
    },

    isVerified: {
        type: Boolean,
        default: false
    },
    hasProfile: {
        type: Boolean,
        default: false,
    },
    avatar: {
        type: String
    },
    friends: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    savedPosts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post"
    }],
    publicKey: {
        type: String,
        default: null
    }
}, { timestamps: true })
export default mongoose.model("User", userschema)