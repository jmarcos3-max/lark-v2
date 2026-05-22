import React, { useState } from 'react';
import { Sliders, Zap, Loader2, Save, Plus, FolderOpen } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const MOCK_PROJECTS = [
  { id: 1, title: 'Rainy Evening Session', instrument: 'Piano', mood: 'Melancholic' },
  { id: 2, title: 'Late Night Bass Groove', instrument: 'Bass', mood: 'Calm' },
  { id: 3, title: 'Morning Drum Loop', instrument: 'Drums', mood: 'Energetic' },
  { id: 4, title: 'Electric Soul', instrument: 'Guitar', mood: 'Rock' },
];

const INSTRUMENTS = [
  { value: 'Piano', icon: '🎹' },
  { value: 'Bass', icon: '🎸' },
  { value: 'Drums', icon: '🥁' },
  { value: 'Guitar', icon: '🎵' },
];

const MOODS = [
  { value: 'Calm', icon: '🌊' },
  { value: 'Rock', icon: '🎸' },
  { value: 'Melancholic', icon: '🌧️' },
  { value: 'Energetic', icon: '⚡' },
];

export default function ParameterMatrixCard({
  instrument,
  mood,
  onInstrumentChange,
  onMoodChange,
  onAutomate,
  onNewProject,
  isProcessing,
  hasAudio,
  currentProject,
  onSaved,
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  const [showProjects, setShowProjects] = useState(false);

  const handleSave = async () => {
    if (!currentProject.title && !instrument && !mood) return;
    setIsSaving(true);
    await base44.entities.Project.create({
      title: currentProject.title || 'Untitled Track',
      source_audio_url: currentProject.source_audio_url || '',
      target_instrument: instrument,
      selected_mood: mood,
      elevenlabs_output_url: currentProject.elevenlabs_output_url || '',
    });
    setIsSaving(false);
    setSavedMsg(true);
    onSaved?.();
    setTimeout(() => setSavedMsg(false), 2000);
  };

  return (
    <div
      className="lark-card-glass rounded-2xl p-5 h-full flex flex-col"
      style={{ minHeight: '340px' }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <div
          className="w-1.5 h-5 rounded-full"
          style={{ background: 'linear-gradient(to bottom, #8B5CF6, #4C1D95)' }}
        />
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--lark-text-muted)' }}>
          Parameter Matrix
        </span>
      </div>

      {/* Instrument Selector */}
      <div className="mb-5">
        <label className="block text-[10px] uppercase tracking-widest mb-2.5" style={{ color: 'var(--lark-text-subtle)' }}>
          Target Instrument
        </label>
        <div className="grid grid-cols-4 gap-2">
          {INSTRUMENTS.map(({ value, icon }) => (
            <button
              key={value}
              onClick={() => onInstrumentChange(value)}
              className="flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-medium transition-all duration-200"
              style={{
                background: instrument === value
                  ? 'rgba(139,92,246,0.2)'
                  : 'rgba(255,255,255,0.03)',
                border: instrument === value
                  ? '1px solid rgba(139,92,246,0.5)'
                  : '1px solid rgba(255,255,255,0.07)',
                color: instrument === value ? 'var(--lark-violet-bright)' : 'var(--lark-text-muted)',
                boxShadow: instrument === value ? '0 0 12px rgba(139,92,246,0.2)' : 'none',
              }}
            >
              <span className="text-base">{icon}</span>
              <span>{value}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Mood Chips */}
      <div className="mb-5">
        <label className="block text-[10px] uppercase tracking-widest mb-2.5" style={{ color: 'var(--lark-text-subtle)' }}>
          Mood Profile
        </label>
        <div className="grid grid-cols-2 gap-2">
          {MOODS.map(({ value, icon }) => (
            <button
              key={value}
              onClick={() => onMoodChange(value)}
              className="flex items-center gap-2 py-2.5 px-3 rounded-xl text-xs font-medium transition-all duration-200"
              style={{
                background: mood === value
                  ? 'rgba(139,92,246,0.2)'
                  : 'rgba(255,255,255,0.03)',
                border: mood === value
                  ? '1px solid rgba(139,92,246,0.5)'
                  : '1px solid rgba(255,255,255,0.07)',
                color: mood === value ? 'var(--lark-violet-bright)' : 'var(--lark-text-muted)',
                boxShadow: mood === value ? '0 0 10px rgba(139,92,246,0.18)' : 'none',
              }}
            >
              <span>{icon}</span>
              <span>{value}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1" />

      {/* Project Actions Row */}
      <div className="flex gap-2 mb-2 relative">
        <button
          onClick={onNewProject}
          className="flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 text-xs font-medium transition-all duration-200"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'var(--lark-text-muted)',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.3)'; e.currentTarget.style.color = 'var(--lark-violet-bright)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'var(--lark-text-muted)'; }}
        >
          <Plus size={12} />
          New Project
        </button>
        <button
          onClick={() => setShowProjects(v => !v)}
          className="flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 text-xs font-medium transition-all duration-200"
          style={{
            background: showProjects ? 'rgba(139,92,246,0.1)' : 'rgba(255,255,255,0.03)',
            border: showProjects ? '1px solid rgba(139,92,246,0.35)' : '1px solid rgba(255,255,255,0.08)',
            color: showProjects ? 'var(--lark-violet-bright)' : 'var(--lark-text-muted)',
          }}
        >
          <FolderOpen size={12} />
          Open Project
        </button>

        {/* Project Popover */}
        {showProjects && (
          <div
            className="absolute bottom-full mb-2 left-0 right-0 rounded-xl overflow-hidden z-20"
            style={{ background: '#18181b', border: '1px solid rgba(139,92,246,0.25)', boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}
          >
            <div className="px-3 py-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
              <span className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--lark-text-muted)' }}>Cloud Projects</span>
            </div>
            {MOCK_PROJECTS.map(p => (
              <button
                key={p.id}
                onClick={() => {
                  onInstrumentChange(p.instrument);
                  onMoodChange(p.mood);
                  setShowProjects(false);
                }}
                className="w-full px-3 py-2.5 flex items-center justify-between text-left transition-all duration-150"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                <div>
                  <p className="text-xs font-medium" style={{ color: 'var(--lark-text)' }}>{p.title}</p>
                  <p className="text-[10px]" style={{ color: 'var(--lark-text-muted)' }}>{p.instrument} · {p.mood}</p>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(139,92,246,0.15)', color: 'var(--lark-violet-bright)' }}>Load</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={isSaving || savedMsg}
        className="w-full py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold mb-2 transition-all duration-200"
        style={{
          background: savedMsg ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.04)',
          border: savedMsg ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(255,255,255,0.1)',
          color: savedMsg ? '#86efac' : 'var(--lark-text-muted)',
        }}
      >
        {isSaving ? (
          <Loader2 size={13} className="animate-spin" />
        ) : (
          <Save size={13} />
        )}
        {savedMsg ? 'Project Saved!' : 'Save Project'}
      </button>

      {/* Automate Button */}
      <button
        onClick={onAutomate}
        disabled={isProcessing}
        className="w-full py-3 rounded-xl flex items-center justify-center gap-2.5 text-sm font-bold transition-all duration-300"
        style={{
          background: isProcessing
            ? 'rgba(139,92,246,0.15)'
            : 'linear-gradient(135deg, #7C3AED, #5B21B6)',
          border: '1px solid rgba(139,92,246,0.4)',
          color: isProcessing ? 'var(--lark-violet-bright)' : '#fff',
          boxShadow: isProcessing ? 'none' : '0 0 24px rgba(139,92,246,0.3), 0 4px 16px rgba(0,0,0,0.4)',
        }}
      >
        {isProcessing ? (
          <>
            <Loader2 size={15} className="animate-spin" />
            <span>Processing via Nexus SDK...</span>
          </>
        ) : (
          <>
            <Zap size={15} />
            <span>Automate via Audiotool SDK</span>
          </>
        )}
      </button>
    </div>
  );
}