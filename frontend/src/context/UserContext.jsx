import axios from 'axios'
import React, { createContext, useEffect, useState } from 'react'
import { GoogleOAuthProvider } from '@react-oauth/google'

export const userDataContext=createContext()

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

function UserContext({children}) {
    const serverUrl= import.meta.env.VITE_SERVER_URL || "https://veda-tqui.onrender.com"
    const [userData,setUserData]=useState(null)
    const [frontendImage,setFrontendImage]=useState(null)
     const [backendImage,setBackendImage]=useState(null)
     const [selectedImage,setSelectedImage]=useState(null)
     const [authLoading, setAuthLoading]=useState(true)

    const handleCurrentUser=async ()=>{
        try {
            setAuthLoading(true)
            const result=await axios.get(`${serverUrl}/api/user/current`,{withCredentials:true})
            setUserData(result.data)
        } catch (error) {
            console.log(error)
            setUserData(null)
        } finally {
            setAuthLoading(false)
        }
    }

    const handleGoogleAuth = async (credential) => {
        try {
            const result = await axios.post(`${serverUrl}/api/auth/google`, { credential }, { withCredentials: true })
            setUserData(result.data)
            return result.data
        } catch (error) {
            console.error('Google auth error:', error)
            throw error
        }
    }

    const getGeminiResponse=async (command)=>{
try {
  const result=await axios.post(`${serverUrl}/api/user/asktoassistant`,{command},{withCredentials:true})
  return result.data
} catch (error) {
  console.log(error)
}
    }

    useEffect(()=>{
handleCurrentUser()
    },[])
    const value={
serverUrl,userData,setUserData,backendImage,setBackendImage,frontendImage,setFrontendImage,selectedImage,setSelectedImage,getGeminiResponse,handleGoogleAuth,authLoading
    }
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <userDataContext.Provider value={value}>
      {children}
      </userDataContext.Provider>
    </GoogleOAuthProvider>
  )
}

export default UserContext
