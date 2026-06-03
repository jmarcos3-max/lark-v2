import {
  AUDIOTOOL_CLIENT_ID,
  AUDIOTOOL_SCOPE,
  getAudiotoolRedirectUrl,
} from '@/lib/audiotool-config';

/** One shared SDK init — avoids React StrictMode double-mount breaking OAuth callback. */
let audiotoolInitPromise = null;

export function resetAudiotoolInit() {
  audiotoolInitPromise = null;
}

export async function initAudiotoolClient() {
  if (!audiotoolInitPromise) {
    audiotoolInitPromise = (async () => {
      const { audiotool } = await import('@audiotool/nexus');
      return audiotool({
        clientId: AUDIOTOOL_CLIENT_ID,
        redirectUrl: getAudiotoolRedirectUrl(),
        scope: AUDIOTOOL_SCOPE,
      });
    })();
  }
  return audiotoolInitPromise;
}

/** Remove OAuth query params after a successful redirect so routing stays clean. */
export function stripOAuthSearchParams() {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  const keys = ['code', 'state', 'session_state', 'error', 'error_description'];
  let changed = false;
  for (const key of keys) {
    if (url.searchParams.has(key)) {
      url.searchParams.delete(key);
      changed = true;
    }
  }
  if (!changed) return;
  const next = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState({}, document.title, next);
}
