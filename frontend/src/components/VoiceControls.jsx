import React from 'react';

/**
 * Audio waveform visualization for TTS playback.
 * Shows: speaking state, progress bar, mute toggle, pause/resume, rate control.
 */
function VoiceControls({
  isSpeaking,
  isPaused,
  isMuted,
  progress,
  rate,
  onToggleMute,
  onTogglePause,
  onStop,
  onRateChange,
  voices = [],
  selectedVoice,
  onVoiceChange,
  showVoiceSelect = false,
  className = '',
}) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Mute/Unmute */}
      <button
        type="button"
        onClick={onToggleMute}
        className={`p-1.5 rounded-md transition-all duration-200 ${
          isMuted
            ? 'bg-red-900/30 border-red-700/50 text-red-400'
            : 'bg-black/50 border-purple-500/30 text-purple-400 hover:bg-purple-900/20'
        } border`}
        title={isMuted ? 'Unmute AI voice' : 'Mute AI voice'}
      >
        {isMuted ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
        )}
      </button>

      {/* Audio Waveform / Progress */}
      {isSpeaking && (
        <div className="flex items-center gap-1.5 px-2 py-1 bg-black/50 border border-purple-500/30 rounded-md">
          {/* Animated bars */}
          <div className="flex items-end gap-0.5 h-4">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`w-0.5 bg-purple-400 rounded-full transition-all ${
                  isPaused ? 'h-1' : ''
                }`}
                style={{
                  height: isPaused ? '4px' : `${Math.max(4, Math.sin((Date.now() / 200) + i * 1.5) * 8 + 10)}px`,
                  animation: isPaused ? 'none' : `waveform ${0.5 + i * 0.1}s ease-in-out infinite alternate`,
                }}
              />
            ))}
          </div>

          {/* Progress bar */}
          <div className="w-12 h-1 bg-purple-900/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-400 rounded-full transition-all duration-100"
              style={{ width: `${progress * 100}%` }}
            />
          </div>

          {/* Pause/Resume */}
          <button
            type="button"
            onClick={onTogglePause}
            className="p-0.5 text-purple-400 hover:text-purple-200 transition-colors"
          >
            {isPaused ? (
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            )}
          </button>

          {/* Stop */}
          <button
            type="button"
            onClick={onStop}
            className="p-0.5 text-purple-400 hover:text-red-400 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h12v12H6z" />
            </svg>
          </button>
        </div>
      )}

      {/* Speed Control */}
      <select
        value={rate}
        onChange={(e) => onRateChange(parseFloat(e.target.value))}
        className="bg-black/70 text-purple-300 text-xs font-mono border border-purple-500/30 rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
        title="Speech rate"
      >
        <option value={0.5}>0.5x</option>
        <option value={0.75}>0.75x</option>
        <option value={1}>1x</option>
        <option value={1.25}>1.25x</option>
        <option value={1.5}>1.5x</option>
        <option value={2}>2x</option>
      </select>

      {/* Voice Selection */}
      {showVoiceSelect && voices.length > 0 && (
        <select
          value={selectedVoice?.name || ''}
          onChange={(e) => {
            const voice = voices.find(v => v.name === e.target.value);
            if (voice) onVoiceChange(voice);
          }}
          className="bg-black/70 text-purple-300 text-xs font-mono border border-purple-500/30 rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-purple-500/50 max-w-32 truncate"
          title="Voice selection"
        >
          {voices.map((voice) => (
            <option key={voice.name} value={voice.name}>
              {voice.name.length > 25 ? voice.name.substring(0, 25) + '...' : voice.name}
            </option>
          ))}
        </select>
      )}

      <style>{`
        @keyframes waveform {
          0% { height: 4px; }
          100% { height: 16px; }
        }
      `}</style>
    </div>
  );
}

export default VoiceControls;
