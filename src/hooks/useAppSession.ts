import { useState, useEffect, useCallback } from 'react';
import type { SessionUser } from '../types';
import { restoreSupabaseSession, signOutAuth } from '../lib/auth/authService';
import { writeAuditLog } from '../lib/auditLog';

const SESSION_KEY = 'guardr_current_user';

export function useAppSession() {
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(() => {
    try {
      const s = localStorage.getItem(SESSION_KEY);
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    void restoreSupabaseSession();
  }, []);

  const handleSignIn = useCallback(
    (user: SessionUser, options?: { passwordChangeRecommended?: boolean }) => {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      setCurrentUser(user);
      void writeAuditLog(user, 'sign_in', 'session', user.id);
      return options;
    },
    []
  );

  const handleSignOut = useCallback(() => {
    if (currentUser) void writeAuditLog(currentUser, 'sign_out', 'session', currentUser.id);
    localStorage.removeItem(SESSION_KEY);
    void signOutAuth();
    setCurrentUser(null);
  }, [currentUser]);

  const updateCurrentUser = useCallback((user: SessionUser) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    setCurrentUser(user);
  }, []);

  return {
    currentUser,
    setCurrentUser,
    handleSignIn,
    handleSignOut,
    updateCurrentUser,
    isAuthenticated: !!currentUser,
  };
}
