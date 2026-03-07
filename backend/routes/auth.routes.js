import express from "express"
import { Login, logOut, signUp, googleAuth } from "../controllers/auth.controllers.js"

const authRouter=express.Router()

authRouter.post("/signup",signUp)
authRouter.post("/signin",Login)
authRouter.post("/google",googleAuth)
authRouter.get("/logout",logOut)
export default authRouter