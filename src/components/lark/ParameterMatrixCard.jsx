import React, { useEffect, useRef, useState } from 'react';
import { Zap, Loader2, Save, Plus, RefreshCw, ExternalLink, Layers } from 'lucide-react';
import { audiotoolProjectToLark } from '@/lib/lark-project-metadata';
import { studioDeviceName, TARGET_INSTRUMENTS, availableStudioLayers, WOW_PASS_LAYERS } from '@/lib/lark-instruments';
import { MOOD_LAYERS_NAME } from '@/lib/lark-copy';
import { openAudiotoolStudio } from '@/lib/open-audiotool-studio';
import LarkStepLabel from '@/components/lark/LarkStepLabel';

const MOODS = [
  { value: 'Calm', icon: '🌊' },
  { value: 'Rock', icon: '🎸' },
  { value: 'Melancholic', icon: '🌧️' },
  { value: 'Energetic', icon: '⚡' },
];

export default function ParameterMatrixCard({
  instrument,
  mood,
  studioLayers = [],
  wowPassLayers = [],
  onInstrumentChange,
  onMoodChange,
  onStudioLayerToggle,
  onWowPassLayerToggle,
  onAutomate,
  onGenerateMoodLayers,
  onNewProject,
  onConnectProject,
  onSave,
  isProcessing,
  isProjectBusy,
  projectError,
  projectSuccess,
  transformStatus,
  isGeneratingMoodLayers,
  isAuthenticated,
  onLogin,
  cloudProjects,
  onRefreshProjects,
  onTransformHint,
  hasAudio,
  hasInstrument,
  hasMood,
  currentProject,
  activeProjectName,
}) {
  const [savedMsg, setSavedMsg] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const nameInputRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    (async () => {
      setLoadingList(true);
      try {
        await onRefreshProjects?.();
      } catch {
        // parent surfaces projectError
      } finally {
        if (!cancelled) setLoadingList(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isAuthenticated, onRefreshProjects]);

  const handleRefreshProjects = async () => {
    if (!isAuthenticated) {
      onLogin?.();
      return;
    }
    setLoadingList(true);
    try {
      await onRefreshProjects?.();
    } catch {
      // parent surfaces projectError
    } finally {
      setLoadingList(false);
    }
  };

  const handleSave = async () => {
    if (!isAuthenticated) {
      onLogin?.();
      return;
    }
    if (!activeProjectName) return;

    const ok = await onSave?.();
    if (ok) {
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 2000);
    }
  };

  const openNameDialog = () => {
    if (!isAuthenticated) {
      onLogin?.();
      return;
    }
    setNewProjectName('');
    setShowNameDialog(true);
  };

  useEffect(() => {
    if (!showNameDialog) return;
    const t = setTimeout(() => nameInputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [showNameDialog]);

  const handleCreateNamedProject = async () => {
    const name = newProjectName.trim();
    if (!name) return;
    setShowNameDialog(false);
    await onNewProject?.(name);
  };

  const handleNameKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCreateNamedProject();
    }
    if (e.key === 'Escape') {
      setShowNameDialog(false);
    }
  };

  const busy = isProjectBusy || isProcessing;
  const hasConnectedProject = Boolean(activeProjectName);
  const connectedTitle = currentProject?.title || 'Untitled Track';
  const layerOptions = availableStudioLayers(instrument);

  const transformBlockerMessage = () => {
    if (!hasAudio) return 'Complete Step 1 first — record or import humming in Audio Capture.';
    if (!hasConnectedProject) return 'Complete Step 2 — select an Audiotool project.';
    if (!hasInstrument) return 'Complete Step 3 — choose a lead instrument.';
    return null;
  };

  const wowPassBlockerMessage = () => {
    const block = transformBlockerMessage();
    if (block) return block;
    if (!hasMood) return `Pick a mood in Step 6 for ${MOOD_LAYERS_NAME}.`;
    if (!wowPassLayers.length) return `Select at least one ${MOOD_LAYERS_NAME} type to generate.`;
    return null;
  };

  const handleTransformClick = () => {
    if (busy || isProcessing) return;

    if (!isAuthenticated) {
      onLogin?.();
      return;
    }

    const hint = transformBlockerMessage();
    if (hint) {
      onTransformHint?.(hint);
      return;
    }

    onAutomate?.();
  };

  const handleGenerateLayersClick = () => {
    if (busy || isGeneratingMoodLayers) return;
    if (!isAuthenticated) {
      onLogin?.();
      return;
    }
    const hint = wowPassBlockerMessage();
    if (hint) {
      onTransformHint?.(hint);
      return;
    }
    onGenerateMoodLayers?.();
  };

  const handleProjectSelect = async (e) => {
    const name = e.target.value;
    if (!name) return;
    await onConnectProject?.(name);
  };

  return (
    <div
      className="lark-card-glass rounded-2xl p-5 h-full flex flex-col"
      style={{ minHeight: '340px' }}
    >
      <div className="flex items-center gap-2 mb-1">
        <div
          className="w-1.5 h-5 rounded-full"
          style={{ background: 'linear-gradient(to bottom, #8B5CF6, #4C1D95)' }}
        />
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--lark-text-muted)' }}>
          Studio Workflow
        </span>
      </div>
      <p className="text-[10px] mb-4 px-1" style={{ color: 'var(--lark-text-subtle)' }}>
        Step 1 is Audio Capture (left). Complete steps 2–5 to write MIDI in Studio.
      </p>

      <div className="mb-5">
        <LarkStepLabel
          step={2}
          title="Select project"
          done={hasConnectedProject}
          className="mb-2.5"
        />
        {!isAuthenticated ? (
          <button
            type="button"
            onClick={onLogin}
            className="w-full py-2.5 px-3 rounded-xl text-xs text-left"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px dashed rgba(139,92,246,0.35)',
              color: 'var(--lark-violet-bright)',
            }}
          >
            Log in to choose an Audiotool project
          </button>
        ) : (
          <div className="flex flex-col gap-2">
            <select
              value={activeProjectName || ''}
              onChange={handleProjectSelect}
              disabled={busy || loadingList}
              className="w-full py-2.5 px-3 rounded-xl text-xs outline-none appearance-none cursor-pointer"
              style={{
                background: hasConnectedProject
                  ? 'rgba(34,197,94,0.08)'
                  : 'rgba(255,255,255,0.03)',
                border: hasConnectedProject
                  ? '1px solid rgba(34,197,94,0.3)'
                  : '1px solid rgba(255,255,255,0.1)',
                color: 'var(--lark-text)',
              }}
            >
              <option value="" disabled>
                {loadingList ? 'Loading projects…' : 'Select a project…'}
              </option>
              {cloudProjects.map((p) => {
                const lark = audiotoolProjectToLark(p);
                return (
                  <option key={p.name} value={p.name}>
                    {lark.title}
                  </option>
                );
              })}
            </select>
            {hasConnectedProject && (
              <p className="text-[10px] truncate px-1" style={{ color: '#86efac' }}>
                Nexus synced · {connectedTitle}
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={openNameDialog}
                disabled={busy}
                className="flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 text-xs font-medium transition-all duration-200"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'var(--lark-text-muted)',
                  opacity: busy ? 0.6 : 1,
                }}
              >
                {isProjectBusy ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                New Project
              </button>
              <button
                type="button"
                onClick={handleRefreshProjects}
                disabled={busy || loadingList}
                className="flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 text-xs font-medium transition-all duration-200"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'var(--lark-text-muted)',
                  opacity: busy ? 0.6 : 1,
                }}
              >
                <RefreshCw size={12} className={loadingList ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>
          </div>
        )}
      </div>

      {projectError && (
        <p className="text-[10px] mb-3 px-2 py-1.5 rounded-lg" style={{ color: '#f87171', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
          {projectError}
        </p>
      )}

      {projectSuccess && !projectError && (
        <p className="text-[10px] mb-3 px-2 py-1.5 rounded-lg" style={{ color: '#86efac', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)' }}>
          {projectSuccess}
        </p>
      )}

      <div className="mb-5">
        <LarkStepLabel
          step={3}
          title="Select lead instrument"
          done={hasInstrument}
          className="mb-2.5"
        />
        <div className="grid grid-cols-4 gap-2">
          {TARGET_INSTRUMENTS.map(({ value, icon }) => (
            <button
              key={value}
              onClick={() => onInstrumentChange(value)}
              disabled={busy}
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
                opacity: busy ? 0.6 : 1,
              }}
            >
              <span className="text-base">{icon}</span>
              <span>{value}</span>
              <span
                className="text-[9px] leading-tight opacity-70"
                style={{ color: instrument === value ? 'var(--lark-violet-bright)' : 'var(--lark-text-subtle)' }}
              >
                {studioDeviceName(value)}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-5">
        <LarkStepLabel
          step={4}
          title="Add Studio layers"
          done={studioLayers.length > 0}
          optional
          className="mb-2.5"
        />
        {!instrument ? (
          <p
            className="text-[10px] px-2 py-2 rounded-lg"
            style={{
              color: 'var(--lark-text-subtle)',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            Choose a lead instrument first.
          </p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {layerOptions.map(({ value, icon }) => {
              const selected = studioLayers.includes(value);
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => onStudioLayerToggle?.(value)}
                  disabled={busy}
                  className="flex flex-col items-center gap-1 py-2 px-1.5 rounded-xl text-[11px] font-medium transition-all duration-200"
                  style={{
                    background: selected
                      ? 'rgba(56,189,248,0.12)'
                      : 'rgba(255,255,255,0.03)',
                    border: selected
                      ? '1px solid rgba(56,189,248,0.4)'
                      : '1px solid rgba(255,255,255,0.07)',
                    color: selected ? '#7DD3FC' : 'var(--lark-text-muted)',
                    opacity: busy ? 0.6 : 1,
                  }}
                >
                  <span className="text-sm">{icon}</span>
                  <span>{value}</span>
                  <span
                    className="text-[8px] opacity-70"
                    style={{ color: selected ? '#7DD3FC' : 'var(--lark-text-subtle)' }}
                  >
                    {studioDeviceName(value)}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="mb-5">
        <LarkStepLabel step={5} title="Transform to Studio" className="mb-2.5" />
        <button
          type="button"
          onClick={handleTransformClick}
          disabled={busy || isProcessing}
          title={
            transformBlockerMessage()
              ? transformBlockerMessage()
              : 'Transcribe your hum and write MIDI in your connected project'
          }
          className="w-full py-3 rounded-xl flex items-center justify-center gap-2.5 text-sm font-bold transition-all duration-300 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
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
              <span>{transformStatus || 'Writing to Studio…'}</span>
            </>
          ) : (
            <>
              <Zap size={15} />
              <span>Transform humming → instrument</span>
            </>
          )}
        </button>
      </div>

      <div className="mb-5">
        <LarkStepLabel
          step={6}
          title={`${MOOD_LAYERS_NAME} (ElevenLabs)`}
          done={hasMood && wowPassLayers.length > 0}
          optional
          className="mb-2.5"
        />
        <div className="grid grid-cols-2 gap-2">
          {MOODS.map(({ value, icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => onMoodChange(mood === value ? null : value)}
              disabled={busy}
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
                opacity: busy ? 0.6 : 1,
              }}
            >
              <span>{icon}</span>
              <span>{value}</span>
            </button>
          ))}
        </div>
        <p className="text-[10px] mt-3 mb-2 px-1" style={{ color: 'var(--lark-text-subtle)' }}>
          {MOOD_LAYERS_NAME} types (MP3 — preview here, import to Studio)
        </p>
        <div className="grid grid-cols-3 gap-2">
          {WOW_PASS_LAYERS.map(({ value, icon }) => {
            const selected = wowPassLayers.includes(value);
            return (
              <button
                key={value}
                type="button"
                onClick={() => onWowPassLayerToggle?.(value)}
                disabled={busy}
                className="flex flex-col items-center gap-1 py-2 px-1.5 rounded-xl text-[10px] font-medium transition-all duration-200"
                style={{
                  background: selected
                    ? 'rgba(56,189,248,0.12)'
                    : 'rgba(255,255,255,0.03)',
                  border: selected
                    ? '1px solid rgba(56,189,248,0.4)'
                    : '1px solid rgba(255,255,255,0.07)',
                  color: selected ? '#7DD3FC' : 'var(--lark-text-muted)',
                  opacity: busy ? 0.6 : 1,
                }}
              >
                <span className="text-sm">{icon}</span>
                <span className="text-center leading-tight">{value}</span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={handleGenerateLayersClick}
          disabled={busy || isGeneratingMoodLayers}
          title={wowPassBlockerMessage() ?? 'Generate ElevenLabs mood layers'}
          className="w-full mt-2 py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold transition-all duration-200 disabled:opacity-60"
          style={{
            background: 'rgba(139,92,246,0.12)',
            border: '1px solid rgba(139,92,246,0.35)',
            color: 'var(--lark-violet-bright)',
          }}
        >
          {isGeneratingMoodLayers ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              <span>Generating {MOOD_LAYERS_NAME}…</span>
            </>
          ) : (
            <>
              <Layers size={14} />
              <span>Generate {MOOD_LAYERS_NAME}</span>
            </>
          )}
        </button>
      </div>

      <div className="flex-1" />

      {currentProject?.dawUrl && (
        <button
          type="button"
          onClick={() => openAudiotoolStudio(currentProject.dawUrl)}
          className="w-full mb-2 py-1.5 rounded-lg flex items-center justify-center gap-1.5 text-[10px] transition-all cursor-pointer"
          style={{ color: 'var(--lark-violet-bright)', border: '1px solid rgba(139,92,246,0.25)', background: 'rgba(139,92,246,0.06)' }}
        >
          <ExternalLink size={11} />
          Open in Audiotool Studio
        </button>
      )}

      <button
        onClick={handleSave}
        disabled={busy || savedMsg || !hasConnectedProject}
        title={!hasConnectedProject ? 'Complete Step 2 first' : undefined}
        className="w-full py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold transition-all duration-200"
        style={{
          background: savedMsg ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.04)',
          border: savedMsg ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(255,255,255,0.1)',
          color: savedMsg ? '#86efac' : 'var(--lark-text-muted)',
          opacity: busy && !savedMsg ? 0.6 : 1,
        }}
      >
        {isProjectBusy ? (
          <Loader2 size={13} className="animate-spin" />
        ) : (
          <Save size={13} />
        )}
        {savedMsg ? 'Saved to Audiotool!' : 'Save Project'}
      </button>

      {showNameDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
          onClick={() => setShowNameDialog(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-5 flex flex-col gap-4"
            style={{
              background: 'var(--lark-card)',
              border: '1px solid var(--lark-border)',
              boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--lark-text)' }}>
                Name your project
              </h3>
              <p className="text-xs mt-1" style={{ color: 'var(--lark-text-muted)' }}>
                This will be the title in your Audiotool cloud library.
              </p>
            </div>
            <input
              ref={nameInputRef}
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={handleNameKeyDown}
              placeholder="e.g. Summer Demo"
              maxLength={120}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{
                background: 'rgba(128,128,128,0.06)',
                border: '1px solid var(--lark-border)',
                color: 'var(--lark-text)',
              }}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowNameDialog(false)}
                className="flex-1 py-2 rounded-xl text-xs font-medium"
                style={{
                  border: '1px solid var(--lark-border)',
                  color: 'var(--lark-text-muted)',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateNamedProject}
                disabled={!newProjectName.trim() || isProjectBusy}
                className="flex-1 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
                }}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
