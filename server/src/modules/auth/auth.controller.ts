import { Request, Response } from 'express';
import * as authService from './auth.service';
import { AuthError } from './auth.service';
import { success, error } from '../../utils/response';

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/api/auth/refresh',
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

export async function loginHandler(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return error(res, 'VALIDATION', '이메일과 비밀번호를 입력해주세요', 400);
    }

    const result = await authService.login(email, password);

    res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);

    return success(res, {
      accessToken: result.accessToken,
      user: result.user,
    });
  } catch (e) {
    if (e instanceof AuthError) {
      return error(res, 'AUTH_ERROR', e.message, e.status);
    }
    return error(res, 'INTERNAL', '서버 오류가 발생했습니다', 500);
  }
}

export async function logoutHandler(req: Request, res: Response) {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      await authService.logout(refreshToken);
    }
    res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
    return res.status(204).send();
  } catch {
    return res.status(204).send();
  }
}

export async function refreshHandler(req: Request, res: Response) {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return error(res, 'UNAUTHORIZED', '리프레시 토큰이 없습니다', 401);
    }

    const result = await authService.refreshAccessToken(refreshToken);
    return success(res, result);
  } catch (e) {
    if (e instanceof AuthError) {
      return error(res, 'AUTH_ERROR', e.message, e.status);
    }
    return error(res, 'UNAUTHORIZED', '토큰 갱신에 실패했습니다', 401);
  }
}

export async function changePasswordHandler(req: Request, res: Response) {
  try {
    if (!req.user) {
      return error(res, 'UNAUTHORIZED', '인증이 필요합니다', 401);
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return error(res, 'VALIDATION', '현재 비밀번호와 새 비밀번호를 입력해주세요', 400);
    }

    if (newPassword.length < 8) {
      return error(res, 'VALIDATION', '비밀번호는 8자 이상이어야 합니다', 400);
    }

    await authService.changePassword(req.user.id, currentPassword, newPassword);
    return success(res, { message: '비밀번호가 변경되었습니다' });
  } catch (e) {
    if (e instanceof AuthError) {
      return error(res, 'AUTH_ERROR', e.message, e.status);
    }
    return error(res, 'INTERNAL', '서버 오류가 발생했습니다', 500);
  }
}

export async function meHandler(req: Request, res: Response) {
  try {
    if (!req.user) {
      return error(res, 'UNAUTHORIZED', '인증이 필요합니다', 401);
    }

    const { default: prisma } = await import('../../utils/prisma');
    const employee = await prisma.employee.findUnique({
      where: { id: req.user.id },
      include: { ourCompany: true, department: true },
    });

    if (!employee) {
      return error(res, 'NOT_FOUND', '사용자를 찾을 수 없습니다', 404);
    }

    return success(res, {
      id: employee.id,
      email: employee.email,
      name: employee.name,
      role: employee.role,
      position: employee.position,
      phone: employee.phone,
      ourCompanyId: employee.ourCompanyId,
      ourCompanyCode: employee.ourCompany.code,
      ourCompanyName: employee.ourCompany.name,
      departmentId: employee.departmentId,
      departmentName: employee.department.name,
    });
  } catch {
    return error(res, 'INTERNAL', '서버 오류가 발생했습니다', 500);
  }
}
