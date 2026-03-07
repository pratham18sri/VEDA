import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Custom hook for speech recognition (voice-to-text)
 * Supports: mic toggle, interim results, silence auto-stop, language selection,
 * voice activity visualization, browser permission handling, unsupported fallback.
 */
export function useSpeechRecognition({
  language = 'en-US',
  continuous = false,
  interimResults = true,
  silenceTimeout = 3000,
  onResult = null,
  onInterim = null,
  autoRestart = false,
} = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const [permissionState, setPermissionState] = useState('prompt'); // 'prompt' | 'granted' | 'denied'
  const [error, setError] = useState(null);
  const [volume, setVolume] = useState(0); // 0-1 for voice activity visualization

  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const animFrameRef = useRef(null);

  // Check browser support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
    }
  }, []);

  // Check mic permission
  useEffect(() => {
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'microphone' }).then((result) => {
        setPermissionState(result.state);
        result.onchange = () => setPermissionState(result.state);
      }).catch(() => {
        // permissions API not fully supported
      });
    }
  }, []);

  // Voice activity visualization
  const startAudioAnalysis = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;

      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

      const updateVolume = () => {
        analyserRef.current.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setVolume(Math.min(avg / 128, 1));
        animFrameRef.current = requestAnimationFrame(updateVolume);
      };
      updateVolume();
      setPermissionState('granted');
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setPermissionState('denied');
        setError('MIC_PERMISSION_DENIED');
      }
    }
  }, []);

  const stopAudioAnalysis = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setVolume(0);
  }, []);

  const resetSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    if (silenceTimeout > 0 && !continuous) {
      silenceTimerRef.current = setTimeout(() => {
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
      }, silenceTimeout);
    }
  }, [silenceTimeout, continuous]);

  const startListening = useCallback(async () => {
    if (!isSupported) {
      setError('SPEECH_RECOGNITION_NOT_SUPPORTED');
      return;
    }

    setError(null);
    setTranscript('');
    setInterimTranscript('');

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = continuous;
    recognition.lang = language;
    recognition.interimResults = interimResults;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      setIsListening(true);
      resetSilenceTimer();
    };

    recognition.onresult = (event) => {
      resetSilenceTimer();

      let finalText = '';
      let interimText = '';

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript;
        } else {
          interimText += result[0].transcript;
        }
      }

      if (finalText) {
        setTranscript(finalText);
        onResult?.(finalText);
      }

      setInterimTranscript(interimText);
      onInterim?.(interimText);
    };

    recognition.onerror = (event) => {
      console.warn('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        setPermissionState('denied');
        setError('MIC_PERMISSION_DENIED');
      } else if (event.error !== 'aborted' && event.error !== 'no-speech') {
        setError(`RECOGNITION_ERROR: ${event.error.toUpperCase()}`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
      stopAudioAnalysis();

      if (autoRestart && !error) {
        setTimeout(() => {
          try {
            recognition.start();
          } catch {
            // ignore
          }
        }, 500);
      }
    };

    try {
      await startAudioAnalysis();
      recognition.start();
    } catch (e) {
      setError(`START_ERROR: ${e.message}`);
    }
  }, [isSupported, continuous, language, interimResults, resetSilenceTimer, onResult, onInterim, autoRestart, error, startAudioAnalysis, stopAudioAnalysis]);

  const stopListening = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    stopAudioAnalysis();
    setIsListening(false);
    setInterimTranscript('');
  }, [stopAudioAnalysis]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Cleanup
  useEffect(() => {
    return () => {
      stopListening();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    permissionState,
    error,
    volume,
    startListening,
    stopListening,
    toggleListening,
    setTranscript,
  };
}
