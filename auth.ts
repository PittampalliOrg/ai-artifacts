import NextAuth from 'next-auth';
import AzureAd from "next-auth/providers/azure-ad"

import type { NextAuthConfig, Session } from 'next-auth';

export const config = {
  providers: [
    AzureAd({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
      tenantId: process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID,
      authorization: {
        params: {
          scope: "openid profile email offline_access",
        },
      },
    })
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (account && user) {
        return {
          ...token,
          access_token: account.access_token,
          issued_at: Date.now(),
          expires_at: Date.now() + Number(account.expires_in) * 1000,
          refresh_token: account.refresh_token,
          sub: user.id, 
        };
      } else if (Date.now() < Number(token.expires_at)) {
        return token;
      } else {
        try {
          const response = await fetch('https://login.microsoftonline.com/0c4da9c5-40ea-4e7d-9c7a-e7308d4f8e38/oauth2/v2.0/token', {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              client_id: process.env.AUTH_MICROSOFT_ENTRA_ID_ID as string,
              client_secret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET as string,
              grant_type: 'refresh_token',
              refresh_token: token.refresh_token as string,
            }),
            method: 'POST',
          });

          const tokens = await response.json();

          if (!response.ok) throw tokens;

          return {
            ...token,
            access_token: tokens.access_token,
            expires_at: Date.now() + Number(tokens.expires_in) * 1000,
            refresh_token: tokens.refresh_token ?? token.refresh_token,
          };
        } catch (error) {
          console.error('Error refreshing access token', error);
          return { ...token, error: 'RefreshAccessTokenError' as const };
        }
      }
    },
    async session({ session, token }) {
      return {
        ...session,
        accessToken: String(token.access_token),
        refreshToken: String(token.refresh_token),
        accessTokenExpiresAt: Number(token.expires_at),
        accessTokenIssuedAt: Number(token.issued_at),
        userId: String(token.sub),
      } satisfies EnrichedSession;
    },
  },
};

export interface EnrichedSession extends Session {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: number;
  accessTokenIssuedAt: number;
  userId: string;
}

export const { handlers, auth, signIn, signOut } = NextAuth(config);