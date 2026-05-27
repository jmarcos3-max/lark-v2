import React, { createContext, useContext, useEffect, useState } from 'react';
import { audiotool } from '@audiotool/nexus';

/**
 * Audiotool auth context.
 * status: 'loading' | 'authenticated' | 'unauthenticated' | 'misconfigured'
 */
const AudiotoolContext = createContext(null);

const CLIENT_ID = import.meta.env.VITE_AUDIOTOOL_CLIENT_ID;
const REDIRECT_URL = import.meta.env.VITE_AUDIOTOOL_REDIRECT_URL || 'http://127.0.0.1:5173/';
const SCOPE = import.meta.env.VITE_AUDIOTOOL_SCOPE || 'project:write';

export function AudiotoolProvider({ children }) {
  const [status, setStatus] = useState('loading');
  const [atClient, setAtClient] = useState(null); // the `at` object from audiotool()
  const [userName, setUserName] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!CLIENT_ID) {
      setStatus('misconfigured');
      setError('VITE_AUDIOTOOL_CLIENT_ID is not set. Add it to your .env file.');
      return;
    }

    // Use the current page origin as redirect URL if no env var is set,
    // so it works on both 127.0.0.1:5173 and deployed/preview URLs.
    const redirectUrl = REDIRECT_URL || `${window.location.origin}/`;

    audiotool({ clientId: CLIENT_ID, redirectUrl, scope: SCOPE })
      .then(at => {
        setAtClient(at);
        if (at.status === 'authenticated') {
          setStatus('authenticated');
          setUserName(at.userName ?? null);
        } else {
          // at.error may be an object or string
          const errMsg = at.error
            ? (typeof at.error === 'string' ? at.error : at.error?.message ?? JSON.stringify(at.error))
            : null;
          if (errMsg) {
            console.error('[Audiotool] auth error:', errMsg);
            setError(errMsg);
          }
          setStatus('unauthenticated');
        }
      })
      .catch(err => {
        const msg = err?.message ?? String(err);
        console.error('[Audiotool] init error:', msg);
        setError(msg);
        setStatus('unauthenticated');
      });
  }, []);

  const login = () => {
    if (atClient && atClient.status === 'unauthenticated') {
      atClient.login();
    }
  };

  const logout = () => {
    if (atClient && atClient.status === 'authenticated') atClient.logout();
  };

  return (
    <AudiotoolContext.Provider value={{ status, atClient, userName, error, login, logout }}>
      {children}
    </AudiotoolContext.Provider>
  );
}

export function useAudiotool() {
  return useContext(AudiotoolContext);
}