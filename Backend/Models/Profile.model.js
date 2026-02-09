import mongoose from "mongoose";
import User from "./User.model.js";
const profileschema=new mongoose.Schema({

    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true,
        unique:true
    },
    firstname:{
        type:String,
        required:true
    },
    lastname:{
        type:String,
        required:false,
    },
    bio:{
        type:String,
        maxLength:50
    },
    course:{
        type:String,
        required:true
    },
    year:{
        type:String,
        required:true
    },
    avatar:{
        type:String
    },
    interest:{
        type:String
    }
},{timestamps:true}
)
export default mongoose.model("Profile",profileschema)