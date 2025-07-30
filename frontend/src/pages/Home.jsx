import React, { useContext, useEffect, useRef, useState } from 'react'
import { userDataContext } from '../context/UserContext'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { CgMenuRight, CgLogOut } from "react-icons/cg";
import { RxCross1 } from "react-icons/rx";
import { gsap } from 'gsap';
import Orb from '../components/orb';

function Home() {
  const { userData, serverUrl, setUserData, getGeminiResponse } = useContext(userDataContext)
  const navigate = useNavigate()
  const [listening, setListening] = useState(true)
  const [userText, setUserText] = useState("")
  const [aiText, setAiText] = useState("")
  const isSpeakingRef = useRef(false)
  const recognitionRef = useRef(null)
  const [ham, setHam] = useState(false)
  const isRecognizingRef = useRef(false)
  const synth = window.speechSynthesis
  const containerRef = useRef(null)
  const logoRef = useRef(null)
  const orbRef = useRef(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userData) {
      navigate("/signin")
      return
    }

    setLoading(false)
    
    // GSAP animations
    gsap.from(logoRef.current, {
      duration: 1,
      opacity: 0,
      y: -50,
      ease: "elastic.out(1, 0.5)"
    })

    gsap.from(".main-content", {
      duration: 1,
      opacity: 0,
      y: 50,
      delay: 0.5,
      ease: "power3.out"
    })

    // Particle effect for orb container
    const particles = []
    for (let i = 0; i < 20; i++) {
      const particle = document.createElement('div')
      particle.className = 'absolute rounded-full bg-blue-500/20'
      particle.style.width = `${Math.random() * 10 + 5}px`
      particle.style.height = particle.style.width
      particle.style.left = `${Math.random() * 100}%`
      particle.style.top = `${Math.random() * 100}%`
      orbRef.current.appendChild(particle)
      particles.push(particle)

      gsap.to(particle, {
        x: `${(Math.random() - 0.5) * 100}`,
        y: `${(Math.random() - 0.5) * 100}`,
        duration: Math.random() * 10 + 10,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      })
    }

    // Initial greeting
    const greeting = new SpeechSynthesisUtterance(`Hello ${userData?.name || 'there'}, what can I help you with?`)
    greeting.lang = 'hi-IN'
    window.speechSynthesis.speak(greeting)

    return () => {
      particles.forEach(p => p.remove())
    }
  }, [userData, navigate])

  const handleLogOut = async () => {
    try {
      await axios.get(`${serverUrl}/api/auth/logout`, { withCredentials: true })
      setUserData(null)
      navigate("/signin")
    } catch (error) {
      setUserData(null)
      console.log(error)
    }
  }

  const startRecognition = () => {
    if (!isSpeakingRef.current && !isRecognizingRef.current) {
      try {
        recognitionRef.current?.start()
      } catch (error) {
        if (error.name !== "InvalidStateError") {
          console.error("Start error:", error)
        }
      }
    }
  }

  const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'hi-IN'
    const voices = window.speechSynthesis.getVoices()
    const hindiVoice = voices.find(v => v.lang === 'hi-IN')
    if (hindiVoice) {
      utterance.voice = hindiVoice
    }

    isSpeakingRef.current = true
    utterance.onend = () => {
      setAiText("")
      isSpeakingRef.current = false
      setTimeout(() => {
        startRecognition()
      }, 800)
    }
    synth.cancel()
    synth.speak(utterance)
  }

  const handleCommand = (data) => {
    const { type, userInput, response } = data
    speak(response)

    const commands = {
      'google-search': `https://www.google.com/search?q=${encodeURIComponent(userInput)}`,
      'calculator-open': 'https://www.google.com/search?q=calculator',
      'instagram-open': 'https://www.instagram.com/',
      'facebook-open': 'https://www.facebook.com/',
      'weather-show': 'https://www.google.com/search?q=weather',
      'youtube-search': `https://www.youtube.com/results?search_query=${encodeURIComponent(userInput)}`,
      'youtube-play': `https://www.youtube.com/results?search_query=${encodeURIComponent(userInput)}`
    }

    if (commands[type]) {
      window.open(commands[type], '_blank')
    }
  }

  useEffect(() => {
    if (!userData) return

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()

    recognition.continuous = true
    recognition.lang = 'en-US'
    recognition.interimResults = false

    recognitionRef.current = recognition

    let isMounted = true

    const startTimeout = setTimeout(() => {
      if (isMounted && !isSpeakingRef.current && !isRecognizingRef.current) {
        try {
          recognition.start()
        } catch (e) {
          if (e.name !== "InvalidStateError") {
            console.error(e)
          }
        }
      }
    }, 1000)

    recognition.onstart = () => {
      isRecognizingRef.current = true
      setListening(true)
    }

    recognition.onend = () => {
      isRecognizingRef.current = false
      setListening(false)
      if (isMounted && !isSpeakingRef.current) {
        setTimeout(() => {
          if (isMounted) {
            try {
              recognition.start()
            } catch (e) {
              if (e.name !== "InvalidStateError") console.error(e)
            }
          }
        }, 1000)
      }
    }

    recognition.onerror = (event) => {
      console.warn("Recognition error:", event.error)
      isRecognizingRef.current = false
      setListening(false)
      if (event.error !== "aborted" && isMounted && !isSpeakingRef.current) {
        setTimeout(() => {
          if (isMounted) {
            try {
              recognition.start()
            } catch (e) {
              if (e.name !== "InvalidStateError") console.error(e)
            }
          }
        }, 1000)
      }
    }

    recognition.onresult = async (e) => {
      const transcript = e.results[e.results.length - 1][0].transcript.trim()
      if (userData?.assistantName && transcript.toLowerCase().includes(userData.assistantName.toLowerCase())) {
        setAiText("")
        setUserText(transcript)
        recognition.stop()
        isRecognizingRef.current = false
        setListening(false)
        const data = await getGeminiResponse(transcript)
        handleCommand(data)
        setAiText(data.response)
        setUserText("")
      }
    }

    return () => {
      isMounted = false
      clearTimeout(startTimeout)
      recognition.stop()
      setListening(false)
      isRecognizingRef.current = false
    }
  }, [userData, getGeminiResponse])

  if (loading || !userData) {
    return (
      <div className="w-full min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    )
  }

  return (
    <div 
      ref={containerRef}
      className='w-full min-h-screen bg-gray-900 text-white overflow-hidden relative'
    >
      {/* VEDA Logo */}
      <div ref={logoRef} className="absolute top-6 left-6 z-20">
        <div className="flex items-center">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold text-2xl sm:text-3xl px-4 py-2 rounded-lg shadow-lg">
            VEDA
          </div>
          <div className="ml-2 text-xs sm:text-sm text-gray-300 font-light italic">
            Virtual Evolutionary<br />Digital Assistant
          </div>
        </div>
      </div>

      {/* Mobile Hamburger Menu */}
      <CgMenuRight 
        className='lg:hidden text-white absolute top-6 right-6 w-6 h-6 z-20 cursor-pointer' 
        onClick={() => setHam(true)}
      />

      {/* Mobile Sidebar */}
      <div className={`
        fixed lg:hidden top-0 right-0 w-3/4 h-full bg-gray-800/90 backdrop-blur-lg 
        p-6 flex flex-col gap-6 z-30 transition-transform duration-300 ease-in-out
        ${ham ? "translate-x-0" : "translate-x-full"}
      `}>
        <RxCross1 
          className='text-white absolute top-6 right-6 w-6 h-6 cursor-pointer' 
          onClick={() => setHam(false)}
        />
        
        <button 
          className='flex items-center gap-2 text-white bg-gray-700 hover:bg-gray-600 rounded-lg px-4 py-3 transition-colors'
          onClick={handleLogOut}
        >
          <CgLogOut className="w-5 h-5" />
          Log Out
        </button>

        <div className='w-full h-px bg-gray-600'></div>
        
        <h1 className='text-lg font-semibold text-gray-300'>History</h1>
        
        <div className='flex-1 overflow-y-auto'>
          {userData?.history?.length > 0 ? (
            userData.history.map((his, index) => (
              <div 
                key={index} 
                className='text-gray-400 py-2 border-b border-gray-700 hover:text-white transition-colors cursor-pointer'
              >
                {his}
              </div>
            ))
          ) : (
            <p className="text-gray-500 py-2">No history yet</p>
          )}
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block fixed left-0 top-0 h-full w-64 bg-gray-800/80 backdrop-blur-lg p-6 border-r border-gray-700">
        <div className="flex flex-col h-full">
          <button 
            className='flex items-center gap-2 text-white bg-gray-700 hover:bg-gray-600 rounded-lg px-4 py-3 mb-6 transition-colors'
            onClick={handleLogOut}
          >
            <CgLogOut className="w-5 h-5" />
            Log Out
          </button>

          <div className='w-full h-px bg-gray-600 mb-6'></div>
          
          <h1 className='text-lg font-semibold text-gray-300 mb-4'>History</h1>
          
          <div className='flex-1 overflow-y-auto'>
            {userData?.history?.length > 0 ? (
              userData.history.map((his, index) => (
                <div 
                  key={index} 
                  className='text-gray-400 py-2 border-b border-gray-700 hover:text-white transition-colors cursor-pointer'
                >
                  {his}
                </div>
              ))
            ) : (
              <p className="text-gray-500 py-2">No history yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content lg:ml-64 p-6 flex flex-col items-center justify-center min-h-screen">
        {/* Orb Container */}
        <div 
          ref={orbRef}
          className="w-full max-w-2xl h-96 relative mb-8 rounded-2xl overflow-hidden border border-gray-700/50 shadow-xl"
        >
          <Orb
            hoverIntensity={0.5}
            rotateOnHover={true}
            hue={0}
            forceHoverState={false}
            className="w-full h-full"
          />
        </div>

        {/* Assistant Info */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 mb-2">
            I'm {userData?.assistantName || 'VEDA'}
          </h1>
          <p className="text-gray-400">Your Virtual Evolutionary Digital Assistant</p>
        </div>

        {/* Interaction Area */}
        <div className="w-full max-w-2xl bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
          {userText && (
            <div className="mb-4 p-4 bg-gray-700 rounded-lg">
              <p className="text-blue-300">You: {userText}</p>
            </div>
          )}
          
          {aiText && (
            <div className="p-4 bg-gray-700 rounded-lg">
              <p className="text-purple-300">{userData?.assistantName || 'VEDA'}: {aiText}</p>
            </div>
          )}

          <div className="mt-6 flex justify-center">
            <div className={`w-4 h-4 rounded-full ${listening ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <p className="ml-2 text-gray-400">
              {listening ? 'Listening...' : 'Not listening'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
