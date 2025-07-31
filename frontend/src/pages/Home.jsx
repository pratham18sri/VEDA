import React, { useContext, useEffect, useRef, useState, useCallback } from 'react';
import { userDataContext } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import { CgMenuRight, CgLogOut } from "react-icons/cg";
import { RxCross1 } from "react-icons/rx";
import { gsap } from 'gsap';
import Orb from '../components/orb';
import axios from 'axios';

function Home() {
  const { userData, serverUrl, setUserData, getGeminiResponse } = useContext(userDataContext);
  const navigate = useNavigate();
  const [listening, setListening] = useState(false);
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const isSpeakingRef = useRef(false);
  const recognitionRef = useRef(null);
  const [ham, setHam] = useState(false);
  const isRecognizingRef = useRef(false);
  const synth = window.speechSynthesis;
  const containerRef = useRef(null);
  const logoRef = useRef(null);
  const orbRef = useRef(null);
  const messagesEndRef = useRef(null);
  const mainContentRef = useRef(null);
  const [loading, setLoading] = useState(true);

  // Load chat history from userData
  useEffect(() => {
    if (userData?.history) {
      setChatHistory(userData.history);
    }
  }, [userData]);

  // Save chat history to backend
  const saveChatHistory = useCallback(async (updatedHistory) => {
    try {
      await axios.post(`${serverUrl}/api/user/update-history`, {
        history: updatedHistory
      }, { withCredentials: true });
    } catch (error) {
      console.error("Error saving history:", error);
    }
  }, [serverUrl]);

  // Delete a chat history item
  const deleteHistoryItem = useCallback(async (index) => {
    const updatedHistory = [...chatHistory];
    updatedHistory.splice(index, 1);
    setChatHistory(updatedHistory);
    await saveChatHistory(updatedHistory);
  }, [chatHistory, saveChatHistory]);

  // Add current chat to history
  const addToHistory = useCallback(async (message) => {
    const updatedHistory = [...chatHistory, message];
    setChatHistory(updatedHistory);
    await saveChatHistory(updatedHistory);
  }, [chatHistory, saveChatHistory]);

  // Memoized handlers
  const handleLogOut = useCallback(async () => {
    try {
      await axios.get(`${serverUrl}/api/auth/logout`, { withCredentials: true });
      setUserData(null);
      navigate('/signin');
    } catch (error) {
      console.error("Logout error:", error);
      setUserData(null);
      navigate('/signin');
    }
  }, [serverUrl, setUserData, navigate]);

  const handleTextSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMessage = inputText;
    setInputText("");
    const newMessage = { text: userMessage, sender: 'user' };
    setMessages(prev => [...prev, newMessage]);
    await addToHistory(userMessage); // Save to history

    try {
      recognitionRef.current?.stop();
      isRecognizingRef.current = false;
      setListening(false);

      const data = await getGeminiResponse(userMessage);
      await handleCommand(data);
    } catch (error) {
      console.error("Error getting response:", error);
      setMessages(prev => [...prev, { 
        text: "SYSTEM_ERROR: REQUEST_FAILED", 
        sender: 'ai' 
      }]);
    }
  }, [inputText, getGeminiResponse, addToHistory]);

  // ... (keep all other existing functions like handleCommand, speak, startRecognition)

  // Mobile Sidebar with delete functionality
  const renderMobileSidebar = () => (
    <div className={`
      fixed lg:hidden top-0 right-0 w-3/4 h-full bg-black/95 backdrop-blur-lg 
      p-6 flex flex-col gap-6 z-30 transition-transform duration-300 ease-in-out
      ${ham ? "translate-x-0" : "translate-x-full"} border-l border-purple-500/30
    `}>
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-purple-300 font-mono">CHAT_HISTORY</h2>
        <RxCross1 
          className='text-purple-300 w-6 h-6 cursor-pointer hover:text-purple-200 transition-colors' 
          onClick={() => setHam(false)}
        />
      </div>
      
      <div className='flex-1 overflow-y-auto'>
        {chatHistory?.length > 0 ? (
          chatHistory.map((his, index) => (
            <div key={index} className='flex justify-between items-center py-2 border-b border-purple-500/30'>
              <div 
                className='text-purple-400 hover:text-white transition-colors cursor-pointer font-mono text-sm flex-1'
                onClick={() => {
                  setInputText(his);
                  setHam(false);
                }}
              >
                {his.length > 30 ? `${his.substring(0, 30)}...` : his}
              </div>
              <button 
                onClick={() => deleteHistoryItem(index)}
                className="text-purple-500 hover:text-red-400 ml-2"
              >
                <RxCross1 className="w-4 h-4" />
              </button>
            </div>
          ))
        ) : (
          <p className="text-purple-500/70 py-2 font-mono">NO_HISTORY_FOUND</p>
        )}
      </div>

      <button 
        className='flex items-center justify-center gap-2 text-purple-300 bg-black hover:bg-purple-900/50 rounded-lg px-4 py-3 transition-colors w-full border border-purple-500/50 font-mono'
        onClick={handleLogOut}
      >
        <CgLogOut className="w-5 h-5" />
        LOG_OUT
      </button>
    </div>
  );

  // Desktop Sidebar with delete functionality
  const renderDesktopSidebar = () => (
    <div className="hidden lg:block fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-black/90 backdrop-blur-lg p-6 border-r border-purple-500/30">
      <div className="flex flex-col h-full">
        <h1 className='text-lg font-semibold text-purple-300 mb-4 font-mono'>CHAT_HISTORY</h1>
        
        <div className='flex-1 overflow-y-auto mb-6'>
          {chatHistory?.length > 0 ? (
            chatHistory.map((his, index) => (
              <div key={index} className='flex justify-between items-center py-2 border-b border-purple-500/30'>
                <div 
                  className='text-purple-400 hover:text-white transition-colors cursor-pointer font-mono text-sm flex-1'
                  onClick={() => setInputText(his)}
                >
                  {his.length > 30 ? `${his.substring(0, 30)}...` : his}
                </div>
                <button 
                  onClick={() => deleteHistoryItem(index)}
                  className="text-purple-500 hover:text-red-400 ml-2"
                >
                  <RxCross1 className="w-4 h-4" />
                </button>
              </div>
            ))
          ) : (
            <p className="text-purple-500/70 py-2 font-mono">NO_HISTORY_FOUND</p>
          )}
        </div>

        <button 
          className='flex items-center justify-center gap-2 text-purple-300 bg-black hover:bg-purple-900/50 rounded-lg px-4 py-3 transition-colors mt-auto border border-purple-500/50 font-mono'
          onClick={handleLogOut}
        >
          <CgLogOut className="w-5 h-5" />
          LOG_OUT
        </button>
      </div>
    </div>
  );

  // ... (keep all other existing code like useEffect hooks, GSAP animations, etc.)

  return (
    <div ref={containerRef} className='w-full min-h-screen bg-black text-purple-300 overflow-hidden relative'>
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
        <div ref={logoRef} className="flex items-center">
          <div className="bg-black text-purple-400 font-bold text-2xl sm:text-3xl px-4 py-2 rounded border-2 border-purple-500 shadow-lg shadow-purple-500/20 font-mono">
            VEDA<span className="text-purple-300">_AI</span>
          </div>
        </div>

        <button 
          className='hidden lg:flex items-center gap-2 text-purple-300 bg-black hover:bg-purple-900/50 rounded-lg px-4 py-2 transition-colors border border-purple-500/50 font-mono'
          onClick={handleLogOut}
        >
          <CgLogOut className="w-5 h-5" />
          <span>LOG_OUT</span>
        </button>

        <CgMenuRight 
          className='lg:hidden text-purple-300 w-6 h-6 cursor-pointer hover:text-purple-200 transition-colors' 
          onClick={() => setHam(true)}
        />
      </div>

      {renderMobileSidebar()}
      {renderDesktopSidebar()}

      {/* Main Content */}
      <div ref={mainContentRef} className="main-content lg:ml-64 pt-20 p-6 flex flex-col items-center justify-between min-h-screen">
        {/* ... (keep all existing main content JSX) */}
      </div>
    </div>
  );
}

export default Home;
