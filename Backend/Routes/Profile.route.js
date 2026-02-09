import express from 'express'
import { createProfile, getMyProfile, updateProfile } from '../Controllers/Profile.controller.js';
import { getUserById } from '../Controllers/User.controller.js';
import { protect } from '../Middleware/token.js';

const router = express.Router()

router.post("/profile", protect, createProfile)
router.get("/profile/me", protect, getMyProfile)
router.get("/profile/:userId", protect, getUserById)
router.put("/profile", protect, updateProfile)
export default router;