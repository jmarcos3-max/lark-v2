import React, { useMemo, useState } from 'react';
import { Loader2, Music2, Play, Pause, Plus } from 'lucide-react';

export default function MoodLayersCard({
  layers = [],
  isGenerating = false,
  onGenerate,
  onUseLayer,
}) {
  const [playingId, setPlayingId] = useState(null);
  const audio = useMemo(() => new Audio(), []);

  const stopPlayback = () => {
    audio.pause();
    audio.currentTime = 0;
    setPlayingId(null);
  };

  const togglePlayback = async (layer) => {
    if (!layer?.url) return;
    if (playingId === layer.id) {
      stopPlayback();
      return;
    }
    audio.pause();
    audio.src = layer.url;
    try {
      await audio.play();
      setPlayingId(layer.id);
      audio.onended = () => setPlayingId(null);
    } catch {
      setPlayingId(null);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px]" style={{ color: 'var(--lark-text-subtle)' }}>
          Generate optional ElevenLabs layers from your selected mood.
        </p>
        <button
          type="button"
          onClick={onGenerate}
          disabled={isGenerating}
          className="px-2.5 py-1 rounded-lg text-[10px] font-semibold flex items-center gap-1"
          style={{
            background: 'rgba(139,92,246,0.14)',
            border: '1px solid rgba(139,92,246,0.35)',
            color: 'var(--lark-violet-bright)',
            opacity: isGenerating ? 0.7 : 1,
          }}
        >
          {isGenerating ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />}
          {isGenerating ? 'Generating…' : 'Generate layers'}
        </button>
      </div>

      {!layers.length ? (
        <div
          className="rounded-xl p-4 text-center"
          style={{ border: '1px dashed rgba(139,92,246,0.25)', color: 'var(--lark-text-subtle)' }}
        >
          <Music2 size={18} className="mx-auto mb-2 opacity-50" />
          <p className="text-xs">No mood layers yet.</p>
        </div>
      ) : (
        layers.map((layer) => (
          <div
            key={layer.id}
            className="rounded-xl px-3 py-2 flex items-center justify-between"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div>
              <p className="text-xs font-semibold" style={{ color: 'var(--lark-text)' }}>{layer.label}</p>
              <p className="text-[10px] truncate max-w-[620px]" style={{ color: 'var(--lark-text-subtle)' }}>
                {layer.prompt}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => togglePlayback(layer)}
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{
                  background: 'rgba(139,92,246,0.15)',
                  border: '1px solid rgba(139,92,246,0.4)',
                  color: 'var(--lark-violet-bright)',
                }}
                title={playingId === layer.id ? 'Pause layer' : 'Play layer'}
              >
                {playingId === layer.id ? <Pause size={13} /> : <Play size={13} className="ml-0.5" />}
              </button>
              <button
                type="button"
                onClick={() => onUseLayer?.(layer)}
                className="px-2 py-1 rounded-md text-[10px] font-semibold"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: 'var(--lark-text-muted)',
                }}
                title="Use this layer in Playback Engine"
              >
                Use
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
