import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { UserRole, AuthUser } from '../types';

export type { UserRole, AuthUser };

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  csrfToken: string;
  login: (identifier: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  toggleMfa: () => Promise<{ success: boolean; mfaEnabled?: boolean; message?: string }>;
  canAccess: (requiredRoles: UserRole[]) => boolean;
  setLoggedOutMessage: (msg: string | null) => void;
  loggedOutMessage: string | null;
  refreshSession: () => Promise<void>;
  inactivityWarning: boolean;
  resetInactivityTimer: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_SESSION_KEY = 'nass_client_session_v2';
const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
const INACTIVITY_WARNING_MS = 13 * 60 * 1000; // 13 minutes (2 min warning)

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [csrfToken, setCsrfToken] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loggedOutMessage, setLoggedOutMessage] = useState<string | null>(null);
  const [inactivityWarning, setInactivityWarning] = useState<boolean>(false);

  const checkCurrentSession = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/auth/me', {
        headers: { 'Cache-Control': 'no-cache' },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
          setCsrfToken(data.csrfToken || '');
          localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(data.user));
          setIsLoading(false);
          return;
        }
      }

      setUser(null);
      localStorage.removeItem(LOCAL_SESSION_KEY);
    } catch {
      const cached = localStorage.getItem(LOCAL_SESSION_KEY);
      if (cached) {
        try {
          setUser(JSON.parse(cached));
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize session from API
  useEffect(() => {
    checkCurrentSession();
  }, [checkCurrentSession]);

  const logout = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({ csrfToken }),
      });
    } catch (err) {
      console.warn('Logout notice', err);
    } finally {
      setUser(null);
      setCsrfToken('');
      setInactivityWarning(false);
      localStorage.removeItem(LOCAL_SESSION_KEY);
      setLoggedOutMessage('You have been logged out securely.');
      setIsLoading(false);
    }
    return true;
  }, [csrfToken]);

  // Inactivity tracking
  useEffect(() => {
    if (!user) {
      setInactivityWarning(false);
      return;
    }

    let warningTimer: NodeJS.Timeout;
    let logoutTimer: NodeJS.Timeout;

    const resetTimers = () => {
      setInactivityWarning(false);
      clearTimeout(warningTimer);
      clearTimeout(logoutTimer);

      warningTimer = setTimeout(() => {
        setInactivityWarning(true);
      }, INACTIVITY_WARNING_MS);

      logoutTimer = setTimeout(() => {
        setLoggedOutMessage('Your session timed out due to 15 minutes of inactivity.');
        logout();
      }, INACTIVITY_TIMEOUT_MS);
    };

    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    const handleActivity = () => {
      if (!inactivityWarning) {
        resetTimers();
      }
    };

    activityEvents.forEach((event) => window.addEventListener(event, handleActivity));
    resetTimers();

    return () => {
      activityEvents.forEach((event) => window.removeEventListener(event, handleActivity));
      clearTimeout(warningTimer);
      clearTimeout(logoutTimer);
    };
  }, [user, inactivityWarning, logout]);

  const resetInactivityTimer = () => {
    setInactivityWarning(false);
  };

  const login = async (
    identifier: string,
    password: string,
    rememberMe = false
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identifier, password, rememberMe }),
      });

      const data = await res.json();

      if (!res.ok) {
        setIsLoading(false);
        return { success: false, error: data.error || 'Authentication failed. Please verify credentials.' };
      }

      setUser(data.user);
      setCsrfToken(data.csrfToken || '');
      setLoggedOutMessage(null);
      setInactivityWarning(false);
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(data.user));
      setIsLoading(false);
      return { success: true };
    } catch {
      setIsLoading(false);
      return {
        success: false,
        error: 'Unable to connect to authentication server. Please check network connection.',
      };
    }
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; message?: string; error?: string }> => {
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to change password.' };
      }
      return { success: true, message: data.message };
    } catch {
      return { success: false, error: 'Network error communicating with server.' };
    }
  };

  const toggleMfa = async (): Promise<{ success: boolean; mfaEnabled?: boolean; message?: string }> => {
    try {
      const res = await fetch('/api/auth/mfa/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
      });
      const data = await res.json();
      if (res.ok && user) {
        const updated = { ...user, mfaEnabled: data.mfaEnabled };
        setUser(updated);
        localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(updated));
        return { success: true, mfaEnabled: data.mfaEnabled, message: data.message };
      }
      return { success: false };
    } catch {
      return { success: false };
    }
  };

  const canAccess = (requiredRoles: UserRole[]): boolean => {
    if (!user) return false;
    if (user.role === 'super_admin') return true;
    if (user.role === 'headmaster' && (requiredRoles.includes('headmaster') || requiredRoles.includes('assistant_headmaster') || requiredRoles.includes('teacher') || requiredRoles.includes('form_master'))) return true;
    if (user.role === 'assistant_headmaster' && (requiredRoles.includes('assistant_headmaster') || requiredRoles.includes('teacher') || requiredRoles.includes('form_master'))) return true;
    if (user.role === 'form_master' && (requiredRoles.includes('form_master') || requiredRoles.includes('teacher'))) return true;
    return requiredRoles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        csrfToken,
        login,
        logout,
        changePassword,
        toggleMfa,
        canAccess,
        loggedOutMessage,
        setLoggedOutMessage,
        refreshSession: checkCurrentSession,
        inactivityWarning,
        resetInactivityTimer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
