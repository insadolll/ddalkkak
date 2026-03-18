import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { error } from '../utils/response';
import { Role } from '@prisma/client';

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return error(res, 'UNAUTHORIZED', '인증이 필요합니다', 401);
  }

  try {
    const token = header.slice(7);
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.id,
      email: payload.email,
      role: payload.role as Role,
      ourCompanyId: payload.ourCompanyId,
    };
    next();
  } catch {
    return error(res, 'UNAUTHORIZED', '유효하지 않은 토큰입니다', 401);
  }
}
