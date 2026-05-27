import React, { useState } from 'react';
import { Zap, Loader2, Save, Plus, FolderOpen, X, ExternalLink, AlertCircle } from 'lucide-react';
import { useAudiotool } from '@/lib/AudiotoolContext';
import { useAudiotoolProjects } from '@/hooks/useAudiotoolProjects';
import { decodeLarkMeta } from '@/lib/larkMeta';

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
  onProjectOpened,  // (atProject, larkMeta, doc, dawUrl) => void
  isProcessing,
  currentProject,   // { title, source_audio_url, elevenlabs_output_url, atProjectName, dawUrl }
  onSaved,
}) {
  const { status } = useAudiotool();
  const { loading, error, listProjects, createProject, saveProject, openProject } = useAudiotoolProjects();

  const [savedMsg, setSavedMsg] = useState(false);
  const [showProjects, setShowProjects] = useState(false);
  const [cloudProjects, setCloudProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  const isAuthenticated = status === 'authenticated';

  // --- New Project ---
  const handleNewProject = async () => {
    const atProject = await createProject({
      title: 'Untitled Track',
      larkMeta: { instrument, mood },
    });
    if (atProject) {
      const result = await openProject(atProject.name);
      if (result) onProjectOpened?.(atProject, { instrument, mood }, result.doc, result.dawUrl);
    }
  };

  // --- Open Project popup ---
  const handleOpenPopup = async () => {
    if (showProjects) { setShowProjects(false); return; }
    setLoadingProjects(true);
    setShowProjects(true);
    const projects = await listProjects();
    setCloudProjects(projects);
    setLoadingProjects(false);
  };

  const handleLoadProject = async ({ atProject, larkMeta }) => {
    setShowProjects(false);
    const result = await openProject(atProject.name);
    if (result) {
      if (larkMeta?.instrument) onInstrumentChange(larkMeta.instrument);
      if (larkMeta?.mood) onMoodChange(larkMeta.mood);
      onProjectOpened?.(atProject, larkMeta, result.doc, result.dawUrl);
    }
  };

  // --- Save Project ---
  const handleSave = async () => {
    if (!currentProject?.atProjectName) {
      // No active AT project — create one first
      const atProject = await createProject({
        title: currentProject?.title || 'Untitled Track',
        larkMeta: {
          instrument,
          mood,
          sourceAudioUrl: currentProject?.source_audio_url || '',
          outputUrl: currentProject?.elevenlabs_output_url || '',
        },
      });
      if (atProject) {
        setSavedMsg(true);
        onSaved?.(atProject);
        setTimeout(() => setSavedMsg(false), 2000);
      }
      return;
    }
    // Update existing
    await saveProject(currentProject.atProjectName, {
      title: currentProject.title || 'Untitled Track',
      larkMeta: {
        instrument,
        mood,
        sourceAudioUrl: currentProject?.source_audio_url || '',
        outputUrl: currentProject?.elevenlabs_output_url || '',
      },
    });
    setSavedMsg(true);
    onSaved?.();
    setTimeout(() => setSavedMsg(false), 2000);
  };

  return (
    <div className="lark-card-glass rounded-2xl p-5 h-full flex flex-col" style={{ minHeight: '340px' }}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <div className="w-1.5 h-5 rounded-full" style={{ background: 'linear-gradient(to bottom, #8B5CF6, #4C1D95)' }} />
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--lark-text-muted)' }}>
          Parameter Matrix
        </span>
        {currentProject?.dawUrl && (
          <a
            href={currentProject.dawUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto flex items-center gap-1 text-[10px]"
            style={{ color: 'var(--lark-violet-bright)' }}
          >
            <ExternalLink size={10} />
            Open in Studio
          </a>
        )}
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
                background: instrument === value ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.03)',
                border: instrument === value ? '1px solid rgba(139,92,246,0.5)' : '1px solid rgba(255,255,255,0.07)',
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
                background: mood === value ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.03)',
                border: mood === value ? '1px solid rgba(139,92,246,0.5)' : '1px solid rgba(255,255,255,0.07)',
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

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-[10px] mb-2 px-2 py-1.5 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', color: '#FCA5A5', border: '1px solid rgba(239,68,68,0.2)' }}>
          <AlertCircle size={10} />
          {error}
        </div>
      )}

      {/* Project Actions Row */}
      <div className="flex gap-2 mb-2 relative">
        <button
          onClick={isAuthenticated ? handleNewProject : undefined}
          disabled={!isAuthenticated || loading}
          className="flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 text-xs font-medium transition-all duration-200"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: isAuthenticated ? 'var(--lark-text-muted)' : 'var(--lark-text-subtle)',
            cursor: isAuthenticated ? 'pointer' : 'not-allowed',
          }}
          onMouseEnter={e => { if (isAuthenticated) { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.3)'; e.currentTarget.style.color = 'var(--lark-violet-bright)'; } }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = isAuthenticated ? 'var(--lark-text-muted)' : 'var(--lark-text-subtle)'; }}
        >
          {loading ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
          New Project
        </button>

        <button
          onClick={isAuthenticated ? handleOpenPopup : undefined}
          disabled={!isAuthenticated || loadingProjects}
          className="flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 text-xs font-medium transition-all duration-200"
          style={{
            background: showProjects ? 'rgba(139,92,246,0.1)' : 'rgba(255,255,255,0.03)',
            border: showProjects ? '1px solid rgba(139,92,246,0.35)' : '1px solid rgba(255,255,255,0.08)',
            color: showProjects ? 'var(--lark-violet-bright)' : isAuthenticated ? 'var(--lark-text-muted)' : 'var(--lark-text-subtle)',
            cursor: isAuthenticated ? 'pointer' : 'not-allowed',
          }}
        >
          {loadingProjects ? <Loader2 size={12} className="animate-spin" /> : <FolderOpen size={12} />}
          Open Project
        </button>

        {/* Cloud Projects Popover */}
        {showProjects && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowProjects(false)} />
            <div
              className="absolute bottom-full mb-2 left-0 right-0 rounded-xl overflow-hidden z-20"
              style={{ background: 'var(--lark-card)', border: '1px solid rgba(139,92,246,0.25)', boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}
            >
              <div className="px-3 py-2 flex items-center justify-between" style={{ borderBottom: '1px solid var(--lark-border)' }}>
                <span className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--lark-text-muted)' }}>Cloud Projects</span>
                <button onClick={() => setShowProjects(false)}><X size={11} style={{ color: 'var(--lark-text-subtle)' }} /></button>
              </div>
              {loadingProjects ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 size={16} className="animate-spin" style={{ color: 'var(--lark-violet-bright)' }} />
                </div>
              ) : cloudProjects.length === 0 ? (
                <p className="text-xs text-center py-4" style={{ color: 'var(--lark-text-muted)' }}>No projects found</p>
              ) : (
                cloudProjects.map(({ atProject, larkMeta }) => (
                  <button
                    key={atProject.name}
                    onClick={() => handleLoadProject({ atProject, larkMeta })}
                    className="w-full px-3 py-2.5 flex items-center justify-between text-left transition-all duration-150"
                    style={{ borderBottom: '1px solid var(--lark-border)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.1)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div>
                      <p className="text-xs font-medium" style={{ color: 'var(--lark-text)' }}>{atProject.displayName || 'Untitled'}</p>
                      <p className="text-[10px]" style={{ color: 'var(--lark-text-muted)' }}>
                        {larkMeta?.instrument || '—'} · {larkMeta?.mood || '—'}
                      </p>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(139,92,246,0.15)', color: 'var(--lark-violet-bright)' }}>Load</span>
                  </button>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={!isAuthenticated || loading || savedMsg}
        className="w-full py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold mb-2 transition-all duration-200"
        style={{
          background: savedMsg ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.04)',
          border: savedMsg ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(255,255,255,0.1)',
          color: savedMsg ? '#86efac' : isAuthenticated ? 'var(--lark-text-muted)' : 'var(--lark-text-subtle)',
        }}
      >
        {loading ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
        {savedMsg ? 'Project Saved!' : 'Save Project'}
      </button>

      {/* Automate Button */}
      <button
        onClick={onAutomate}
        disabled={isProcessing}
        className="w-full py-3 rounded-xl flex items-center justify-center gap-2.5 text-sm font-bold transition-all duration-300"
        style={{
          background: isProcessing ? 'rgba(139,92,246,0.15)' : 'linear-gradient(135deg, #7C3AED, #5B21B6)',
          border: '1px solid rgba(139,92,246,0.4)',
          color: isProcessing ? 'var(--lark-violet-bright)' : '#fff',
          boxShadow: isProcessing ? 'none' : '0 0 24px rgba(139,92,246,0.3), 0 4px 16px rgba(0,0,0,0.4)',
        }}
      >
        {isProcessing ? (
          <><Loader2 size={15} className="animate-spin" /><span>Processing via Nexus SDK...</span></>
        ) : (
          <><Zap size={15} /><span>Automate via Audiotool SDK</span></>
        )}
      </button>
    </div>
  );
}