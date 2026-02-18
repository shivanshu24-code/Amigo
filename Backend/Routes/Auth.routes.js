import express from "express";
import { signup, login, checkAuth, setPassword, logout, updatePrivacy, updateTagsAndMentions } from "../Controllers/Auth.controller.js";
import { protect } from "../Middleware/token.js"
import { verifyOtp } from "../Controllers/verifyOtp.controller.js";
const router = express.Router();


console.log("AUTH ROUTES FILE LOADED");

router.post("/signup",
  (req, res, next) => {
    console.log("HIT /signup ROUTE");
    next();
  },
  signup
);

router.post("/login", login)
router.post("/verifyotp", verifyOtp)
router.post("/setpassword", setPassword)
router.post("/logout", logout)
router.get("/check-auth", protect, checkAuth);
router.put("/privacy", protect, updatePrivacy);
router.put("/tags-mentions", protect, updateTagsAndMentions);

export default router;
