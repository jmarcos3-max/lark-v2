export const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY ?? '';

/** Use Vite dev proxy so the key stays in .env (server) only. */
export const ELEVENLABS_API_BASE =
  import.meta.env.VITE_ELEVENLABS_API_BASE
  ?? (import.meta.env.DEV ? '/api/elevenlabs' : 'https://api.elevenlabs.io');

export function getElevenLabsSetupIssues() {
  const issues = [];
  if (!ELEVENLABS_API_KEY && !import.meta.env.DEV) {
    issues.push({
      level: 'error',
      message: 'Missing VITE_ELEVENLABS_API_KEY in environment.',
    });
  }
  if (!ELEVENLABS_API_KEY && import.meta.env.DEV) {
    issues.push({
      level: 'warn',
      message:
        'Add VITE_ELEVENLABS_API_KEY to .env.local (or ELEVENLABS_API_KEY for the dev proxy).',
    });
  }
  return issues;
}

export function isElevenLabsConfigured() {
  if (ELEVENLABS_API_KEY) return true;
  // Local dev can use vite.config.js proxy with ELEVENLABS_API_KEY in .env.local
  return import.meta.env.DEV;
}
