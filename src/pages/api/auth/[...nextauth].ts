import NextAuth, { NextAuthOptions, Account, User } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import CredentialsProvider from 'next-auth/providers/credentials';
import { JWT } from 'next-auth/jwt';
import type { Session } from 'next-auth';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    FacebookProvider({
      clientId: (process.env.FACEBOOK_APP_ID || '').trim(),
      clientSecret: (process.env.FACEBOOK_APP_SECRET || '').trim(),
    }),
    // Passwordless email sign-in. The one-time token is issued + emailed by the
    // backend; here we just burn it (via /api/auth/magic-consume) and, on
    // success, mint the same JWT session as the social providers.
    CredentialsProvider({
      id: 'magic-link',
      name: 'Email link',
      credentials: { token: { label: 'Token', type: 'text' } },
      async authorize(credentials) {
        const token = credentials?.token;
        if (!token) return null;
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        try {
          const res = await fetch(`${backendUrl}/api/auth/magic-consume`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
          });
          const data = await res.json();
          if (res.ok && data?.ok && data.email) {
            return { id: data.email as string, email: data.email as string };
          }
        } catch (e) {
          console.error('[magic-link] authorize error', e);
        }
        return null;
      },
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user, account }: { token: JWT; user?: User; account?: Account | null }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.image = user.image;
      }
      if (account) {
        token.provider = account.provider;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }): Promise<Session> {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).email = token.email as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      // Allows relative callback URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  events: {
    async signIn({ user, account }: any) {
      // Save user to Supabase database
      try {
        await fetch(`${process.env.NEXTAUTH_URL}/api/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: user?.email,
            name: user?.name,
            image: user?.image,
            provider: account?.provider,
            proverId: account?.providerAccountId,
          }),
        });
      } catch (error) {
        console.error('Failed to save user to database:', error);
      }
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);
