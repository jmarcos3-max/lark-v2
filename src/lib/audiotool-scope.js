import { AUDIOTOOL_SCOPE } from '@/lib/audiotool-config';

const GRANTED_SCOPE_KEY = 'lark-oauth-scope-granted';

export function audiotoolScopeIncludes(scopeName) {
  return AUDIOTOOL_SCOPE.split(/\s+/).includes(scopeName);
}

export function markAudiotoolScopeGranted() {
  try {
    localStorage.setItem(GRANTED_SCOPE_KEY, AUDIOTOOL_SCOPE);
  } catch {
    // ignore storage errors
  }
}

/** True when app scopes changed since the last successful login. */
export function audiotoolScopeNeedsRefresh() {
  try {
    const granted = localStorage.getItem(GRANTED_SCOPE_KEY);
    return Boolean(granted && granted !== AUDIOTOOL_SCOPE);
  } catch {
    return false;
  }
}

export function moodLayerImportScopeHint() {
  if (audiotoolScopeIncludes('sample:write')) {
    return (
      'Mood layer import needs the sample:write OAuth scope. '
      + 'Add sample:write at developer.audiotool.com/applications, '
      + 'then sign out and sign in again.'
    );
  }
  return (
    'Mood layer import needs sample upload permission. '
    + 'Set VITE_AUDIOTOOL_SCOPE="project:write sample:write" and re-login.'
  );
}
