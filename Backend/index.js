import dotenv from "dotenv";


dotenv.config({
  path: "./.env"
});
import { configureCloudinary } from "./Config/Cloudinary.js";
configureCloudinary()
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createServer } from "node:http";

import { connectdb } from "./DB/ConnectDB.js";
import { initializeSocket } from "./Socket/SocketManager.js";

import authroute from "./Routes/Auth.routes.js";
import user from "./Routes/User.routes.js";
import storyroute from "./Routes/Story.routes.js";
import likeroute from "./Routes/Like.route.js";
import commentroute from "./Routes/Comment.routes.js"
import profileroute from "./Routes/Profile.route.js"
import postroute from "./Routes/Post.routes.js";
import friendroute from "./Routes/Friend.routes.js";
import chatroute from "./Routes/Chat.routes.js";
import eventroute from "./Routes/Event.routes.js";
import newsroute from "./Routes/News.routes.js";

const app = express();
const server = createServer(app);
app.use(cookieParser());

// ✅ Middleware
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use((req, res, next) => {
  console.log("➡️ INCOMING:", req.method, req.originalUrl);
  next();
});


// ✅ Routes
app.use("/api/auth", authroute);
app.use("/api/users", user);
app.use("/api", storyroute);
app.use("/api/post", postroute)
app.use("/api", profileroute)
app.use("/api", likeroute)
app.use("/api/comment", commentroute)
app.use("/api/friends", friendroute)
app.use("/api/chat", chatroute)
app.use("/api/events", eventroute)
app.use("/api/news", newsroute)

authroute.stack.forEach((r) => {
  if (r.route) {
    console.log(
      Object.keys(r.route.methods)[0].toUpperCase(),
      "/api/auth" + r.route.path
    );
  }
});

// ✅ Socket.io - using SocketManager
initializeSocket(server);

// ✅ Start server
const port = process.env.PORT || 3000;

connectdb().then(() => {
  server.listen(port, () => {
    console.log("Server is running on port:", port);
  });
});
