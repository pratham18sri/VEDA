import React, { useContext, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { userDataContext } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import { CgMenuRight } from "react-icons/cg";
import { RxCross1 } from "react-icons/rx";
import { gsap } from 'gsap';
import Orb from '../components/orb';
import axios from 'axios';
import ProfileDropdown from '../components/ProfileDropdown';
import MicButton from '../components/MicButton';
import VoiceControls from '../components/VoiceControls';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useTextToSpeech } from '../hooks/useTextToSpeech';

function Home() {
  const { userData, serverUrl, setUserData, getGeminiResponse } = useContext(userDataContext);
  const navigate = useNavigate();
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [ham, setHam] = useState(false);
  const [loading, setLoading] = useState(true);
  const [conversationMode, setConversationMode] = useState(false);
  const [showVoiceSelect, setShowVoiceSelect] = useState(false);
  const [selectedLang, setSelectedLang] = useState('en-US');
  const [historySearch, setHistorySearch] = useState('');

  const containerRef = useRef(null);
  const logoRef = useRef(null);
  const orbRef = useRef(null);
  const messagesEndRef = useRef(null);
  const mainContentRef = useRef(null);
  const isProcessingRef = useRef(false);
  const chatHistoryRef = useRef(chatHistory);
  const conversationModeRef = useRef(conversationMode);

  // Keep refs in sync
  useEffect(() => { chatHistoryRef.current = chatHistory; }, [chatHistory]);
  useEffect(() => { conversationModeRef.current = conversationMode; }, [conversationMode]);

  // --- TTS hook (declare before STT so we can reference it) ---
  const tts = useTextToSpeech({
    defaultLang: selectedLang,
    defaultRate: 1.0,
  });

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

  // Handle command actions (open URLs etc.)
  const handleCommandAction = useCallback((data) => {
    if (!data) return;
    const { type, userInput, appName } = data;
    const commands = {
      'google-search': `https://www.google.com/search?q=${encodeURIComponent(userInput)}`,
      'calculator-open': 'https://www.google.com/search?q=calculator',
      'instagram-open': 'https://www.instagram.com/',
      'facebook-open': 'https://www.facebook.com/',
      'whatsapp-open': 'https://web.whatsapp.com/',
      'twitter-open': 'https://x.com/',
      'linkedin-open': 'https://www.linkedin.com/',
      'spotify-open': 'https://open.spotify.com/',
      'github-open': 'https://github.com/',
      'reddit-open': 'https://www.reddit.com/',
      'amazon-open': 'https://www.amazon.in/',
      'snapchat-open': 'https://www.snapchat.com/',
      'telegram-open': 'https://web.telegram.org/',
      'gmail-open': 'https://mail.google.com/',
      'maps-open': 'https://maps.google.com/',
      'pinterest-open': 'https://www.pinterest.com/',
      'weather-show': 'https://www.google.com/search?q=weather',
      'news-show': 'https://news.google.com/',
      'music-play': `https://www.youtube.com/results?search_query=${encodeURIComponent(userInput || 'popular music mix')}`,
      'translate': `https://translate.google.com/?sl=auto&tl=en&text=${encodeURIComponent(userInput)}`,
      'youtube-search': `https://www.youtube.com/results?search_query=${encodeURIComponent(userInput)}`,
      'youtube-play': `https://www.youtube.com/results?search_query=${encodeURIComponent(userInput)}`
    };
    if (commands[type]) {
      window.open(commands[type], '_blank');
    } else if (type === 'app-open' && appName) {
      window.open(`https://www.google.com/search?q=${encodeURIComponent(appName + ' open online')}`, '_blank');
    }
  }, []);

  // --- STT result handler (uses refs to avoid stale closures) ---
  const sttStartRef = useRef(null); // will be set after hook init
  const ttsRef = useRef(tts);
  useEffect(() => { ttsRef.current = tts; }, [tts]);

  const handleVoiceResult = useCallback(async (transcript) => {
    if (!transcript.trim() || isProcessingRef.current) return;

    isProcessingRef.current = true;
    const userMessage = transcript.trim();
    setInputText("");
    setMessages(prev => [...prev, { text: userMessage, sender: 'user' }]);

    try {
      const updatedHistory = [...chatHistoryRef.current, userMessage];
      setChatHistory(updatedHistory);
      saveChatHistory(updatedHistory);

      const data = await getGeminiResponse(userMessage);
      if (data) {
        setMessages(prev => [...prev, { text: data.response, sender: 'ai' }]);

        ttsRef.current.speakImmediate(data.response, () => {
          isProcessingRef.current = false;
          if (conversationModeRef.current && sttStartRef.current) {
            setTimeout(() => { sttStartRef.current(); }, 500);
          }
        });

        handleCommandAction(data);
      } else {
        isProcessingRef.current = false;
      }
    } catch (error) {
      console.error("Error getting response:", error);
      setMessages(prev => [...prev, { text: "SYSTEM_ERROR: REQUEST_FAILED", sender: 'ai' }]);
      isProcessingRef.current = false;
    }
  }, [getGeminiResponse, saveChatHistory, handleCommandAction]);

  // --- STT hook ---
  const stt = useSpeechRecognition({
    language: selectedLang,
    continuous: false,
    interimResults: true,
    silenceTimeout: 3000,
    onResult: handleVoiceResult,
    autoRestart: false,
  });

  // Store startListening in ref so the TTS onEnd callback can use it
  useEffect(() => { sttStartRef.current = stt.startListening; }, [stt.startListening]);

  // Load chat history from userData
  useEffect(() => {
    if (userData) {
      setChatHistory(userData.history || []);
      setLoading(false);
    }
  }, [userData]);

  // Delete a chat history item
  const deleteHistoryItem = useCallback(async (index) => {
    const updatedHistory = [...chatHistory];
    updatedHistory.splice(index, 1);
    setChatHistory(updatedHistory);
    await saveChatHistory(updatedHistory);
  }, [chatHistory, saveChatHistory]);

  // Clear all chat history
  const clearAllHistory = useCallback(async () => {
    try {
      setChatHistory([]);
      await axios.delete(`${serverUrl}/api/user/clear-history`, { withCredentials: true });
    } catch (error) {
      console.error("Error clearing history:", error);
    }
  }, [serverUrl]);

  // Filtered history based on search — preserves original indices
  const filteredHistory = useMemo(() => {
    const items = chatHistory.map((text, idx) => ({ text, idx }));
    if (!historySearch.trim()) return items;
    const q = historySearch.toLowerCase();
    return items.filter(({ text }) => text.toLowerCase().includes(q));
  }, [chatHistory, historySearch]);

  // Handle text form submit
  const handleTextSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!inputText.trim() || isProcessingRef.current) return;

    isProcessingRef.current = true;
    const userMessage = inputText;
    setInputText("");
    setMessages(prev => [...prev, { text: userMessage, sender: 'user' }]);

    stt.stopListening();

    try {
      const updatedHistory = [...chatHistory, userMessage];
      setChatHistory(updatedHistory);
      saveChatHistory(updatedHistory);

      const data = await getGeminiResponse(userMessage);
      if (data) {
        setMessages(prev => [...prev, { text: data.response, sender: 'ai' }]);
        tts.speakImmediate(data.response, () => {
          isProcessingRef.current = false;
        });
        handleCommandAction(data);
      } else {
        isProcessingRef.current = false;
      }
    } catch (error) {
      console.error("Error getting response:", error);
      setMessages(prev => [...prev, { text: "SYSTEM_ERROR: REQUEST_FAILED", sender: 'ai' }]);
      isProcessingRef.current = false;
    }
  }, [inputText, getGeminiResponse, chatHistory, saveChatHistory, handleCommandAction, stt, tts]);

  // Conversation Mode Toggle
  const toggleConversationMode = useCallback(() => {
    if (conversationMode) {
      setConversationMode(false);
      stt.stopListening();
      tts.stop();
    } else {
      setConversationMode(true);
      stt.startListening();
    }
  }, [conversationMode, stt, tts]);

  // Handle mic button (one-shot voice input)
  const handleMicToggle = useCallback(() => {
    if (stt.isListening) {
      stt.stopListening();
    } else {
      stt.startListening();
    }
  }, [stt]);

  // Handle log out
  const handleLogOut = useCallback(async () => {
    try {
      await axios.get(`${serverUrl}/api/auth/logout`, { withCredentials: true });
    } catch { /* ignore */ }
    setUserData(null);
    navigate('/signin');
  }, [serverUrl, setUserData, navigate]);

  // GSAP animations
  useEffect(() => {
    if (!logoRef.current || !mainContentRef.current) return;

    const ctx = gsap.context(() => {
      gsap.from(logoRef.current, {
        duration: 1,
        opacity: 0,
        y: -50,
        ease: "elastic.out(1, 0.5)"
      });

      gsap.from(mainContentRef.current, {
        duration: 1,
        opacity: 0,
        y: 50,
        delay: 0.5,
        ease: "power3.out"
      });

      if (orbRef.current) {
        const particles = [];
        for (let i = 0; i < 20; i++) {
          const particle = document.createElement('div');
          particle.className = 'absolute rounded-full bg-purple-500/30';
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

        return () => { particles.forEach(p => p.remove()); };
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // Initialize messages
  useEffect(() => {
    if (userData) {
      setMessages([{
        text: `SYSTEM: [VEDA_AI] ONLINE. USER_ID: ${userData.name || 'Guest'}. QUERY?`,
        sender: 'ai'
      }]);
    }
  }, [userData]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (loading || !userData) {
    return (
      <div className="w-full min-h-screen bg-black flex items-center justify-center">
        <div className="text-purple-300 font-mono text-xl">LOADING_SYSTEM...</div>
      </div>
    );
  }

  const languageOptions = [
    { code: 'en-US', label: 'English (US)' },
    { code: 'en-GB', label: 'English (UK)' },
    { code: 'hi-IN', label: 'Hindi' },
    { code: 'es-ES', label: 'Spanish' },
    { code: 'fr-FR', label: 'French' },
    { code: 'de-DE', label: 'German' },
    { code: 'ja-JP', label: 'Japanese' },
    { code: 'zh-CN', label: 'Chinese' },
  ];

  // Sidebar renderers
  const renderMobileSidebar = () => (
    <div className={`
      fixed lg:hidden top-0 right-0 w-3/4 h-full bg-black/95 backdrop-blur-lg
      p-6 flex flex-col gap-4 z-30 transition-transform duration-300 ease-in-out
      ${ham ? "translate-x-0" : "translate-x-full"} border-l border-purple-500/30
    `}>
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-purple-300 font-mono">CHAT_HISTORY</h2>
        <RxCross1
          className='text-purple-300 w-6 h-6 cursor-pointer hover:text-purple-200 transition-colors'
          onClick={() => setHam(false)}
        />
      </div>

      {/* Search History */}
      <div className="relative">
        <input
          type="text"
          value={historySearch}
          onChange={(e) => setHistorySearch(e.target.value)}
          placeholder="SEARCH_HISTORY..."
          className="w-full bg-black/70 text-purple-300 text-sm px-3 py-2 rounded-lg border border-purple-500/30 font-mono focus:outline-none focus:ring-1 focus:ring-purple-500/50 placeholder-purple-500/50"
        />
        {historySearch && (
          <button onClick={() => setHistorySearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-purple-500 hover:text-purple-300">
            <RxCross1 className="w-3 h-3" />
          </button>
        )}
      </div>

      <div className='flex-1 overflow-y-auto'>
        {filteredHistory.length > 0 ? (
          filteredHistory.map(({ text, idx }) => (
            <div key={idx} className='flex justify-between items-center py-2 border-b border-purple-500/30'>
              <div
                className='text-purple-400 hover:text-white transition-colors cursor-pointer font-mono text-sm flex-1'
                onClick={() => { setInputText(text); setHam(false); }}
              >
                {text.length > 30 ? `${text.substring(0, 30)}...` : text}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); deleteHistoryItem(idx); }}
                className="text-purple-500 hover:text-red-400 ml-2"
                aria-label="Delete history item"
              >
                <RxCross1 className="w-4 h-4" />
              </button>
            </div>
          ))
        ) : (
          <p className="text-purple-500/70 py-2 font-mono">
            {historySearch ? 'NO_RESULTS_FOUND' : 'NO_HISTORY_FOUND'}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {chatHistory.length > 0 && (
          <button
            className='flex items-center justify-center gap-2 text-red-400 bg-black hover:bg-red-900/30 rounded-lg px-4 py-2 transition-colors w-full border border-red-500/30 font-mono text-sm'
            onClick={clearAllHistory}
          >
            CLEAR_ALL_HISTORY
          </button>
        )}
        <button
          className='flex items-center justify-center gap-2 text-purple-300 bg-black hover:bg-purple-900/50 rounded-lg px-4 py-3 transition-colors w-full border border-purple-500/50 font-mono'
          onClick={handleLogOut}
        >
          LOG_OUT
        </button>
      </div>
    </div>
  );

  const renderDesktopSidebar = () => (
    <div className="hidden lg:block fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-black/90 backdrop-blur-lg p-6 border-r border-purple-500/30">
      <div className="flex flex-col h-full">
        <h1 className='text-lg font-semibold text-purple-300 mb-3 font-mono'>CHAT_HISTORY</h1>

        {/* Search History */}
        <div className="relative mb-3">
          <input
            type="text"
            value={historySearch}
            onChange={(e) => setHistorySearch(e.target.value)}
            placeholder="SEARCH..."
            className="w-full bg-black/70 text-purple-300 text-xs px-3 py-2 rounded-lg border border-purple-500/30 font-mono focus:outline-none focus:ring-1 focus:ring-purple-500/50 placeholder-purple-500/50"
          />
          {historySearch && (
            <button onClick={() => setHistorySearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-purple-500 hover:text-purple-300">
              <RxCross1 className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className='flex-1 overflow-y-auto mb-4'>
          {filteredHistory.length > 0 ? (
            filteredHistory.map(({ text, idx }) => (
              <div key={idx} className='flex justify-between items-center py-2 border-b border-purple-500/30'>
                <div
                  className='text-purple-400 hover:text-white transition-colors cursor-pointer font-mono text-sm flex-1'
                  onClick={() => setInputText(text)}
                >
                  {text.length > 30 ? `${text.substring(0, 30)}...` : text}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteHistoryItem(idx); }}
                  className="text-purple-500 hover:text-red-400 ml-2"
                  aria-label="Delete history item"
                >
                  <RxCross1 className="w-4 h-4" />
                </button>
              </div>
            ))
          ) : (
            <p className="text-purple-500/70 py-2 font-mono text-sm">
              {historySearch ? 'NO_RESULTS' : 'NO_HISTORY_FOUND'}
            </p>
          )}
        </div>

        {chatHistory.length > 0 && (
          <button
            className='flex items-center justify-center gap-2 text-red-400 bg-black hover:bg-red-900/30 rounded-lg px-3 py-2 transition-colors w-full border border-red-500/30 font-mono text-xs mb-2'
            onClick={clearAllHistory}
          >
            CLEAR_ALL
          </button>
        )}
      </div>
    </div>
  );

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

        <div className="flex items-center gap-3">
          {/* Voice Controls in Header */}
          <VoiceControls
            isSpeaking={tts.isSpeaking}
            isPaused={tts.isPaused}
            isMuted={tts.isMuted}
            progress={tts.progress}
            rate={tts.rate}
            onToggleMute={tts.toggleMute}
            onTogglePause={tts.togglePause}
            onStop={tts.stop}
            onRateChange={tts.setRate}
            voices={tts.voices}
            selectedVoice={tts.selectedVoice}
            onVoiceChange={tts.setSelectedVoice}
            showVoiceSelect={showVoiceSelect}
          />

          {/* Toggle Voice Select */}
          <button
            onClick={() => setShowVoiceSelect(!showVoiceSelect)}
            className="hidden sm:flex p-1.5 rounded-md bg-black/50 border border-purple-500/30 text-purple-400 hover:bg-purple-900/20 transition-colors"
            title="Toggle voice settings"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>

          {/* Profile Dropdown */}
          <ProfileDropdown />

          <CgMenuRight
            className='lg:hidden text-purple-300 w-6 h-6 cursor-pointer hover:text-purple-200 transition-colors'
            onClick={() => setHam(true)}
          />
        </div>
      </div>

      {/* Mobile sidebar backdrop */}
      {ham && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 lg:hidden"
          onClick={() => setHam(false)}
        />
      )}
      {renderMobileSidebar()}
      {renderDesktopSidebar()}

      {/* Main Content */}
      <div ref={mainContentRef} className="main-content lg:ml-64 pt-20 p-6 flex flex-col items-center justify-between min-h-screen">
        <div
          ref={orbRef}
          className="w-full max-w-2xl h-96 relative mb-8 rounded-2xl overflow-hidden border border-purple-500/50 shadow-xl"
        >
          <Orb
            hoverIntensity={0.5}
            rotateOnHover={true}
            hue={280}
            forceHoverState={false}
            className="w-full h-full"
          />

          {/* Conversation Mode Overlay */}
          {conversationMode && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
              <div className="text-center">
                <div className={`w-20 h-20 mx-auto mb-4 rounded-full border-2 flex items-center justify-center ${
                  stt.isListening
                    ? 'border-green-400 bg-green-900/20 animate-pulse'
                    : tts.isSpeaking
                      ? 'border-purple-400 bg-purple-900/20 animate-pulse'
                      : 'border-purple-500/50 bg-black/50'
                }`}>
                  {stt.isListening ? (
                    <svg className="w-8 h-8 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
                    </svg>
                  ) : tts.isSpeaking ? (
                    <div className="flex items-end gap-1 h-8">
                      {[0,1,2,3,4].map(i => (
                        <div key={i} className="w-1 bg-purple-400 rounded-full" style={{
                          animation: `waveform ${0.4 + i * 0.1}s ease-in-out infinite alternate`,
                        }} />
                      ))}
                    </div>
                  ) : (
                    <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  )}
                </div>
                <p className="text-purple-300 font-mono text-sm">
                  {stt.isListening ? 'LISTENING...' : tts.isSpeaking ? 'SPEAKING...' : 'READY'}
                </p>
                {stt.interimTranscript && (
                  <p className="text-purple-400/70 font-mono text-xs mt-2 max-w-xs mx-auto">
                    {stt.interimTranscript}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

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
                {message.sender === 'ai' && (
                  <button
                    onClick={() => tts.speakImmediate(message.text)}
                    className="mt-1 text-purple-500 hover:text-purple-300 transition-colors"
                    title="Replay this response"
                  >
                    <svg className="w-3.5 h-3.5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Interim transcript display */}
          {stt.interimTranscript && !conversationMode && (
            <div className="mb-2 px-3 py-2 bg-purple-900/10 border border-purple-500/20 rounded-lg">
              <p className="font-mono text-purple-400/70 text-sm italic">{stt.interimTranscript}</p>
            </div>
          )}

          {/* Input Form with Mic */}
          <form onSubmit={handleTextSubmit} className="flex gap-2">
            <input
              type="text"
              value={stt.isListening && stt.interimTranscript ? stt.interimTranscript : inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="ENTER_COMMAND..."
              className="flex-1 bg-black/70 text-purple-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 border border-purple-500/30 font-mono"
              disabled={stt.isListening}
            />

            <MicButton
              isListening={stt.isListening}
              onToggle={handleMicToggle}
              volume={stt.volume}
              isSupported={stt.isSupported}
              permissionState={stt.permissionState}
              disabled={conversationMode || isProcessingRef.current}
            />

            <button
              type="submit"
              disabled={isProcessingRef.current || stt.isListening}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors border border-purple-500/50 font-mono"
            >
              SEND
            </button>
          </form>

          {/* Voice Status Bar */}
          <div className="mt-4 flex flex-wrap justify-between items-center gap-2">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                stt.isListening ? 'bg-green-500 animate-pulse' :
                tts.isSpeaking ? 'bg-purple-500 animate-pulse' :
                'bg-red-500'
              } border border-white/50`}></div>
              <p className="text-purple-300 font-mono text-sm">
                {stt.isListening ? 'VOICE_INPUT_ACTIVE' :
                 tts.isSpeaking ? 'AI_SPEAKING...' :
                 'SYSTEM_STANDBY'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedLang}
                onChange={(e) => { setSelectedLang(e.target.value); tts.setLang(e.target.value); }}
                className="bg-black/70 text-purple-300 text-xs font-mono border border-purple-500/30 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
              >
                {languageOptions.map(opt => (
                  <option key={opt.code} value={opt.code}>{opt.label}</option>
                ))}
              </select>

              <button
                onClick={toggleConversationMode}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs transition-all duration-300 border ${
                  conversationMode
                    ? 'bg-green-900/30 border-green-500/50 text-green-300 shadow-lg shadow-green-500/10'
                    : 'bg-black/50 border-purple-500/30 text-purple-400 hover:bg-purple-900/20'
                }`}
                title={conversationMode ? 'Stop conversation mode' : 'Start voice conversation mode'}
              >
                <svg className="w-3.5 h-3.5" fill={conversationMode ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {conversationMode ? 'CONVO_ON' : 'CONVO_MODE'}
              </button>
            </div>
          </div>

          {stt.error && (
            <div className="mt-2 px-3 py-2 bg-red-900/20 border border-red-700/30 rounded text-red-400 text-xs font-mono">
              {stt.error}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes waveform {
          0% { height: 4px; }
          100% { height: 24px; }
        }
      `}</style>
    </div>
  );
}

export default Home;
