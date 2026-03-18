import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { error } from '../utils/response';

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return error(res, 'UNAUTHORIZED', '인증이 필요합니다', 401);
    }
    if (!roles.includes(req.user.role)) {
      return error(res, 'FORBIDDEN', '접근 권한이 없습니다', 403);
    }
    next();
  };
}
