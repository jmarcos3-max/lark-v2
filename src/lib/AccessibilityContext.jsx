import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

const STORAGE_KEY = 'lark-accessibility';

export const TEXT_SIZE_OPTIONS = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
];

const DEFAULT_SETTINGS = {
  textSize: 'medium',
  highContrast: false,
  reduceMotion: false,
  boldText: false,
  enhancedFocus: false,
};

function readStoredSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      textSize: TEXT_SIZE_OPTIONS.some((o) => o.value === parsed?.textSize)
        ? parsed.textSize
        : DEFAULT_SETTINGS.textSize,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function applyAccessibilityToDocument(settings) {
  const root = document.documentElement;
  root.setAttribute('data-text-size', settings.textSize);
  root.toggleAttribute('data-high-contrast', settings.highContrast);
  root.toggleAttribute('data-reduce-motion', settings.reduceMotion);
  root.toggleAttribute('data-bold-text', settings.boldText);
  root.toggleAttribute('data-enhanced-focus', settings.enhancedFocus);
}

const AccessibilityContext = createContext(null);

export function AccessibilityProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    const stored = readStoredSettings();
    const initial = localStorage.getItem(STORAGE_KEY)
      ? stored
      : window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? { ...stored, reduceMotion: true }
        : stored;
    applyAccessibilityToDocument(initial);
    return initial;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    applyAccessibilityToDocument(settings);
  }, [settings]);

  const patchSettings = useCallback((patch) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings({ ...DEFAULT_SETTINGS });
  }, []);

  const value = useMemo(
    () => ({ settings, patchSettings, resetSettings }),
    [settings, patchSettings, resetSettings],
  );

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return ctx;
}
