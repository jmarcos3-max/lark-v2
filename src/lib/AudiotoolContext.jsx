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

    audiotool({ clientId: CLIENT_ID, redirectUrl: REDIRECT_URL, scope: SCOPE })
      .then(at => {
        setAtClient(at);
        if (at.status === 'authenticated') {
          setStatus('authenticated');
          setUserName(at.userName ?? null);
        } else {
          if (at.error) setError(at.error);
          setStatus('unauthenticated');
        }
      })
      .catch(err => {
        setError(err?.message ?? String(err));
        setStatus('unauthenticated');
      });
  }, []);

  const login = () => {
    if (atClient && atClient.status === 'unauthenticated') atClient.login();
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