import React, { useEffect, useRef, useState } from 'react';
import {
  Download,
  Mic,
  Pencil,
  Trash2,
  FileAudio,
  Play,
  Pause,
  Loader2,
  ArrowUpCircle,
  CheckCircle2,
} from 'lucide-react';
import { format } from 'date-fns';
import RenameInline from '@/components/lark/RenameInline';
import {
  downloadRawAudio,
  listRawAudioEntries,
  removeRawAudioEntry,
  renameRawAudioEntry,
  resolveRawAudioUrl,
} from '@/lib/raw-audio-library';

export default function RawAudioLibraryCard({
  refreshKey,
  onLibraryChange,
  onUseForHumming,
  activeRawAudioId,
}) {
  const [entries, setEntries] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [playingId, setPlayingId] = useState(null);
  const [loadingPlayId, setLoadingPlayId] = useState(null);
  const [loadingUseId, setLoadingUseId] = useState(null);
  const [unplayableId, setUnplayableId] = useState(null);
  const audioRef = useRef(null);
  const playbackUrlRef = useRef(null);

  const reload = () => {
    setEntries(listRawAudioEntries());
    onLibraryChange?.();
  };

  useEffect(() => {
    reload();
  }, [refreshKey]);

  const revokePlaybackUrl = () => {
    if (playbackUrlRef.current?.startsWith('blob:')) {
      URL.revokeObjectURL(playbackUrlRef.current);
    }
    playbackUrlRef.current = null;
  };

  useEffect(() => () => {
    audioRef.current?.pause();
    revokePlaybackUrl();
  }, []);

  const stopPlayback = () => {
    audioRef.current?.pause();
    setPlayingId(null);
    revokePlaybackUrl();
  };

  const togglePlay = async (entry) => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playingId === entry.id) {
      stopPlayback();
      return;
    }

    stopPlayback();
    setUnplayableId(null);
    setLoadingPlayId(entry.id);

    let playUrl;
    try {
      playUrl = await resolveRawAudioUrl(entry);
    } catch {
      playUrl = null;
    } finally {
      setLoadingPlayId(null);
    }

    if (!playUrl) {
      setUnplayableId(entry.id);
      return;
    }

    playbackUrlRef.current = playUrl;
    audio.src = playUrl;
    audio.load();

    try {
      await audio.play();
      setPlayingId(entry.id);
    } catch {
      stopPlayback();
      setUnplayableId(entry.id);
    }
  };

  const handleDelete = async (id) => {
    if (playingId === id) stopPlayback();
    await removeRawAudioEntry(id);
    reload();
  };

  const handleRename = (id, name) => {
    renameRawAudioEntry(id, name);
    setEditingId(null);
    reload();
  };

  const handleUseForHumming = async (entry) => {
    if (!onUseForHumming) return;
    setLoadingUseId(entry.id);
    try {
      await onUseForHumming(entry);
    } finally {
      setLoadingUseId(null);
    }
  };

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-2">
        <Mic size={24} style={{ color: 'var(--lark-text-subtle)', opacity: 0.4 }} />
        <p className="text-xs text-center max-w-xs" style={{ color: 'var(--lark-text-subtle)' }}>
          Record or upload audio above. Your raw takes appear here — use one for humming, play, or download.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 max-h-64 overflow-y-auto lark-scrollbar">
      <audio
        ref={audioRef}
        preload="none"
        className="hidden"
        onEnded={stopPlayback}
        onError={() => {
          if (playingId) setUnplayableId(playingId);
          stopPlayback();
        }}
      />

      {entries.map((entry) => {
        const isPlaying = playingId === entry.id;
        const isLoading = loadingPlayId === entry.id;
        const isUsing = loadingUseId === entry.id;
        const isActive = activeRawAudioId === entry.id;
        const cannotPlay = unplayableId === entry.id;

        return (
          <div
            key={entry.id}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5"
            style={{
              background: isActive ? 'rgba(139,92,246,0.08)' : 'rgba(255,255,255,0.02)',
              border: isActive
                ? '1px solid rgba(139,92,246,0.35)'
                : '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{
                background: 'rgba(139,92,246,0.12)',
                border: '1px solid rgba(139,92,246,0.2)',
              }}
            >
              <FileAudio size={14} style={{ color: '#A78BFA' }} />
            </div>

            <div className="flex-1 min-w-0">
              {editingId === entry.id ? (
                <RenameInline
                  value={entry.name}
                  onSave={(name) => handleRename(entry.id, name)}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <p className="text-xs font-medium truncate" style={{ color: 'var(--lark-text)' }}>
                  {entry.name}
                </p>
              )}
              <p className="text-[10px] font-mono truncate mt-0.5" style={{ color: 'var(--lark-text-subtle)' }}>
                {format(new Date(entry.createdAt), 'MMM d, yyyy · h:mm a')}
                {entry.projectTitle ? ` · ${entry.projectTitle}` : ''}
              </p>
              {isActive && (
                <p className="text-[10px] mt-0.5" style={{ color: 'var(--lark-violet-bright)' }}>
                  Active for humming transform
                </p>
              )}
              {cannotPlay && (
                <p className="text-[10px] mt-0.5" style={{ color: '#f87171' }}>
                  Recording not found — remove this entry and record again.
                </p>
              )}
            </div>

            {onUseForHumming && (
              <button
                type="button"
                onClick={() => handleUseForHumming(entry)}
                disabled={isUsing || isActive}
                className="p-2 rounded-lg transition-all duration-200 shrink-0"
                style={{
                  background: isActive ? 'rgba(139,92,246,0.2)' : 'rgba(139,92,246,0.1)',
                  border: isActive
                    ? '1px solid rgba(139,92,246,0.5)'
                    : '1px solid rgba(139,92,246,0.3)',
                  color: 'var(--lark-violet-bright)',
                  opacity: isUsing ? 0.6 : 1,
                }}
                title={isActive ? 'Currently used for humming' : 'Use for humming'}
              >
                {isUsing ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : isActive ? (
                  <CheckCircle2 size={14} />
                ) : (
                  <ArrowUpCircle size={14} />
                )}
              </button>
            )}

            <button
              type="button"
              onClick={() => togglePlay(entry)}
              disabled={isLoading}
              className="p-2 rounded-lg transition-all duration-200 shrink-0"
              style={{
                background: isPlaying ? 'rgba(34,197,94,0.15)' : 'rgba(34,197,94,0.08)',
                border: isPlaying ? '1px solid rgba(34,197,94,0.4)' : '1px solid rgba(34,197,94,0.25)',
                color: isPlaying ? '#86efac' : '#4ade80',
                opacity: isLoading ? 0.6 : 1,
              }}
              title={isPlaying ? 'Pause' : 'Play recording'}
            >
              {isLoading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : isPlaying ? (
                <Pause size={14} />
              ) : (
                <Play size={14} />
              )}
            </button>

            <button
              type="button"
              onClick={() => setEditingId(entry.id)}
              className="p-2 rounded-lg transition-all duration-200 shrink-0"
              style={{
                background: 'rgba(128,128,128,0.06)',
                border: '1px solid var(--lark-border)',
                color: 'var(--lark-text-muted)',
              }}
              title="Rename"
            >
              <Pencil size={14} />
            </button>

            <button
              type="button"
              onClick={() => downloadRawAudio(entry)}
              className="p-2 rounded-lg transition-all duration-200 shrink-0"
              style={{
                background: 'rgba(139,92,246,0.12)',
                border: '1px solid rgba(139,92,246,0.25)',
                color: 'var(--lark-violet-bright)',
              }}
              title="Download raw audio"
            >
              <Download size={14} />
            </button>

            <button
              type="button"
              onClick={() => handleDelete(entry.id)}
              className="p-2 rounded-lg transition-all duration-200 shrink-0"
              style={{
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
                color: '#FCA5A5',
              }}
              title="Remove from library"
            >
              <Trash2 size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
