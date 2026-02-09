import jwt from "jsonwebtoken";
import User from "../Models/User.model.js";

export const protect = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;

    if (!auth || !auth.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = auth.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("PROTECT ERROR:", err.message);
    return res.status(401).json({ message: "Token invalid" });
  }
};

/**
 * Optional authentication middleware
 * Sets req.user if valid token, otherwise continues without auth
 * Used for routes that work with or without authentication (e.g., viewing public posts)
 */
export const optionalProtect = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;

    if (!auth || !auth.startsWith("Bearer ")) {
      req.user = null;
      return next();
    }

    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    req.user = user || null;
    next();
  } catch (err) {
    // Token invalid, continue without auth
    req.user = null;
    next();
  }
};
