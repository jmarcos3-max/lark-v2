import { MOOD_LAYERS_NAME, MOOD_LAYERS_PREVIEW_TITLE } from '@/lib/lark-copy';
import {
  Play,
  Pause,
  SkipBack,
  Volume2,
  AudioWaveform,
  Loader2,
  ExternalLink,
  Sparkles,
  Upload,
} from 'lucide-react';
import { openAudiotoolStudio } from '@/lib/open-audiotool-studio';
import { useWowPassPreview } from '@/lib/useWowPassPreview';
import { downloadMoodLayers, moodLayerDownloadHint } from '@/lib/download-mood-layers';
import React, { useState } from 'react';

function PreviewVisualizer({ levels, isPlaying, isGenerating }) {
  const bars = levels?.length ? levels : Array.from({ length: 32 }, (_, i) => (
    0.12 + Math.abs(Math.sin(i * 0.55)) * 0.18
  ));

  return (
    <div className="flex items-end justify-center gap-0.5 h-12 w-full px-2">
      {bars.map((level, i) => {
        const h = isPlaying
          ? Math.max(8, level * 100)
          : Math.max(4, 15 + Math.sin(i * 0.7) * 12);
        return (
          <div
            key={i}
            className={`rounded-sm flex-1 transition-all ${isPlaying ? 'wave-bar' : ''}`}
            style={{
              height: `${h}%`,
              background: isGenerating
                ? 'linear-gradient(to top, rgba(56,189,248,0.7), rgba(125,211,252,0.25))'
                : 'linear-gradient(to top, rgba(139,92,246,0.85), rgba(167,139,250,0.35))',
              '--dur': `${0.35 + (i % 7) * 0.07}s`,
              animationDelay: `${(i % 5) * 0.05}s`,
              transformOrigin: 'bottom',
              opacity: isPlaying || isGenerating ? 1 : 0.35,
            }}
          />
        );
      })}
    </div>
  );
}

function formatTime(seconds) {
  if (!seconds || Number.isNaN(seconds)) return '0:00';
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
}

