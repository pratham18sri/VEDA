import React from 'react';
import { isSpeechRecognitionSupported } from '../hooks/useVoiceRecognition';

/**
 * VoiceButton component - Microphone toggle button with visual recording feedback.
 *
 * Features:
 * - Pulsing animation while recording
 * - Color changes to indicate state (inactive/recording/processing)
 * - ARIA labels for accessibility
 * - Tooltip for unsupported browsers
 *
 * @param {Object} props
 * @param {boolean} props.isRecording - Whether voice recognition is active
 * @param {boolean} props.isProcessing - Whether voice is being processed
 * @param {function} props.onToggle - Toggle recording on/off
 * @param {boolean} [props.disabled=false] - Disable the button
 * @param {string} [props.error] - Error message to display
 */
function VoiceButton({ isRecording, isProcessing, onToggle, disabled = false, error }) {
  const supported = isSpeechRecognitionSupported();

  const getButtonClasses = () => {
    const base = 'relative flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-300 border font-mono focus:outline-none focus:ring-2 focus:ring-purple-400';

    if (!supported || disabled) {
      return `${base} bg-gray-800 border-gray-600 text-gray-500 cursor-not-allowed opacity-50`;
    }

    if (isRecording) {
      return `${base} bg-red-900/40 border-red-500 text-red-400 hover:bg-red-900/60 voice-btn-recording`;
    }

    if (isProcessing) {
      return `${base} bg-yellow-900/40 border-yellow-500/50 text-yellow-400 cursor-wait`;
    }

    return `${base} bg-black/70 border-purple-500/30 text-purple-400 hover:bg-purple-900/30 hover:border-purple-500/50`;
  };

  const getAriaLabel = () => {
    if (!supported) return 'Voice recognition not supported in this browser';
    if (isRecording) return 'Stop voice recording';
    if (isProcessing) return 'Processing voice input';
    return 'Start voice recording';
  };

  const getTitle = () => {
    if (!supported) return 'Voice input not supported. Use Chrome, Edge, or Safari.';
    if (error) return error;
    if (isRecording) return 'Click to stop recording';
    return 'Click to start voice input';
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        disabled={!supported || disabled || isProcessing}
        className={getButtonClasses()}
        aria-label={getAriaLabel()}
        title={getTitle()}
      >
        {/* Pulsing ring animation while recording */}
        {isRecording && (
          <span className="absolute inset-0 rounded-lg border-2 border-red-500 animate-ping opacity-30" />
        )}

        {/* Microphone SVG icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5"
          aria-hidden="true"
        >
          {isRecording ? (
            /* Stop icon when recording */
            <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />
          ) : (
            /* Microphone icon when not recording */
            <>
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="22" />
            </>
          )}
        </svg>
      </button>
    </div>
  );
}

export default VoiceButton;
