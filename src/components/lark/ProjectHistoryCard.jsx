import React, { useState, useEffect } from 'react';
import { Trash2, Music, Calendar, Layers, RefreshCw, AlertCircle } from 'lucide-react';
import { useAudiotool } from '@/lib/AudiotoolContext';
import { useAudiotoolProjects } from '@/hooks/useAudiotoolProjects';

const INSTRUMENT_COLORS = {
  Piano: { bg: 'rgba(99,102,241,0.15)', border: 'rgba(99,102,241,0.35)', text: '#A5B4FC' },
  Bass: { bg: 'rgba(236,72,153,0.12)', border: 'rgba(236,72,153,0.3)', text: '#F9A8D4' },
  Drums: { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', text: '#FCD34D' },
  Guitar: { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', text: '#6EE7B7' },
};

const MOOD_COLORS = {
  Calm: { bg: 'rgba(56,189,248,0.1)', border: 'rgba(56,189,248,0.25)', text: '#7DD3FC' },
  Rock: { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)', text: '#FCA5A5' },
  Melancholic: { bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.3)', text: '#C4B5FD' },
  Energetic: { bg: 'rgba(251,146,60,0.12)', border: 'rgba(251,146,60,0.28)', text: '#FED7AA' },
};

const MOOD_ICONS = { Calm: '🌊', Rock: '🎸', Melancholic: '🌧️', Energetic: '⚡' };

function Badge({ label, colors }) {
  if (!label || !colors) return null;
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium"
      style={{ background: colors.bg, border: `1px solid ${colors.border}`, color: colors.text }}
    >
      {label}
    </span>
  );
}

export default function ProjectHistoryCard({ refreshKey, onOpenProject }) {
  const { status } = useAudiotool();
  const { loading, error, listProjects, deleteProject } = useAudiotoolProjects();
  const [projects, setProjects] = useState([]);
  const [deletingName, setDeletingName] = useState(null);

  const isAuthenticated = status === 'authenticated';

  const load = async () => {
    if (!isAuthenticated) { setProjects([]); return; }
    const list = await listProjects();
    setProjects(list);
  };

  useEffect(() => { load(); }, [refreshKey, isAuthenticated]);

  const handleDelete = async (projectName) => {
    setDeletingName(projectName);
    const ok = await deleteProject(projectName);
    if (ok) setProjects(p => p.filter(x => x.atProject.name !== projectName));
    setDeletingName(null);
  };

  return (
    <div className="lark-card-glass rounded-2xl p-5" style={{ minHeight: '180px' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-5 rounded-full" style={{ background: 'linear-gradient(to bottom, #8B5CF6, #4C1D95)' }} />
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--lark-text-muted)' }}>
            Dashboard History
          </span>
          {projects.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-mono" style={{ background: 'rgba(139,92,246,0.12)', color: 'rgba(139,92,246,0.7)', border: '1px solid rgba(139,92,246,0.2)' }}>
              {projects.length}
            </span>
          )}
        </div>
        <button onClick={load} className="p-1.5 rounded-lg transition-all duration-200" style={{ color: 'var(--lark-text-muted)' }} title="Refresh">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-[10px] mb-3 px-2 py-1.5 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', color: '#FCA5A5', border: '1px solid rgba(239,68,68,0.2)' }}>
          <AlertCircle size={10} /> {error}
        </div>
      )}

      {!isAuthenticated ? (
        <div className="flex flex-col items-center justify-center py-8 gap-2">
          <Layers size={24} style={{ color: 'var(--lark-text-subtle)', opacity: 0.4 }} />
          <p className="text-xs" style={{ color: 'var(--lark-text-subtle)' }}>Sign in with Audiotool to see your projects.</p>
        </div>
      ) : loading && projects.length === 0 ? (
        <div className="grid grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-xl p-3 animate-pulse" style={{ height: '90px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }} />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 gap-2">
          <Layers size={24} style={{ color: 'var(--lark-text-subtle)', opacity: 0.4 }} />
          <p className="text-xs" style={{ color: 'var(--lark-text-subtle)' }}>No projects yet. Create your first track above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 lark-scrollbar overflow-y-auto max-h-64">
          {projects.map(({ atProject, larkMeta }) => (
            <div
              key={atProject.name}
              className="relative group rounded-xl p-3 flex flex-col gap-2 transition-all duration-200 cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
              onClick={() => onOpenProject?.({ atProject, larkMeta })}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.05)'; e.currentTarget.style.borderColor = 'rgba(139,92,246,0.2)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)' }}>
                <Music size={14} style={{ color: '#A78BFA' }} />
              </div>

              <p className="text-xs font-medium truncate" style={{ color: 'var(--lark-text)' }}>
                {atProject.displayName || 'Untitled'}
              </p>

              <div className="flex flex-wrap gap-1">
                {larkMeta?.instrument && (
                  <Badge label={larkMeta.instrument} colors={INSTRUMENT_COLORS[larkMeta.instrument]} />
                )}
                {larkMeta?.mood && (
                  <Badge
                    label={`${MOOD_ICONS[larkMeta.mood] || ''} ${larkMeta.mood}`}
                    colors={MOOD_COLORS[larkMeta.mood]}
                  />
                )}
              </div>

              {atProject.createTime && (
                <div className="flex items-center gap-1">
                  <Calendar size={9} style={{ color: 'var(--lark-text-subtle)' }} />
                  <span className="text-[9px] font-mono" style={{ color: 'var(--lark-text-subtle)' }}>
                    {new Date(Number(atProject.createTime.seconds) * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                  </span>
                </div>
              )}

              <button
                onClick={e => { e.stopPropagation(); handleDelete(atProject.name); }}
                disabled={deletingName === atProject.name}
                className="absolute top-2 right-2 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-150"
                style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)', color: '#FCA5A5' }}
              >
                {deletingName === atProject.name ? (
                  <div className="w-2.5 h-2.5 border border-red-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 size={10} />
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}