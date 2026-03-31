import bcrypt from 'bcrypt';
import jwt, { JwtPayload } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || '';
if (!JWT_SECRET) throw new Error('JWT_SECRET not set in environment');

export interface TokenPayload extends JwtPayload {
  userId: number;
  email: string;
}

export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, 10);
}

export async function verifyPassword(
  plainPassword: string,
  passwordHash: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, passwordHash);
}

export function generateToken(userId: number, email: string): string {
  const payload: TokenPayload = { userId, email };
  return jwt.sign(payload, JWT_SECRET as string, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET as string) as TokenPayload;

    
    if (!decoded.userId || !decoded.email) {  // required fields exist or not
      return null;
    }

    return decoded;
  } catch (error) {
    return null;
  }
}
