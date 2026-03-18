import jwt, { SignOptions } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const JWT_EXPIRES_IN = 7 * 24 * 60 * 60; // 7 days in seconds

export interface JwtPayload {
  id: string;
  email: string;
  role: string;
  ourCompanyId: string;
}

export function signAccessToken(payload: JwtPayload): string {
  const options: SignOptions = { expiresIn: JWT_EXPIRES_IN };
  return jwt.sign(payload, JWT_SECRET, options);
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

export function signRefreshToken(payload: { id: string }): string {
  const options: SignOptions = { expiresIn: 30 * 24 * 60 * 60 }; // 30 days
  return jwt.sign(payload, JWT_SECRET, options);
}

export function verifyRefreshToken(token: string): { id: string } {
  return jwt.verify(token, JWT_SECRET) as { id: string };
}
