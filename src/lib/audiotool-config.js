/** OAuth redirect must match developer.audiotool.com app settings exactly (incl. trailing slash). */
export const AUDIOTOOL_REDIRECT_URL =
  import.meta.env.VITE_AUDIOTOOL_REDIRECT_URL ?? 'http://127.0.0.1:5173/';

export const AUDIOTOOL_CLIENT_ID = import.meta.env.VITE_AUDIOTOOL_CLIENT_ID ?? '';

export const AUDIOTOOL_SCOPE = import.meta.env.VITE_AUDIOTOOL_SCOPE ?? 'project:write';
