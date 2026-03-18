import { Request, Response, NextFunction } from 'express';
import { error } from '../utils/response';

/**
 * Resolves which company context the request operates under.
 *
 * - ADMIN: can use x-company-id header (any company or 'all')
 * - ACCOUNTANT: can use x-company-id header (specific company only, not 'all')
 * - MANAGER/EMPLOYEE: forced to their own ourCompanyId
 */
export function companyContext(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return error(res, 'UNAUTHORIZED', '인증이 필요합니다', 401);
  }

  const headerCompanyId = req.headers['x-company-id'] as string | undefined;
  const { role, ourCompanyId } = req.user;

  if (role === 'ADMIN') {
    req.companyContext = {
      ourCompanyId: headerCompanyId || ourCompanyId,
    };
  } else if (role === 'ACCOUNTANT') {
    if (headerCompanyId && headerCompanyId !== 'all') {
      req.companyContext = { ourCompanyId: headerCompanyId };
    } else {
      req.companyContext = { ourCompanyId };
    }
  } else {
    // MANAGER, EMPLOYEE — forced to own company
    req.companyContext = { ourCompanyId };
  }

  next();
}