export default function PlaybackEngineCard({
  moodLayers = [],
  isGeneratingMoodLayers = false,
  isProcessing = false,
  isImportingWowLayers = false,
  wowImportStatus = null,
  onImportToStudio,
  dawUrl,
}) {
  const [downloadMsg, setDownloadMsg] = useState(null);
  const {
    tracks,
    isPlaying,
    currentTime,
    duration,
    loading,
    loadError,
    meterLevels,
    togglePlay,
    seek,
    setTrackVolume,
    toggleTrackEnabled,
    hasAudio,
  } = useWowPassPreview({ moodLayers });

  const isGenerating = isGeneratingMoodLayers || isProcessing;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const layerCount = moodLayers.length;

  const handleDownloadLayers = () => {
    const count = downloadMoodLayers(moodLayers);
    if (count > 0) {
      setDownloadMsg(moodLayerDownloadHint());
      setTimeout(() => setDownloadMsg(null), 5000);
    }
  };

  return (
    <div
      className="lark-card-glass rounded-2xl p-5 h-full flex flex-col"
      style={{ minHeight: '340px' }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="w-1.5 h-5 rounded-full"
            style={{ background: 'linear-gradient(to bottom, #38BDF8, #7C3AED)' }}
          />
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--lark-text-muted)' }}>
            {MOOD_LAYERS_PREVIEW_TITLE}
          </span>
        </div>
        <div
          className="text-[9px] font-mono px-2 py-1 rounded-md uppercase tracking-wider flex items-center gap-1"
          style={{
            background: 'rgba(56,189,248,0.1)',
            color: 'rgba(125,211,252,0.9)',
            border: '1px solid rgba(56,189,248,0.25)',
          }}
        >
          <Sparkles size={9} />
          ElevenLabs
        </div>
      </div>

      <div
        className="flex-1 rounded-xl flex flex-col overflow-hidden relative"
        style={{
          background: 'var(--lark-card)',
          border: '1px solid var(--lark-border)',
        }}
      >
        <div
          className="px-3 py-2 flex items-center gap-1.5"
          style={{ borderBottom: '1px solid var(--lark-border)' }}
        >
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#38BDF8' }} />
          <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: 'rgba(125,211,252,0.75)' }}>
            {layerCount
              ? `${layerCount} layer${layerCount > 1 ? 's' : ''}`
              : 'No layers yet'}
          </span>
          {(loading || isGenerating) && (
            <Loader2 size={9} className="animate-spin ml-auto" style={{ color: '#38BDF8' }} />
          )}
        </div>

        <div className="flex-1 flex flex-col px-3 py-3 gap-3 min-h-0">
          <PreviewVisualizer
            levels={meterLevels}
            isPlaying={isPlaying}
            isGenerating={isGeneratingMoodLayers}
          />

          {loadError && (
            <p className="text-[10px] text-center" style={{ color: '#f87171' }}>{loadError}</p>
          )}

          {!hasAudio && !loading && !isGenerating && (
            <p className="text-[10px] text-center leading-relaxed" style={{ color: 'var(--lark-text-subtle)' }}>
              Generate {MOOD_LAYERS_NAME} in Step 6 to preview ElevenLabs layers here.
            </p>
          )}

          {tracks.length > 0 && (
            <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
              {tracks.map((track) => (
                <div
                  key={track.id}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5"
                  style={{
                    background: track.enabled ? 'rgba(139,92,246,0.06)' : 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    opacity: track.enabled ? 1 : 0.5,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => toggleTrackEnabled(track.id)}
                    className="text-[9px] font-mono uppercase w-14 shrink-0 text-left truncate"
                    style={{ color: '#7DD3FC' }}
                    title={track.enabled ? 'Mute track' : 'Unmute track'}
                  >
                    {track.label}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={track.volume}
                    onChange={(e) => setTrackVolume(track.id, parseFloat(e.target.value))}
                    className="flex-1 h-1 accent-violet-500 cursor-pointer min-w-0"
                    disabled={!track.enabled}
                  />
                </div>
              ))}
            </div>
          )}

          <div className="w-full px-1 mt-auto">
            <div
              className="w-full h-1.5 rounded-full cursor-pointer relative overflow-hidden"
              style={{ background: 'var(--lark-border-hover)' }}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const pct = (e.clientX - rect.left) / rect.width;
                seek(pct * (duration || 0));
              }}
            >
              <div
                className="h-full rounded-full transition-all duration-200"
                style={{
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, #38BDF8, #A78BFA)',
                  boxShadow: progress > 0 ? '0 0 8px rgba(56,189,248,0.45)' : 'none',
                }}
              />
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

          <div className="flex items-center justify-center gap-3 pb-1">
            <button
              type="button"
              onClick={() => seek(0)}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: 'var(--lark-text-muted)' }}
            >
              <SkipBack size={14} />
            </button>

            <button
              type="button"
              onClick={togglePlay}
              disabled={!hasAudio || loading}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-40"
              style={{
                background: hasAudio
                  ? 'linear-gradient(135deg, #38BDF8, #7C3AED)'
                  : 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(139,92,246,0.35)',
                color: hasAudio ? '#fff' : 'var(--lark-text-subtle)',
                boxShadow: hasAudio ? '0 0 16px rgba(56,189,248,0.25)' : 'none',
              }}
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
            </button>

            <Volume2 size={12} style={{ color: 'var(--lark-text-muted)' }} />
          </div>
        </div>

        {!hasAudio && !loading && !isGenerating && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
            <AudioWaveform size={28} style={{ color: '#38BDF8' }} />
          </div>
        )}
      </div>

      {dawUrl && (
        <div className="mt-3 flex flex-col gap-2">
          {layerCount > 0 && (
            <>
              <button
                type="button"
                onClick={onImportToStudio}
                disabled={isImportingWowLayers || isGenerating}
                className="w-full py-2 rounded-lg flex items-center justify-center gap-1.5 text-[10px] font-semibold transition-all cursor-pointer disabled:opacity-50"
                style={{
                  color: '#7DD3FC',
                  border: '1px solid rgba(56,189,248,0.35)',
                  background: 'rgba(56,189,248,0.08)',
                }}
              >
                {isImportingWowLayers ? (
                  <>
                    <Loader2 size={11} className="animate-spin" />
                    <span>{wowImportStatus || 'Importing to Studio…'}</span>
                  </>
                ) : (
                  <>
                    <Upload size={11} />
                    <span>Import {MOOD_LAYERS_NAME} to Audiotool Studio</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleDownloadLayers}
                disabled={isGenerating}
                className="w-full py-2 rounded-lg flex items-center justify-center gap-1.5 text-[10px] font-semibold transition-all cursor-pointer disabled:opacity-50"
                style={{
                  color: 'var(--lark-text-muted)',
                  border: '1px solid var(--lark-border)',
                  background: 'rgba(128,128,128,0.06)',
                }}
              >
                Download MP3 layers
              </button>
              {downloadMsg && (
                <p className="text-[9px] text-center leading-snug px-1" style={{ color: '#86efac' }}>
                  {downloadMsg}
                </p>
              )}
            </>
          )}
          <button
            type="button"
            onClick={() => openAudiotoolStudio(dawUrl)}
            className="w-full py-2 rounded-lg flex items-center justify-center gap-1.5 text-[10px] font-semibold transition-all cursor-pointer"
            style={{
              color: 'var(--lark-violet-bright)',
              border: '1px solid rgba(139,92,246,0.25)',
              background: 'rgba(139,92,246,0.06)',
            }}
          >
            <ExternalLink size={11} />
            Open MIDI mix in Audiotool Studio
          </button>
        </div>
      )}
    </div>
  );
}
