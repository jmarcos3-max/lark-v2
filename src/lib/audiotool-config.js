/** OAuth redirect must match developer.audiotool.com app settings exactly (incl. trailing slash). */
export const AUDIOTOOL_CLIENT_ID = import.meta.env.VITE_AUDIOTOOL_CLIENT_ID ?? '';

export const AUDIOTOOL_SCOPE = import.meta.env.VITE_AUDIOTOOL_SCOPE ?? 'project:write';

/**
 * OAuth redirect for the current deployment.
 * Uses VITE_AUDIOTOOL_REDIRECT_URL when set; otherwise derives from window + Vite base
 * (e.g. https://user.github.io/lark/ on GitHub Pages, http://127.0.0.1:5173/ locally).
 */
export function getAudiotoolRedirectUrl() {
  const configured = import.meta.env.VITE_AUDIOTOOL_REDIRECT_URL;
  if (configured) {
    return configured.endsWith('/') ? configured : `${configured}/`;
  }
  if (typeof window !== 'undefined') {
    const base = import.meta.env.BASE_URL || '/';
    return new URL(base, window.location.origin).href;
  }
  return 'http://127.0.0.1:5173/';
}
