import React, { useState } from 'react';
import { useTheme } from '@/lib/ThemeContext';
import { useAudiotool } from '@/lib/AudiotoolContext';
import { LogOut, User, Sparkles, Sun, Moon, Monitor, Loader2, X, AlertCircle } from 'lucide-react';

const LarkMark = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 13 Q5 4 9 5 Q13 6 10 10 Q8 13 11 14 Q14 15 16 11" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <circle cx="9" cy="4" r="1.2" fill="white" opacity="0.7"/>
  </svg>
);

const THEME_OPTIONS = [
  { value: 'day', label: 'Day', Icon: Sun },
  { value: 'night', label: 'Night', Icon: Moon },
  { value: 'system', label: 'System', Icon: Monitor },
];

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const active = THEME_OPTIONS.find(t => t.value === theme);
  const ActiveIcon = active?.Icon || Moon;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        title="Toggle theme"
        className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200"
        style={{
          background: open ? 'rgba(139,92,246,0.15)' : 'rgba(128,128,128,0.08)',
          border: `1px solid ${open ? 'rgba(139,92,246,0.4)' : 'var(--lark-border)'}`,
          color: open ? 'var(--lark-violet-bright)' : 'var(--lark-text-muted)',
        }}
      >
        <ActiveIcon size={13} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 rounded-xl overflow-hidden z-50" style={{ background: 'var(--lark-card)', border: '1px solid var(--lark-border)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', minWidth: '130px' }}>
            {THEME_OPTIONS.map(({ value, label, Icon }) => (
              <button
                key={value}
                onClick={() => { setTheme(value); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium transition-all"
                style={{ color: theme === value ? 'var(--lark-violet-bright)' : 'var(--lark-text-muted)', background: theme === value ? 'rgba(139,92,246,0.1)' : 'transparent' }}
                onMouseEnter={e => { if (theme !== value) e.currentTarget.style.background = 'rgba(128,128,128,0.06)'; }}
                onMouseLeave={e => { if (theme !== value) e.currentTarget.style.background = 'transparent'; }}
              >
                <Icon size={12} />
                {label}
                {theme === value && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function AudiotoolAuthButton() {
  const { status, userName, error, login, logout } = useAudiotool();
  const [showModal, setShowModal] = useState(false);

  if (status === 'loading') {
    return (
      <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg" style={{ color: 'var(--lark-violet-bright)', border: '1px solid rgba(139,92,246,0.3)', background: 'rgba(139,92,246,0.08)' }}>
        <Loader2 size={12} className="animate-spin" />
        <span>Connecting...</span>
      </div>
    );
  }

  if (status === 'authenticated') {
    return (
      <div className="flex items-center gap-2">
        {/* Connected badge */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg" style={{ background: 'rgba(128,128,128,0.06)', border: '1px solid var(--lark-border)' }}>
          <div className="w-1.5 h-1.5 rounded-full bg-green-400" style={{ boxShadow: '0 0 6px #4ade80' }} />
          <span className="text-[10px] font-medium" style={{ color: '#4ade80' }}>Connected via Nexus</span>
        </div>

        {/* User avatar */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold" style={{ background: 'rgba(139,92,246,0.2)', color: 'var(--lark-violet-bright)', border: '1px solid rgba(139,92,246,0.3)' }}>
              {userName?.[0]?.toUpperCase() || <User size={12} />}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2" style={{ background: '#4ade80', borderColor: 'var(--lark-bg)' }} />
          </div>
          <span className="text-sm hidden lg:block" style={{ color: 'var(--lark-text-muted)' }}>{userName}</span>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all duration-200"
          style={{ color: 'var(--lark-text-muted)', border: '1px solid var(--lark-border)' }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--lark-violet-bright)'; e.currentTarget.style.borderColor = 'rgba(139,92,246,0.3)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--lark-text-muted)'; e.currentTarget.style.borderColor = 'var(--lark-border)'; }}
        >
          <LogOut size={12} />
          Sign Out
        </button>
      </div>
    );
  }

  // unauthenticated / misconfigured
  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg transition-all duration-200"
        style={{ color: 'var(--lark-text-muted)', border: '1px solid var(--lark-border)', background: 'rgba(128,128,128,0.05)' }}
        onMouseEnter={e => { e.currentTarget.style.color = 'var(--lark-violet-bright)'; e.currentTarget.style.borderColor = 'rgba(139,92,246,0.35)'; }}
        onMouseLeave={e => { e.currentTarget.style.color = 'var(--lark-text-muted)'; e.currentTarget.style.borderColor = 'var(--lark-border)'; }}
      >
        <User size={12} />
        <span>Guest</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
          <div className="relative rounded-2xl p-8 flex flex-col items-center gap-5 w-80" style={{ background: 'var(--lark-card)', border: '1px solid var(--lark-border)', boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 40px rgba(139,92,246,0.15)' }}>
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 w-6 h-6 rounded-md flex items-center justify-center" style={{ color: 'var(--lark-text-subtle)', background: 'rgba(128,128,128,0.08)' }}>
              <X size={13} />
            </button>

            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #7C3AED, #4C1D95)', boxShadow: '0 0 32px rgba(139,92,246,0.5)' }}>
              <LarkMark />
            </div>

            <div className="text-center">
              <h2 className="text-base font-bold mb-1" style={{ color: 'var(--lark-text)' }}>Sign in to Lark</h2>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--lark-text-muted)' }}>
                Connect your Audiotool account to sync and manage your cloud projects.
              </p>
            </div>

            {/* Warn if not on a registered redirect origin */}
            {!window.location.origin.includes('127.0.0.1') && status !== 'misconfigured' && (
              <div className="w-full flex items-start gap-2 px-3 py-2.5 rounded-xl text-xs" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: '#FCD34D' }}>
                <AlertCircle size={13} className="mt-0.5 shrink-0" />
                <span>
                  OAuth requires <code className="font-mono">127.0.0.1:5173</code>. Run the app locally and register that redirect URI at{' '}
                  <a href="https://developer.audiotool.com/applications" target="_blank" rel="noopener noreferrer" className="underline">developer.audiotool.com</a>.
                </span>
              </div>
            )}

            {/* Misconfigured warning */}
            {status === 'misconfigured' && (
              <div className="w-full flex items-start gap-2 px-3 py-2.5 rounded-xl text-xs" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#FCA5A5' }}>
                <AlertCircle size={13} className="mt-0.5 shrink-0" />
                <span>{error || 'VITE_AUDIOTOOL_CLIENT_ID is not configured.'}</span>
              </div>
            )}

            {/* Auth error from previous attempt */}
            {status === 'unauthenticated' && error && (
              <div className="w-full flex items-start gap-2 px-3 py-2.5 rounded-xl text-xs" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#FCA5A5' }}>
                <AlertCircle size={13} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={() => { setShowModal(false); login(); }}
              disabled={status === 'misconfigured'}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all duration-200"
              style={{ background: status === 'misconfigured' ? 'rgba(139,92,246,0.3)' : 'linear-gradient(135deg, #7C3AED, #5B21B6)', boxShadow: '0 0 20px rgba(139,92,246,0.35)', cursor: status === 'misconfigured' ? 'not-allowed' : 'pointer' }}
              onMouseEnter={e => { if (status !== 'misconfigured') e.currentTarget.style.boxShadow = '0 0 30px rgba(139,92,246,0.55)'; }}
              onMouseLeave={e => e.currentTarget.style.boxShadow = '0 0 20px rgba(139,92,246,0.35)'}
            >
              <Sparkles size={14} />
              Connect via Audiotool SDK
            </button>

            <p className="text-[10px]" style={{ color: 'var(--lark-text-subtle)' }}>
              Triggers <code className="font-mono">at.login()</code> OAuth redirect
            </p>
          </div>
        </div>
      )}
    </>
  );
}

export default function LarkNavbar() {
  return (
    <header
      className="sticky top-0 z-50 px-6 py-3 flex items-center justify-between"
      style={{ background: 'var(--lark-header-bg)', borderBottom: '1px solid var(--lark-header-border)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', transition: 'background 0.3s ease, border-color 0.3s ease' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #7C3AED, #4C1D95)', boxShadow: '0 0 16px rgba(139,92,246,0.4)' }}>
          <LarkMark />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold tracking-tight" style={{ color: 'var(--lark-text)' }}>Lark</span>
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full uppercase tracking-widest" style={{ background: 'rgba(139,92,246,0.15)', color: 'var(--lark-violet-bright)', border: '1px solid rgba(139,92,246,0.25)' }}>
            Studio
          </span>
        </div>
      </div>

      {/* Center tagline */}
      <div className="hidden md:flex items-center gap-2" style={{ color: 'var(--lark-text-muted)' }}>
        <Sparkles size={12} style={{ color: 'var(--lark-violet)' }} />
        <span className="text-xs tracking-widest uppercase font-medium">AI Audio Transformation Engine</span>
        <Sparkles size={12} style={{ color: 'var(--lark-violet)' }} />
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <AudiotoolAuthButton />
      </div>
    </header>
  );
}