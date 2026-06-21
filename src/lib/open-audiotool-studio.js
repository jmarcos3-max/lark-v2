const STUDIO_WINDOW_NAME = 'lark-audiotool-studio';
const SESSION_KEY = 'lark-studio-session-project';

/** @type {Window | null} */
let studioWindowRef = null;

function projectIdFromStudioUrl(dawUrl) {
  try {
    return new URL(dawUrl).searchParams.get('project') ?? dawUrl;
  } catch {
    return dawUrl;
  }
}

function persistStudioWindow(studioWindow, projectId) {
  studioWindowRef = studioWindow ?? null;
  if (typeof window !== 'undefined' && studioWindow) {
    window.__larkStudioWindow = studioWindow;
  }
  if (projectId) {
    sessionStorage.setItem(SESSION_KEY, projectId);
  }
}

function readPersistedStudioWindow() {
  if (studioWindowRef && !studioWindowRef.closed) return studioWindowRef;
  if (typeof window !== 'undefined' && window.__larkStudioWindow && !window.__larkStudioWindow.closed) {
    studioWindowRef = window.__larkStudioWindow;
    return studioWindowRef;
  }
  return null;
}

function studioWindowIsOnProject(studioWindow, projectId) {
  try {
    const href = studioWindow.location.href;
    return href !== 'about:blank' && href.includes(projectId);
  } catch {
    // Cross-origin — tab is on Audiotool (not a blank placeholder).
    return sessionStorage.getItem(SESSION_KEY) === projectId;
  }
}

/**
 * Find the Lark-named Studio tab without opening a new one.
 * Closes accidental about:blank placeholders the browser may create.
 * @returns {Window | null}
 */
function resolveStudioWindow() {
  const cached = readPersistedStudioWindow();
  if (cached) return cached;

  const candidate = window.open('', STUDIO_WINDOW_NAME);
  if (!candidate || candidate.closed) return null;

  try {
    const href = candidate.location.href;
    if (href === 'about:blank' || href === '' || href === 'about:blank#blocked') {
      candidate.close();
      return null;
    }
    persistStudioWindow(candidate, sessionStorage.getItem(SESSION_KEY));
    return candidate;
  } catch {
    // Cross-origin — real Studio tab exists under this window name.
    persistStudioWindow(candidate, sessionStorage.getItem(SESSION_KEY));
    return candidate;
  }
}

/**
 * Focus an existing Studio tab. Never opens or navigates.
 * @returns {Window | null}
 */
export function focusAudiotoolStudioTab() {
  const studioWindow = resolveStudioWindow();
  studioWindow?.focus?.();
  return studioWindow;
}

/**
 * Explicit "Open in Studio" — reuse tab when possible, otherwise open once.
 * @param {string | null | undefined} dawUrl
 * @returns {Window | null}
 */
export function openAudiotoolStudio(dawUrl) {
  if (!dawUrl || typeof window === 'undefined') return null;

  const projectId = projectIdFromStudioUrl(dawUrl);
  const existing = resolveStudioWindow();

  if (existing) {
    if (!studioWindowIsOnProject(existing, projectId)) {
      existing.location.href = dawUrl;
    }
    persistStudioWindow(existing, projectId);
    existing.focus();
    return existing;
  }

  const opened = window.open(dawUrl, STUDIO_WINDOW_NAME);
  persistStudioWindow(opened, projectId);
  opened?.focus?.();
  return opened ?? null;
}

/**
 * On transform click — open Studio only the first time for a project.
 * Re-transforms (new layers/instruments) focus the existing tab only.
 * @param {string | null | undefined} dawUrl
 * @returns {{ action: 'opened' | 'focused' | 'navigated' | 'skipped', window: Window | null }}
 */
export function prepareStudioForTransform(dawUrl) {
  if (!dawUrl || typeof window === 'undefined') {
    return { action: 'skipped', window: null };
  }

  const projectId = projectIdFromStudioUrl(dawUrl);
  const sessionProject = sessionStorage.getItem(SESSION_KEY);
  const existing = resolveStudioWindow();

  if (existing) {
    if (!studioWindowIsOnProject(existing, projectId)) {
      existing.location.href = dawUrl;
      persistStudioWindow(existing, projectId);
      existing.focus();
      return { action: 'navigated', window: existing };
    }
    existing.focus();
    persistStudioWindow(existing, projectId);
    return { action: 'focused', window: existing };
  }

  // Studio was opened earlier this session but the tab is gone — don't spawn another
  // on layer/instrument updates; user can click "Open in Audiotool Studio" if needed.
  if (sessionProject === projectId) {
    return { action: 'skipped', window: null };
  }

  const opened = window.open(dawUrl, STUDIO_WINDOW_NAME);
  persistStudioWindow(opened, projectId);
  opened?.focus?.();
  return { action: 'opened', window: opened ?? null };
}

/** @deprecated Use prepareStudioForTransform */
export function primeAudiotoolStudioTab(dawUrl) {
  return prepareStudioForTransform(dawUrl).window;
}
