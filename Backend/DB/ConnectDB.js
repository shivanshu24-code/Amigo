import mongoose from "mongoose";
export const connectdb= async()=>{
    try {
        const conn= await mongoose.connect(`${process.env.MONGODB_URL}`)
        console.log(`MongoDB Connected: ${conn.connection.host}` )
    } catch (error) {
        console.log("Error in connecting MongoDB:",error.message)
        process.exit(1)
        
    }
}
