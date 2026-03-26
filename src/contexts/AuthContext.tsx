'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useSession, signIn as nextAuthSignIn, signOut as nextAuthSignOut } from 'next-auth/react';
import { Session } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user?: {
      id?: string;
      email?: string;
      name?: string;
      image?: string;
    };
  }
}

interface AuthContextType {
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  user: {
    id?: string;
    email?: string;
    name?: string;
    image?: string;
  } | null;
  signIn: (provider: 'google' | 'apple') => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const linkedRef = useRef(false);

  useEffect(() => {
    setIsLoading(status === 'loading');
  }, [status]);

  // Link localStorage twimp_user_id to the authenticated user record.
  // Also acts as a backup for user creation if the server-side signIn event failed.
  useEffect(() => {
    if (linkedRef.current) return;
    const email = session?.user?.email;
    if (!email) return;
    const twimpUserId = typeof window !== 'undefined' ? localStorage.getItem('twimp_user_id') : null;
    if (!twimpUserId) return;
    linkedRef.current = true;
    fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        name: session?.user?.name,
        image: session?.user?.image,
        twimp_user_id: twimpUserId,
        provider: 'google',
      }),
    }).catch(() => {});
  }, [session?.user?.email, session?.user?.name, session?.user?.image]);

  const handleSignIn = async (provider: 'google' | 'apple') => {
    try {
      const callbackUrl = typeof window !== 'undefined' ? window.location.pathname : '/';
      await nextAuthSignIn(provider, { callbackUrl });
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const handleSignOut = async () => {
    try {
      await nextAuthSignOut({ callbackUrl: '/' });
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const contextValue: AuthContextType = {
    session,
    isLoading,
    isAuthenticated: !!session?.user,
    user: session?.user
      ? {
          id: session.user.id,
          email: session.user.email || undefined,
          name: session.user.name || undefined,
          image: session.user.image || undefined,
        }
      : null,
    signIn: handleSignIn,
    signOut: handleSignOut,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
