import React, { useContext, useEffect, useRef, useState } from 'react'
import { userDataContext } from '../context/UserContext'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { CgMenuRight, CgLogOut } from "react-icons/cg"
import { RxCross1 } from "react-icons/rx"
import { gsap } from 'gsap'
import Orb from '../components/orb'

function Home() {
  const { userData, serverUrl, setUserData, getGeminiResponse } = useContext(userDataContext)
  const navigate = useNavigate()
  const [listening, setListening] = useState(false)
  const [userText, setUserText] = useState("")
  const [aiText, setAiText] = useState("")
  const [inputText, setInputText] = useState("")
  const [messages, setMessages] = useState([])
  const isSpeakingRef = useRef(false)
  const recognitionRef = useRef(null)
  const [ham, setHam] = useState(false)
  const isRecognizingRef = useRef(false)
  const synth = window.speechSynthesis
  const containerRef = useRef(null)
  const logoRef = useRef(null)
  const orbRef = useRef(null)
  const messagesEndRef = useRef(null)

  useEffect(() => {
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
      particle.className = 'absolute rounded-full bg-purple-500/30'
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

    return () => {
      particles.forEach(p => p.remove())
    }
  }, [])

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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
        console.log("Recognition requested to start")
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
      isSpeakingRef.current = false
      setTimeout(() => {
        startRecognition()
      }, 800)
    }
    synth.cancel()
    synth.speak(utterance)
  }

  const handleCommand = async (data) => {
    const { type, userInput, response } = data
    setMessages(prev => [...prev, { text: response, sender: 'ai' }])
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

  const handleTextSubmit = async (e) => {
    e.preventDefault()
    if (!inputText.trim()) return

    const userMessage = inputText
    setInputText("")
    setMessages(prev => [...prev, { text: userMessage, sender: 'user' }])

    try {
      recognitionRef.current?.stop()
      isRecognizingRef.current = false
      setListening(false)

      const data = await getGeminiResponse(userMessage)
      await handleCommand(data)
    } catch (error) {
      console.error("Error getting response:", error)
      setMessages(prev => [...prev, { 
        text: "SYSTEM_ERROR: REQUEST_FAILED", 
        sender: 'ai' 
      }])
    }
  }

  useEffect(() => {
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
          console.log("Recognition requested to start")
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
      console.log("Recognition started")
    }

    recognition.onend = () => {
      isRecognizingRef.current = false
      setListening(false)
      console.log("Recognition ended")
      if (isMounted && !isSpeakingRef.current) {
        setTimeout(() => {
          if (isMounted) {
            try {
              recognition.start()
              console.log("Recognition restarted")
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
              console.log("Recognition restarted after error")
            } catch (e) {
              if (e.name !== "InvalidStateError") console.error(e)
            }
          }
        }, 1000)
      }
    }

    recognition.onresult = async (e) => {
      const transcript = e.results[e.results.length - 1][0].transcript.trim()
      console.log("Recognized:", transcript)
      if (transcript.toLowerCase().includes(userData.assistantName.toLowerCase())) {
        setMessages(prev => [...prev, { text: transcript, sender: 'user' }])
        recognition.stop()
        isRecognizingRef.current = false
        setListening(false)
        const data = await getGeminiResponse(transcript)
        await handleCommand(data)
      }
    }

    const greeting = new SpeechSynthesisUtterance(`ACCESS_GRANTED. USER: ${userData.name}. SYSTEM_READY.`)
    greeting.lang = 'hi-IN'
    window.speechSynthesis.speak(greeting)

    // Add initial greeting message
    setMessages([{ text: `SYSTEM: [VEDA_AI] ONLINE. USER_ID: ${userData.name}. QUERY?`, sender: 'ai' }])

    return () => {
      isMounted = false
      clearTimeout(startTimeout)
      recognition.stop()
      setListening(false)
      isRecognizingRef.current = false
    }
  }, [])

  return (
    <div 
      ref={containerRef}
      className='w-full min-h-screen bg-black text-purple-300 overflow-hidden relative'
    >
      {/* Matrix Grid Overlay */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
        backgroundImage: `
          linear-gradient(rgba(107, 33, 255, 0.2) 1px, transparent 1px),
          linear-gradient(90deg, rgba(107, 33, 255, 0.2) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px'
      }}></div>

      {/* Header Bar */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-black/90 backdrop-blur-lg z-20 flex justify-between items-center px-6 border-b border-purple-500/50">
        {/* Cyberpunk VEDA Logo */}
        <div ref={logoRef} className="flex items-center">
          <div className="bg-black text-purple-400 font-bold text-2xl sm:text-3xl px-4 py-2 rounded border-2 border-purple-500 shadow-lg shadow-purple-500/20 font-mono">
            VEDA<span className="text-purple-300">_AI</span>
          </div>
          <div className="ml-2 text-xs sm:text-sm text-purple-300 font-mono italic hidden sm:block">
            VIRTUAL_DIGITAL_ASSISTANT
          </div>
        </div>

        {/* Desktop Logout Button - Top Right */}
        <button 
          className='hidden lg:flex items-center gap-2 text-purple-300 bg-black hover:bg-purple-900/50 rounded-lg px-4 py-2 transition-colors border border-purple-500/50 font-mono'
          onClick={handleLogOut}
        >
          <CgLogOut className="w-5 h-5" />
          <span className="hidden sm:inline">LOG_OUT</span>
        </button>

        {/* Mobile Hamburger Menu */}
        <CgMenuRight 
          className='lg:hidden text-purple-300 w-6 h-6 cursor-pointer hover:text-purple-200 transition-colors' 
          onClick={() => setHam(true)}
        />
      </div>

      {/* Mobile Sidebar */}
      <div className={`
        fixed lg:hidden top-0 right-0 w-3/4 h-full bg-black/95 backdrop-blur-lg 
        p-6 flex flex-col gap-6 z-30 transition-transform duration-300 ease-in-out
        ${ham ? "translate-x-0" : "translate-x-full"} border-l border-purple-500/30
      `}>
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-purple-300 font-mono">MENU</h2>
          <RxCross1 
            className='text-purple-300 w-6 h-6 cursor-pointer hover:text-purple-200 transition-colors' 
            onClick={() => setHam(false)}
          />
        </div>
        
        <button 
          className='flex items-center justify-center gap-2 text-purple-300 bg-black hover:bg-purple-900/50 rounded-lg px-4 py-3 transition-colors w-full border border-purple-500/50 font-mono'
          onClick={handleLogOut}
        >
          <CgLogOut className="w-5 h-5" />
          LOG_OUT
        </button>

        <div className='w-full h-px bg-purple-500/30'></div>
        
        <h1 className='text-lg font-semibold text-purple-300 font-mono'>HISTORY</h1>
        
        <div className='flex-1 overflow-y-auto'>
          {userData.history?.length > 0 ? (
            userData.history.map((his, index) => (
              <div 
                key={index} 
                className='text-purple-400 py-2 border-b border-purple-500/30 hover:text-white transition-colors cursor-pointer font-mono text-sm'
              >
                {his}
              </div>
            ))
          ) : (
            <p className="text-purple-500/70 py-2 font-mono">NO_HISTORY_FOUND</p>
          )}
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-black/90 backdrop-blur-lg p-6 border-r border-purple-500/30">
        <div className="flex flex-col h-full">
          <h1 className='text-lg font-semibold text-purple-300 mb-4 font-mono'>HISTORY</h1>
          
          <div className='flex-1 overflow-y-auto mb-6'>
            {userData.history?.length > 0 ? (
              userData.history.map((his, index) => (
                <div 
                  key={index} 
                  className='text-purple-400 py-2 border-b border-purple-500/30 hover:text-white transition-colors cursor-pointer font-mono text-sm'
                >
                  {his}
                </div>
              ))
            ) : (
              <p className="text-purple-500/70 py-2 font-mono">NO_HISTORY_FOUND</p>
            )}
          </div>

          {/* Desktop Sidebar Logout Button - Bottom */}
          <button 
            className='flex items-center justify-center gap-2 text-purple-300 bg-black hover:bg-purple-900/50 rounded-lg px-4 py-3 transition-colors mt-auto border border-purple-500/50 font-mono'
            onClick={handleLogOut}
          >
            <CgLogOut className="w-5 h-5" />
            LOG_OUT
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content lg:ml-64 pt-20 p-6 flex flex-col items-center justify-between min-h-screen">
        {/* Orb Container */}
        <div 
          ref={orbRef}
          className="w-full max-w-2xl h-96 relative mb-8 rounded-2xl overflow-hidden border border-purple-500/50 shadow-xl"
        >
          <Orb
            hoverIntensity={0.5}
            rotateOnHover={true}
            hue={280} // Purple hue
            forceHoverState={false}
            className="w-full h-full"
          />
        </div>

        {/* Chat Container */}
        <div className="w-full max-w-2xl bg-black/70 backdrop-blur-sm rounded-xl p-6 border border-purple-500/50 flex flex-col">
          <div className="flex-1 overflow-y-auto max-h-64 mb-4">
            {messages.map((message, index) => (
              <div 
                key={index} 
                className={`mb-3 p-3 rounded-lg border ${message.sender === 'user' 
                  ? 'bg-purple-900/20 ml-auto border-purple-500/30' 
                  : 'bg-black/50 mr-auto border-purple-500/30'}`}
              >
                <p className={`font-mono ${message.sender === 'user' ? 'text-purple-300' : 'text-purple-200'}`}>
                  <strong>{message.sender === 'user' ? 'USER:' : 'VEDA_AI:'} </strong>
                  {message.text}
                </p>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form onSubmit={handleTextSubmit} className="flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="ENTER_COMMAND..."
              className="flex-1 bg-black/70 text-purple-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 border border-purple-500/30 font-mono"
            />
            <button 
              type="submit"
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors border border-purple-500/50 font-mono"
            >
              SEND
            </button>
          </form>

          {/* Listening Indicator */}
          <div className="mt-4 flex justify-center items-center">
            <div className={`w-4 h-4 rounded-full ${listening ? 'bg-green-500 animate-pulse' : 'bg-red-500'} border border-white/50`}></div>
            <p className="ml-2 text-purple-300 font-mono">
              {listening ? 'SYSTEM_ACTIVE: LISTENING...' : 'SYSTEM_STANDBY'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
