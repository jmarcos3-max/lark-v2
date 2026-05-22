import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, Volume2, AudioWaveform, Loader2 } from 'lucide-react';

const NexusVisualizer = ({ isPlaying }) => {
  const bars = Array.from({ length: 32 }, (_, i) => i);
  return (
    <div className="flex items-end justify-center gap-0.5 h-12 w-full px-2">
      {bars.map((i) => {
        const baseH = 15 + Math.sin(i * 0.7) * 20 + Math.cos(i * 0.4) * 15;
        return (
          <div
            key={i}
            className={`rounded-sm flex-1 transition-all ${isPlaying ? 'wave-bar' : ''}`}
            style={{
              height: `${Math.max(4, baseH)}%`,
              background: `linear-gradient(to top, rgba(139,92,246,0.8), rgba(167,139,250,0.3))`,
              '--dur': `${0.4 + (i % 7) * 0.08}s`,
              animationDelay: `${(i % 5) * 0.06}s`,
              transformOrigin: 'bottom',
              opacity: isPlaying ? 1 : 0.35,
            }}
          />
        );
      })}
    </div>
  );
};

export default function PlaybackEngineCard({ outputUrl, isProcessing }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);

  useEffect(() => {
    if (!outputUrl) return;
    setIsPlaying(false);
    setCurrentTime(0);
  }, [outputUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = x / rect.width;
    const newTime = pct * (duration || 0);
    if (audioRef.current) audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const restart = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
    }
  };

  const formatTime = (s) => {
    if (!s || isNaN(s)) return '0:00';
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className="lark-card-glass rounded-2xl p-5 h-full flex flex-col"
      style={{ minHeight: '340px' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="w-1.5 h-5 rounded-full"
            style={{ background: 'linear-gradient(to bottom, #8B5CF6, #4C1D95)' }}
          />
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--lark-text-muted)' }}>
            Playback Engine
          </span>
        </div>
        <div
          className="text-[9px] font-mono px-2 py-1 rounded-md uppercase tracking-wider"
          style={{
            background: 'rgba(139,92,246,0.1)',
            color: 'rgba(139,92,246,0.7)',
            border: '1px solid rgba(139,92,246,0.2)',
          }}
        >
          Nexus SDK
        </div>
      </div>

      {/* Audiotool Nexus SDK Viewport */}
      <div
        id="audiotool-nexus-sdk-viewport"
        className="flex-1 rounded-xl flex flex-col overflow-hidden"
        style={{
          background: 'var(--lark-card)',
          border: '1px solid var(--lark-border)',
          position: 'relative',
        }}
      >
        {/* Viewport label */}
        <div
          className="px-3 py-2 flex items-center gap-1.5"
          style={{ borderBottom: '1px solid var(--lark-border)' }}
        >
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#8B5CF6' }} />
          <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: 'rgba(139,92,246,0.6)' }}>
            Audiotool Nexus SDK Viewport
          </span>
          {isProcessing && (
            <Loader2 size={9} className="animate-spin ml-auto" style={{ color: '#8B5CF6' }} />
          )}
        </div>

        {/* Visualizer area */}
        <div className="flex-1 flex flex-col items-center justify-center px-3 py-4 gap-3">
          {isProcessing ? (
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-1">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-0.5 rounded-full wave-bar"
                    style={{
                      height: '24px',
                      background: 'linear-gradient(to top, #7C3AED, #A78BFA)',
                      '--dur': `${0.4 + i * 0.1}s`,
                      animationDelay: `${i * 0.07}s`,
                      transformOrigin: 'bottom',
                    }}
                  />
                ))}
              </div>
              <p className="text-[10px]" style={{ color: 'rgba(139,92,246,0.7)' }}>
                Synthesizing via Nexus...
              </p>
            </div>
          ) : (
            <NexusVisualizer isPlaying={isPlaying} />
          )}

          {/* Timeline */}
          <div className="w-full px-1">
            <div
              className="w-full h-1.5 rounded-full cursor-pointer relative overflow-hidden"
              style={{ background: 'var(--lark-border-hover)' }}
              onClick={handleSeek}
            >
              {/* Animated idle shimmer when no track */}
              {!outputUrl && !isProcessing && (
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.3), transparent)',
                    animation: 'shimmer 2s infinite',
                  }}
                />
              )}
              {/* Progress bar */}
              <div
                className="h-full rounded-full transition-all duration-200"
                style={{
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, #7C3AED, #A78BFA)',
                  boxShadow: progress > 0 ? '0 0 8px rgba(139,92,246,0.5)' : 'none',
                }}
              />
              {/* Playhead */}
              {progress > 0 && (
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full"
                  style={{
                    left: `calc(${progress}% - 6px)`,
                    background: '#A78BFA',
                    boxShadow: '0 0 8px rgba(167,139,250,0.6)',
                  }}
                />
              )}
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[9px] font-mono" style={{ color: 'var(--lark-text-muted)' }}>
                {formatTime(currentTime)}
              </span>
              <span className="text-[9px] font-mono" style={{ color: 'var(--lark-text-subtle)' }}>
                {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={restart}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: 'var(--lark-text-muted)' }}
            >
              <SkipBack size={14} />
            </button>

            <button
              onClick={togglePlay}
              disabled={!outputUrl}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200"
              style={{
                background: outputUrl
                  ? 'linear-gradient(135deg, #7C3AED, #5B21B6)'
                  : 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(139,92,246,0.4)',
                color: outputUrl ? '#fff' : 'var(--lark-text-subtle)',
                boxShadow: outputUrl ? '0 0 16px rgba(139,92,246,0.3)' : 'none',
              }}
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
            </button>

            <div className="flex items-center gap-1.5">
              <Volume2 size={12} style={{ color: 'var(--lark-text-muted)' }} />
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={e => {
                  const v = parseFloat(e.target.value);
                  setVolume(v);
                  if (audioRef.current) audioRef.current.volume = v;
                }}
                className="w-14 h-1 accent-violet-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Empty state label */}
        {!outputUrl && !isProcessing && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <AudioWaveform size={28} className="mx-auto mb-2 opacity-10" style={{ color: '#8B5CF6' }} />
              <p className="text-[10px] uppercase tracking-widest opacity-20" style={{ color: '#8B5CF6' }}>
                Awaiting Output
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Hidden audio element */}
      {outputUrl && (
        <audio
          ref={audioRef}
          src={outputUrl}
          onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
          onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
          onEnded={() => setIsPlaying(false)}
          style={{ display: 'none' }}
        />
      )}
    </div>
  );
}