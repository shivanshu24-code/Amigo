import jwt from "jsonwebtoken";
import cookie from "cookie";

const socketAuth = async (socket, next) => {
  try {
    // Parse cookies manually
    const cookies = cookie.parse(socket.request.headers.cookie || "");
    const token = cookies.token;

    if (!token) {
      return next(new Error("Not authenticated"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    socket.userId = decoded.userId;

    next();
  } catch (error) {
    next(new Error("Authentication failed"));
  }
};

export default socketAuth;
