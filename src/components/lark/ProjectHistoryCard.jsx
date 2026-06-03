import React, { useState, useEffect } from 'react';
import { Trash2, Music, Calendar, Layers, RefreshCw, Loader2, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import RenameInline from '@/components/lark/RenameInline';
import {
  AUDIOTOOL_DELETE_ON_WEB_CONFIRM,
  AUDIOTOOL_PROJECTS_URL,
  isAudiotoolPermissionDenied,
} from '@/lib/audiotool-api';
import { audiotoolProjectToLark } from '@/lib/lark-project-metadata';

const INSTRUMENT_COLORS = {
  Piano: { bg: 'rgba(99,102,241,0.15)', border: 'rgba(99,102,241,0.35)', text: '#A5B4FC' },
  Bass: { bg: 'rgba(236,72,153,0.12)', border: 'rgba(236,72,153,0.3)', text: '#F9A8D4' },
  Drums: { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', text: '#FCD34D' },
  Guitar: { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', text: '#6EE7B7' },
};
const DEFAULT_INSTRUMENT_COLORS = {
  bg: 'rgba(139,92,246,0.12)',
  border: 'rgba(139,92,246,0.3)',
  text: '#C4B5FD',
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

function timestampToDate(ts) {
  if (!ts) return null;
  const seconds = Number(ts.seconds ?? 0);
  const nanos = Number(ts.nanos ?? 0);
  return new Date(seconds * 1000 + nanos / 1e6);
}

export default function ProjectHistoryCard({
  refreshKey,
  cloudProjects = [],
  isAuthenticated,
  onLogin,
  onOpenProject,
  onRefreshProjects,
  onDeleteProject,
  onRenameProject,
  activeProjectName,
  embedded = false,
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [deletingName, setDeletingName] = useState(null);
  const [renamingName, setRenamingName] = useState(null);

  const loadProjects = async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      await onRefreshProjects?.();
    } catch {
      // errors handled upstream
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, [refreshKey, isAuthenticated]);

  const handleDelete = async (projectName, e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      onLogin?.();
      return;
    }
    setDeletingName(projectName);
    try {
      await onDeleteProject?.(projectName);
    } catch (err) {
      if (isAudiotoolPermissionDenied(err)) {
        const open = window.confirm(AUDIOTOOL_DELETE_ON_WEB_CONFIRM);
        if (open) {
          window.open(AUDIOTOOL_PROJECTS_URL, '_blank', 'noopener,noreferrer');
        }
      }
    } finally {
      setDeletingName(null);
    }
  };

  const handleRename = async (projectName, newTitle) => {
    if (!isAuthenticated) {
      onLogin?.();
      return;
    }
    try {
      await onRenameProject?.(projectName, newTitle);
    } catch {
      // error surfaced upstream
    } finally {
      setRenamingName(null);
    }
  };

  const items = cloudProjects.map((p) => ({
    ...audiotoolProjectToLark(p),
    raw: p,
  }));

  const content = !isAuthenticated ? (
        <div className="flex flex-col items-center justify-center py-8 gap-2">
          <Layers size={24} style={{ color: 'var(--lark-text-subtle)', opacity: 0.4 }} />
          <p className="text-xs text-center" style={{ color: 'var(--lark-text-subtle)' }}>
            Sign in with Audiotool to see your cloud projects.
          </p>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl p-3 animate-pulse"
              style={{ height: '90px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 gap-2">
          <Layers size={24} style={{ color: 'var(--lark-text-subtle)', opacity: 0.4 }} />
          <p className="text-xs" style={{ color: 'var(--lark-text-subtle)' }}>
            No projects yet. Create one with New Project above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 lark-scrollbar overflow-y-auto max-h-64">
          {items.map((project, index) => {
            const date = timestampToDate(project.updateTime ?? project.createTime);
            const isActive = project.audiotoolName === activeProjectName;
            const projectKey = project.audiotoolName ?? `project-${index}`;
            return (
              <button
                key={projectKey}
                type="button"
                onClick={() => onOpenProject?.(project.audiotoolName)}
                className="relative group rounded-xl p-3 flex flex-col gap-2 transition-all duration-200 text-left w-full"
                style={{
                  background: isActive ? 'rgba(139,92,246,0.08)' : 'rgba(255,255,255,0.02)',
                  border: isActive ? '1px solid rgba(139,92,246,0.35)' : '1px solid rgba(255,255,255,0.06)',
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(139,92,246,0.05)';
                    e.currentTarget.style.borderColor = 'rgba(139,92,246,0.2)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                  }
                }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                  style={{
                    background: 'rgba(139,92,246,0.12)',
                    border: '1px solid rgba(139,92,246,0.2)',
                  }}
                >
                  <Music size={14} style={{ color: '#A78BFA' }} />
                </div>

                {renamingName === project.audiotoolName ? (
                  <div onClick={(e) => e.stopPropagation()}>
                    <RenameInline
                      value={project.title || 'Untitled Track'}
                      onSave={(title) => handleRename(project.audiotoolName, title)}
                      onCancel={() => setRenamingName(null)}
                    />
                  </div>
                ) : (
                  <p className="text-xs font-medium truncate" style={{ color: 'var(--lark-text)' }}>
                    {project.title || 'Untitled Track'}
                  </p>
                )}

                <div className="flex flex-wrap gap-1">
                  {project.target_instrument && (
                    <Badge
                      label={project.target_instrument}
                      colors={INSTRUMENT_COLORS[project.target_instrument] ?? DEFAULT_INSTRUMENT_COLORS}
                    />
                  )}
                  {project.selected_mood && (
                    <Badge
                      label={`${MOOD_ICONS[project.selected_mood] || ''} ${project.selected_mood}`}
                      colors={MOOD_COLORS[project.selected_mood]}
                    />
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <Calendar size={9} style={{ color: 'var(--lark-text-subtle)' }} />
                  <span className="text-[9px] font-mono" style={{ color: 'var(--lark-text-subtle)' }}>
                    {date ? format(date, 'MMM d, yy') : '—'}
                  </span>
                </div>

                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-150">
                  {onRenameProject && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        setRenamingName(project.audiotoolName);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.stopPropagation();
                          setRenamingName(project.audiotoolName);
                        }
                      }}
                      className="p-1 rounded-md"
                      style={{
                        background: 'rgba(128,128,128,0.12)',
                        border: '1px solid var(--lark-border)',
                        color: 'var(--lark-text-muted)',
                      }}
                      title="Rename"
                    >
                      <Pencil size={10} />
                    </span>
                  )}
                  {onDeleteProject && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => handleDelete(project.audiotoolName, e)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleDelete(project.audiotoolName, e);
                      }}
                      className="p-1 rounded-md"
                      style={{
                        background: 'rgba(239,68,68,0.12)',
                        border: '1px solid rgba(239,68,68,0.2)',
                        color: '#FCA5A5',
                      }}
                      title="Delete"
                    >
                      {deletingName === project.audiotoolName ? (
                        <Loader2 size={10} className="animate-spin" />
                      ) : (
                        <Trash2 size={10} />
                      )}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      );

  if (embedded) {
    return content;
  }

  return (
    <div
      className="lark-card-glass rounded-2xl p-5"
      style={{ minHeight: '180px' }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="w-1.5 h-5 rounded-full"
            style={{ background: 'linear-gradient(to bottom, #8B5CF6, #4C1D95)' }}
          />
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--lark-text-muted)' }}>
            Audiotool Projects
          </span>
          {items.length > 0 && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full font-mono"
              style={{
                background: 'rgba(139,92,246,0.12)',
                color: 'rgba(139,92,246,0.7)',
                border: '1px solid rgba(139,92,246,0.2)',
              }}
            >
              {items.length}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            if (!isAuthenticated) {
              onLogin?.();
              return;
            }
            loadProjects();
          }}
          className="p-1.5 rounded-lg transition-all duration-200"
          style={{ color: 'var(--lark-text-muted)' }}
          title="Refresh"
        >
          <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>
      {content}
    </div>
  );
}
