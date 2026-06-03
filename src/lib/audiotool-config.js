/** OAuth redirect must match developer.audiotool.com app settings exactly (incl. trailing slash). */
export const AUDIOTOOL_CLIENT_ID = import.meta.env.VITE_AUDIOTOOL_CLIENT_ID ?? '';

export const AUDIOTOOL_SCOPE = import.meta.env.VITE_AUDIOTOOL_SCOPE ?? 'project:write';

function normalizeRedirectUrl(url) {
  return url.endsWith('/') ? url : `${url}/`;
}

/** Deployment URL where Audiotool OAuth should return (runtime, not build host). */
export function getAudiotoolRedirectUrl() {
  if (typeof window !== 'undefined') {
    const configured = import.meta.env.VITE_AUDIOTOOL_REDIRECT_URL;
    if (configured) {
      try {
        const configuredOrigin = new URL(configured).origin;
        if (configuredOrigin === window.location.origin) {
          return normalizeRedirectUrl(configured);
        }
      } catch {
        // ignore malformed env value
      }
    }

    const base = import.meta.env.BASE_URL || '/';
    return new URL(base, window.location.origin).href;
  }

  if (import.meta.env.VITE_AUDIOTOOL_REDIRECT_URL) {
    return normalizeRedirectUrl(import.meta.env.VITE_AUDIOTOOL_REDIRECT_URL);
  }

  return 'http://127.0.0.1:5173/';
}
