import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AUDIOTOOL_CLIENT_ID,
  AUDIOTOOL_SCOPE,
  getAudiotoolRedirectUrl,
} from '@/lib/audiotool-config';
import { formatAuthError, getAudiotoolSetupIssues } from '@/lib/audiotool-setup';

const INIT_TIMEOUT_MS = 20_000;
const AudiotoolContext = createContext(null);

export function AudiotoolProvider({ children }) {
  const [client, setClient] = useState(null);
  const [userName, setUserName] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [setupIssues, setSetupIssues] = useState([]);
  const startLoginRef = useRef(null);
  const pendingLoginRef = useRef(false);
  const initGenerationRef = useRef(0);

  useEffect(() => {
    setSetupIssues(getAudiotoolSetupIssues());
  }, []);

  const applyAuthResult = useCallback((at) => {
    if (at.status === 'authenticated') {
      setClient(at);
      setUserName(at.userName);
      setStatus('authenticated');
      setError(null);
      startLoginRef.current = null;
      pendingLoginRef.current = false;
      return;
    }

    setClient(null);
    setUserName(null);
    setStatus('unauthenticated');
    setError(at.error ? new Error(formatAuthError(at.error)) : null);
    startLoginRef.current = typeof at.login === 'function' ? at.login : null;

    if (pendingLoginRef.current && startLoginRef.current) {
      pendingLoginRef.current = false;
      startLoginRef.current();
    }
  }, []);

  const initSdk = useCallback(async () => {
    const issues = getAudiotoolSetupIssues();
    setSetupIssues(issues);

    const blocking = issues.find((i) => i.level === 'error');
    if (blocking) {
      setStatus(blocking.message.includes('VITE_AUDIOTOOL') ? 'misconfigured' : 'unauthenticated');
      setError(new Error(blocking.message));
      return;
    }

    const generation = ++initGenerationRef.current;
    setStatus('loading');
    setError(null);

    let timedOut = false;
    const timeoutId = setTimeout(() => {
      timedOut = true;
      if (initGenerationRef.current !== generation) return;
      setStatus('unauthenticated');
      setError(
        new Error('Audiotool SDK timed out. Click Log in to try again.'),
      );
    }, INIT_TIMEOUT_MS);

    try {
      const { audiotool } = await import('@audiotool/nexus');
      const at = await audiotool({
        clientId: AUDIOTOOL_CLIENT_ID,
        redirectUrl: getAudiotoolRedirectUrl(),
        scope: AUDIOTOOL_SCOPE,
      });
      if (initGenerationRef.current !== generation || timedOut) return;
      applyAuthResult(at);
    } catch (err) {
      if (initGenerationRef.current !== generation || timedOut) return;
      setStatus('unauthenticated');
      setError(err instanceof Error ? new Error(formatAuthError(err)) : new Error(String(err)));
      startLoginRef.current = null;
    } finally {
      clearTimeout(timeoutId);
    }
  }, [applyAuthResult]);

  useEffect(() => {
    initSdk();
  }, [initSdk]);

  /** Documented flow: at.login() from audiotool() — full-page OAuth redirect. */
  const login = useCallback(() => {
    const issues = getAudiotoolSetupIssues();
    const blocking = issues.find((i) => i.level === 'error');
    if (blocking) {
      setError(new Error(blocking.message));
      return;
    }

    setError(null);

    if (startLoginRef.current) {
      pendingLoginRef.current = false;
      startLoginRef.current();
      return;
    }

    pendingLoginRef.current = true;

    if (status === 'loading') {
      return;
    }

    initSdk();
  }, [status, initSdk]);

  const logout = useCallback(async () => {
    pendingLoginRef.current = false;

    if (client?.status === 'authenticated') {
      client.logout();
      return;
    }

    setClient(null);
    setUserName(null);
    setStatus('unauthenticated');
    setError(null);
  }, [client]);

  const value = useMemo(
    () => ({
      client,
      userName,
      status,
      error,
      setupIssues,
      isAuthenticated: status === 'authenticated',
      isLoading: status === 'loading',
      isMisconfigured: status === 'misconfigured',
      login,
      logout,
    }),
    [client, userName, status, error, setupIssues, login, logout],
  );

  return (
    <AudiotoolContext.Provider value={value}>{children}</AudiotoolContext.Provider>
  );
}

export function useAudiotool() {
  const ctx = useContext(AudiotoolContext);
  if (!ctx) {
    throw new Error('useAudiotool must be used within AudiotoolProvider');
  }
  return ctx;
}
