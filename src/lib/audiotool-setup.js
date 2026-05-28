import {
  AUDIOTOOL_CLIENT_ID,
  AUDIOTOOL_REDIRECT_URL,
  AUDIOTOOL_SCOPE,
} from '@/lib/audiotool-config';

/** Checks Lark config against https://developer.audiotool.com/js-package-documentation/ */
export function getAudiotoolSetupIssues() {
  const issues = [];

  if (!AUDIOTOOL_CLIENT_ID) {
    issues.push({
      level: 'error',
      message:
        'Missing VITE_AUDIOTOOL_CLIENT_ID in .env.local (create an app at developer.audiotool.com/applications).',
    });
  }

  if (AUDIOTOOL_SCOPE !== 'project:write') {
    issues.push({
      level: 'warn',
      message: `Scope is "${AUDIOTOOL_SCOPE}"; docs recommend project:write for project sync.`,
    });
  }

  const expectedRedirect = 'http://127.0.0.1:5173/';
  if (AUDIOTOOL_REDIRECT_URL !== expectedRedirect) {
    issues.push({
      level: 'warn',
      message: `VITE_AUDIOTOOL_REDIRECT_URL is "${AUDIOTOOL_REDIRECT_URL}"; local dev docs use ${expectedRedirect}`,
    });
  }

  if (typeof window !== 'undefined') {
    const expectedOrigin = new URL(AUDIOTOOL_REDIRECT_URL).origin;
    if (window.location.origin !== expectedOrigin) {
      issues.push({
        level: 'error',
        message: `Open ${AUDIOTOOL_REDIRECT_URL} in the browser (you are on ${window.location.origin}). OAuth cannot use localhost.`,
      });
    }
  }

  return issues;
}

export function formatAuthError(err, redirectUrl = AUDIOTOOL_REDIRECT_URL) {
  if (!(err instanceof Error)) return String(err);
  const msg = err.message;
  if (/server_error|internal server error/i.test(msg)) {
    return (
      'Audiotool OAuth server_error — Redirect URI in developer.audiotool.com must match exactly: '
      + redirectUrl
    );
  }
  if (/invalid.*state/i.test(msg)) {
    return `${msg} Reload ${redirectUrl} and click Log in again.`;
  }
  return msg;
}
