import { getAllUsers, getUserById } from "../Controllers/User.controller.js";
import express from "express";

const router = express.Router();

router.get("/allUsers", getAllUsers);
router.get("/user/:userId", getUserById);

export default router;