import { toggleLike } from "../Controllers/Like.controller.js";
import express from "express";
import{protect} from '../Middleware/token.js'

const router=express.Router()

router.post("/post/:id/like",protect,toggleLike)
export default router