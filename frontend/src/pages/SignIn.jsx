import React, { useContext, useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import { IoEye, IoEyeOff } from "react-icons/io5"
import { useNavigate } from 'react-router-dom'
import { userDataContext } from '../context/UserContext'
import axios from "axios"
import { gsap } from 'gsap'

const CyberInput = styled.div`
  .cyber-input-group {
    position: relative;
    margin: 1.5rem 0;
  }

  .cyber-input {
    width: 100%;
    padding: 1rem;
    background: rgba(20, 20, 30, 0.8);
    border: 2px solid #6b21ff;
    border-radius: 0;
    color: #f0f0ff;
    font-family: 'Courier New', monospace;
    font-size: 1rem;
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    box-shadow: 0 0 0 0 rgba(107, 33, 255, 0.4);
  }

  .cyber-input:focus {
    outline: none;
    border-color: #a855f7;
    box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.3);
    background: rgba(30, 30, 40, 0.9);
  }

  .cyber-label {
    position: absolute;
    left: 1rem;
    top: 1rem;
    color: #a855f7;
    pointer-events: none;
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    font-size: 1rem;
    background: rgba(10, 10, 20, 0.9);
    padding: 0 0.5rem;
  }

  .cyber-input:focus ~ .cyber-label,
  .cyber-input:not(:placeholder-shown) ~ .cyber-label {
    top: -0.6rem;
    left: 0.8rem;
    font-size: 0.8rem;
    color: #d8b4fe;
    text-shadow: 0 0 5px rgba(216, 180, 254, 0.5);
  }
`

const CyberToggle = styled.div`
  .cyber-toggle-container {
    position: relative;
    width: 60px;
    height: 30px;
    margin: 20px auto;
    perspective: 1000px;
  }

  .cyber-toggle-input {
    position: absolute;
    opacity: 0;
    width: 100%;
    height: 100%;
    z-index: 2;
    cursor: pointer;
  }

  .cyber-toggle-track {
    position: absolute;
    width: 100%;
    height: 100%;
    background: linear-gradient(145deg, #1e1b2e, #2a2540);
    border: 1px solid #6b21ff;
    border-radius: 15px;
    box-shadow: 
      inset 0 1px 3px rgba(0, 0, 0, 0.3),
      0 0 10px rgba(107, 33, 255, 0.5);
    transition: all 0.3s ease;
  }

  .cyber-toggle-thumb {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 24px;
    height: 24px;
    background: linear-gradient(145deg, #a855f7, #7e22ce);
    border-radius: 50%;
    box-shadow: 
      0 2px 5px rgba(0, 0, 0, 0.3),
      0 0 10px rgba(168, 85, 247, 0.8);
    transform: translateX(0);
    transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    z-index: 1;
  }

  .cyber-toggle-input:checked ~ .cyber-toggle-track {
    background: linear-gradient(145deg, #2a2540, #1e1b2e);
    box-shadow: 
      inset 0 1px 3px rgba(0, 0, 0, 0.3),
      0 0 15px rgba(168, 85, 247, 0.8);
  }

  .cyber-toggle-input:checked ~ .cyber-toggle-thumb {
    transform: translateX(30px);
    background: linear-gradient(145deg, #7e22ce, #a855f7);
    box-shadow: 
      0 2px 5px rgba(0, 0, 0, 0.3),
      0 0 15px rgba(168, 85, 247, 1);
  }

  .cyber-toggle-glitch {
    position: absolute;
    width: 100%;
    height: 100%;
    background: repeating-linear-gradient(
      45deg,
      transparent,
      transparent 2px,
      rgba(168, 85, 247, 0.1) 2px,
      rgba(168, 85, 247, 0.1) 4px
    );
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .cyber-toggle-input:hover ~ .cyber-toggle-glitch {
    opacity: 0.3;
  }

  .cyber-toggle-input:checked ~ .cyber-toggle-glitch {
    opacity: 0.5;
  }
`

function SignIn() {
  const [showPassword, setShowPassword] = useState(false)
  const { serverUrl, setUserData } = useContext(userDataContext)
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [password, setPassword] = useState("")
  const [err, setErr] = useState("")
  const formRef = useRef(null)
  const logoRef = useRef(null)
  const particlesRef = useRef([])
  const particlesContainerRef = useRef(null)

  useEffect(() => {
    // Matrix rain effect
    const canvas = document.createElement('canvas')
    canvas.style.position = 'absolute'
    canvas.style.top = '0'
    canvas.style.left = '0'
    canvas.style.zIndex = '0'
    canvas.style.opacity = '0.05'
    document.body.appendChild(canvas)
    
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    
    const ctx = canvas.getContext('2d')
    const katakana = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン'
    const latin = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const nums = '0123456789'
    const alphabet = katakana + latin + nums
    
    const fontSize = 16
    const columns = canvas.width / fontSize
    const rainDrops = []
    
    for (let x = 0; x < columns; x++) {
      rainDrops[x] = 1
    }
    
    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      ctx.fillStyle = '#a855f7'
      ctx.font = fontSize + 'px monospace'
      
      for (let i = 0; i < rainDrops.length; i++) {
        const text = alphabet.charAt(Math.floor(Math.random() * alphabet.length))
        ctx.fillText(text, i * fontSize, rainDrops[i] * fontSize)
        
        if (rainDrops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          rainDrops[i] = 0
        }
        rainDrops[i]++
      }
    }
    
    const interval = setInterval(draw, 30)
    
    return () => {
      clearInterval(interval)
      document.body.removeChild(canvas)
    }
  }, [])

  const handleSignIn = async (e) => {
    e.preventDefault()
    setErr("")
    setLoading(true)
    try {
      let result = await axios.post(`${serverUrl}/api/auth/signin`, {
        email, password
      }, { withCredentials: true })
      setUserData(result.data)
      setLoading(false)
      navigate("/")
    } catch (error) {
      console.log(error)
      setUserData(null)
      setLoading(false)
      setErr(error.response.data.message)
    }
  }

  return (
    <div className='w-full min-h-screen bg-black flex items-center justify-center p-4 sm:p-6 relative overflow-hidden'>
      {/* Cyber Grid Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-purple-900/10 to-black"></div>
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: `
            linear-gradient(rgba(107, 33, 255, 0.2) 1px, transparent 1px),
            linear-gradient(90deg, rgba(107, 33, 255, 0.2) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      {/* VEDA Logo */}
      <div ref={logoRef} className="absolute top-6 left-6 z-20">
        <div className="flex items-center">
          <div className="bg-black text-purple-400 font-bold text-2xl sm:text-3xl px-4 py-2 rounded border-2 border-purple-500 shadow-lg shadow-purple-500/20 font-mono">
            VEDA<span className="text-purple-300">_SYSTEMS</span>
          </div>
          <div className="ml-2 text-xs sm:text-sm text-purple-300 font-mono italic">
            Virtual_Evolutionary<br />Digital_Assistant
          </div>
        </div>
      </div>

      {/* Main form */}
      <form 
        ref={formRef}
        className='w-full max-w-md bg-black/90 backdrop-blur-sm rounded-lg shadow-xl p-6 sm:p-8 flex flex-col gap-6 relative z-10 border border-purple-500/50'
        onSubmit={handleSignIn}
      >
        {/* Cyber Toggle Switch */}
        <div className="flex justify-center items-center mb-4">
          <CyberToggle>
            <div className="cyber-toggle-container">
              <input 
                type="checkbox" 
                className="cyber-toggle-input" 
                defaultChecked
                onClick={() => navigate("/signup")}
              />
              <div className="cyber-toggle-track"></div>
              <div className="cyber-toggle-thumb"></div>
              <div className="cyber-toggle-glitch"></div>
            </div>
          </CyberToggle>
          <span className="text-purple-300 font-mono ml-4 text-sm">SWITCH_TO_SIGNUP</span>
        </div>

        <h1 className='text-white text-2xl sm:text-3xl font-bold text-center mb-6 font-mono tracking-wider border-b border-purple-500/50 pb-3'>
          <span className="text-purple-400">[</span> 
          SYSTEM_AUTHENTICATION 
          <span className="text-purple-400">]</span>
        </h1>
        
        <p className="text-purple-300 text-center text-sm mb-2 font-mono tracking-wider">
          ENTER_CREDENTIALS_FOR_NETWORK_ACCESS
        </p>

        {/* Cyberpunk Input fields */}
        <CyberInput>
          <div className="cyber-input-group">
            <input 
              type="email" 
              className="cyber-input" 
              placeholder=" "
              required 
              onChange={(e) => setEmail(e.target.value)} 
              value={email}
            />
            <label className="cyber-label">EMAIL_ADDRESS</label>
          </div>
          
          <div className="cyber-input-group">
            <input 
              type={showPassword ? "text" : "password"} 
              className="cyber-input pr-12" 
              placeholder=" "
              required 
              onChange={(e) => setPassword(e.target.value)} 
              value={password}
            />
            <label className="cyber-label">PASSWORD</label>
            <button 
              type="button" 
              className='absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-400 hover:text-purple-300 transition-colors'
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <IoEyeOff className='w-5 h-5' />
              ) : (
                <IoEye className='w-5 h-5' />
              )}
            </button>
          </div>
        </CyberInput>
        
        {err && (
          <div className="px-4 py-3 bg-red-900/30 border border-red-700/50 rounded text-red-300 text-sm flex items-center animate-pulse font-mono">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            ERROR: {err}
          </div>
        )}
        
        <button 
          className={`w-full py-3.5 rounded font-semibold text-lg relative overflow-hidden group ${
            loading ? 'bg-gray-800 cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900'
          } transition-all duration-300 shadow-lg hover:shadow-purple-500/30 border border-purple-500/50 font-mono tracking-wider`}
          disabled={loading}
        >
          <span className="relative z-10 flex items-center justify-center">
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                VERIFYING_CREDENTIALS...
              </>
            ) : (
              <>
                INITIATE_LOGIN_SEQUENCE
                <svg className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </>
            )}
          </span>
          <span className="absolute inset-0 bg-gradient-to-r from-purple-500 to-purple-700 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></span>
        </button>
        
        <div className="flex items-center justify-between pt-2">
          <p className='text-purple-300 text-sm font-mono'>
            NEW_USER?{' '}
            <button 
              type="button" 
              className='text-purple-400 hover:text-purple-200 font-medium transition-colors underline'
              onClick={() => navigate("/signup")}
            >
              REQUEST_ACCESS
            </button>
          </p>
        </div>
      </form>
    </div>
  )
}

export default SignIn
