 import uploadOnCloudinary from "../config/cloudinary.js"
import geminiResponse from "../gemini.js"
import User from "../models/user.model.js"
import moment from "moment"
 export const getCurrentUser=async (req,res)=>{
    try {
        const userId=req.userId
        const user=await User.findById(userId).select("-password")
        if(!user){
return res.status(400).json({message:"user not found"})
        }

   return res.status(200).json(user)     
    } catch (error) {
       return res.status(400).json({message:"get current user error"}) 
    }
}

export const updateAssistant=async (req,res)=>{
   try {
      const {assistantName,imageUrl}=req.body
      let assistantImage;
if(req.file){
   assistantImage=await uploadOnCloudinary(req.file.path)
}else{
   assistantImage=imageUrl
}

const user=await User.findByIdAndUpdate(req.userId,{
   assistantName,assistantImage
},{new:true}).select("-password")
return res.status(200).json(user)

      
   } catch (error) {
       return res.status(400).json({message:"updateAssistantError user error"}) 
   }
}


export const askToAssistant=async (req,res)=>{
   try {
      const {command}=req.body
      const user=await User.findById(req.userId);
      user.history.push(command)
      user.save()
      const userName=user.name
      const assistantName=user.assistantName
      const result=await geminiResponse(command,assistantName,userName)

      // geminiResponse now always returns a JSON string
      let gemResult
      try {
        gemResult = typeof result === 'string' ? JSON.parse(result) : result
      } catch (parseErr) {
        const jsonMatch = result?.match(/{[\s\S]*}/)
        if (!jsonMatch) {
          return res.status(400).json({ response: "Sorry, I can't understand" })
        }
        gemResult = JSON.parse(jsonMatch[0])
      }

      console.log(gemResult)
      const type=gemResult.type

      switch(type){
         case 'get-date' :
            return res.json({
               type,
               userInput:gemResult.userInput,
               response:`Current date is ${moment().format("YYYY-MM-DD")}`
            });
            case 'get-time':
                return res.json({
               type,
               userInput:gemResult.userInput,
               response:`Current time is ${moment().format("hh:mm A")}`
            });
             case 'get-day':
                return res.json({
               type,
               userInput:gemResult.userInput,
               response:`Today is ${moment().format("dddd")}`
            });
            case 'get-month':
                return res.json({
               type,
               userInput:gemResult.userInput,
               response:`The current month is ${moment().format("MMMM")}`
            });
      case 'google-search':
      case 'youtube-search':
      case 'youtube-play':
      case 'general':
      case 'calculator-open':
      case 'instagram-open': 
      case 'facebook-open': 
      case 'weather-show':
      case 'whatsapp-open':
      case 'twitter-open':
      case 'linkedin-open':
      case 'spotify-open':
      case 'github-open':
      case 'reddit-open':
      case 'amazon-open':
      case 'snapchat-open':
      case 'telegram-open':
      case 'gmail-open':
      case 'maps-open':
      case 'pinterest-open':
      case 'news-show':
      case 'joke-tell':
      case 'translate':
      case 'music-play':
      case 'app-open':
         return res.json({
            type,
            userInput:gemResult.userInput,
            response:gemResult.response,
            ...(gemResult.appName ? { appName: gemResult.appName } : {}),
            ...(gemResult.targetLang ? { targetLang: gemResult.targetLang } : {}),
         });

         default:
            return res.status(400).json({ response: "I didn't understand that command." })
      }
     

   } catch (error) {
  return res.status(500).json({ response: "ask assistant error" })
   }
}

export const updateHistory = async (req, res) => {
  try {
    const { history } = req.body
    const user = await User.findByIdAndUpdate(
      req.userId,
      { history },
      { new: true }
    ).select("-password")
    return res.status(200).json(user)
  } catch (error) {
    return res.status(400).json({ message: "update history error" })
  }
}

// Search through chat history
export const searchHistory = async (req, res) => {
  try {
    const { query } = req.query
    if (!query || !query.trim()) {
      return res.status(400).json({ message: "Search query is required" })
    }
    const user = await User.findById(req.userId).select("history")
    if (!user) return res.status(404).json({ message: "User not found" })

    const lowerQuery = query.toLowerCase()
    const results = user.history
      .map((item, index) => ({ text: item, index }))
      .filter(({ text }) => text.toLowerCase().includes(lowerQuery))

    return res.status(200).json({ results, total: results.length })
  } catch (error) {
    return res.status(500).json({ message: "search history error" })
  }
}

// Clear all chat history
export const clearHistory = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.userId,
      { history: [] },
      { new: true }
    ).select("-password")
    return res.status(200).json(user)
  } catch (error) {
    return res.status(400).json({ message: "clear history error" })
  }
}

// Delete a single history item by index
export const deleteHistoryItem = async (req, res) => {
  try {
    const { index } = req.params
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ message: "User not found" })

    const idx = parseInt(index)
    if (isNaN(idx) || idx < 0 || idx >= user.history.length) {
      return res.status(400).json({ message: "Invalid history index" })
    }

    user.history.splice(idx, 1)
    await user.save()
    return res.status(200).json(user)
  } catch (error) {
    return res.status(500).json({ message: "delete history item error" })
  }
}