import React from 'react';
import { CheckCircle2, AlertTriangle, Activity } from 'lucide-react';
import { studioDeviceName } from '@/lib/lark-instruments';

function statusTone(ok) {
  if (ok) {
    return {
      color: '#86efac',
      bg: 'rgba(34,197,94,0.08)',
      border: '1px solid rgba(34,197,94,0.25)',
      Icon: CheckCircle2,
      label: 'Ready',
    };
  }
  return {
    color: '#fbbf24',
    bg: 'rgba(251,191,36,0.08)',
    border: '1px solid rgba(251,191,36,0.25)',
    Icon: AlertTriangle,
    label: 'Needs Attention',
  };
}

export default function StudioHealthCard({ currentProject, report, projectError }) {
  const checks = [
    { label: 'Project connected', ok: Boolean(currentProject?.audiotoolName) },
    { label: 'Timeline write', ok: Boolean(report?.noteCount > 0) },
    { label: 'Mixer routing', ok: Boolean(report?.nexusCabled) },
    { label: 'Playback readiness', ok: Boolean(report?.noteCount > 0 && report?.nexusCabled) },
  ];
  const passing = checks.filter((c) => c.ok).length;
  const allGood = passing === checks.length;
  const tone = statusTone(allGood);

  return (
    <div
      className="lark-card-glass rounded-2xl p-4"
      style={{ minHeight: '170px' }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity size={14} style={{ color: 'var(--lark-violet-bright)' }} />
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--lark-text-muted)' }}>
            Studio Health
          </span>
        </div>
        <span
          className="text-[10px] px-2 py-1 rounded-md font-semibold"
          style={{ color: tone.color, background: tone.bg, border: tone.border }}
        >
          {tone.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-1.5 mb-3">
        {checks.map((check) => (
          <div
            key={check.label}
            className="text-[10px] px-2 py-1 rounded-lg flex items-center gap-1.5"
            style={{
              color: check.ok ? '#86efac' : 'var(--lark-text-subtle)',
              background: check.ok ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.03)',
              border: check.ok ? '1px solid rgba(34,197,94,0.2)' : '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <span aria-hidden>{check.ok ? '✓' : '○'}</span>
            <span>{check.label}</span>
          </div>
        ))}
      </div>

      <p className="text-[10px]" style={{ color: 'var(--lark-text-subtle)' }}>
        {report
          ? `${report.noteCount} notes at ~${report.bpm} BPM on ${studioDeviceName(report.instrument)}.`
          : 'Run Transform to populate SDK checks.'}
      </p>
      {projectError && (
        <p className="text-[10px] mt-1" style={{ color: '#f87171' }}>
          Last issue: {projectError}
        </p>
      )}
    </div>
  );
}
