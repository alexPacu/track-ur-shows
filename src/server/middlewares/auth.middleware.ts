import { NextRequest } from 'next/server';
import { verifyToken, TokenPayload } from '@/lib/auth';

export function extractUserFromRequest(req: NextRequest): TokenPayload | null {
  const cookieHeader = req.headers.get('cookie');
  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(';').reduce(
    (acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = decodeURIComponent(value);
      return acc;
    },
    {} as Record<string, string>
  );

  const token = cookies['auth-token'];
  if (!token) {
    return null;
  }

  const payload = verifyToken(token);
  return payload;
}

export function extractUserFromCookie(cookieValue: string | undefined): TokenPayload | null {
  if (!cookieValue) {
    return null;
  }

  const payload = verifyToken(cookieValue);
  return payload;
}
