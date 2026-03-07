import React, { useState } from 'react';

/**
 * Microphone toggle button with visual states for voice input.
 * Shows: recording animation, volume level, permission denied state, unsupported fallback.
 */
function MicButton({ 
  isListening, 
  onToggle, 
  volume = 0, 
  isSupported = true, 
  permissionState = 'prompt',
  disabled = false,
  className = '' 
}) {
  const [showTooltip, setShowTooltip] = useState(false);

  if (!isSupported) {
    return (
      <button
        type="button"
        disabled
        className={`relative p-2.5 rounded-lg bg-gray-900/50 border border-gray-700/50 cursor-not-allowed opacity-50 ${className}`}
        title="Speech recognition not supported in this browser"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          <line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
        </svg>
        {showTooltip && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black border border-gray-700 rounded text-xs text-gray-400 font-mono whitespace-nowrap">
            BROWSER_NOT_SUPPORTED
          </div>
        )}
      </button>
    );
  }

  if (permissionState === 'denied') {
    return (
      <button
        type="button"
        disabled
        className={`relative p-2.5 rounded-lg bg-red-900/20 border border-red-700/50 cursor-not-allowed ${className}`}
        title="Microphone permission denied"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          <line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
        </svg>
        {showTooltip && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black border border-red-700/50 rounded text-xs text-red-400 font-mono whitespace-nowrap">
            MIC_PERMISSION_DENIED
          </div>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`relative p-2.5 rounded-lg transition-all duration-300 ${
        isListening
          ? 'bg-purple-600/30 border-purple-400 shadow-lg shadow-purple-500/30'
          : 'bg-black/70 border-purple-500/30 hover:bg-purple-900/20 hover:border-purple-400/50'
      } border ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
    >
      {/* Voice activity ring */}
      {isListening && (
        <div
          className="absolute inset-0 rounded-lg border-2 border-purple-400 animate-ping opacity-30"
          style={{ animationDuration: '1.5s' }}
        />
      )}

      {/* Volume indicator ring */}
      {isListening && volume > 0.05 && (
        <div
          className="absolute inset-0 rounded-lg border-2 border-green-400 transition-opacity duration-100"
          style={{ opacity: volume * 0.8, transform: `scale(${1 + volume * 0.15})` }}
        />
      )}

      <svg
        className={`w-5 h-5 transition-colors duration-200 ${
          isListening ? 'text-purple-300' : 'text-purple-400'
        }`}
        fill={isListening ? 'currentColor' : 'none'}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
        />
      </svg>
    </button>
  );
}

export default MicButton;
