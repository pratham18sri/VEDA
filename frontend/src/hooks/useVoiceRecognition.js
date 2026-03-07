import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Voice recognition states:
 * - inactive: Not recording
 * - recording: Actively listening for voice input
 * - processing: Processing final result
 */
const RECOGNITION_STATES = {
  INACTIVE: 'inactive',
  RECORDING: 'recording',
  PROCESSING: 'processing',
};

/**
 * Checks if the Web Speech API is supported in the current browser.
 * @returns {boolean}
 */
export function isSpeechRecognitionSupported() {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

/**
 * Custom hook for managing Web Speech API voice recognition.
 *
 * Features:
 * - Toggle-based recording (start/stop via mic button)
 * - Interim (live) transcription results
 * - Multi-language support
 * - Proper cleanup to avoid memory leaks
 * - Error handling for permissions and unsupported browsers
 *
 * @param {Object} options
 * @param {string} [options.lang='en-US'] - BCP 47 language code
 * @param {boolean} [options.continuous=false] - Keep listening after results
 * @param {boolean} [options.interimResults=true] - Show live transcription
 * @param {function} [options.onResult] - Callback with final transcript
 * @param {function} [options.onInterim] - Callback with interim transcript
 * @param {function} [options.onError] - Callback on error
 * @returns {Object} Voice recognition controls and state
 */
export default function useVoiceRecognition({
  lang = 'en-US',
  continuous = false,
  interimResults = true,
  onResult,
  onInterim,
  onError,
} = {}) {
  const [status, setStatus] = useState(RECOGNITION_STATES.INACTIVE);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState(null);
  const [supported, setSupported] = useState(true);

  const recognitionRef = useRef(null);
  const isManuallyStopped = useRef(false);

  // Check browser support on mount
  useEffect(() => {
    setSupported(isSpeechRecognitionSupported());
  }, []);

  // Initialize recognition instance
  const initRecognition = useCallback(() => {
    if (!isSpeechRecognitionSupported()) {
      setSupported(false);
      setError('Voice recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return null;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = continuous;
    recognition.lang = lang;
    recognition.interimResults = interimResults;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setStatus(RECOGNITION_STATES.RECORDING);
      setError(null);
    };

    recognition.onresult = (event) => {
      let finalText = '';
      let interimText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript;
        } else {
          interimText += result[0].transcript;
        }
      }

      if (interimText) {
        setInterimTranscript(interimText);
        onInterim?.(interimText);
      }

      if (finalText) {
        setTranscript(finalText.trim());
        setInterimTranscript('');
        setStatus(RECOGNITION_STATES.PROCESSING);
        onResult?.(finalText.trim());
      }
    };

    recognition.onerror = (event) => {
      const errorMessages = {
        'not-allowed': 'Microphone access denied. Click the microphone icon in your browser address bar to allow access.',
        'no-speech': 'No speech detected. Please try again.',
        'audio-capture': 'No microphone found. Please connect a microphone.',
        'network': 'Network error. Please check your connection.',
        'aborted': null, // Intentional abort, no error message needed
      };

      const message = errorMessages[event.error] ?? `Voice recognition error: ${event.error}`;

      if (message) {
        setError(message);
        onError?.(message);
      }

      setStatus(RECOGNITION_STATES.INACTIVE);
      setInterimTranscript('');
    };

    recognition.onend = () => {
      // Only restart if continuous mode and not manually stopped
      if (continuous && !isManuallyStopped.current) {
        try {
          recognition.start();
        } catch (restartErr) {
          // Ignore InvalidStateError from rapid start/stop
          if (restartErr.name !== 'InvalidStateError') {
            console.error('Recognition restart error:', restartErr);
          }
        }
        return;
      }
      setStatus(RECOGNITION_STATES.INACTIVE);
      setInterimTranscript('');
    };

    return recognition;
  }, [lang, continuous, interimResults, onResult, onInterim, onError]);

  // Start voice recognition
  const startListening = useCallback(() => {
    if (!isSpeechRecognitionSupported()) {
      setError('Voice recognition is not supported in this browser.');
      return;
    }

    // Stop any existing instance first
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // Ignore
      }
    }

    isManuallyStopped.current = false;
    const recognition = initRecognition();
    if (!recognition) return;

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (e) {
      if (e.name !== 'InvalidStateError') {
        setError('Failed to start voice recognition. Please try again.');
        console.error('Recognition start error:', e);
      }
    }
  }, [initRecognition]);

  // Stop voice recognition
  const stopListening = useCallback(() => {
    isManuallyStopped.current = true;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore errors when stopping
      }
    }
    setStatus(RECOGNITION_STATES.INACTIVE);
    setInterimTranscript('');
  }, []);

  // Toggle voice recognition
  const toggleListening = useCallback(() => {
    if (status === RECOGNITION_STATES.RECORDING) {
      stopListening();
    } else {
      startListening();
    }
  }, [status, startListening, stopListening]);

  // Reset state
  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignore cleanup errors
        }
        recognitionRef.current = null;
      }
    };
  }, []);

  return {
    status,
    transcript,
    interimTranscript,
    error,
    supported,
    isRecording: status === RECOGNITION_STATES.RECORDING,
    isProcessing: status === RECOGNITION_STATES.PROCESSING,
    startListening,
    stopListening,
    toggleListening,
    resetTranscript,
  };
}
