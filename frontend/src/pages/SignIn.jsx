import React, { useContext, useState, useEffect, useRef } from 'react'
import bg from "../assets/authBg.png"
import { IoEye, IoEyeOff } from "react-icons/io5";
import { useNavigate } from 'react-router-dom';
import { userDataContext } from '../context/UserContext';
import axios from "axios"
import { gsap } from 'gsap';

function SignIn() {
  const [showPassword, setShowPassword] = useState(false)
  const { serverUrl, userData, setUserData } = useContext(userDataContext)
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
    // Logo animation
    gsap.from(logoRef.current, {
      duration: 1.5,
      opacity: 0,
      y: -50,
      ease: "elastic.out(1, 0.5)"
    })

    // Form animation
    gsap.from(formRef.current, {
      duration: 1,
      opacity: 0,
      y: 50,
      delay: 0.5,
      ease: "power3.out"
    })

    // Create floating particles
    const createParticles = () => {
      const container = particlesContainerRef.current
      if (!container) return

      const particleCount = 15
      const particles = []

      for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div')
        particle.className = 'absolute rounded-full bg-blue-500/20'
        particle.style.width = `${Math.random() * 10 + 5}px`
        particle.style.height = particle.style.width
        particle.style.left = `${Math.random() * 100}%`
        particle.style.top = `${Math.random() * 100}%`
        container.appendChild(particle)
        particles.push(particle)
      }

      particlesRef.current = particles

      // Animate particles
      particles.forEach((particle, i) => {
        const duration = Math.random() * 10 + 10
        const delay = Math.random() * 5
        const x = (Math.random() - 0.5) * 100
        const y = (Math.random() - 0.5) * 100

        gsap.to(particle, {
          x: `+=${x}`,
          y: `+=${y}`,
          duration: duration,
          delay: delay,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut"
        })
      })
    }

    createParticles()

    return () => {
      particlesRef.current.forEach(particle => {
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle)
        }
      })
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
    <div className='w-full min-h-screen bg-cover bg-center flex items-center justify-center p-4 sm:p-6 relative overflow-hidden' style={{ backgroundImage: `url(${bg})` }}>
      {/* Particles container */}
      <div ref={particlesContainerRef} className="absolute inset-0 overflow-hidden z-0"></div>
      
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

      {/* Main form */}
      <form 
        ref={formRef}
        className='w-full max-w-md bg-gray-900/80 backdrop-blur-lg rounded-2xl shadow-2xl p-6 sm:p-8 flex flex-col gap-6 relative z-10 border border-gray-700/50'
        onSubmit={handleSignIn}
      >
        <h1 className='text-white text-2xl sm:text-3xl font-bold text-center mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500'>
          Welcome Back
        </h1>
        
        <p className="text-gray-300 text-center text-sm mb-2">
          Sign in to continue your journey with VEDA
        </p>

        {/* Input fields */}
        <div className="space-y-5">
          <div className="relative group">
            <input 
              type="email" 
              placeholder=' ' 
              className='w-full px-5 py-3 bg-gray-800/70 border border-gray-700 rounded-xl text-white 
              placeholder-transparent peer focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all'
              required 
              onChange={(e) => setEmail(e.target.value)} 
              value={email}
            />
            <label className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none 
              transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm 
              peer-focus:top-0 peer-focus:text-xs peer-focus:text-blue-400 peer-placeholder-shown:scale-100 
              peer-focus:scale-90 peer-placeholder-shown:-translate-y-1/2 peer-focus:-translate-y-3 bg-gray-900/80 px-1">
              Email Address
            </label>
          </div>
          
          <div className="relative group">
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder=' ' 
              className='w-full px-5 py-3 bg-gray-800/70 border border-gray-700 rounded-xl text-white 
              placeholder-transparent peer focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all pr-12'
              required 
              onChange={(e) => setPassword(e.target.value)} 
              value={password}
            />
            <label className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none 
              transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm 
              peer-focus:top-0 peer-focus:text-xs peer-focus:text-blue-400 peer-placeholder-shown:scale-100 
              peer-focus:scale-90 peer-placeholder-shown:-translate-y-1/2 peer-focus:-translate-y-3 bg-gray-900/80 px-1">
              Password
            </label>
            <button 
              type="button" 
              className='absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-400 transition-colors'
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <IoEyeOff className='w-5 h-5' />
              ) : (
                <IoEye className='w-5 h-5' />
              )}
            </button>
          </div>
        </div>
        
        {err && (
          <div className="px-4 py-3 bg-red-900/30 border border-red-700/50 rounded-lg text-red-300 text-sm flex items-center animate-pulse">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {err}
          </div>
        )}
        
        <button 
          className={`w-full py-3.5 rounded-xl font-semibold text-lg relative overflow-hidden group ${
            loading ? 'bg-gray-700 cursor-not-allowed' : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
          } transition-all duration-300 shadow-lg hover:shadow-blue-500/30`}
          disabled={loading}
        >
          <span className="relative z-10 flex items-center justify-center">
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing In...
              </>
            ) : (
              <>
                Sign In
                <svg className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </>
            )}
          </span>
          <span className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></span>
        </button>
        
        <div className="flex items-center justify-between pt-2">
          
          
          <p className='text-gray-400 text-sm'>
            New to VEDA?{' '}
            <button 
              type="button" 
              className='text-blue-400 hover:text-blue-300 font-medium transition-colors'
              onClick={() => navigate("/signup")}
            >
              Sign Up
            </button>
          </p>
        </div>
      </form>
    </div>
  )
}

export default SignIn