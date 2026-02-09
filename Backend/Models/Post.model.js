import mongoose from 'mongoose';
const Postschema=new mongoose.Schema({
    author:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true

    },
    caption:{
        type:String,
    },

    media:{
        type:String
    },
    visibility:{
        type:String,
        enum:["Connection","Followers","Public"],
        default:"Connection"
    },
    likes:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"User"
        }
    ],
    comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Comment"
  }],
    
  aspectRatio: {
  type: String,
  enum: ["1:1", "4:5", "9:16"],
  default: "1:1"
}

},
{timestamps:true})
export default mongoose.model("Post",Postschema)