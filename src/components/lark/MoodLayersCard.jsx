import React from 'react';
import { Loader2, Music2, Plus } from 'lucide-react';
import { MOOD_LAYERS_NAME, MOOD_LAYERS_PREVIEW_TITLE } from '@/lib/lark-copy';

export default function MoodLayersCard({
  layers = [],
  isGenerating = false,
  onGenerate,
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] leading-relaxed max-w-md" style={{ color: 'var(--lark-text-subtle)' }}>
          ElevenLabs reads your hum&apos;s pitch and tempo, then builds hook, riser, and impact layers.
          They appear in <strong style={{ color: 'var(--lark-violet-bright)' }}>{MOOD_LAYERS_PREVIEW_TITLE}</strong> above.
        </p>
        <button
          type="button"
          onClick={onGenerate}
          disabled={isGenerating}
          className="px-2.5 py-1 rounded-lg text-[10px] font-semibold flex items-center gap-1 shrink-0"
          style={{
            background: 'rgba(139,92,246,0.14)',
            border: '1px solid rgba(139,92,246,0.35)',
            color: 'var(--lark-violet-bright)',
            opacity: isGenerating ? 0.7 : 1,
          }}
        >
          {isGenerating ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />}
          {isGenerating ? 'Generating…' : `Generate ${MOOD_LAYERS_NAME}`}
        </button>
      </div>

      {!layers.length ? (
        <div
          className="rounded-xl p-4 text-center"
          style={{ border: '1px dashed rgba(139,92,246,0.25)', color: 'var(--lark-text-subtle)' }}
        >
          <Music2 size={18} className="mx-auto mb-2 opacity-50" />
          <p className="text-xs">No {MOOD_LAYERS_NAME} yet.</p>
        </div>
      ) : (
        layers.map((layer) => (
          <div
            key={layer.id}
            className="rounded-xl px-3 py-2"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <p className="text-xs font-semibold capitalize" style={{ color: 'var(--lark-text)' }}>
              {layer.label}
            </p>
            <p className="text-[10px] mt-0.5 leading-snug" style={{ color: 'var(--lark-text-subtle)' }}>
              {layer.prompt}
            </p>
          </div>
        ))
      )}
    </div>
  );
}
