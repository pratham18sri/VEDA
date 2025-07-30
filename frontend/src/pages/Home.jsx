import React, { useContext, useEffect, useRef, useState } from 'react';
import { userDataContext } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CgMenuRight, CgLogOut } from "react-icons/cg";
import { RxCross1 } from "react-icons/rx";
import { gsap } from 'gsap';
import Orb from '../components/orb';

function Home() {
  const { userData, serverUrl, setUserData, getGeminiResponse } = useContext(userDataContext);
  const navigate = useNavigate();
  const [listening, setListening] = useState(false);
  const [userText, setUserText] = useState("");
  const [aiText, setAiText] = useState("");
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState([]);
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const isSpeakingRef = useRef(false);
  const recognitionRef = useRef(null);
  const [ham, setHam] = useState(false);
  const isRecognizingRef = useRef(false);
  const synth = window.speechSynthesis;
  const containerRef = useRef(null);
  const logoRef = useRef(null);
  const orbRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Set mounted state and verify user data
  useEffect(() => {
    setIsMounted(true);
    
    if (!userData) {
      navigate("/signin");
      return;
    }

    setLoading(false);
    
    return () => {
      setIsMounted(false);
      // Stop any ongoing speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      // Cancel any ongoing speech
      synth.cancel();
    };
  }, [userData, navigate, synth]);

  // Run animations only after component is mounted and user data is loaded
  useEffect(() => {
    if (!isMounted || loading) return;

    // GSAP animations with null checks
    if (logoRef.current) {
      gsap.from(logoRef.current, {
        duration: 1,
        opacity: 0,
        y: -50,
        ease: "elastic.out(1, 0.5)"
      });
    }

    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      gsap.from(mainContent, {
        duration: 1,
        opacity: 0,
        y: 50,
        delay: 0.5,
        ease: "power3.out"
      });
    }

    // Particle effect with null check
    if (orbRef.current) {
      const particles = [];
      for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'absolute rounded-full bg-blue-500/20';
        particle.style.width = `${Math.random() * 10 + 5}px`;
        particle.style.height = particle.style.width;
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        orbRef.current.appendChild(particle);
        particles.push(particle);

        gsap.to(particle, {
          x: `${(Math.random() - 0.5) * 100}`,
          y: `${(Math.random() - 0.5) * 100}`,
          duration: Math.random() * 10 + 10,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut"
        });
      }

      return () => {
        particles.forEach(p => {
          if (p && p.parentNode) {
            p.parentNode.removeChild(p);
          }
        });
      };
    }
  }, [isMounted, loading]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleLogOut = async () => {
    try {
      await axios.get(`${serverUrl}/api/auth/logout`, { withCredentials: true });
      setUserData(null);
      navigate("/signin");
    } catch (error) {
      setUserData(null);
      console.log(error);
    }
  };

  const startRecognition = () => {
    if (!isSpeakingRef.current && !isRecognizingRef.current && recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        if (error.name !== "InvalidStateError") {
          console.error("Start error:", error);
        }
      }
    }
  };

  const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'hi-IN';
    const voices = window.speechSynthesis.getVoices();
    const hindiVoice = voices.find(v => v.lang === 'hi-IN');
    if (hindiVoice) {
      utterance.voice = hindiVoice;
    }

    isSpeakingRef.current = true;
    utterance.onend = () => {
      isSpeakingRef.current = false;
      setTimeout(() => {
        startRecognition();
      }, 800);
    };
    synth.cancel();
    synth.speak(utterance);
  };

  const handleCommand = async (data) => {
    const { type, userInput, response } = data;
    setMessages(prev => [...prev, { text: response, sender: 'ai' }]);
    speak(response);

    const commands = {
      'google-search': `https://www.google.com/search?q=${encodeURIComponent(userInput)}`,
      'calculator-open': 'https://www.google.com/search?q=calculator',
      'instagram-open': 'https://www.instagram.com/',
      'facebook-open': 'https://www.facebook.com/',
      'weather-show': 'https://www.google.com/search?q=weather',
      'youtube-search': `https://www.youtube.com/results?search_query=${encodeURIComponent(userInput)}`,
      'youtube-play': `https://www.youtube.com/results?search_query=${encodeURIComponent(userInput)}`
    };

    if (commands[type]) {
      window.open(commands[type], '_blank');
    }
  };

  const handleTextSubmit = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMessage = inputText;
    setInputText("");
    setMessages(prev => [...prev, { text: userMessage, sender: 'user' }]);

    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      isRecognizingRef.current = false;
      setListening(false);

      const data = await getGeminiResponse(userMessage);
      await handleCommand(data);
    } catch (error) {
      console.error("Error getting response:", error);
      setMessages(prev => [...prev, { 
        text: "Sorry, I encountered an error. Please try again.", 
        sender: 'ai' 
      }]);
    }
  };

  useEffect(() => {
    if (!isMounted || loading || !userData) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech recognition not supported in this browser");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognitionRef.current = recognition;

    let isActive = true;

    const startTimeout = setTimeout(() => {
      if (isActive && !isSpeakingRef.current && !isRecognizingRef.current) {
        try {
          recognition.start();
        } catch (e) {
          if (e.name !== "InvalidStateError") {
            console.error(e);
          }
        }
      }
    }, 1000);

    recognition.onstart = () => {
      isRecognizingRef.current = true;
      setListening(true);
    };

    recognition.onend = () => {
      isRecognizingRef.current = false;
      setListening(false);
      if (isActive && !isSpeakingRef.current) {
        setTimeout(() => {
          if (isActive) {
            try {
              recognition.start();
            } catch (e) {
              if (e.name !== "InvalidStateError") console.error(e);
            }
          }
        }, 1000);
      }
    };

    recognition.onerror = (event) => {
      console.warn("Recognition error:", event.error);
      isRecognizingRef.current = false;
      setListening(false);
      if (event.error !== "aborted" && isActive && !isSpeakingRef.current) {
        setTimeout(() => {
          if (isActive) {
            try {
              recognition.start();
            } catch (e) {
              if (e.name !== "InvalidStateError") console.error(e);
            }
          }
        }, 1000);
      }
    };

    recognition.onresult = async (e) => {
      const transcript = e.results[e.results.length - 1][0].transcript.trim();
      if (userData?.assistantName && transcript.toLowerCase().includes(userData.assistantName.toLowerCase())) {
        setMessages(prev => [...prev, { text: transcript, sender: 'user' }]);
        recognition.stop();
        isRecognizingRef.current = false;
        setListening(false);
        const data = await getGeminiResponse(transcript);
        await handleCommand(data);
      }
    };

    // Initial greeting
    const greeting = new SpeechSynthesisUtterance(`Hello ${userData.name}, what can I help you with?`);
    greeting.lang = 'hi-IN';
    window.speechSynthesis.speak(greeting);
    setMessages([{ text: `Hello ${userData.name}, I'm ${userData.assistantName || 'VEDA'}. How can I help you?`, sender: 'ai' }]);

    return () => {
      isActive = false;
      clearTimeout(startTimeout);
      recognition.stop();
      setListening(false);
      isRecognizingRef.current = false;
    };
  }, [isMounted, loading, userData, getGeminiResponse]);

  if (loading || !isMounted || !userData) {
    return (
      <div className="w-full min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className='w-full min-h-screen bg-gray-900 text-white overflow-hidden relative'
    >
      {/* Header Bar */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-gray-800/80 backdrop-blur-lg z-20 flex justify-between items-center px-6 border-b border-gray-700">
        {/* VEDA Logo */}
        <div ref={logoRef} className="flex items-center">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold text-2xl sm:text-3xl px-4 py-2 rounded-lg shadow-lg">
            VEDA
          </div>
          <div className="ml-2 text-xs sm:text-sm text-gray-300 font-light italic hidden sm:block">
            Virtual Evolutionary<br />Digital Assistant
          </div>
        </div>

        {/* Desktop Logout Button - Top Right */}
        <button 
          className='hidden lg:flex items-center gap-2 text-white bg-gray-700 hover:bg-gray-600 rounded-lg px-4 py-2 transition-colors'
          onClick={handleLogOut}
        >
          <CgLogOut className="w-5 h-5" />
          <span className="hidden sm:inline">Log Out</span>
        </button>

        {/* Mobile Hamburger Menu */}
        <CgMenuRight 
          className='lg:hidden text-white w-6 h-6 cursor-pointer' 
          onClick={() => setHam(true)}
        />
      </div>

      {/* Mobile Sidebar */}
      <div className={`
        fixed lg:hidden top-0 right-0 w-3/4 h-full bg-gray-800/90 backdrop-blur-lg 
        p-6 flex flex-col gap-6 z-30 transition-transform duration-300 ease-in-out
        ${ham ? "translate-x-0" : "translate-x-full"}
      `}>
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Menu</h2>
          <RxCross1 
            className='text-white w-6 h-6 cursor-pointer' 
            onClick={() => setHam(false)}
          />
        </div>
        
        <button 
          className='flex items-center justify-center gap-2 text-white bg-gray-700 hover:bg-gray-600 rounded-lg px-4 py-3 transition-colors w-full'
          onClick={handleLogOut}
        >
          <CgLogOut className="w-5 h-5" />
          Log Out
        </button>

        <div className='w-full h-px bg-gray-600'></div>
        
        <h1 className='text-lg font-semibold text-gray-300'>History</h1>
        
        <div className='flex-1 overflow-y-auto'>
          {userData.history?.length > 0 ? (
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
      <div className="hidden lg:block fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-gray-800/80 backdrop-blur-lg p-6 border-r border-gray-700">
        <div className="flex flex-col h-full">
          <h1 className='text-lg font-semibold text-gray-300 mb-4'>History</h1>
          
          <div className='flex-1 overflow-y-auto mb-6'>
            {userData.history?.length > 0 ? (
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

          {/* Desktop Sidebar Logout Button - Bottom */}
          <button 
            className='flex items-center justify-center gap-2 text-white bg-gray-700 hover:bg-gray-600 rounded-lg px-4 py-3 transition-colors mt-auto'
            onClick={handleLogOut}
          >
            <CgLogOut className="w-5 h-5" />
            Log Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content lg:ml-64 pt-20 p-6 flex flex-col items-center justify-between min-h-screen">
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

        {/* Chat Container */}
        <div className="w-full max-w-2xl bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 flex flex-col">
          <div className="flex-1 overflow-y-auto max-h-64 mb-4">
            {messages.map((message, index) => (
              <div 
                key={index} 
                className={`mb-3 p-3 rounded-lg ${message.sender === 'user' 
                  ? 'bg-blue-900/30 ml-auto' 
                  : 'bg-purple-900/30 mr-auto'}`}
              >
                <p className={message.sender === 'user' ? 'text-blue-300' : 'text-purple-300'}>
                  <strong>{message.sender === 'user' ? 'You' : userData?.assistantName || 'VEDA'}: </strong>
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
              placeholder="Type your message here..."
              className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button 
              type="submit"
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Send
            </button>
          </form>

          {/* Listening Indicator */}
          <div className="mt-4 flex justify-center items-center">
            <div className={`w-4 h-4 rounded-full ${listening ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <p className="ml-2 text-gray-400">
              {listening ? 'Listening...' : 'Not listening'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
