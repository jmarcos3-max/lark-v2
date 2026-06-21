import React from 'react';
import { Check } from 'lucide-react';

export default function LarkStepLabel({
  step,
  title,
  done = false,
  optional = false,
  className = '',
}) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span
        className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold leading-none"
        style={{
          background: done ? 'rgba(34,197,94,0.15)' : 'rgba(139,92,246,0.2)',
          border: done
            ? '1px solid rgba(34,197,94,0.4)'
            : '1px solid rgba(139,92,246,0.45)',
          color: done ? '#86efac' : 'var(--lark-violet-bright)',
        }}
        aria-hidden
      >
        {done ? <Check size={10} strokeWidth={3} /> : step}
      </span>
      <span
        className="text-[10px] uppercase tracking-widest font-medium"
        style={{ color: done ? '#86efac' : 'var(--lark-text-subtle)' }}
      >
        {title}
      </span>
      {optional && (
        <span className="text-[9px] ml-auto" style={{ color: 'var(--lark-text-subtle)' }}>
          Optional
        </span>
      )}
    </div>
  );
}
