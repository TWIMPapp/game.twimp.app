import NextAuth, { NextAuthOptions, Account, User } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import { JWT } from 'next-auth/jwt';
import type { Session } from 'next-auth';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_APP_ID || '',
      clientSecret: process.env.FACEBOOK_APP_SECRET || '',
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
