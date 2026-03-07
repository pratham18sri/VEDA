import express from "express"
import { askToAssistant, getCurrentUser, updateAssistant, updateHistory, searchHistory, clearHistory, deleteHistoryItem } from "../controllers/user.controllers.js"
import isAuth from "../middlewares/isAuth.js"
import upload from "../middlewares/multer.js"

const userRouter=express.Router()

userRouter.get("/current",isAuth,getCurrentUser)
userRouter.post("/update",isAuth,upload.single("assistantImage"),updateAssistant)
userRouter.post("/asktoassistant",isAuth,askToAssistant)
userRouter.post("/update-history",isAuth,updateHistory)
userRouter.get("/search-history",isAuth,searchHistory)
userRouter.delete("/clear-history",isAuth,clearHistory)
userRouter.delete("/delete-history/:index",isAuth,deleteHistoryItem)

export default userRouter