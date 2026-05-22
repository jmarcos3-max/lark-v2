import React from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Bird, LogOut, User, Sparkles } from 'lucide-react';

export default function LarkNavbar() {
  const { user, logout } = useAuth();

  return (
    <header
      className="sticky top-0 z-50 px-6 py-3 flex items-center justify-between"
      style={{
        background: 'rgba(8,8,8,0.85)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #7C3AED, #4C1D95)',
            boxShadow: '0 0 16px rgba(139,92,246,0.4)',
          }}
        >
          <Bird size={16} className="text-white" />
        </div>
        <div className="flex items-baseline gap-2">
          <span
            className="text-xl font-bold tracking-tight"
            style={{ color: 'var(--lark-text)' }}
          >
            Nightingale
          </span>
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded-full uppercase tracking-widest"
            style={{
              background: 'rgba(139,92,246,0.15)',
              color: 'var(--lark-violet-bright)',
              border: '1px solid rgba(139,92,246,0.25)',
            }}
          >
            Studio
          </span>
        </div>
      </div>

      {/* Center tagline */}
      <div className="hidden md:flex items-center gap-2" style={{ color: 'var(--lark-text-muted)' }}>
        <Sparkles size={12} style={{ color: 'var(--lark-violet)' }} />
        <span className="text-xs tracking-widest uppercase font-medium">
          AI Audio Transformation Engine
        </span>
        <Sparkles size={12} style={{ color: 'var(--lark-violet)' }} />
      </div>

      {/* User area */}
      <div className="flex items-center gap-3">
        {user ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold"
                style={{
                  background: 'rgba(139,92,246,0.2)',
                  color: 'var(--lark-violet-bright)',
                  border: '1px solid rgba(139,92,246,0.3)',
                }}
              >
                {user.full_name?.[0]?.toUpperCase() || <User size={12} />}
              </div>
              <span className="text-sm hidden lg:block" style={{ color: 'var(--lark-text-muted)' }}>
                {user.full_name || user.email}
              </span>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all duration-200"
              style={{
                color: 'var(--lark-text-muted)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = 'var(--lark-violet-bright)';
                e.currentTarget.style.borderColor = 'rgba(139,92,246,0.3)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'var(--lark-text-muted)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
              }}
            >
              <LogOut size={12} />
              Sign Out
            </button>
          </div>
        ) : (
          <div
            className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg"
            style={{
              color: 'var(--lark-text-muted)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <User size={12} />
            <span>Guest</span>
          </div>
        )}
      </div>
    </header>
  );
}